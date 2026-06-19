import type {
  SignalCanonicalState,
  SignalEntityInstance,
  SignalEvidenceSupport,
  SignalWorkflowStatus,
} from "@/lib/signal/canonical-state";

export type SignalWorkflowMapNodeKind = "work_surface";
export type SignalWorkflowMapSurfaceKind = "client_role" | "supplier";

export interface SignalWorkflowMapNode {
  id: string;
  label: string;
  nodeKind: SignalWorkflowMapNodeKind;
  surfaceKind: SignalWorkflowMapSurfaceKind;
  evidenceSourceIds: string[];
}

export interface SignalWorkflowMapLink {
  source: string;
  target: string;
  value: number;
  flowUnit: "content_packet";
  contentLabel: string;
  contentKinds: string[];
  status?: SignalWorkflowStatus;
  ownerRole?: string;
  supplier?: string;
  material?: string;
  workflowId?: string;
  support: SignalEvidenceSupport;
  evidenceSourceIds: string[];
  contentEntityIds: string[];
  summary: string;
}

export interface SignalWorkflowMapData {
  nodes: SignalWorkflowMapNode[];
  links: SignalWorkflowMapLink[];
}

const buyerRequestNodeId = "surface:client-role:procurement-lead:rfx";
const supplierNodeId = "surface:supplier:northstar-sweeteners";

export function buildSignalWorkflowMap(
  canonical: SignalCanonicalState,
): SignalWorkflowMapData {
  const rfp = firstEntity(canonical.entities, "rfp");
  const quoteFields = entitiesForNodes(canonical.entities, [
    "price_received",
    "moq_received",
    "lead_time_received",
  ]);
  const qaDocuments = entitiesForNodes(canonical.entities, [
    "coa",
    "certification",
  ]);
  const qaGates = entitiesForNodes(canonical.entities, ["qa_gate"]);
  const supplier = firstPresent([
    rfp?.supplier,
    ...quoteFields.map((entity) => entity.supplier),
    ...qaDocuments.map((entity) => entity.supplier),
  ]);

  if (!supplier || quoteFields.length + qaDocuments.length === 0) {
    return { nodes: [], links: [] };
  }

  const workflowId = firstPresent([
    rfp?.workflowId,
    ...quoteFields.map((entity) => entity.workflowId),
    ...qaDocuments.map((entity) => entity.workflowId),
  ]);
  const material = firstPresent([
    rfp?.material,
    ...quoteFields.map((entity) => entity.material),
    ...qaDocuments.map((entity) => entity.material),
  ]);
  const contentPackets = [
    ...quoteFields.map((entity) => contentPacket(entity, "buyer")),
    ...qaDocuments.map((entity) => contentPacket(entity, "qa", qaGates)),
  ];
  const nodes: SignalWorkflowMapNode[] = [
    workSurfaceNode({
      id: buyerRequestNodeId,
      label: "Procurement RFx",
      surfaceKind: "client_role",
      entities: [rfp, ...quoteFields, ...qaDocuments],
    }),
    workSurfaceNode({
      id: supplierNodeId,
      label: supplier,
      surfaceKind: "supplier",
      entities: [rfp, ...quoteFields, ...qaDocuments, ...qaGates],
    }),
    ...contentPackets.map((packet) =>
      workSurfaceNode({
        id: packet.target,
        label: packet.targetLabel,
        surfaceKind: "client_role",
        entities: packet.entities,
      }),
    ),
  ];
  const links: SignalWorkflowMapLink[] = [
    workflowLink({
      source: buyerRequestNodeId,
      target: supplierNodeId,
      value: contentPackets.length,
      contentLabel: "RFP packet request",
      contentKinds: contentPackets.map((packet) => packet.contentKind),
      entities: [rfp, ...quoteFields, ...qaDocuments],
      contentEntityIds: contentPackets.map((packet) => packet.entity.id),
      status: rfp?.status,
      ownerRole: "buyer",
      supplier,
      material,
      workflowId,
      summary:
        "Procurement lead sends the RFP packet that frames the supplier content expected back.",
    }),
    ...contentPackets.map((packet) =>
      workflowLink({
        source: supplierNodeId,
        target: packet.target,
        value: 1,
        contentLabel: packet.contentLabel,
        contentKinds: [packet.contentKind],
        entities: packet.entities,
        contentEntityIds: [packet.entity.id],
        status: packet.entity.status,
        ownerRole: packet.ownerRole,
        supplier,
        material,
        workflowId,
        summary: packet.summary,
      }),
    ),
  ].filter((link) => link.value > 0);

  const renderedNodeIds = new Set(
    links.flatMap((link) => [link.source, link.target]),
  );

  return {
    nodes: uniqueNodes(nodes).filter((node) => renderedNodeIds.has(node.id)),
    links,
  };
}

function contentPacket(
  entity: SignalEntityInstance,
  ownerRole: "buyer" | "qa",
  relatedEntities: SignalEntityInstance[] = [],
) {
  const label = contentLabelForEntity(entity);
  const targetSurface = ownerSurfaceForRole(ownerRole);
  const entities = [entity, ...relatedEntitiesForEntity(entity, relatedEntities)];

  return {
    entity,
    entities,
    ownerRole,
    target: targetSurface.id,
    targetLabel: targetSurface.label,
    contentLabel: label,
    contentKind: contentKindForEntity(entity),
    summary: summaryForEntity(entity, label, targetSurface.label),
  };
}

function ownerSurfaceForRole(ownerRole: "buyer" | "qa") {
  switch (ownerRole) {
    case "buyer":
      return {
        id: "surface:client-role:procurement",
        label: "Procurement workspace",
      };
    case "qa":
      return {
        id: "surface:client-role:qa",
        label: "QA workspace",
      };
  }
}

function contentLabelForEntity(entity: SignalEntityInstance) {
  switch (entity.nodeId) {
    case "price_received":
      return "price";
    case "moq_received":
      return "MOQ";
    case "lead_time_received":
      return "lead time";
    case "coa":
      return "CoA";
    case "certification":
      return "organic certification";
    default:
      return entity.nodeId.replaceAll("_", " ");
  }
}

function contentKindForEntity(entity: SignalEntityInstance) {
  switch (entity.nodeId) {
    case "price_received":
      return "price";
    case "moq_received":
      return "moq";
    case "lead_time_received":
      return "lead_time";
    case "coa":
      return "coa";
    case "certification":
      return "certification";
    default:
      return entity.nodeId;
  }
}

function relatedEntitiesForEntity(
  entity: SignalEntityInstance,
  candidates: SignalEntityInstance[],
) {
  return candidates.filter((candidate) => candidate.parentRefs.includes(entity.id));
}

function summaryForEntity(
  entity: SignalEntityInstance,
  label: string,
  targetRoleLabel: string,
) {
  return `${label} evidence reaches ${targetRoleLabel}. ${entity.summary}`;
}

function workSurfaceNode({
  id,
  label,
  surfaceKind,
  entities,
}: {
  id: string;
  label: string;
  surfaceKind: SignalWorkflowMapSurfaceKind;
  entities: Array<SignalEntityInstance | undefined>;
}): SignalWorkflowMapNode {
  return {
    id,
    label,
    nodeKind: "work_surface",
    surfaceKind,
    evidenceSourceIds: unique(
      compact(entities).flatMap((entity) => entity.evidenceSourceIds),
    ),
  };
}

function workflowLink({
  source,
  target,
  value,
  contentLabel,
  contentKinds,
  entities,
  contentEntityIds,
  status,
  ownerRole,
  supplier,
  material,
  workflowId,
  summary,
}: {
  source: string;
  target: string;
  value: number;
  contentLabel: string;
  contentKinds: string[];
  entities: Array<SignalEntityInstance | undefined>;
  contentEntityIds?: string[];
  status?: SignalWorkflowStatus;
  ownerRole?: string;
  supplier?: string;
  material?: string;
  workflowId?: string;
  summary: string;
}): SignalWorkflowMapLink {
  const presentEntities = compact(entities);

  return {
    source,
    target,
    value,
    flowUnit: "content_packet",
    contentLabel,
    contentKinds,
    status,
    ownerRole,
    supplier,
    material,
    workflowId,
    support: presentEntities.some((entity) => entity.support === "partial")
      ? "partial"
      : "strong",
    evidenceSourceIds: unique(
      presentEntities.flatMap((entity) => entity.evidenceSourceIds),
    ),
    contentEntityIds: unique(
      contentEntityIds ?? presentEntities.map((entity) => entity.id),
    ),
    summary,
  };
}

function firstEntity(
  entities: SignalEntityInstance[],
  nodeId: SignalEntityInstance["nodeId"],
) {
  return entities.find((entity) => entity.nodeId === nodeId);
}

function entitiesForNodes(
  entities: SignalEntityInstance[],
  nodeIds: SignalEntityInstance["nodeId"][],
) {
  const allowedNodeIds = new Set(nodeIds);

  return entities.filter((entity) => allowedNodeIds.has(entity.nodeId));
}

function firstPresent(values: Array<string | undefined>) {
  return values.find((value) => value !== undefined);
}

function compact<Value>(values: Array<Value | undefined>) {
  return values.filter((value): value is Value => value !== undefined);
}

function uniqueNodes(nodes: SignalWorkflowMapNode[]) {
  return Array.from(new Map(nodes.map((node) => [node.id, node])).values());
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}
