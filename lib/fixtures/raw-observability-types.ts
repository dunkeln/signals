export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type AttributeMap = Record<string, JsonValue>;

export type LogSeverity = "debug" | "info" | "warn" | "error";
export type SpanStatus = "ok" | "error" | "unset";
export type MetricKind = "counter" | "gauge" | "histogram";

export interface RawLogRecord {
  timestamp: string;
  provider: "datadog" | "cloudwatch" | "otel";
  service: string;
  env: "demo";
  severity: LogSeverity;
  message: string;
  traceId?: string;
  spanId?: string;
  attributes: AttributeMap;
}

export interface RawMetricPoint {
  timestamp: string;
  provider: "datadog" | "cloudwatch" | "otel";
  service: string;
  env: "demo";
  name: string;
  kind: MetricKind;
  unit: "count" | "ms" | "percent" | "bytes";
  value: number;
  tags: AttributeMap;
}

export interface RawTraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  service: string;
  name: string;
  kind: "server" | "client" | "consumer" | "producer" | "internal";
  startTime: string;
  durationMs: number;
  status: SpanStatus;
  attributes: AttributeMap;
  events?: Array<{
    timestamp: string;
    name: string;
    attributes: AttributeMap;
  }>;
}

export interface RawCloudEvent {
  id: string;
  source: string;
  type: string;
  time: string;
  subject?: string;
  data: AttributeMap;
}

export interface RawObservabilityFixture {
  scenario: {
    name: string;
    description: string;
    capturedAt: string;
  };
  logs: RawLogRecord[];
  metrics: RawMetricPoint[];
  traces: RawTraceSpan[];
  events: RawCloudEvent[];
}
