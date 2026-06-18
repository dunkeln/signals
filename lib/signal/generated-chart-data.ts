import {
  parseSignalGeneratedChartDataset,
  type SignalGeneratedChartDataset,
  type SignalGeneratedChartRow,
} from "@/lib/signal/generated-chart-agent";
import type { SignalIntelligenceState } from "@/lib/signal/intelligence";
import type {
  SignalOperatingMapState,
  SignalWorkflowLaneStatus,
} from "@/lib/signal/operating-map";

const laneStatuses: SignalWorkflowLaneStatus[] = [
  "moving",
  "slow",
  "blocked",
  "healthy",
];

export function generateSignalChartDataset(
  signal: SignalIntelligenceState,
  operatingMap: SignalOperatingMapState,
): SignalGeneratedChartDataset {
  const rowsByOwner = new Map<string, SignalGeneratedChartRow>();

  for (const lane of operatingMap.workflowLanes) {
    const row =
      rowsByOwner.get(lane.ownerRole) ?? emptyOwnerRow(lane.ownerRole);

    row.measures[lane.status] = (row.measures[lane.status] ?? 0) + 1;
    row.evidenceSourceIds.push(...lane.evidenceSourceIds);

    if (lane.evidenceStrength === "partial") {
      row.support = "partial";
    }

    rowsByOwner.set(lane.ownerRole, row);
  }

  const rows = Array.from(rowsByOwner.values()).map((row) => ({
    ...row,
    evidenceSourceIds: unique(row.evidenceSourceIds),
  }));

  const dataset = {
    id: "derived:workflow_status_by_owner",
    title: "Workflow Status By Owner",
    chartKind: "stacked_bar" as const,
    sourceDatasetIds: [
      "workflow_lanes",
      "workflow_signals",
      "source_evidence",
    ] as const,
    derivationSummary:
      "Counts operating-map workflow lane statuses by owner role while preserving lane evidence ids.",
    rows,
    evidenceSourceIds: unique(rows.flatMap((row) => row.evidenceSourceIds)),
    omissions: [
      "This chart counts the current fixture lanes only; it does not estimate cycle time or backlog volume.",
    ],
  };

  return parseSignalGeneratedChartDataset(dataset, {
    knownEvidenceSourceIds: signal.evidenceRows.map((row) => row.sourceId),
  });
}

function emptyOwnerRow(ownerRole: string): SignalGeneratedChartRow {
  return {
    id: `owner:${ownerRole}`,
    label: ownerRole,
    dimensions: { ownerRole },
    measures: Object.fromEntries(laneStatuses.map((status) => [status, 0])),
    evidenceSourceIds: [],
    support: "strong",
    omissions: [],
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}
