import type {
  SignalCanonicalState,
  SignalEntityInstance,
  SignalEvidenceSupport,
  SignalWorkflowNode,
  SignalWorkflowStatus,
} from "@/lib/signal/canonical-state";

export type SignalWorkflowMapNodeKind = "workflow_stage";

export interface SignalWorkflowMapNode {
  id: string;
  label: string;
  nodeKind: SignalWorkflowMapNodeKind;
  tier: SignalWorkflowNode["tier"];
  evidenceSourceIds: string[];
}

export interface SignalWorkflowMapLink {
  source: string;
  target: string;
  value: number;
  flowUnit: "entity_instance";
  status?: SignalWorkflowStatus;
  ownerRole?: string;
  supplier?: string;
  material?: string;
  workflowId?: string;
  support: SignalEvidenceSupport;
  evidenceSourceIds: string[];
  flowEntityIds: string[];
  summary: string;
}

export interface SignalWorkflowMapData {
  nodes: SignalWorkflowMapNode[];
  links: SignalWorkflowMapLink[];
}

interface LinkAccumulator {
  sourceNode: SignalWorkflowNode;
  targetNode: SignalWorkflowNode;
  flowEntityIds: string[];
  evidenceSourceIds: string[];
  support: SignalEvidenceSupport;
  statuses: SignalWorkflowStatus[];
  ownerRoles: string[];
  suppliers: string[];
  materials: string[];
  workflowIds: string[];
  summaries: string[];
}

export function buildSignalWorkflowMap(
  canonical: SignalCanonicalState,
): SignalWorkflowMapData {
  const nodesById = new Map(canonical.workflowNodes.map((node) => [node.id, node]));
  const entitiesById = new Map(
    canonical.entities.map((entity) => [entity.id, entity]),
  );
  const allowedEdges = new Set(
    canonical.workflowEdges.map((edge) => edgeKey(edge.from, edge.to)),
  );
  const linksByKey = new Map<string, LinkAccumulator>();

  for (const entity of canonical.entities) {
    const targetNode = nodesById.get(entity.nodeId);

    if (!targetNode) {
      continue;
    }

    for (const parentRef of entity.parentRefs) {
      const parent = entitiesById.get(parentRef);

      if (!parent) {
        continue;
      }

      const sourceNode = nodesById.get(parent.nodeId);

      if (!sourceNode || !allowedEdges.has(edgeKey(sourceNode.id, targetNode.id))) {
        continue;
      }

      const key = edgeKey(sourceNode.id, targetNode.id);
      const accumulator =
        linksByKey.get(key) ?? emptyLinkAccumulator(sourceNode, targetNode);

      accumulator.flowEntityIds.push(entity.id);
      accumulator.evidenceSourceIds.push(...entity.evidenceSourceIds);
      accumulator.support =
        accumulator.support === "partial" || entity.support === "partial"
          ? "partial"
          : "strong";

      if (shouldCarryStatusOnLink(entity)) {
        pushIfPresent(accumulator.statuses, entity.status);
      }
      pushIfPresent(accumulator.ownerRoles, entity.ownerRole);
      pushIfPresent(accumulator.suppliers, entity.supplier);
      pushIfPresent(accumulator.materials, entity.material);
      pushIfPresent(accumulator.workflowIds, entity.workflowId);
      accumulator.summaries.push(entity.summary);

      linksByKey.set(key, accumulator);
    }
  }

  const links = Array.from(linksByKey.values()).map(toWorkflowMapLink);
  const renderedNodeIds = new Set(
    links.flatMap((link) => [link.source, link.target]),
  );
  const nodes = canonical.workflowNodes
    .filter((node) => renderedNodeIds.has(stageId(node.id)))
    .map((node) => workflowMapNode(node, canonical.entities));

  return { nodes, links };
}

function workflowMapNode(
  node: SignalWorkflowNode,
  entities: SignalEntityInstance[],
): SignalWorkflowMapNode {
  return {
    id: stageId(node.id),
    label: node.label,
    nodeKind: "workflow_stage",
    tier: node.tier,
    evidenceSourceIds: unique(
      entities
        .filter((entity) => entity.nodeId === node.id)
        .flatMap((entity) => entity.evidenceSourceIds),
    ),
  };
}

function emptyLinkAccumulator(
  sourceNode: SignalWorkflowNode,
  targetNode: SignalWorkflowNode,
): LinkAccumulator {
  return {
    sourceNode,
    targetNode,
    flowEntityIds: [],
    evidenceSourceIds: [],
    support: "strong",
    statuses: [],
    ownerRoles: [],
    suppliers: [],
    materials: [],
    workflowIds: [],
    summaries: [],
  };
}

function toWorkflowMapLink(accumulator: LinkAccumulator): SignalWorkflowMapLink {
  const flowEntityIds = unique(accumulator.flowEntityIds);

  return {
    source: stageId(accumulator.sourceNode.id),
    target: stageId(accumulator.targetNode.id),
    value: flowEntityIds.length,
    flowUnit: "entity_instance",
    status: dominantStatus(accumulator.statuses),
    ownerRole: firstUnique(accumulator.ownerRoles),
    supplier: firstUnique(accumulator.suppliers),
    material: firstUnique(accumulator.materials),
    workflowId: firstUnique(accumulator.workflowIds),
    support: accumulator.support,
    evidenceSourceIds: unique(accumulator.evidenceSourceIds),
    flowEntityIds,
    summary: unique(accumulator.summaries).join(" "),
  };
}

function dominantStatus(
  statuses: SignalWorkflowStatus[],
): SignalWorkflowStatus | undefined {
  if (statuses.includes("blocked")) {
    return "blocked";
  }

  if (statuses.includes("slow")) {
    return "slow";
  }

  if (statuses.includes("moving")) {
    return "moving";
  }

  if (statuses.includes("healthy")) {
    return "healthy";
  }

  return undefined;
}

function shouldCarryStatusOnLink(entity: SignalEntityInstance) {
  return entity.nodeId !== "document_instance";
}

function stageId(id: string) {
  return `stage:${id}`;
}

function edgeKey(source: string, target: string) {
  return `${source}->${target}`;
}

function pushIfPresent<T>(values: T[], value: T | undefined) {
  if (value !== undefined) {
    values.push(value);
  }
}

function firstUnique(values: string[]) {
  return unique(values)[0];
}

function unique<Value>(values: Value[]) {
  return Array.from(new Set(values));
}
