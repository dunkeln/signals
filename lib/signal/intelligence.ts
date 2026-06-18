import type {
  AcmeBaseSandbox,
  RawCloudEvent,
  RawLogRecord,
  RawMetricPoint,
  RawTraceSpan,
} from "@/lib/fixtures/acme-base-sandbox";

/**
 * Raw telemetry substrate for Signal.
 *
 * This module deliberately stops before procurement interpretation: it turns
 * logs, metrics, traces, and cloud events into stable source records and
 * evidence rows. Future intelligence layers should consume this shape instead
 * of reaching back into fixture-specific raw records unless they are adding a
 * new source normalizer.
 */
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

/**
 * Builds the low-level source substrate from raw ingress.
 *
 * The return value is intentionally about source coverage and traceability,
 * not root cause or workflow meaning. Callers that need Waystation-specific
 * semantics should layer on top via `buildSignalCanonicalState`, while
 * keeping the `evidenceRows` IDs as the audit trail for every derived claim.
 */
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
    evidenceRows: records.map(toEvidenceRow),
  };
}

/**
 * Normalizes every raw telemetry family into one evidence record contract.
 *
 * The IDs produced here are the durable join keys for later chart and operating
 * map projections. If a new ingress family is added, extend this function with
 * a source-specific normalizer and keep attributes scalar/array-only so Zod,
 * renderers, and LLM chart generation can safely consume them.
 */
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
