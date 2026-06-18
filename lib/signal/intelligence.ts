import type {
  AcmeBaseSandbox,
  RawCloudEvent,
  RawLogRecord,
  RawMetricPoint,
  RawTraceSpan,
} from "@/lib/fixtures/acme-base-sandbox";

export type TelemetryKind = "log" | "metric" | "trace" | "event";
type JsonScalar = string | number | boolean | null;
export type AttributeValue = JsonScalar | JsonScalar[];

export interface SourceRecord {
  id: string;
  kind: TelemetryKind;
  time: string;
  service: string;
  summary: string;
  attributes: Record<string, AttributeValue>;
}

export interface SignalDimensionRow {
  dimension: string;
  logs: number;
  metrics: number;
  traces: number;
  events: number;
  total: number;
  sourceIds: string[];
}

export interface SignalFlowNode {
  id: string;
  label: string;
}

export interface SignalFlowLink {
  source: string;
  target: string;
  value: number;
  sourceIds: string[];
}

export interface SignalFlowData {
  nodes: SignalFlowNode[];
  links: SignalFlowLink[];
}

export interface SignalEvidenceRow {
  sourceId: string;
  kind: TelemetryKind;
  service: string;
  time: string;
  lane: string;
  summary: string;
  sourceRefs: string;
}

export interface SignalIntelligenceState {
  scenario: AcmeBaseSandbox["scenario"];
  totals: {
    logs: number;
    metrics: number;
    traces: number;
    events: number;
    records: number;
  };
  domainCoverageRows: SignalDimensionRow[];
  serviceFlow: SignalFlowData;
  evidenceRows: SignalEvidenceRow[];
}

const domainKeyLabels: Record<string, string> = {
  attachment_count: "attachment",
  "attachment.count": "attachment",
  blocking_document_id: "document",
  document_id: "document",
  "document.id": "document",
  document_type_guess: "document type",
  "document.type_guess": "document type",
  extracted_fields: "extracted field",
  field: "extracted field",
  highlighted_field: "extracted field",
  low_confidence_fields: "extracted field",
  requested_fields: "requested field",
  from_domain: "supplier",
  input_name: "supplier",
  recipient_domain: "supplier",
  supplier_display_name: "supplier",
  ingredient_display_name: "material",
  thread_id: "thread",
  "email.thread_id": "thread",
  workflow_id: "workflow",
  affected_workflow_id: "workflow",
};

const serviceLanes: Record<string, string> = {
  "email-ingestor": "email intake",
  "document-extractor": "document extraction",
  "supplier-identity": "supplier identity",
  "supplier-graph": "supplier graph",
  "rfp-workflow": "rfp workflow",
  "qa-review": "qa review",
  "search-indexer": "thread search",
  "signal-service": "operator context",
  "web-app": "workspace usage",
};

export function buildSignalIntelligenceState(
  ingress: AcmeBaseSandbox,
): SignalIntelligenceState {
  const records = collectSourceRecords(ingress);

  return {
    scenario: ingress.scenario,
    totals: {
      logs: ingress.logs.length,
      metrics: ingress.metrics.length,
      traces: ingress.traces.length,
      events: ingress.events.length,
      records: records.length,
    },
    domainCoverageRows: buildDomainCoverageRows(records),
    serviceFlow: buildServiceFlow(records),
    evidenceRows: records.map(toEvidenceRow),
  };
}

export function collectSourceRecords(ingress: AcmeBaseSandbox): SourceRecord[] {
  return [
    ...ingress.logs.map(fromLog),
    ...ingress.metrics.map(fromMetric),
    ...ingress.traces.map(fromTrace),
    ...ingress.events.map(fromEvent),
  ];
}

function fromLog(record: RawLogRecord, index: number): SourceRecord {
  return {
    id: `log:${index}:${record.service}`,
    kind: "log",
    time: record.timestamp,
    service: record.service,
    summary: record.message,
    attributes: normalizeAttributes(record.attributes),
  };
}

function fromMetric(record: RawMetricPoint, index: number): SourceRecord {
  return {
    id: `metric:${index}:${record.name}`,
    kind: "metric",
    time: record.timestamp,
    service: record.service,
    summary: `${record.name} ${record.value} ${record.unit}`,
    attributes: normalizeAttributes(record.tags),
  };
}

function fromTrace(record: RawTraceSpan): SourceRecord {
  return {
    id: `trace:${record.traceId}:${record.spanId}`,
    kind: "trace",
    time: record.startTime,
    service: record.service,
    summary: record.name,
    attributes: normalizeAttributes(record.attributes),
  };
}

function fromEvent(record: RawCloudEvent): SourceRecord {
  return {
    id: `event:${record.id}`,
    kind: "event",
    time: record.time,
    service: record.source.replace(/^signal\./, ""),
    summary: record.type,
    attributes: normalizeAttributes({
      ...record.data,
      subject: record.subject ?? null,
    }),
  };
}

function normalizeAttributes(
  attributes: Record<string, unknown>,
): Record<string, AttributeValue> {
  return Object.fromEntries(
    Object.entries(attributes).map(([key, value]) => [key, normalizeValue(value)]),
  );
}

function normalizeValue(value: unknown): AttributeValue {
  if (Array.isArray(value)) {
    return value.map(toScalar);
  }

  return toScalar(value);
}

function toScalar(value: unknown): JsonScalar {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }

  return String(value);
}

function buildDomainCoverageRows(
  records: SourceRecord[],
): SignalDimensionRow[] {
  const groups = new Map<string, SignalDimensionRow>();

  for (const record of records) {
    for (const dimension of dimensionsForRecord(record)) {
      const row = groups.get(dimension) ?? {
        dimension,
        logs: 0,
        metrics: 0,
        traces: 0,
        events: 0,
        total: 0,
        sourceIds: [],
      };

      row[pluralKind(record.kind)] += 1;
      row.total += 1;
      row.sourceIds.push(record.id);
      groups.set(dimension, row);
    }
  }

  return Array.from(groups.values()).sort((left, right) => {
    if (right.total !== left.total) {
      return right.total - left.total;
    }

    return left.dimension.localeCompare(right.dimension);
  });
}

function dimensionsForRecord(record: SourceRecord) {
  const dimensions = new Set<string>();

  for (const key of Object.keys(record.attributes)) {
    const label = domainKeyLabels[key];
    if (label) {
      dimensions.add(label);
    }
  }

  return dimensions;
}

function pluralKind(kind: TelemetryKind) {
  return `${kind}s` as "logs" | "metrics" | "traces" | "events";
}

function buildServiceFlow(records: SourceRecord[]): SignalFlowData {
  const nodeIds = new Set<string>();
  const links = new Map<string, SignalFlowLink>();

  for (const record of records) {
    const source = `kind:${record.kind}`;
    const target = `lane:${laneForService(record.service)}`;
    const key = `${source}->${target}`;

    nodeIds.add(source);
    nodeIds.add(target);

    const link = links.get(key) ?? {
      source,
      target,
      value: 0,
      sourceIds: [],
    };

    link.value += 1;
    link.sourceIds.push(record.id);
    links.set(key, link);
  }

  return {
    nodes: Array.from(nodeIds).map((id) => ({
      id,
      label: readableNodeLabel(id),
    })),
    links: Array.from(links.values()),
  };
}

function toEvidenceRow(record: SourceRecord): SignalEvidenceRow {
  return {
    sourceId: record.id,
    kind: record.kind,
    service: record.service,
    time: record.time,
    lane: laneForService(record.service),
    summary: record.summary,
    sourceRefs: readableRefs(record),
  };
}

function laneForService(service: string) {
  return serviceLanes[service] ?? service;
}

function readableRefs(record: SourceRecord) {
  return Object.entries(record.attributes)
    .filter(([key]) => domainKeyLabels[key])
    .map(([key, value]) => `${domainKeyLabels[key]}=${formatValue(value)}`)
    .join("; ");
}

function formatValue(value: AttributeValue) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value);
}

function readableNodeLabel(id: string) {
  return id.replace(/^kind:/, "").replace(/^lane:/, "");
}
