import type {
  RawCloudEvent,
  RawLogRecord,
  RawMetricPoint,
  RawObservabilityFixture,
  RawTraceSpan,
} from "@/lib/fixtures/raw-observability-types";

export type ReplayRecord =
  | { kind: "log"; index: number; time: string; record: RawLogRecord }
  | { kind: "metric"; index: number; time: string; record: RawMetricPoint }
  | { kind: "trace"; index: number; time: string; record: RawTraceSpan }
  | { kind: "event"; index: number; time: string; record: RawCloudEvent };

export interface ReplayLogLine {
  id: string;
  line: string;
}

export interface RawReplayFrame {
  fixture: RawObservabilityFixture;
}

export function* replayRawObservabilityFixture(
  fixture: RawObservabilityFixture,
  options: { batchSize?: number; windowMs?: number } = {},
): Generator<RawReplayFrame> {
  const records = sortedReplayRecords(fixture);

  if (records.length === 0) {
    return;
  }

  const batchEnds = options.windowMs
    ? replayWindowEnds(records, options.windowMs)
    : replayBatchEnds(records.length, Math.max(1, options.batchSize ?? 8));

  for (const end of batchEnds) {
    const replayed = records.slice(0, end);

    yield {
      fixture: materializeReplayFixture(fixture, replayed),
    };
  }
}

export function replayLogLines(fixture: RawObservabilityFixture): ReplayLogLine[] {
  return sortedReplayRecords(fixture).map((record) => ({
    id: `${record.kind}:${record.index}`,
    line: formatReplayRecord(record),
  }));
}

export function sortedReplayRecords(
  fixture: RawObservabilityFixture,
): ReplayRecord[] {
  return [
    ...fixture.logs.map((record, index) => ({
      kind: "log" as const,
      index,
      time: record.timestamp,
      record,
    })),
    ...fixture.metrics.map((record, index) => ({
      kind: "metric" as const,
      index,
      time: record.timestamp,
      record,
    })),
    ...fixture.traces.map((record, index) => ({
      kind: "trace" as const,
      index,
      time: record.startTime,
      record,
    })),
    ...fixture.events.map((record, index) => ({
      kind: "event" as const,
      index,
      time: record.time,
      record,
    })),
  ].sort((left, right) => Date.parse(left.time) - Date.parse(right.time));
}

function materializeReplayFixture(
  fixture: RawObservabilityFixture,
  records: ReplayRecord[],
): RawObservabilityFixture {
  return {
    scenario: fixture.scenario,
    logs: records
      .filter(
        (record): record is Extract<ReplayRecord, { kind: "log" }> =>
          record.kind === "log",
      )
      .map((record) => record.record),
    metrics: records
      .filter(
        (record): record is Extract<ReplayRecord, { kind: "metric" }> =>
          record.kind === "metric",
      )
      .map((record) => record.record),
    traces: records
      .filter(
        (record): record is Extract<ReplayRecord, { kind: "trace" }> =>
          record.kind === "trace",
      )
      .map((record) => record.record),
    events: records
      .filter(
        (record): record is Extract<ReplayRecord, { kind: "event" }> =>
          record.kind === "event",
      )
      .map((record) => record.record),
  };
}

function replayBatchEnds(recordCount: number, batchSize: number) {
  const ends: number[] = [];

  for (let end = batchSize; end < recordCount + batchSize; end += batchSize) {
    ends.push(Math.min(end, recordCount));
  }

  return ends;
}

function replayWindowEnds(records: ReplayRecord[], windowMs: number) {
  const ends: number[] = [];
  const firstTime = Date.parse(records[0].time);
  let currentBucket = -1;

  records.forEach((record, index) => {
    const time = Date.parse(record.time);
    const bucket = Number.isFinite(time)
      ? Math.floor((time - firstTime) / windowMs)
      : currentBucket;

    if (currentBucket !== -1 && bucket !== currentBucket) {
      ends.push(index);
    }

    currentBucket = bucket;
  });

  ends.push(records.length);

  return ends;
}

function formatReplayRecord(record: ReplayRecord) {
  return [
    record.time,
    record.kind,
    replaySource(record),
    replaySummary(record),
    replayRefs(record),
  ]
    .filter(Boolean)
    .join(" ");
}

function replaySource(record: ReplayRecord) {
  switch (record.kind) {
    case "log":
    case "metric":
      return record.record.service;
    case "trace":
      return record.record.service;
    case "event":
      return record.record.source;
  }
}

function replaySummary(record: ReplayRecord) {
  switch (record.kind) {
    case "log":
      return record.record.message;
    case "metric":
      return `${record.record.name}=${record.record.value}${record.record.unit}`;
    case "trace":
      return `${record.record.name} ${record.record.durationMs}ms`;
    case "event":
      return record.record.type;
  }
}

function replayRefs(record: ReplayRecord) {
  const attrs =
    record.kind === "log"
      ? record.record.attributes
      : record.kind === "metric"
        ? record.record.tags
        : record.kind === "trace"
          ? record.record.attributes
          : record.record.data;
  const ids = {
    event_id: record.kind === "event" ? record.record.id : undefined,
    trace_id:
      record.kind === "trace"
        ? record.record.traceId
        : record.kind === "log"
          ? record.record.traceId
          : undefined,
    workflow_id: firstAttr(attrs, ["workflow_id", "workflow.id"]),
    thread_id: firstAttr(attrs, ["thread_id", "email.thread_id"]),
    source_document_ids: firstAttr(attrs, ["source_document_ids", "document_id"]),
  };

  return Object.entries(ids)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");
}

function firstAttr(attrs: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = attrs[key];

    if (Array.isArray(value)) {
      return value.join(",");
    }

    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }
  }

  return undefined;
}
