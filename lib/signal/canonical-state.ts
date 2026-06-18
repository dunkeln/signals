import type { AcmeBaseSandbox } from "@/lib/fixtures/acme-base-sandbox";
import {
  collectSourceRecords,
  type SourceRecord,
} from "@/lib/signal/intelligence";

export type SignalWorkflowStatus = "moving" | "slow" | "blocked" | "healthy";
export type SignalEvidenceSupport = "strong" | "partial";

export interface SignalWorkflowNode {
  id: SignalWorkflowNodeId;
  tier: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  label: string;
  parentCategory?: string;
}

export interface SignalWorkflowEdge {
  from: SignalWorkflowNodeId;
  to: SignalWorkflowNodeId;
}

export interface SignalEntityInstance {
  id: string;
  nodeId: SignalWorkflowNodeId;
  parentRefs: string[];
  payload: SignalEntityPayload;
  asOf: string;
  evidenceSourceIds: string[];
  support: SignalEvidenceSupport;
  summary: string;
  supplier?: string;
  material?: string;
  workflowId?: string;
  ownerRole?: string;
  status?: SignalWorkflowStatus;
}

export interface SignalCanonicalState {
  workflowNodes: SignalWorkflowNode[];
  workflowEdges: SignalWorkflowEdge[];
  entities: SignalEntityInstance[];
}

export type SignalWorkflowNodeId =
  | "supplier_email_inbox"
  | "email_instance"
  | "rfx_related_content"
  | "document_instance"
  | "rfp"
  | "rfq"
  | "rfi"
  | "supplier_boundary"
  | "price_received"
  | "moq_received"
  | "lead_time_received"
  | "incoterms_received"
  | "docs_received"
  | "rfp_response_received"
  | "coa"
  | "spec_sheet"
  | "haccp_plan"
  | "sds"
  | "supplier_questionnaire"
  | "insurance_certificate"
  | "certification"
  | "qa_gate"
  | "system_entry"
  | "purchase_order"
  | "invoice"
  | "bol"
  | "lot_coa"
  | "otif"
  | "realized_value";

type SignalEntityPayload =
  | {
      kind: "supplier_email_inbox";
      mailbox: string;
    }
  | {
      kind: "email_instance";
      threadId: string;
      supplierDomain: string;
      attachmentCount: number;
    }
  | {
      kind: "rfx_related_content";
      requestKind: "rfp" | "rfq" | "rfi";
      workflowId: string;
      fields: string[];
    }
  | {
      kind: "document_instance";
      documentId: string;
      documentType: "quote_sheet" | "coa" | "certification" | "spec_sheet";
    }
  | {
      kind: "client_request";
      requestKind: "rfp" | "rfq" | "rfi";
      workflowId: string;
    }
  | {
      kind: "supplier_boundary";
      supplierId: string;
      sourcingProcessRef: string;
      clientRequestRef: string;
      enteredBoundaryAt: string;
    }
  | {
      kind: "sourcing_field";
      field: "price" | "moq" | "lead_time" | "incoterms" | "docs";
      valueState: "received" | "requested";
    }
  | {
      kind: "document";
      documentId: string;
      documentType: "CoA" | "Certification" | "SpecSheet";
      confidence?: number;
      expirationDate?: string;
      certificateType?: string;
      lowConfidenceFields?: string[];
    }
  | {
      kind: "supplier_gate";
      gateKind: "qa_review" | "supplier_document_gate";
      reasonCodes: string[];
    }
  | {
      kind: "empty_future_node";
    };

const northstar = {
  supplier: "Northstar Sweeteners",
  material: "rice syrup blend",
  workflowId: "rfp_2026_05_sweeteners",
  supplierBoundaryId: "supplier-boundary:northstar:rice-syrup-blend",
  rfpId: "rfp:rfp_2026_05_sweeteners",
  rfxContentId: "rfx-content:thread-9d1c:northstar-sweeteners",
  emailId: "email:thread-9d1c:northstar-sweeteners",
  inboxId: "inbox:sourcing-demo-brand",
};

export const signalWorkflowNodes: SignalWorkflowNode[] = [
  { id: "supplier_email_inbox", tier: 0, label: "supplier email inbox" },
  { id: "email_instance", tier: 0, label: "email instance" },
  { id: "rfx_related_content", tier: 0, label: "RFx content" },
  { id: "document_instance", tier: 0, label: "document instance" },
  { id: "rfp", tier: 1, label: "RFP" },
  { id: "rfq", tier: 1, label: "RFQ" },
  { id: "rfi", tier: 1, label: "RFI" },
  { id: "supplier_boundary", tier: 3, label: "supplier boundary" },
  { id: "price_received", tier: 2, label: "price received" },
  { id: "moq_received", tier: 2, label: "MOQ received" },
  { id: "lead_time_received", tier: 2, label: "lead time received" },
  { id: "incoterms_received", tier: 2, label: "incoterms received" },
  { id: "docs_received", tier: 2, label: "docs received" },
  { id: "rfp_response_received", tier: 2, label: "RFP response received" },
  { id: "coa", tier: 4, label: "CoA", parentCategory: "Document" },
  { id: "spec_sheet", tier: 4, label: "spec sheet", parentCategory: "Document" },
  { id: "haccp_plan", tier: 4, label: "HACCP plan", parentCategory: "Document" },
  { id: "sds", tier: 4, label: "SDS", parentCategory: "Document" },
  {
    id: "supplier_questionnaire",
    tier: 4,
    label: "supplier questionnaire",
    parentCategory: "Document",
  },
  {
    id: "insurance_certificate",
    tier: 4,
    label: "insurance certificate",
    parentCategory: "Document",
  },
  {
    id: "certification",
    tier: 4,
    label: "certification",
    parentCategory: "Document",
  },
  { id: "qa_gate", tier: 3, label: "QA gate" },
  { id: "system_entry", tier: 3, label: "system entry" },
  { id: "purchase_order", tier: 5, label: "purchase order" },
  { id: "invoice", tier: 5, label: "invoice" },
  { id: "bol", tier: 5, label: "BOL" },
  { id: "lot_coa", tier: 5, label: "lot CoA" },
  { id: "otif", tier: 6, label: "OTIF" },
  { id: "realized_value", tier: 6, label: "realized value" },
];

export const signalWorkflowEdges: SignalWorkflowEdge[] = [
  { from: "supplier_email_inbox", to: "email_instance" },
  { from: "email_instance", to: "rfx_related_content" },
  { from: "email_instance", to: "document_instance" },
  { from: "rfx_related_content", to: "rfp" },
  { from: "rfx_related_content", to: "rfq" },
  { from: "rfx_related_content", to: "rfi" },
  { from: "rfp", to: "supplier_boundary" },
  { from: "rfq", to: "supplier_boundary" },
  { from: "rfi", to: "supplier_boundary" },
  { from: "supplier_boundary", to: "price_received" },
  { from: "supplier_boundary", to: "moq_received" },
  { from: "supplier_boundary", to: "lead_time_received" },
  { from: "supplier_boundary", to: "incoterms_received" },
  { from: "supplier_boundary", to: "docs_received" },
  { from: "supplier_boundary", to: "rfp_response_received" },
  { from: "document_instance", to: "coa" },
  { from: "document_instance", to: "spec_sheet" },
  { from: "document_instance", to: "certification" },
  { from: "coa", to: "qa_gate" },
  { from: "certification", to: "qa_gate" },
  { from: "supplier_boundary", to: "qa_gate" },
  { from: "supplier_boundary", to: "system_entry" },
  { from: "supplier_boundary", to: "purchase_order" },
  { from: "purchase_order", to: "invoice" },
  { from: "purchase_order", to: "bol" },
  { from: "bol", to: "lot_coa" },
  { from: "purchase_order", to: "otif" },
  { from: "otif", to: "realized_value" },
];

export function buildSignalCanonicalState(
  ingress: AcmeBaseSandbox,
): SignalCanonicalState {
  const records = collectSourceRecords(ingress);

  return {
    workflowNodes: signalWorkflowNodes,
    workflowEdges: signalWorkflowEdges,
    entities: buildEntityInstances(records),
  };
}

function buildEntityInstances(records: SourceRecord[]): SignalEntityInstance[] {
  const inboxEvidence = sourceIds(
    records,
    hasAttributeValue("mailbox", "sourcing@demo-brand.example"),
  );
  const northstarEmailEvidence = sourceIds(
    records,
    hasAttributeValue("thread_id", "thread-9d1c"),
    hasAttributeValue("email.thread_id", "thread-9d1c"),
    hasAttributeValue("from_domain", "northstar-sweeteners.example"),
  );
  const rfxEvidence = sourceIds(
    records,
    hasAttributeValue("workflow_id", northstar.workflowId),
    hasAttributeValue("workflow.id", northstar.workflowId),
    hasAttributeValue("affected_workflow_id", northstar.workflowId),
    hasAttributeValue("template", "quote_followup_moq_leadtime"),
    hasAttribute("supplier_row_count"),
  );
  const quoteEvidence = sourceIdsWhere(
    records,
    isNorthstarRiceSyrupRecord,
    hasAttributeValue("document_id", "doc_tmp_quote_183"),
    hasAttributeValue("document.id", "doc_tmp_quote_183"),
    hasAttributeValue("parser", "xlsx-parser"),
    hasAttribute("extracted_fields"),
    hasAttribute("detected_currency_tokens"),
    hasAttribute("detected_quantity_tokens"),
  );
  const coaEvidence = sourceIdsWhere(
    records,
    isNorthstarRiceSyrupRecord,
    hasAttributeValue("document_id", "doc_tmp_7f4a"),
    hasAttributeValue("document.id", "doc_tmp_7f4a"),
    hasAttributeValue("document_type_guess", "coa"),
    hasAttributeValue("document.type_guess", "coa"),
    hasAttributeValue("parser", "textract"),
    hasAttribute("low_confidence_fields"),
    hasAttributeValue("highlighted_field", "lot_number"),
  );
  const certEvidence = sourceIdsWhere(
    records,
    isNorthstarRiceSyrupRecord,
    hasAttributeValue("document_id", "doc_tmp_cert_442"),
    hasAttributeValue("document.id", "doc_tmp_cert_442"),
    hasAttributeValue("document_type_guess", "organic_certification"),
    hasAttributeValue("document.type_guess", "organic_certification"),
    hasAttribute("expiration_date"),
    hasAttribute("cert.expiration_date"),
    hasAttributeValue("blocking_document_id", "doc_tmp_cert_442"),
  );
  const qaReviewEvidence = sourceIds(
    records,
    hasAttributeValue("user_role", "qa"),
    hasAttributeValue("app.user_role", "qa"),
    hasAttributeValue("reason_codes", "ocr_low_confidence"),
    hasAttributeValue("highlighted_field", "lot_number"),
  );
  const blockedGateEvidence = sourceIdsWhere(
    records,
    isNorthstarRiceSyrupRecord,
    hasAttributeValue("blocked_by", "expired_certification"),
    hasAttributeValue("edge.blocked_by", "expired_certification"),
    hasAttributeValue("next_status", "blocked"),
    hasAttributeValue("next_edge_status", "blocked"),
    hasAttributeValue("edge.status.next", "blocked"),
  );

  return compactEntities([
    entity({
      id: northstar.inboxId,
      nodeId: "supplier_email_inbox",
      parentRefs: [],
      payload: {
        kind: "supplier_email_inbox",
        mailbox: "sourcing@demo-brand.example",
      },
      asOf: firstTime(records, inboxEvidence),
      evidenceSourceIds: inboxEvidence,
      support: "strong",
      summary: "Demo sourcing inbox received supplier email evidence.",
    }),
    entity({
      id: northstar.emailId,
      nodeId: "email_instance",
      parentRefs: [northstar.inboxId],
      payload: {
        kind: "email_instance",
        threadId: "thread-9d1c",
        supplierDomain: "northstar-sweeteners.example",
        attachmentCount: 2,
      },
      asOf: firstTime(records, northstarEmailEvidence),
      evidenceSourceIds: northstarEmailEvidence,
      support: "strong",
      supplier: northstar.supplier,
      material: northstar.material,
      summary: "Northstar supplier thread entered the sourcing inbox.",
    }),
    entity({
      id: northstar.rfxContentId,
      nodeId: "rfx_related_content",
      parentRefs: [northstar.emailId],
      payload: {
        kind: "rfx_related_content",
        requestKind: "rfp",
        workflowId: northstar.workflowId,
        fields: ["unit_price", "moq", "lead_time_days", "payment_terms"],
      },
      asOf: firstTime(records, rfxEvidence),
      evidenceSourceIds: rfxEvidence,
      support: "strong",
      supplier: northstar.supplier,
      material: northstar.material,
      workflowId: northstar.workflowId,
      status: "moving",
      summary: "RFx-related quote content was extracted for the sweeteners RFP.",
    }),
    entity({
      id: northstar.rfpId,
      nodeId: "rfp",
      parentRefs: [northstar.rfxContentId],
      payload: {
        kind: "client_request",
        requestKind: "rfp",
        workflowId: northstar.workflowId,
      },
      asOf: firstTime(records, rfxEvidence),
      evidenceSourceIds: rfxEvidence,
      support: "strong",
      supplier: northstar.supplier,
      material: northstar.material,
      workflowId: northstar.workflowId,
      status: "moving",
      summary: "The extracted RFx content is attached to the sweeteners RFP.",
    }),
    entity({
      id: northstar.supplierBoundaryId,
      nodeId: "supplier_boundary",
      parentRefs: [northstar.rfpId],
      payload: {
        kind: "supplier_boundary",
        supplierId: "northstar-sweeteners",
        sourcingProcessRef: northstar.rfxContentId,
        clientRequestRef: northstar.rfpId,
        enteredBoundaryAt: firstTime(records, rfxEvidence),
      },
      asOf: firstTime(records, rfxEvidence),
      evidenceSourceIds: rfxEvidence,
      support: "strong",
      supplier: northstar.supplier,
      material: northstar.material,
      workflowId: northstar.workflowId,
      status: "moving",
      summary: "Northstar has a supplier-scoped boundary for this RFP workflow.",
    }),
    sourcingFieldEntity({
      id: "field:northstar:rice-syrup-blend:price",
      nodeId: "price_received",
      field: "price",
      parentRefs: [northstar.supplierBoundaryId],
      evidenceSourceIds: quoteEvidence,
      asOf: firstTime(records, quoteEvidence),
      status: "healthy",
      summary: "Price evidence was received from the Northstar quote sheet/body.",
    }),
    sourcingFieldEntity({
      id: "field:northstar:rice-syrup-blend:moq",
      nodeId: "moq_received",
      field: "moq",
      parentRefs: [northstar.supplierBoundaryId],
      evidenceSourceIds: quoteEvidence,
      asOf: firstTime(records, quoteEvidence),
      status: "moving",
      summary: "MOQ evidence was extracted, with follow-up still visible in source telemetry.",
    }),
    sourcingFieldEntity({
      id: "field:northstar:rice-syrup-blend:lead-time",
      nodeId: "lead_time_received",
      field: "lead_time",
      parentRefs: [northstar.supplierBoundaryId],
      evidenceSourceIds: quoteEvidence,
      asOf: firstTime(records, quoteEvidence),
      status: "moving",
      summary: "Lead-time evidence was extracted, with follow-up still visible in source telemetry.",
    }),
    entity({
      id: "document-instance:northstar:coa",
      nodeId: "document_instance",
      parentRefs: [northstar.emailId],
      payload: {
        kind: "document_instance",
        documentId: "doc_tmp_7f4a",
        documentType: "coa",
      },
      asOf: firstTime(records, coaEvidence),
      evidenceSourceIds: coaEvidence,
      support: "strong",
      supplier: northstar.supplier,
      material: northstar.material,
      workflowId: northstar.workflowId,
      status: "slow",
      summary: "A CoA document instance was extracted from the Northstar thread.",
    }),
    entity({
      id: "document:northstar:coa",
      nodeId: "coa",
      parentRefs: ["document-instance:northstar:coa"],
      payload: {
        kind: "document",
        documentId: "doc_tmp_7f4a",
        documentType: "CoA",
        confidence: 0.41,
        lowConfidenceFields: ["lot_number", "micro_result"],
      },
      asOf: firstTime(records, coaEvidence),
      evidenceSourceIds: coaEvidence,
      support: "strong",
      supplier: northstar.supplier,
      material: northstar.material,
      workflowId: northstar.workflowId,
      ownerRole: "qa",
      status: "slow",
      summary: "CoA extraction has low-confidence lot and micro-result fields.",
    }),
    entity({
      id: "qa-gate:northstar:coa-review",
      nodeId: "qa_gate",
      parentRefs: ["document:northstar:coa"],
      payload: {
        kind: "supplier_gate",
        gateKind: "qa_review",
        reasonCodes: ["ocr_low_confidence", "coa_candidate"],
      },
      asOf: firstTime(records, qaReviewEvidence),
      evidenceSourceIds: qaReviewEvidence,
      support: "strong",
      supplier: northstar.supplier,
      material: northstar.material,
      workflowId: northstar.workflowId,
      ownerRole: "qa",
      status: "slow",
      summary: "QA review opened for low-confidence CoA fields.",
    }),
    entity({
      id: "document-instance:northstar:organic-certification",
      nodeId: "document_instance",
      parentRefs: [northstar.emailId],
      payload: {
        kind: "document_instance",
        documentId: "doc_tmp_cert_442",
        documentType: "certification",
      },
      asOf: firstTime(records, certEvidence),
      evidenceSourceIds: certEvidence,
      support: "strong",
      supplier: northstar.supplier,
      material: northstar.material,
      workflowId: northstar.workflowId,
      status: "blocked",
      summary: "An organic certification document instance exists for Northstar.",
    }),
    entity({
      id: "document:northstar:organic-certification",
      nodeId: "certification",
      parentRefs: ["document-instance:northstar:organic-certification"],
      payload: {
        kind: "document",
        documentId: "doc_tmp_cert_442",
        documentType: "Certification",
        expirationDate: "2026-05-01",
        certificateType: "organic",
      },
      asOf: firstTime(records, certEvidence),
      evidenceSourceIds: certEvidence,
      support: "strong",
      supplier: northstar.supplier,
      material: northstar.material,
      workflowId: northstar.workflowId,
      ownerRole: "qa",
      status: "blocked",
      summary: "Organic certification evidence is expired for the supplier boundary.",
    }),
    entity({
      id: "qa-gate:northstar:organic-certification",
      nodeId: "qa_gate",
      parentRefs: ["document:northstar:organic-certification"],
      payload: {
        kind: "supplier_gate",
        gateKind: "supplier_document_gate",
        reasonCodes: ["expired_certification"],
      },
      asOf: firstTime(records, blockedGateEvidence),
      evidenceSourceIds: blockedGateEvidence,
      support: "strong",
      supplier: northstar.supplier,
      material: northstar.material,
      workflowId: northstar.workflowId,
      ownerRole: "qa",
      status: "blocked",
      summary: "Supplier document gate is blocked by expired certification evidence.",
    }),
  ]);
}

function sourcingFieldEntity({
  id,
  nodeId,
  field,
  parentRefs,
  evidenceSourceIds,
  asOf,
  status,
  summary,
}: {
  id: string;
  nodeId: "price_received" | "moq_received" | "lead_time_received";
  field: "price" | "moq" | "lead_time";
  parentRefs: string[];
  evidenceSourceIds: string[];
  asOf: string;
  status: SignalWorkflowStatus;
  summary: string;
}): SignalEntityInstance {
  return entity({
    id,
    nodeId,
    parentRefs,
    payload: {
      kind: "sourcing_field",
      field,
      valueState: "received",
    },
    asOf,
    evidenceSourceIds,
    support: "partial",
    supplier: northstar.supplier,
    material: northstar.material,
    workflowId: northstar.workflowId,
    ownerRole: "buyer",
    status,
    summary,
  });
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

function sourceIds(
  records: SourceRecord[],
  ...predicates: Array<(record: SourceRecord) => boolean>
) {
  return sourceIdsWhere(records, () => true, ...predicates);
}

function sourceIdsWhere(
  records: SourceRecord[],
  scope: (record: SourceRecord) => boolean,
  ...predicates: Array<(record: SourceRecord) => boolean>
) {
  return unique(
    records
      .filter(scope)
      .filter((record) => predicates.some((predicate) => predicate(record)))
      .map((record) => record.id),
  );
}

function firstTime(records: SourceRecord[], sourceIds: string[]) {
  const sourceIdSet = new Set(sourceIds);
  const record = records.find((candidate) => sourceIdSet.has(candidate.id));

  return record?.time ?? "2026-05-14T17:00:00.000Z";
}

function isNorthstarRiceSyrupRecord(record: SourceRecord) {
  return (
    hasAttributeValue("supplier_display_name", "Northstar Sweeteners")(record) ||
    hasAttributeValue("supplier_display_name", "Northstar Sweeteners LLC")(record) ||
    hasAttributeValue("ingredient_display_name", northstar.material)(record) ||
    hasAttributeValue("workflow_id", northstar.workflowId)(record) ||
    hasAttributeValue("affected_workflow_id", northstar.workflowId)(record) ||
    hasAttributeValue("workflow.id", northstar.workflowId)(record) ||
    hasAttributeValue("edge_id", "edge_northstar_rice_syrup_blend")(record) ||
    hasAttributeValue("edge.id", "edge_northstar_rice_syrup_blend")(record) ||
    hasAttributeValue("blocking_document_id", "doc_tmp_cert_442")(record) ||
    hasAttributeValue("document_id", "doc_tmp_cert_442")(record) ||
    hasAttributeValue("document.id", "doc_tmp_cert_442")(record) ||
    hasAttributeValue("document_id", "doc_tmp_7f4a")(record) ||
    hasAttributeValue("document.id", "doc_tmp_7f4a")(record) ||
    hasAttributeValue("document_id", "doc_tmp_quote_183")(record) ||
    hasAttributeValue("subject", "edge/edge_northstar_rice_syrup_blend")(record)
  );
}

function hasAttribute(key: string) {
  return (record: SourceRecord) => key in record.attributes;
}

function hasAttributeValue(key: string, expectedValue: string) {
  return (record: SourceRecord) => {
    const value = record.attributes[key];

    if (Array.isArray(value)) {
      return value.includes(expectedValue);
    }

    return value === expectedValue;
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}
