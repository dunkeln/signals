import type { AcmeBaseSandbox } from "@/lib/fixtures/acme-base-sandbox";
import {
  collectSourceRecords,
  type SourceRecord,
} from "@/lib/signal/intelligence";
import { buildPacketSetState } from "@/lib/signal/canonical-packets";
import type {
  SignalCanonicalState,
  SignalEntityInstance,
  SignalEvidenceSupport,
  SignalWorkflowStatus,
} from "@/lib/signal/canonical-types";

export type {
  SignalCanonicalState,
  SignalContentPacket,
  SignalEntityInstance,
  SignalEvidenceSupport,
  SignalPacketOmission,
  SignalPacketSetState,
  SignalWorkSurface,
  SignalWorkflowNodeId,
  SignalWorkflowStatus,
} from "@/lib/signal/canonical-types";

export function buildSignalCanonicalState(
  ingress: AcmeBaseSandbox,
): SignalCanonicalState {
  const records = collectSourceRecords(ingress).filter(isCanonicalCompatibleRecord);
  const entities = buildEntityInstances(records);

  return {
    entities,
    packetSets: buildPacketSetState(entities, records),
  };
}

function isCanonicalCompatibleRecord(record: SourceRecord) {
  return Boolean(supplierForRecord(record)) && hasProcurementSignal(record);
}

type ContentTarget =
  | "price_received"
  | "moq_received"
  | "lead_time_received"
  | "incoterms_received"
  | "docs_received"
  | "rfp_response_received";
type DocumentTarget =
  | "coa"
  | "spec_sheet"
  | "allergen_statement"
  | "haccp_plan"
  | "sds"
  | "supplier_questionnaire"
  | "insurance_certificate"
  | "certification"
  | "traceability_document"
  | "bol"
  | "lot_coa";
type ClusterRecord = {
  key: string;
  supplier: string;
  supplierId: string;
  material?: string;
  materialId: string;
  workflowId?: string;
  threadIds: Set<string>;
  supplierDomains: Set<string>;
  records: SourceRecord[];
};

const fieldTargets: Array<{
  nodeId: ContentTarget;
  field: string;
  aliases: string[];
}> = [
  {
    nodeId: "price_received",
    field: "price",
    aliases: ["unit_price", "price", "price_unit", "currency"],
  },
  { nodeId: "moq_received", field: "moq", aliases: ["moq", "minimum_order"] },
  {
    nodeId: "lead_time_received",
    field: "lead_time",
    aliases: ["lead_time", "lead_time_days"],
  },
  {
    nodeId: "incoterms_received",
    field: "incoterms",
    aliases: ["incoterms", "freight_terms", "terms"],
  },
  {
    nodeId: "rfp_response_received",
    field: "rfp_response",
    aliases: ["quote_revision", "supplier_row_count", "source_document_ids"],
  },
];

const documentTargets: Array<{
  nodeId: DocumentTarget;
  documentType: string;
  aliases: string[];
}> = [
  { nodeId: "coa", documentType: "CoA", aliases: ["coa", "lot_coa"] },
  {
    nodeId: "certification",
    documentType: "Certification",
    aliases: [
      "certification",
      "organic_certification",
      "organic_cert",
      "expired_certification",
    ],
  },
  {
    nodeId: "spec_sheet",
    documentType: "SpecSheet",
    aliases: ["spec_sheet", "specification", "spec"],
  },
  {
    nodeId: "allergen_statement",
    documentType: "AllergenStatement",
    aliases: ["allergen_statement", "allergen_cross_contact_statement"],
  },
  { nodeId: "haccp_plan", documentType: "HACCP", aliases: ["haccp", "haccp_plan"] },
  { nodeId: "sds", documentType: "SDS", aliases: ["sds", "safety_data_sheet"] },
  {
    nodeId: "supplier_questionnaire",
    documentType: "SupplierQuestionnaire",
    aliases: ["supplier_questionnaire", "questionnaire"],
  },
  {
    nodeId: "insurance_certificate",
    documentType: "InsuranceCertificate",
    aliases: ["insurance_certificate", "insurance"],
  },
  {
    nodeId: "traceability_document",
    documentType: "TraceabilityDocument",
    aliases: ["traceability_document", "traceability", "lot_traceability"],
  },
  { nodeId: "bol", documentType: "BOL", aliases: ["bol", "bill_of_lading"] },
  { nodeId: "lot_coa", documentType: "LotCoA", aliases: ["lot_coa", "lot_number"] },
];

export function buildEntityInstances(records: SourceRecord[]): SignalEntityInstance[] {
  const inboxEntities = buildInboxEntities(records);
  const clusters = buildSupplierClusters(records);

  return compactEntities([
    ...inboxEntities,
    ...clusters.flatMap((cluster) => buildClusterEntities(cluster, records)),
  ]);
}

function buildInboxEntities(records: SourceRecord[]) {
  const mailboxes = new Map<string, SourceRecord[]>();

  for (const record of records) {
    const mailbox = firstAttribute(record, ["mailbox"]);

    if (mailbox) {
      appendMap(mailboxes, mailbox, record);
    }
  }

  return Array.from(mailboxes.entries()).map(([mailbox, mailboxRecords]) =>
    entity({
      id: `inbox:${token(mailbox)}`,
      nodeId: "supplier_email_inbox",
      parentRefs: [],
      payload: {
        kind: "supplier_email_inbox",
        mailbox,
      },
      asOf: firstTime(records, recordIds(mailboxRecords)),
      evidenceSourceIds: recordIds(mailboxRecords),
      support: "strong",
      summary: `${mailbox} received supplier email evidence.`,
    }),
  );
}

function buildSupplierClusters(records: SourceRecord[]) {
  const clusters = new Map<string, ClusterRecord>();

  for (const record of records) {
    const supplier = supplierForRecord(record);

    if (!supplier || !hasProcurementSignal(record)) {
      continue;
    }

    const material = firstAttribute(record, ["ingredient_display_name"]);
    const workflowId = firstAttribute(record, [
      "workflow_id",
      "affected_workflow_id",
      "workflow.id",
    ]);
    const threadId = firstAttribute(record, ["thread_id", "email.thread_id"]);
    const key = clusterKey({ supplier, material, workflowId, threadId });
    const cluster =
      clusters.get(key) ??
      {
        key,
        supplier,
        supplierId: token(supplier),
        material,
        materialId: token(material ?? "unspecified-material"),
        workflowId,
        threadIds: new Set<string>(),
        supplierDomains: new Set<string>(),
        records: [],
      };

    if (material && !cluster.material) {
      cluster.material = material;
      cluster.materialId = token(material);
    }

    if (workflowId && !cluster.workflowId) {
      cluster.workflowId = workflowId;
    }

    if (threadId) {
      cluster.threadIds.add(threadId);
    }

    for (const domain of attributeStrings(record, ["from_domain", "recipient_domain"])) {
      cluster.supplierDomains.add(domain);
    }

    cluster.records.push(record);
    clusters.set(key, cluster);
  }

  return mergeMaterialClusters(mergeSparseClusters(Array.from(clusters.values()))).filter((cluster) =>
    cluster.records.some(hasChartableContent),
  );
}

function mergeSparseClusters(clusters: ClusterRecord[]) {
  const merged = clusters.filter((cluster) => cluster.material);
  const sparseClusters = clusters.filter((cluster) => !cluster.material);

  for (const cluster of sparseClusters) {
    const compatibleTargets = merged.filter(
      (target) =>
        target.supplier === cluster.supplier &&
        (target.workflowId === cluster.workflowId ||
          intersects(target.threadIds, cluster.threadIds)),
    );
    const target =
      compatibleTargets[0] ??
      singleSupplierMaterialCluster(merged, cluster.supplier);

    if (!target) {
      merged.push(cluster);
      continue;
    }

    target.records.push(...cluster.records);
    for (const threadId of cluster.threadIds) {
      target.threadIds.add(threadId);
    }
    for (const domain of cluster.supplierDomains) {
      target.supplierDomains.add(domain);
    }
    target.workflowId = target.workflowId ?? cluster.workflowId;
  }

  return merged;
}

function mergeMaterialClusters(clusters: ClusterRecord[]) {
  const byMaterial = new Map<string, ClusterRecord>();

  for (const cluster of clusters) {
    const key = [cluster.supplier, cluster.material ?? cluster.key].map(token).join(":");
    const existing = byMaterial.get(key);

    if (!existing) {
      byMaterial.set(key, cluster);
      continue;
    }

    if (
      existing.workflowId !== cluster.workflowId &&
      existing.workflowId !== undefined &&
      cluster.workflowId !== undefined
    ) {
      byMaterial.set(`${key}:${token(cluster.workflowId)}`, cluster);
      continue;
    }

    existing.records.push(...cluster.records);
    existing.workflowId = existing.workflowId ?? cluster.workflowId;
    for (const threadId of cluster.threadIds) {
      existing.threadIds.add(threadId);
    }
    for (const domain of cluster.supplierDomains) {
      existing.supplierDomains.add(domain);
    }
  }

  return Array.from(byMaterial.values());
}

function requestKindForRecords(
  records: SourceRecord[],
  workflowId: string,
): "rfi" | "rfq" | "rfp" | "rfx" {
  for (const record of records) {
    const value = firstAttribute(record, ["request_type", "workflow.type"]);

    if (value === "rfi" || value === "rfq" || value === "rfp") {
      return value;
    }
  }

  if (workflowId.startsWith("rfi_")) return "rfi";
  if (workflowId.startsWith("rfq_")) return "rfq";
  if (workflowId.startsWith("rfp_")) return "rfp";

  return "rfx";
}

function requestKindLabel(kind: "rfi" | "rfq" | "rfp" | "rfx") {
  return kind === "rfx" ? "RFx" : kind.toUpperCase();
}

function buildClusterEntities(
  cluster: ClusterRecord,
  allRecords: SourceRecord[],
): SignalEntityInstance[] {
  const inboxId = "inbox:sourcing-demo-brand-example";
  const firstThreadId = Array.from(cluster.threadIds)[0];
  const emailId = `email:${cluster.supplierId}:${firstThreadId ?? cluster.key}`;
  const rfxContentId = `rfx-content:${cluster.supplierId}:${cluster.materialId}`;
  const workflowId =
    cluster.workflowId ?? `workflow:${cluster.supplierId}:${cluster.materialId}`;
  const requestKind = requestKindForRecords(cluster.records, workflowId);
  const requestNodeId = requestKind === "rfx" ? "rfp" : requestKind;
  const requestId = `${requestNodeId}:${token(workflowId)}`;
  const boundaryId = `supplier-boundary:${cluster.supplierId}:${cluster.materialId}`;
  const rfxRecords = cluster.records.filter(isRfxRecord);
  const clusterSourceIds = recordIds(cluster.records);
  const rfxSourceIds = recordIds(rfxRecords.length > 0 ? rfxRecords : cluster.records);

  return [
    entity({
      id: emailId,
      nodeId: "email_instance",
      parentRefs: [inboxId],
      payload: {
        kind: "email_instance",
        threadId: firstThreadId ?? cluster.key,
        supplierDomain: Array.from(cluster.supplierDomains)[0] ?? cluster.supplierId,
        attachmentCount: numberAttribute(cluster.records, "attachment_count"),
      },
      asOf: firstTime(allRecords, clusterSourceIds),
      evidenceSourceIds: clusterSourceIds,
      support: "strong",
      supplier: cluster.supplier,
      material: cluster.material,
      workflowId,
      summary: `${cluster.supplier} evidence entered the sourcing inbox.`,
    }),
    entity({
      id: rfxContentId,
      nodeId: "rfx_related_content",
      parentRefs: [emailId],
      payload: {
        kind: "rfx_related_content",
        requestKind: requestNodeId,
        workflowId,
        fields: unique(
          cluster.records.flatMap((record) =>
            attributeStrings(record, [
              "extracted_fields",
              "requested_fields",
              "missing_fields",
            ]),
          ),
        ),
      },
      asOf: firstTime(allRecords, rfxSourceIds),
      evidenceSourceIds: rfxSourceIds,
      support: supportForRecords(rfxRecords),
      supplier: cluster.supplier,
      material: cluster.material,
      workflowId,
      status: "received",
      summary: `RFx-related content exists for ${cluster.supplier}.`,
    }),
    entity({
      id: requestId,
      nodeId: requestNodeId,
      parentRefs: [rfxContentId],
      payload: {
        kind: "client_request",
        requestKind: requestNodeId,
        workflowId,
      },
      asOf: firstTime(allRecords, rfxSourceIds),
      evidenceSourceIds: rfxSourceIds,
      support: supportForRecords(rfxRecords),
      supplier: cluster.supplier,
      material: cluster.material,
      workflowId,
      status: "requested",
      summary: `${cluster.supplier} content is attached to a ${requestKindLabel(requestKind)} workflow.`,
    }),
    entity({
      id: boundaryId,
      nodeId: "supplier_boundary",
      parentRefs: [requestId],
      payload: {
        kind: "supplier_boundary",
        supplierId: cluster.supplierId,
        sourcingProcessRef: rfxContentId,
        clientRequestRef: requestId,
        enteredBoundaryAt: firstTime(allRecords, rfxSourceIds),
      },
      asOf: firstTime(allRecords, rfxSourceIds),
      evidenceSourceIds: rfxSourceIds,
      support: supportForRecords(rfxRecords),
      supplier: cluster.supplier,
      material: cluster.material,
      workflowId,
      status: "requested",
      summary: `${cluster.supplier} has supplier-scoped content for this workflow.`,
    }),
    ...buildSourcingFieldEntities(cluster, allRecords, boundaryId, workflowId),
    ...buildDocumentEntities(cluster, allRecords, emailId, boundaryId, workflowId),
  ];
}

function buildSourcingFieldEntities(
  cluster: ClusterRecord,
  allRecords: SourceRecord[],
  boundaryId: string,
  workflowId: string,
) {
  return fieldTargets
    .map((fieldTarget) => {
      const fieldRecords = cluster.records.filter((record) =>
        recordMentionsAny(record, fieldTarget.aliases),
      );

      if (fieldRecords.length === 0) {
        return undefined;
      }

      const sourceIds = recordIds(fieldRecords);
      const status = statusForFieldRecords(fieldRecords, fieldTarget.aliases);

      return entity({
        id: `field:${cluster.supplierId}:${cluster.materialId}:${fieldTarget.field}`,
        nodeId: fieldTarget.nodeId,
        parentRefs: [boundaryId],
        payload: {
          kind: "sourcing_field",
          field: fieldTarget.field,
          valueState: status === "requested" ? "requested" : "received",
        },
        asOf: firstTime(allRecords, sourceIds),
        evidenceSourceIds: sourceIds,
        support: supportForRecords(fieldRecords),
        supplier: cluster.supplier,
        material: cluster.material,
        workflowId,
        ownerRole: ownerRoleForRecords(fieldRecords, "buyer"),
        status,
        summary: `${fieldTarget.field} content is present in supplier evidence for ${cluster.supplier}.`,
      });
    })
    .filter((instance): instance is SignalEntityInstance => instance !== undefined);
}

function buildDocumentEntities(
  cluster: ClusterRecord,
  allRecords: SourceRecord[],
  emailId: string,
  boundaryId: string,
  workflowId: string,
) {
  const entities: SignalEntityInstance[] = [];

  for (const target of documentTargets) {
    const documentRecords = cluster.records.filter((record) =>
      recordMentionsAny(record, target.aliases),
    );

    if (documentRecords.length === 0) {
      continue;
    }

    const sourceIds = recordIds(documentRecords);
    const status = statusForRecords(documentRecords);
    const ownerRole = ownerRoleForRecords(documentRecords, "qa");
    const documentId =
      firstPresent(documentRecords.map((record) => firstAttribute(record, [
        "document_id",
        "document.id",
        "blocking_document_id",
        "missing_document_type",
      ]))) ?? `virtual:${target.nodeId}:${cluster.key}`;
    const instanceId = `document-instance:${cluster.supplierId}:${cluster.materialId}:${target.nodeId}:${token(documentId)}`;
    const documentEntityId = `document:${cluster.supplierId}:${cluster.materialId}:${target.nodeId}:${token(documentId)}`;

    entities.push(
      entity({
        id: instanceId,
        nodeId: "document_instance",
        parentRefs: [emailId],
        payload: {
          kind: "document_instance",
          documentId,
          documentType: target.nodeId,
        },
        asOf: firstTime(allRecords, sourceIds),
        evidenceSourceIds: sourceIds,
        support: supportForRecords(documentRecords),
        supplier: cluster.supplier,
        material: cluster.material,
        workflowId,
        status: status === "requested" ? "requested" : "received",
        summary: `${target.documentType} document evidence exists for ${cluster.supplier}.`,
      }),
      entity({
        id: documentEntityId,
        nodeId: target.nodeId,
        parentRefs: [instanceId, boundaryId],
        payload: {
          kind: "document",
          documentId,
          documentType: target.documentType,
          confidence: numericFirstAttribute(documentRecords, [
            "extraction_confidence",
            "min_field_confidence",
          ]),
          expirationDate: firstPresent(
            documentRecords.map((record) =>
              firstAttribute(record, ["expiration_date", "cert.expiration_date"]),
            ),
          ),
          certificateType: certificateTypeForRecords(documentRecords),
          lowConfidenceFields: unique(
            documentRecords.flatMap((record) =>
              attributeStrings(record, ["low_confidence_fields"]),
            ),
          ),
        },
        asOf: firstTime(allRecords, sourceIds),
        evidenceSourceIds: sourceIds,
        support: supportForRecords(documentRecords),
        supplier: cluster.supplier,
        material: cluster.material,
        workflowId,
        ownerRole,
        status,
        summary: `${target.documentType} content is present in supplier evidence for ${cluster.supplier}.`,
      }),
    );

    if (status === "review_required" || status === "blocked") {
      entities.push(
        entity({
          id: `qa-gate:${cluster.supplierId}:${cluster.materialId}:${target.nodeId}:${token(status)}`,
          nodeId: "qa_gate",
          parentRefs: [documentEntityId],
          payload: {
            kind: "supplier_gate",
            gateKind: status === "blocked" ? "supplier_document_gate" : "qa_review",
            reasonCodes: unique(
              documentRecords.flatMap((record) =>
                attributeStrings(record, [
                  "reason_codes",
                  "blocked_by",
                  "missing_document_type",
                  "low_confidence_fields",
                ]),
              ),
            ),
          },
          asOf: firstTime(allRecords, sourceIds),
          evidenceSourceIds: sourceIds,
          support: supportForRecords(documentRecords),
          supplier: cluster.supplier,
          material: cluster.material,
          workflowId,
          ownerRole,
          status,
          summary: `${target.documentType} has QA-facing status metadata in source evidence.`,
        }),
      );
    }
  }

  return entities;
}

function entity(instance: SignalEntityInstance): SignalEntityInstance {
  return {
    ...instance,
    evidenceSourceIds: unique(instance.evidenceSourceIds),
  };
}

function compactEntities(instances: SignalEntityInstance[]) {
  return instances.filter((instance) => instance.evidenceSourceIds.length > 0);
}

function firstTime(records: SourceRecord[], sourceIds: string[]) {
  const sourceIdSet = new Set(sourceIds);
  const record = records.find((candidate) => sourceIdSet.has(candidate.id));

  return record?.time ?? "2026-05-14T17:00:00.000Z";
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function recordIds(records: SourceRecord[]) {
  return unique(records.map((record) => record.id));
}

function appendMap<Key, Value>(map: Map<Key, Value[]>, key: Key, value: Value) {
  map.set(key, [...(map.get(key) ?? []), value]);
}

function intersects(left: Set<string>, right: Set<string>) {
  return Array.from(left).some((value) => right.has(value));
}

function singleSupplierMaterialCluster(clusters: ClusterRecord[], supplier: string) {
  const matches = clusters.filter(
    (cluster) => cluster.supplier === supplier && cluster.material,
  );

  return matches.length === 1 ? matches[0] : undefined;
}

function supplierForRecord(record: SourceRecord) {
  const supplier =
    firstAttribute(record, ["supplier_display_name", "input_name"]) ??
    domainToSupplier(firstAttribute(record, ["from_domain", "recipient_domain"]));

  return supplier ? normalizeSupplierName(supplier) : undefined;
}

function domainToSupplier(domain: string | undefined) {
  if (!domain) {
    return undefined;
  }

  return domain
    .replace(/\.(example|com|co|io|net|org)$/g, "")
    .split(/[-.]/g)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeSupplierName(value: string) {
  return value.replace(/\s+(LLC|Inc\.?|Ltd\.?)$/i, "").trim();
}

function hasProcurementSignal(record: SourceRecord) {
  return [
    "thread_id",
    "email.thread_id",
    "workflow_id",
    "affected_workflow_id",
    "ingredient_display_name",
    "extracted_fields",
    "requested_fields",
    "missing_fields",
    "document_type_guess",
    "document.type_guess",
    "missing_document_type",
    "edge_id",
  ].some((key) => key in record.attributes);
}

function hasChartableContent(record: SourceRecord) {
  return isRfxRecord(record) || fieldTargets.some((target) =>
    recordMentionsAny(record, target.aliases),
  ) || documentTargets.some((target) => recordMentionsAny(record, target.aliases));
}

function isRfxRecord(record: SourceRecord) {
  return [
    "workflow_id",
    "affected_workflow_id",
    "workflow.id",
    "template",
    "requested_fields",
    "supplier_row_count",
  ].some((key) => key in record.attributes);
}

function clusterKey({
  supplier,
  material,
  workflowId,
  threadId,
}: {
  supplier: string;
  material?: string;
  workflowId?: string;
  threadId?: string;
}) {
  return [workflowId ?? threadId ?? "workflow", supplier, material ?? "material"]
    .map(token)
    .join(":");
}

function firstAttribute(record: SourceRecord, keys: string[]) {
  return firstPresent(attributeStrings(record, keys));
}

function numericFirstAttribute(records: SourceRecord[], keys: string[]) {
  for (const record of records) {
    for (const key of keys) {
      const value = record.attributes[key];

      if (typeof value === "number") {
        return value;
      }
    }
  }

  return undefined;
}

function numberAttribute(records: SourceRecord[], key: string) {
  return records.reduce((total, record) => {
    const value = record.attributes[key];

    return total + (typeof value === "number" ? value : 0);
  }, 0);
}

function attributeStrings(record: SourceRecord, keys: string[]) {
  return keys.flatMap((key) => {
    const value = record.attributes[key];

    if (Array.isArray(value)) {
      return value.map(String).filter(Boolean);
    }

    if (value === undefined || value === null) {
      return [];
    }

    return [String(value)];
  });
}

function recordMentionsAny(record: SourceRecord, aliases: string[]) {
  const values = new Set(
    Object.entries(record.attributes).flatMap(([key, value]) => [
      key,
      ...toStrings(value),
    ]),
  );

  return aliases.some((alias) => values.has(alias));
}

function toStrings(value: SourceRecord["attributes"][string]) {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (value === null || value === undefined) {
    return [];
  }

  return [String(value)];
}

function statusForRecords(records: SourceRecord[]): SignalWorkflowStatus {
  if (
    records.some((record) =>
      attributeStrings(record, [
        "next_status",
        "next_edge_status",
        "edge.status.next",
      ]).includes("blocked") ||
      "blocked_by" in record.attributes ||
      "edge.blocked_by" in record.attributes,
    )
  ) {
    return "blocked";
  }

  if (
    records.some((record) =>
      "low_confidence_fields" in record.attributes ||
      "missing_fields" in record.attributes ||
      attributeStrings(record, ["previous_edge_status"]).includes("needs_review"),
    )
  ) {
    return "review_required";
  }

  if (
    records.some((record) =>
      "requested_fields" in record.attributes || "missing_document_type" in record.attributes,
    )
  ) {
    return "requested";
  }

  return "received";
}

function statusForFieldRecords(
  records: SourceRecord[],
  aliases: string[],
): SignalWorkflowStatus {
  if (records.some(hasBlockedStatus)) {
    return "blocked";
  }

  if (
    records.some((record) =>
      attributeStrings(record, ["low_confidence_fields"]).some((value) =>
        aliases.includes(value),
      ),
    )
  ) {
    return "review_required";
  }

  if (
    records.some((record) =>
      attributeStrings(record, ["missing_fields", "requested_fields"]).some((value) =>
        aliases.includes(value),
      ),
    )
  ) {
    return "requested";
  }

  return "received";
}

function hasBlockedStatus(record: SourceRecord) {
  return (
    attributeStrings(record, [
      "next_status",
      "next_edge_status",
      "edge.status.next",
    ]).includes("blocked") ||
    "blocked_by" in record.attributes ||
    "edge.blocked_by" in record.attributes
  );
}

function supportForRecords(records: SourceRecord[]): SignalEvidenceSupport {
  return records.some((record) =>
    "low_confidence_fields" in record.attributes ||
    "missing_fields" in record.attributes ||
    "missing_document_type" in record.attributes,
  )
    ? "partial"
    : "strong";
}

function ownerRoleForRecords(
  records: SourceRecord[],
  fallback: "buyer" | "qa" | "rd" | "ops",
) {
  for (const record of records) {
    const role = firstAttribute(record, ["owner_role", "to_role", "recipient_role"]);

    if (role === "buyer" || role === "qa" || role === "rd" || role === "ops") {
      return role;
    }

    if (role === "procurement") {
      return "buyer";
    }
  }

  return fallback;
}

function certificateTypeForRecords(records: SourceRecord[]) {
  const explicit = firstPresent(
    records.map((record) =>
      firstAttribute(record, ["certificate_type", "cert_type", "cert.type"]),
    ),
  );

  if (explicit) {
    return explicit.replaceAll("_", " ");
  }

  const guessed = firstPresent(
    records.map((record) =>
      firstAttribute(record, ["document_type_guess", "document.type_guess"]),
    ),
  );

  if (guessed?.endsWith("_certification")) {
    return guessed.replace(/_certification$/, "").replaceAll("_", " ");
  }

  return undefined;
}

function firstPresent(values: Array<string | undefined>) {
  return values.find((value) => value !== undefined && value.length > 0);
}

function token(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "unknown"
  );
}
