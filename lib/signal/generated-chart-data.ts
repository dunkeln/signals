import { z } from "zod";

import { signalProtocolDatasetIdSchema } from "@/lib/json-render/signal-chart-protocol";
import type { SignalIntelligenceState } from "@/lib/signal/intelligence";
import type {
  SignalWorkflowMapData,
  SignalWorkflowMapLink,
} from "@/lib/signal/workflow-map";

/**
 * Deterministic chart-data projection over the canonical workflow map.
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

const signalGeneratedChartRowSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  dimensions: z.record(z.string().min(1), dimensionValueSchema),
  measures: z.record(z.string().min(1), z.number().finite().nullable()),
  evidenceSourceIds: z.array(z.string().min(1)).min(1),
  support: evidenceSupportSchema,
  omissions: z.array(z.string().min(1)).default([]),
});

const signalGeneratedChartDatasetSchema = z
  .object({
    id: z
      .string()
      .regex(
        /^derived:[a-z0-9][a-z0-9:_-]*$/,
        "Generated dataset ids must start with derived: and use lowercase token characters.",
      ),
    title: z.string().min(1),
    chartKind: generatedChartKindSchema,
    sourceDatasetIds: z.array(signalProtocolDatasetIdSchema).min(1).max(4),
    derivationSummary: z.string().min(1),
    rows: z.array(signalGeneratedChartRowSchema).min(1).max(12),
    evidenceSourceIds: z.array(z.string().min(1)).min(1),
    omissions: z.array(z.string().min(1)).default([]),
  })
  .superRefine((dataset, context) => {
    const rowIds = new Set<string>();
    const datasetEvidence = new Set(dataset.evidenceSourceIds);

    if (
      dataset.sourceDatasetIds.includes(
        "generated_canonical_link_health_by_owner",
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

export type SignalGeneratedChartDataset = z.infer<
  typeof signalGeneratedChartDatasetSchema
>;
export type SignalGeneratedChartRow = z.infer<
  typeof signalGeneratedChartRowSchema
>;

const workflowStatuses: Array<NonNullable<SignalWorkflowMapLink["status"]>> = [
  "moving",
  "slow",
  "blocked",
  "healthy",
];

/**
 * Produces the current generated chart dataset without calling an agent.
 *
 * The dataset counts canonical link health by owner role as a conservative
 * proof that entity-instance flow can become chart-ready. Future views should
 * follow this pattern: derive from `workflowMap`, preserve every supporting
 * evidence ID, and state what the chart does not estimate.
 */
export function generateSignalChartDataset(
  signal: SignalIntelligenceState,
  workflowMap: SignalWorkflowMapData,
): SignalGeneratedChartDataset {
  const rowsByOwner = new Map<string, SignalGeneratedChartRow>();

  for (const link of workflowMap.links) {
    if (!link.ownerRole || !link.status) {
      continue;
    }

    const row =
      rowsByOwner.get(link.ownerRole) ?? emptyOwnerRow(link.ownerRole);

    row.measures[link.status] = (row.measures[link.status] ?? 0) + link.value;
    row.evidenceSourceIds.push(...link.evidenceSourceIds);

    if (link.support === "partial") {
      row.support = "partial";
    }

    rowsByOwner.set(link.ownerRole, row);
  }

  const rows = Array.from(rowsByOwner.values()).map((row) => ({
    ...row,
    evidenceSourceIds: unique(row.evidenceSourceIds),
  }));

  const dataset = {
    id: "derived:canonical_link_health_by_owner",
    title: "Canonical Link Health By Owner",
    chartKind: "stacked_bar" as const,
    sourceDatasetIds: ["workflow_map", "source_evidence"] as const,
    derivationSummary:
      "Aggregates canonical workflow-map entity-instance volume by owner role and link health while preserving evidence ids.",
    rows,
    evidenceSourceIds: unique(rows.flatMap((row) => row.evidenceSourceIds)),
    omissions: [
      "This chart counts canonical entity-instance transitions only; it does not estimate cycle time, backlog volume, or dollar impact.",
    ],
  };

  return parseSignalGeneratedChartDataset(dataset, {
    knownEvidenceSourceIds: signal.evidenceRows.map((row) => row.sourceId),
  });
}

/**
 * Validates chart datasets before they reach renderers or agent outputs.
 *
 * This is the contract boundary for generated visual intelligence: rows must be
 * bounded, evidence-backed, and tied to protocol dataset IDs. When
 * `knownEvidenceSourceIds` is supplied, unknown evidence references throw
 * immediately so charts cannot quietly imply support the ingress never provided.
 */
export function parseSignalGeneratedChartDataset(
  input: unknown,
  options: { knownEvidenceSourceIds?: Iterable<string> } = {},
): SignalGeneratedChartDataset {
  const dataset = signalGeneratedChartDatasetSchema.parse(input);

  if (options.knownEvidenceSourceIds) {
    assertKnownEvidenceSourceIds(dataset, options.knownEvidenceSourceIds);
  }

  return dataset;
}

function emptyOwnerRow(ownerRole: string): SignalGeneratedChartRow {
  return {
    id: `owner:${ownerRole}`,
    label: ownerRole,
    dimensions: { ownerRole },
    measures: Object.fromEntries(workflowStatuses.map((status) => [status, 0])),
    evidenceSourceIds: [],
    support: "strong",
    omissions: [],
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function assertKnownEvidenceSourceIds(
  dataset: SignalGeneratedChartDataset,
  knownEvidenceSourceIds: Iterable<string>,
) {
  const known = new Set(knownEvidenceSourceIds);

  for (const sourceId of dataset.evidenceSourceIds) {
    if (!known.has(sourceId)) {
      throw new Error(`Generated dataset references unknown evidence: ${sourceId}`);
    }
  }
}
