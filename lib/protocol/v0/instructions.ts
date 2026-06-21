import { z } from "zod";

import { protocolVersion } from "@/lib/protocol/v0/chart-intent";

const instructionSourceDatasetIdSchema = z.enum(["workflow_map"]);

const reductionFieldSchema = z.enum([
  "source.label",
  "target.label",
  "ownerRole",
  "status",
  "contentKind",
  "contentLabel",
  "support",
  "timeBucket",
  "businessTimeSlice",
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
  chartKind: z.enum(["bar", "stacked_bar", "donut"]),
  sourceDatasetIds: z.array(instructionSourceDatasetIdSchema).length(1),
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
]);

export type ChartRuntimeResult = z.infer<typeof chartRuntimeResultSchema>;

export function parseChartInstruction(input: unknown): ChartInstruction {
  return chartInstructionSchema.parse(input);
}

export function parseChartRuntimeResult(input: unknown): ChartRuntimeResult {
  return chartRuntimeResultSchema.parse(input);
}
