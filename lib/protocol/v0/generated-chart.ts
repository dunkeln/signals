import { z } from "zod";

import { protocolDatasetIdSchema } from "@/lib/protocol/v0/chart-intent";

/**
 * Deterministic chart-data projection over the supplier content-flow map.
 *
 * This file is the safe bridge between semantic workflow state and renderable
 * datasets. It should not discover new facts; it reshapes `workflowMap` into
 * validated chart rows, preserves source evidence IDs, and records omissions
 * when the current fixture cannot support stronger measures such as cycle time,
 * backlog volume, or dollar impact.
 */
const generatedChartKindSchema = z.enum([
  "bar",
  "stacked_bar",
  "line",
  "sankey",
  "table",
]);

const evidenceSupportSchema = z.enum(["strong", "partial"]);

const dimensionValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

const generatedChartRowSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  dimensions: z.record(z.string().min(1), dimensionValueSchema),
  measures: z.record(z.string().min(1), z.number().finite().nullable()),
  evidenceSourceIds: z.array(z.string().min(1)).min(1),
  support: evidenceSupportSchema,
  omissions: z.array(z.string().min(1)).default([]),
});

export const generatedChartDatasetSchema = z
  .object({
    id: z
      .string()
      .regex(
        /^derived:[a-z0-9][a-z0-9:_-]*$/,
        "Generated dataset ids must start with derived: and use lowercase token characters.",
      ),
    title: z.string().min(1),
    chartKind: generatedChartKindSchema,
    sourceDatasetIds: z.array(protocolDatasetIdSchema).min(1).max(4),
    derivationSummary: z.string().min(1),
    rows: z.array(generatedChartRowSchema).min(1).max(12),
    evidenceSourceIds: z.array(z.string().min(1)).min(1),
    omissions: z.array(z.string().min(1)).default([]),
  })
  .superRefine((dataset, context) => {
    const rowIds = new Set<string>();
    const datasetEvidence = new Set(dataset.evidenceSourceIds);

    if (
      dataset.sourceDatasetIds.includes(
        "generated_content_state_by_owner",
      )
    ) {
      context.addIssue({
        code: "custom",
        message: "Generated datasets cannot cite generated render datasets as source inputs.",
        path: ["sourceDatasetIds"],
      });
    }

    for (const row of dataset.rows) {
      if (rowIds.has(row.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate generated chart row id: ${row.id}`,
          path: ["rows"],
        });
      }

      rowIds.add(row.id);

      for (const sourceId of row.evidenceSourceIds) {
        if (!datasetEvidence.has(sourceId)) {
          context.addIssue({
            code: "custom",
            message: `Row ${row.id} references evidence not declared on dataset: ${sourceId}`,
            path: ["rows", row.id, "evidenceSourceIds"],
          });
        }
      }
    }
  });

export type GeneratedChartDataset = z.infer<typeof generatedChartDatasetSchema>;
export type GeneratedChartRow = z.infer<typeof generatedChartRowSchema>;

/**
 * Validates chart datasets before they reach renderers or agent outputs.
 *
 * This is the contract boundary for generated visual intelligence: rows must be
 * bounded, evidence-backed, and tied to protocol dataset IDs. When
 * `knownEvidenceSourceIds` is supplied, unknown evidence references throw
 * immediately so charts cannot quietly imply support the ingress never provided.
 */
export function parseGeneratedChartDataset(
  input: unknown,
  options: { knownEvidenceSourceIds?: Iterable<string> } = {},
): GeneratedChartDataset {
  const dataset = generatedChartDatasetSchema.parse(input);

  if (options.knownEvidenceSourceIds) {
    assertKnownEvidenceSourceIds(dataset, options.knownEvidenceSourceIds);
  }

  return dataset;
}

function assertKnownEvidenceSourceIds(
  dataset: GeneratedChartDataset,
  knownEvidenceSourceIds: Iterable<string>,
) {
  const known = new Set(knownEvidenceSourceIds);

  for (const sourceId of dataset.evidenceSourceIds) {
    if (!known.has(sourceId)) {
      throw new Error(`Generated dataset references unknown evidence: ${sourceId}`);
    }
  }
}
