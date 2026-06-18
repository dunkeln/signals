import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";

import {
  buildSignalChartProtocolState,
  signalProtocolDatasetIdSchema,
  type SignalChartProtocolState,
} from "@/lib/json-render/signal-chart-protocol";
import type { SignalIntelligenceState } from "@/lib/signal/intelligence";
import type { SignalOperatingMapState } from "@/lib/signal/operating-map";

interface SignalChartAgentContext {
  signal: SignalIntelligenceState;
  operatingMap: SignalOperatingMapState;
  chartProtocol: SignalChartProtocolState;
}

const getChartGenerationContext = tool({
  name: "get_chart_generation_context",
  description:
    "Return the only context allowed for generating chart data: chart protocols, operating-map primitives, and known evidence source ids. Use this before producing the final dataset.",
  parameters: z.object({}),
  async execute(_args, runContext) {
    if (!runContext) {
      throw new Error("Chart generation context is required.");
    }

    const context = runContext.context as SignalChartAgentContext;

    return {
      chartProtocol: context.chartProtocol,
      operatingMap: context.operatingMap,
      knownEvidenceSourceIds: context.signal.evidenceRows.map(
        (row) => row.sourceId,
      ),
    };
  },
});

const agentDimensionValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

const agentKeyValueDimensionsSchema = z.array(
  z.object({
    key: z.string().min(1),
    value: agentDimensionValueSchema,
  }),
);

const agentKeyValueMeasuresSchema = z.array(
  z.object({
    key: z.string().min(1),
    value: z.number().finite().nullable(),
  }),
);

const agentSourceDatasetIdSchema = z.enum([
  "domain_coverage",
  "service_flow",
  "source_evidence",
  "workflow_lanes",
  "workflow_signals",
  "intervention_candidates",
  "business_impact",
]);

const generatedChartKindSchema = z.enum([
  "bar",
  "stacked_bar",
  "line",
  "sankey",
  "table",
]);

const evidenceSupportSchema = z.enum(["strong", "partial"]);

const signalGeneratedChartRowSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  dimensions: z.record(z.string().min(1), agentDimensionValueSchema),
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

    if (dataset.sourceDatasetIds.includes("generated_workflow_status_by_owner")) {
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

const agentGeneratedChartDatasetSchema = z.object({
  id: z
    .string()
    .regex(
      /^derived:[a-z0-9][a-z0-9:_-]*$/,
      "Generated dataset ids must start with derived: and use lowercase token characters.",
    ),
  title: z.string().min(1),
  chartKind: z.enum(["bar", "stacked_bar", "line", "sankey", "table"]),
  sourceDatasetIds: z.array(agentSourceDatasetIdSchema).min(1).max(4),
  derivationSummary: z.string().min(1),
  rows: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      dimensions: agentKeyValueDimensionsSchema,
      measures: agentKeyValueMeasuresSchema,
      evidenceSourceIds: z.array(z.string().min(1)).min(1),
      support: z.enum(["strong", "partial"]),
      omissions: z.array(z.string().min(1)),
    }),
  ).min(1).max(12),
  evidenceSourceIds: z.array(z.string().min(1)).min(1),
  omissions: z.array(z.string().min(1)),
});

export type SignalGeneratedChartKind = z.infer<
  typeof generatedChartKindSchema
>;
export type SignalEvidenceSupport = z.infer<typeof evidenceSupportSchema>;
export type SignalGeneratedChartRow = z.infer<
  typeof signalGeneratedChartRowSchema
>;
export type SignalGeneratedChartDataset = z.infer<
  typeof signalGeneratedChartDatasetSchema
>;

export async function generateSignalChartDatasetWithAgent(
  signal: SignalIntelligenceState,
  operatingMap: SignalOperatingMapState,
): Promise<SignalGeneratedChartDataset> {
  const context: SignalChartAgentContext = {
    signal,
    operatingMap,
    chartProtocol: buildSignalChartProtocolState(),
  };

  const agent = new Agent<
    SignalChartAgentContext,
    typeof agentGeneratedChartDatasetSchema
  >({
    name: "Signal chart data author",
    instructions: "",
    model: process.env.OPENAI_SIGNAL_AGENT_MODEL ?? "gpt-4.1-mini",
    tools: [getChartGenerationContext],
    modelSettings: {
      toolChoice: "get_chart_generation_context",
    },
    outputType: agentGeneratedChartDatasetSchema,
  });

  const result = await run(
    agent,
    "Generate one chart dataset using the available tool context.",
    {
      context,
      maxTurns: 4,
    },
  );

  if (!result.finalOutput) {
    throw new Error("Chart data agent did not return a final output.");
  }

  return parseSignalGeneratedChartDataset(toCanonicalDataset(result.finalOutput), {
    knownEvidenceSourceIds: signal.evidenceRows.map((row) => row.sourceId),
  });
}

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

function toCanonicalDataset(
  dataset: z.infer<typeof agentGeneratedChartDatasetSchema>,
) {
  const rows = dataset.rows.map((row) => ({
    ...row,
    dimensions: Object.fromEntries(
      row.dimensions.map(({ key, value }) => [key, value]),
    ),
    measures: Object.fromEntries(
      row.measures.map(({ key, value }) => [key, value]),
    ),
  }));

  return {
    ...dataset,
    rows,
    evidenceSourceIds: unique([
      ...dataset.evidenceSourceIds,
      ...rows.flatMap((row) => row.evidenceSourceIds),
    ]),
  };
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

function unique(values: string[]) {
  return Array.from(new Set(values));
}
