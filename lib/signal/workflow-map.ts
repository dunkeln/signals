import type {
  SignalContentPacket,
  SignalEvidenceSupport,
  SignalPacketSetState,
  SignalWorkflowStatus,
  SignalWorkSurface,
} from "@/lib/signal/canonical-state";
import type { JsonValue } from "@/lib/signal/intelligence";

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
  observedAt: string;
  timeBucket: string;
  businessTimeSlice: string;
  businessTimeOrder: number;
  attributes: Record<string, JsonValue>;
  summary: string;
}

export interface SignalWorkflowMapData {
  nodes: SignalWorkflowMapNode[];
  links: SignalWorkflowMapLink[];
}

export function buildSignalWorkflowMap(
  packetSets: SignalPacketSetState,
  options: { clientLabel?: string } = {},
): SignalWorkflowMapData {
  const packets = packetSets.renderablePackets;
  const currentWeekStart = pacificWeekStart(Date.now());

  return {
    nodes: nodesForPackets(packets, options.clientLabel),
    links: packets.map((packet) => linkForPacket(packet, currentWeekStart)),
  };
}

function nodesForPackets(packets: SignalContentPacket[], clientLabel?: string) {
  const nodes = new Map<string, SignalWorkflowMapNode>();

  for (const packet of packets) {
    upsertNode(nodes, packet.source, packet.evidenceSourceIds, clientLabel);
    upsertNode(nodes, packet.target, packet.evidenceSourceIds, clientLabel);
  }

  return Array.from(nodes.values());
}

function upsertNode(
  nodes: Map<string, SignalWorkflowMapNode>,
  surface: SignalWorkSurface,
  evidenceSourceIds: string[],
  clientLabel?: string,
) {
  const existing = nodes.get(surface.id);

  nodes.set(surface.id, {
    id: surface.id,
    label: surfaceLabel(surface, clientLabel),
    nodeKind: "work_surface",
    surfaceKind: surface.kind,
    evidenceSourceIds: unique([
      ...(existing?.evidenceSourceIds ?? []),
      ...evidenceSourceIds,
    ]),
  });
}

function surfaceLabel(surface: SignalWorkSurface, clientLabel?: string) {
  if (surface.id === "surface:client-role:procurement:outbound") {
    return clientLabel || surface.label;
  }

  return surface.label;
}

function linkForPacket(
  packet: SignalContentPacket,
  currentWeekStart: number,
): SignalWorkflowMapLink {
  const businessTime = businessTimeFor(packet.observedAt, currentWeekStart);

  return {
    source: packet.source.id,
    target: packet.target.id,
    value: packet.value,
    flowUnit: packet.flowUnit,
    contentLabel: packet.contentLabel,
    contentKinds: packet.contentKinds,
    status: packet.packetState,
    ownerRole: packet.ownerRole,
    supplier: packet.supplier,
    material: packet.material,
    workflowId: packet.workflowId,
    support: packet.support,
    evidenceSourceIds: packet.evidenceSourceIds,
    contentEntityIds: packet.sourceEntityIds,
    observedAt: packet.observedAt,
    timeBucket: packet.timeBucket,
    businessTimeSlice: businessTime.label,
    businessTimeOrder: businessTime.order,
    attributes: packet.attributes,
    summary: packet.summary,
  };
}

const pacificTimeZone = "America/Los_Angeles";
const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function businessTimeFor(observedAt: string, currentWeekStart: number) {
  const time = Date.parse(observedAt);

  if (!Number.isFinite(time)) {
    return { label: "unknown", order: 999 };
  }

  const weekStart = pacificWeekStart(time);
  const weeksAgo = Math.round((currentWeekStart - weekStart) / (7 * 24 * 60 * 60 * 1000));

  if (weeksAgo > 0) {
    return { label: `${weeksAgo}w ago`, order: 10 + weeksAgo };
  }

  if (weeksAgo < 0) {
    return { label: `${Math.abs(weeksAgo)}w ahead`, order: 900 + Math.abs(weeksAgo) };
  }

  const weekday = pacificWeekday(time);
  const dayOrder = weekday === 0 ? 7 : weekday;

  return {
    label: weekdayLabels[dayOrder - 1] ?? "unknown",
    order: dayOrder,
  };
}

function pacificWeekStart(time: number) {
  const parts = pacificParts(time);
  const weekday = pacificWeekday(time);
  const dayOffset = weekday === 0 ? 6 : weekday - 1;

  return Date.UTC(parts.year, parts.month - 1, parts.day - dayOffset);
}

function pacificWeekday(time: number) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: pacificTimeZone,
    weekday: "short",
  }).format(new Date(time));

  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
}

function pacificParts(time: number) {
  const values = new Intl.DateTimeFormat("en-US", {
    timeZone: pacificTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(time));
  const part = (type: string) =>
    Number(values.find((value) => value.type === type)?.value);

  return {
    year: part("year"),
    month: part("month"),
    day: part("day"),
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}
