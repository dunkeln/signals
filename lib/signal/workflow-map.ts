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

const chartableContentNodeIds = new Set<SignalEntityInstance["nodeId"]>([
  "price_received",
  "moq_received",
  "lead_time_received",
  "incoterms_received",
  "docs_received",
  "rfp_response_received",
  "coa",
  "spec_sheet",
  "haccp_plan",
  "sds",
  "supplier_questionnaire",
  "insurance_certificate",
  "certification",
]);

const procurementOutboundNodeId = "surface:client-role:procurement:outbound";

export function buildSignalWorkflowMap(
  canonical: SignalCanonicalState,
): SignalWorkflowMapData {
  const rfps = entitiesForNodes(canonical.entities, ["rfp"]);
  const qaGates = entitiesForNodes(canonical.entities, ["qa_gate"]);
  const contentEntities = canonical.entities.filter(isChartableContentEntity);
  const groups = groupContentEntities(contentEntities);
  const nodes: SignalWorkflowMapNode[] = [];
  const links: SignalWorkflowMapLink[] = [];

  if (groups.length === 0) {
    return { nodes: [], links: [] };
  }

  for (const group of groups) {
    const rfp = rfps.find((entity) => entity.workflowId === group.workflowId);
    const supplierNodeId = `surface:supplier:${token(group.supplier)}`;
    const contentPackets = group.entities.map((entity) =>
      contentPacket(entity, ownerRoleForEntity(entity), qaGates),
    );

    nodes.push(
      workSurfaceNode({
        id: procurementOutboundNodeId,
        label: "Procurement",
        surfaceKind: "client_role",
        entities: [rfp, ...group.entities],
      }),
      workSurfaceNode({
        id: supplierNodeId,
        label: group.supplier,
        surfaceKind: "supplier",
        entities: [rfp, ...group.entities, ...qaGates],
      }),
      ...contentPackets.map((packet) =>
        workSurfaceNode({
          id: packet.target,
          label: packet.targetLabel,
          surfaceKind: "client_role",
          entities: packet.entities,
        }),
      ),
    );

    links.push(
      workflowLink({
        source: procurementOutboundNodeId,
        target: supplierNodeId,
        value: contentPackets.length,
        contentLabel: "RFx packet request",
        contentKinds: unique(contentPackets.map((packet) => packet.contentKind)),
        entities: [rfp, ...group.entities],
        contentEntityIds: contentPackets.map((packet) => packet.entity.id),
        status: rfp?.status ?? "requested",
        ownerRole: "buyer",
        supplier: group.supplier,
        material: group.material,
        workflowId: group.workflowId,
        summary: "Procurement sends the RFx packet to the supplier.",
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
          supplier: group.supplier,
          material: group.material,
          workflowId: group.workflowId,
          summary: packet.summary,
        }),
      ),
    );
  }

  const renderedNodeIds = new Set(
    links.flatMap((link) => [link.source, link.target]),
  );

  return {
    nodes: uniqueNodes(nodes).filter((node) => renderedNodeIds.has(node.id)),
    links,
  };
}

function isChartableContentEntity(entity: SignalEntityInstance) {
  return chartableContentNodeIds.has(entity.nodeId) && entity.supplier !== undefined;
}

function groupContentEntities(entities: SignalEntityInstance[]) {
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

function contentPacket(
  entity: SignalEntityInstance,
  ownerRole: "buyer" | "qa" | "rd" | "ops",
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

function ownerSurfaceForRole(ownerRole: "buyer" | "qa" | "rd" | "ops") {
  switch (ownerRole) {
    case "buyer":
      return {
        id: "surface:client-role:procurement",
        label: "Procurement",
      };
    case "qa":
      return {
        id: "surface:client-role:qa",
        label: "QA",
      };
    case "rd":
      return {
        id: "surface:client-role:rd",
        label: "R&D",
      };
    case "ops":
      return {
        id: "surface:client-role:ops",
        label: "Ops",
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
    case "incoterms_received":
      return "incoterms";
    case "docs_received":
      return "docs";
    case "rfp_response_received":
      return "RFP response";
    case "coa":
      return "CoA";
    case "spec_sheet":
      return "spec sheet";
    case "haccp_plan":
      return "HACCP plan";
    case "sds":
      return "SDS";
    case "supplier_questionnaire":
      return "supplier questionnaire";
    case "insurance_certificate":
      return "insurance certificate";
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
    case "incoterms_received":
      return "incoterms";
    case "docs_received":
      return "docs";
    case "rfp_response_received":
      return "rfp_response";
    case "coa":
      return "coa";
    case "spec_sheet":
      return "spec_sheet";
    case "haccp_plan":
      return "haccp_plan";
    case "sds":
      return "sds";
    case "supplier_questionnaire":
      return "supplier_questionnaire";
    case "insurance_certificate":
      return "insurance_certificate";
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

function entitiesForNodes(
  entities: SignalEntityInstance[],
  nodeIds: SignalEntityInstance["nodeId"][],
) {
  const allowedNodeIds = new Set(nodeIds);

  return entities.filter((entity) => allowedNodeIds.has(entity.nodeId));
}

function compact<Value>(values: Array<Value | undefined>) {
  return values.filter((value): value is Value => value !== undefined);
}

function uniqueNodes(nodes: SignalWorkflowMapNode[]) {
  const merged = new Map<string, SignalWorkflowMapNode>();

  for (const node of nodes) {
    const existing = merged.get(node.id);

    merged.set(
      node.id,
      existing
        ? {
            ...existing,
            evidenceSourceIds: unique([
              ...existing.evidenceSourceIds,
              ...node.evidenceSourceIds,
            ]),
          }
        : node,
    );
  }

  return Array.from(merged.values());
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
