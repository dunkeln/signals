import type {
  JsonValue,
  SourceRecord,
} from "@/lib/signal/intelligence";
import type {
  SignalContentPacket,
  SignalEntityInstance,
  SignalEvidenceSupport,
  SignalPacketOmission,
  SignalPacketSetState,
  SignalWorkflowNodeId,
  SignalWorkSurface,
} from "@/lib/signal/canonical-types";

const contentMetadata: Partial<
  Record<SignalWorkflowNodeId, { label: string; kind: string }>
> = {
  price_received: { label: "price", kind: "price" },
  moq_received: { label: "MOQ", kind: "moq" },
  lead_time_received: { label: "lead time", kind: "lead_time" },
  incoterms_received: { label: "incoterms", kind: "incoterms" },
  docs_received: { label: "docs", kind: "docs" },
  rfp_response_received: { label: "RFP response", kind: "rfp_response" },
  coa: { label: "CoA", kind: "coa" },
  spec_sheet: { label: "spec sheet", kind: "spec_sheet" },
  haccp_plan: { label: "HACCP plan", kind: "haccp_plan" },
  sds: { label: "SDS", kind: "sds" },
  supplier_questionnaire: {
    label: "supplier questionnaire",
    kind: "supplier_questionnaire",
  },
  insurance_certificate: {
    label: "insurance certificate",
    kind: "insurance_certificate",
  },
  certification: { label: "organic certification", kind: "certification" },
};

const renderableContentNodeIds = new Set<SignalWorkflowNodeId>(
  Object.keys(contentMetadata) as SignalWorkflowNodeId[],
);

const procurementOutboundSurface: SignalWorkSurface = {
  id: "surface:client-role:procurement:outbound",
  label: "Procurement",
  kind: "client_role",
};

export function buildPacketSetState(
  entities: SignalEntityInstance[],
  records: SourceRecord[],
): SignalPacketSetState {
  const admittedPackets = buildAdmittedPackets(entities, records);
  const dagMappablePackets = admittedPackets.filter(isDagMappablePacket);
  const renderablePackets = dagMappablePackets.filter(isRenderablePacket);

  return {
    admittedPackets,
    dagMappablePackets,
    renderablePackets,
    omissions: [
      ...omissionsFor(admittedPackets, dagMappablePackets, "not_dag_mappable"),
      ...omissionsFor(dagMappablePackets, renderablePackets, "not_renderable"),
    ],
  };
}

function buildAdmittedPackets(
  entities: SignalEntityInstance[],
  records: SourceRecord[],
) {
  const contentEntities = entities.filter(
    (entity) => renderableContentNodeIds.has(entity.nodeId) && entity.supplier,
  );
  const contentGroups = groupPacketContentEntities(contentEntities);
  const packets: SignalContentPacket[] = [];

  for (const group of contentGroups) {
    const request = entities.find(
      (entity) =>
        (entity.nodeId === "rfi" ||
          entity.nodeId === "rfq" ||
          entity.nodeId === "rfp") &&
        entity.workflowId === group.workflowId,
    );
    const requestKind = requestKindForEntities([request, ...group.entities]);
    const supplierSurface = supplierSurfaceFor(group.supplier);
    const sourceEntityIds = group.entities.map((entity) => entity.id);

    const evidenceSourceIds = evidenceIdsFor([request, ...group.entities]);
    const observedAt = packetObservedAt([request, ...group.entities]);

    packets.push({
      id: `packet:rfx:${token(group.workflowId)}:${token(group.supplier)}`,
      source: procurementOutboundSurface,
      target: supplierSurface,
      value: group.entities.length,
      flowUnit: "content_packet",
      contentLabel:
        requestKind === "rfx"
          ? "RFx packet request"
          : `${requestKind.toUpperCase()} packet request`,
      contentKinds: unique(group.entities.map(contentKindForEntity)),
      packetState: request?.status ?? "requested",
      ownerRole: "buyer",
      supplier: group.supplier,
      material: group.material,
      workflowId: group.workflowId,
      support: supportForEntities([request, ...group.entities]),
      evidenceSourceIds,
      sourceEntityIds,
      observedAt,
      timeBucket: minuteBucket(observedAt),
      attributes: attributesForSourceIds(records, evidenceSourceIds),
      summary: `Procurement sends the ${
        requestKind === "rfx" ? "RFx" : requestKind.toUpperCase()
      } packet to the supplier.`,
    });

    for (const entity of group.entities) {
      const ownerRole = ownerRoleForEntity(entity);
      const targetSurface = ownerSurfaceForRole(ownerRole);
      const label = contentLabelForEntity(entity);

      packets.push({
        id: `packet:${entity.id}`,
        source: supplierSurface,
        target: targetSurface,
        value: 1,
        flowUnit: "content_packet",
        contentLabel: label,
        contentKinds: [contentKindForEntity(entity)],
        packetState: entity.status,
        ownerRole,
        supplier: group.supplier,
        material: group.material,
        workflowId: group.workflowId,
        support: entity.support,
        evidenceSourceIds: entity.evidenceSourceIds,
        sourceEntityIds: [entity.id],
        observedAt: entity.asOf,
        timeBucket: minuteBucket(entity.asOf),
        attributes: attributesForSourceIds(records, entity.evidenceSourceIds),
        summary: `${label} evidence reaches ${targetSurface.label}. ${entity.summary}`,
      });
    }
  }

  return packets;
}

function requestKindForEntities(
  entities: Array<SignalEntityInstance | undefined>,
): "rfi" | "rfq" | "rfp" | "rfx" {
  for (const entity of entities) {
    if (entity?.payload.kind === "client_request") {
      return entity.payload.requestKind;
    }
  }

  return "rfx";
}

function groupPacketContentEntities(entities: SignalEntityInstance[]) {
  const groups = new Map<
    string,
    {
      supplier: string;
      material?: string;
      workflowId: string;
      entities: SignalEntityInstance[];
    }
  >();

  for (const entity of entities) {
    const supplier = entity.supplier ?? "Unknown supplier";
    const workflowId =
      entity.workflowId ?? `workflow:${token(supplier)}:${token(entity.material ?? "material")}`;
    const key = [supplier, entity.material ?? "", workflowId].map(token).join(":");
    const group =
      groups.get(key) ??
      {
        supplier,
        material: entity.material,
        workflowId,
        entities: [],
      };

    group.entities.push(entity);
    groups.set(key, group);
  }

  return Array.from(groups.values());
}

function isDagMappablePacket(packet: SignalContentPacket) {
  return packet.source.id.length > 0 && packet.target.id.length > 0;
}

function isRenderablePacket(packet: SignalContentPacket) {
  return packet.flowUnit === "content_packet" && packet.evidenceSourceIds.length > 0;
}

function omissionsFor(
  sourcePackets: SignalContentPacket[],
  acceptedPackets: SignalContentPacket[],
  reason: SignalPacketOmission["reason"],
) {
  const acceptedIds = new Set(acceptedPackets.map((packet) => packet.id));

  return sourcePackets
    .filter((packet) => !acceptedIds.has(packet.id))
    .map((packet) => ({
      reason,
      sourceEntityId: packet.sourceEntityIds[0] ?? packet.id,
      summary: packet.summary,
    }));
}

function supportForEntities(
  entities: Array<SignalEntityInstance | undefined>,
): SignalEvidenceSupport {
  return compactEntityRefs(entities).some((entity) => entity.support === "partial")
    ? "partial"
    : "strong";
}

function evidenceIdsFor(entities: Array<SignalEntityInstance | undefined>) {
  return unique(compactEntityRefs(entities).flatMap((entity) => entity.evidenceSourceIds));
}

function attributesForSourceIds(
  records: SourceRecord[],
  sourceIds: string[],
): Record<string, JsonValue> {
  const wanted = new Set(sourceIds);
  const values = new Map<string, JsonValue[]>();

  for (const record of records) {
    if (!wanted.has(record.id)) {
      continue;
    }

    for (const [key, value] of Object.entries(record.attributes)) {
      values.set(key, [...(values.get(key) ?? []), value]);
    }
  }

  return Object.fromEntries(
    Array.from(values.entries()).map(([key, attributeValues]) => [
      key,
      compactAttributeValues(attributeValues),
    ]),
  );
}

function compactAttributeValues(values: JsonValue[]): JsonValue {
  const uniqueValues = Array.from(
    new Map(values.map((value) => [JSON.stringify(value), value])).values(),
  );

  return uniqueValues.length === 1 ? uniqueValues[0] : uniqueValues;
}

function packetObservedAt(entities: Array<SignalEntityInstance | undefined>) {
  return compactEntityRefs(entities)
    .map((entity) => entity.asOf)
    .sort()[0] ?? "2026-05-14T17:00:00.000Z";
}

function minuteBucket(time: string) {
  return time.slice(0, 16).replace("T", " ");
}

function compactEntityRefs(entities: Array<SignalEntityInstance | undefined>) {
  return entities.filter(
    (entity): entity is SignalEntityInstance => entity !== undefined,
  );
}

function ownerRoleForEntity(entity: SignalEntityInstance) {
  if (entity.ownerRole === "qa" || entity.ownerRole === "rd" || entity.ownerRole === "ops") {
    return entity.ownerRole;
  }

  if (isDocumentContentEntity(entity)) {
    return "qa";
  }

  return "buyer";
}

function isDocumentContentEntity(entity: SignalEntityInstance) {
  return (
    entity.nodeId === "coa" ||
    entity.nodeId === "certification" ||
    entity.nodeId === "spec_sheet" ||
    entity.nodeId === "haccp_plan" ||
    entity.nodeId === "sds" ||
    entity.nodeId === "supplier_questionnaire" ||
    entity.nodeId === "insurance_certificate"
  );
}

function ownerSurfaceForRole(ownerRole: "buyer" | "qa" | "rd" | "ops"): SignalWorkSurface {
  switch (ownerRole) {
    case "buyer":
      return {
        id: "surface:client-role:procurement",
        label: "Procurement",
        kind: "client_role",
      };
    case "qa":
      return {
        id: "surface:client-role:qa",
        label: "QA",
        kind: "client_role",
      };
    case "rd":
      return {
        id: "surface:client-role:rd",
        label: "R&D",
        kind: "client_role",
      };
    case "ops":
      return {
        id: "surface:client-role:ops",
        label: "Ops",
        kind: "client_role",
      };
  }
}

function supplierSurfaceFor(supplier: string): SignalWorkSurface {
  return {
    id: `surface:supplier:${token(supplier)}`,
    label: supplier,
    kind: "supplier",
  };
}

function contentLabelForEntity(entity: SignalEntityInstance) {
  return contentMetadata[entity.nodeId]?.label ?? entity.nodeId.replaceAll("_", " ");
}

function contentKindForEntity(entity: SignalEntityInstance) {
  return contentMetadata[entity.nodeId]?.kind ?? entity.nodeId;
}



function unique(values: string[]) {
  return Array.from(new Set(values));
}

function token(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "unknown"
  );
}
