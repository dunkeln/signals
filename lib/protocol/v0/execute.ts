import {
  parseGeneratedChartDataset,
  type GeneratedChartDataset,
  type GeneratedChartRow,
} from "@/lib/protocol/v0/generated-chart";
import type { ChartInstruction } from "@/lib/protocol/v0/instructions";

export interface ExecutableWorkflowNode {
  id: string;
  label: string;
}

export interface ExecutableWorkflowLink {
  source: unknown;
  target: unknown;
  value: number;
  contentLabel: string;
  contentKinds: string[];
  status?: string;
  ownerRole?: string;
  support: "strong" | "partial";
  timeBucket: string;
  businessTimeSlice: string;
  businessTimeOrder: number;
  evidenceSourceIds: string[];
}

export interface ExecuteChartInstructionInput {
  instruction: ChartInstruction;
  workflowMap: {
    nodes: ExecutableWorkflowNode[];
    links: ExecutableWorkflowLink[];
  };
  knownEvidenceSourceIds: Iterable<string>;
}

export function executeChartInstruction({
  instruction,
  workflowMap,
  knownEvidenceSourceIds,
}: ExecuteChartInstructionInput): GeneratedChartDataset {
  const nodeLabels = new Map(
    workflowMap.nodes.map((node) => [node.id, node.label]),
  );
  const rowsByKey = new Map<string, GeneratedChartRow>();
  const filteredLinks = workflowMap.links.filter((link) =>
    instruction.reduction.filters.every((filter) =>
      matchesFilter(fieldValues(filter.field, link, nodeLabels), filter),
    ),
  );

  for (const link of filteredLinks) {
    const rowSegments = valuesForFields(
      instruction.reduction.groupBy,
      link,
      nodeLabels,
    );
    const measureKey = instruction.reduction.splitBy
      ? fieldValues(instruction.reduction.splitBy, link, nodeLabels).join(", ")
      : valueLabel(instruction.reduction.measure);
    const measureValue =
      instruction.reduction.measure === "packet_value" ? link.value : 1;
    const rowId = rowSegments.map(protocolToken).join(":");
    const row =
      rowsByKey.get(rowId) ??
      emptyInstructionRow(rowId, rowSegments, instruction);

    row.measures[measureKey] = (row.measures[measureKey] ?? 0) + measureValue;
    row.evidenceSourceIds.push(...link.evidenceSourceIds);

    if (link.support === "partial") {
      row.support = "partial";
    }

    rowsByKey.set(rowId, row);
  }

  const rows = Array.from(rowsByKey.values())
    .map((row) => ({
      ...row,
      evidenceSourceIds: unique(row.evidenceSourceIds),
    }))
    .sort((left, right) =>
      instruction.reduction.groupBy.includes("businessTimeSlice")
        ? timeOrder(left, workflowMap.links) - timeOrder(right, workflowMap.links)
        : 0,
    );

  if (rows.length === 0) {
    throw new Error("Chart instruction did not match any workflow links.");
  }

  const dataset = {
    id: derivedDatasetId(instruction),
    title: instruction.title,
    chartKind: instruction.chartKind,
    sourceDatasetIds: instruction.sourceDatasetIds,
    derivationSummary: summarizeInstruction(instruction),
    rows,
    evidenceSourceIds: unique(rows.flatMap((row) => row.evidenceSourceIds)),
    omissions: instruction.omissions,
  };

  return parseGeneratedChartDataset(dataset, { knownEvidenceSourceIds });
}

function emptyInstructionRow(
  id: string,
  rowSegments: string[],
  instruction: ChartInstruction,
): GeneratedChartRow {
  return {
    id,
    label: rowSegments.join(" / "),
    dimensions: Object.fromEntries(
      instruction.reduction.groupBy.map((field, index) => [
        field,
        rowSegments[index] ?? null,
      ]),
    ),
    measures: {},
    evidenceSourceIds: [],
    support: "strong",
    omissions: [],
  };
}

function valuesForFields(
  fields: ChartInstruction["reduction"]["groupBy"],
  link: ExecutableWorkflowLink,
  nodeLabels: Map<string, string>,
) {
  return fields.flatMap((field) => fieldValues(field, link, nodeLabels));
}

function fieldValues(
  field: ChartInstruction["reduction"]["groupBy"][number],
  link: ExecutableWorkflowLink,
  nodeLabels: Map<string, string>,
): string[] {
  switch (field) {
    case "source.label":
      return [nodeLabels.get(endpointId(link.source)) ?? endpointId(link.source)];
    case "target.label":
      return [nodeLabels.get(endpointId(link.target)) ?? endpointId(link.target)];
    case "ownerRole":
      return [link.ownerRole ?? "unassigned"];
    case "status":
      return [link.status ?? "unspecified"];
    case "contentKind":
      return link.contentKinds.length > 0 ? link.contentKinds : ["unspecified"];
    case "contentLabel":
      return [link.contentLabel];
    case "support":
      return [link.support];
    case "timeBucket":
      return [link.timeBucket];
    case "businessTimeSlice":
      return [link.businessTimeSlice];
  }
}

function timeOrder(row: GeneratedChartRow, links: ExecutableWorkflowLink[]) {
  const label = String(row.dimensions.businessTimeSlice ?? row.label);
  const matchingLink = links.find((link) => link.businessTimeSlice === label);

  return matchingLink?.businessTimeOrder ?? 999;
}

function matchesFilter(
  values: string[],
  filter: ChartInstruction["reduction"]["filters"][number],
) {
  const allowed = Array.isArray(filter.value) ? filter.value : [filter.value];

  switch (filter.op) {
    case "equals":
      return values.some((value) => value === allowed[0]);
    case "in":
      return values.some((value) => allowed.includes(value));
  }
}

function valueLabel(measure: ChartInstruction["reduction"]["measure"]) {
  switch (measure) {
    case "packet_count":
      return "packet count";
    case "packet_value":
      return "packet volume";
  }
}

function summarizeInstruction(instruction: ChartInstruction) {
  const grouped = instruction.reduction.groupBy.join(" + ");
  const split = instruction.reduction.splitBy
    ? ` split by ${instruction.reduction.splitBy}`
    : "";

  return `Application-built ${instruction.reduction.measure} chart grouped by ${grouped}${split}, using ${instruction.reduction.source}.`;
}

function derivedDatasetId(instruction: ChartInstruction) {
  return `derived:${[
    instruction.chartKind,
    instruction.reduction.measure,
    ...instruction.reduction.groupBy,
    instruction.reduction.splitBy,
  ]
    .filter(Boolean)
    .map((part) => protocolToken(String(part)))
    .join(":")}`;
}

function protocolToken(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "") || "row"
  );
}

function endpointId(endpoint: unknown) {
  if (typeof endpoint === "string") {
    return endpoint;
  }

  if (endpoint && typeof endpoint === "object" && "id" in endpoint) {
    return String(endpoint.id);
  }

  return String(endpoint);
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}
