import { z } from "zod";

import { protocolVersion } from "@/lib/protocol/v0/chart-intent";

const instructionSourceDatasetIdSchema = z.enum([
  "workflow_map",
  "source_evidence",
]);

const reductionFieldSchema = z.enum([
  "source.label",
  "target.label",
  "ownerRole",
  "status",
  "contentKind",
  "contentLabel",
  "support",
]);

const filterValueSchema = z.union([
  z.string().min(1),
  z.array(z.string().min(1)).min(1).max(12),
]);

const reductionFilterSchema = z.object({
  field: reductionFieldSchema,
  op: z.enum(["equals", "in"]),
  value: filterValueSchema,
});

export const chartInstructionSchema = z.object({
  protocolVersion: z.literal(protocolVersion),
  title: z.string().min(1).max(80),
  chartKind: z.enum(["bar", "stacked_bar"]),
  sourceDatasetIds: z.array(instructionSourceDatasetIdSchema).min(1).max(2),
  reduction: z.object({
    source: z.literal("workflow_map.links"),
    groupBy: z.array(reductionFieldSchema).min(1).max(2),
    measure: z.enum(["packet_value", "packet_count"]),
    splitBy: reductionFieldSchema.optional(),
    filters: z.array(reductionFilterSchema).max(4).default([]),
  }),
  omissions: z.array(z.string().min(1)).default([]),
});

export type ChartInstruction = z.infer<typeof chartInstructionSchema>;

export const chartRuntimeResultSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("chart_instruction"),
    instruction: chartInstructionSchema,
  }),
  z.object({
    kind: z.literal("unsupported_request"),
    title: z.string().min(1).max(80),
    message: z.string().min(1).max(240),
    unsupportedChartKind: z.string().min(1).nullable(),
    supportedChartKinds: z.array(z.enum(["bar", "stacked_bar"])).min(1),
    omissions: z.array(z.string().min(1)).default([]),
  }),
]);

export type ChartRuntimeResult = z.infer<typeof chartRuntimeResultSchema>;

const supportedChartKinds = ["bar", "stacked_bar"] as const;
const unsupportedChartKindAliases = [
  ["donut", "donut"],
  ["donut", "doughnut"],
  ["pie", "pie"],
  ["line", "line"],
  ["scatter", "scatter"],
  ["area", "area"],
  ["heatmap", "heatmap"],
] as const;

export function parseChartInstruction(input: unknown): ChartInstruction {
  return chartInstructionSchema.parse(input);
}

export function parseChartRuntimeResult(input: unknown): ChartRuntimeResult {
  return chartRuntimeResultSchema.parse(input);
}

export function detectUnsupportedChartRequest(
  message: string,
): ChartRuntimeResult | null {
  const tokens = new Set(
    message
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );
  const requested = unsupportedChartKindAliases.find(([, alias]) =>
    tokens.has(alias),
  );

  if (!requested) {
    return null;
  }

  const [unsupportedChartKind] = requested;

  return {
    kind: "unsupported_request",
    title: "Chart type unavailable",
    message:
      "That chart type is not available yet. Try a bar or stacked bar view for this analysis.",
    unsupportedChartKind,
    supportedChartKinds: [...supportedChartKinds],
    omissions: [`${unsupportedChartKind} charts are not available yet.`],
  };
}
