import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";

import type { FixtureRoute } from "@/lib/fixtures/registry";
import { buildSignalChartProtocolState } from "@/lib/json-render/signal-chart-protocol";
import {
  parseSignalGeneratedChartDataset,
  type SignalGeneratedChartDataset,
} from "@/lib/signal/generated-chart-data";
import { buildSignalCanonicalState } from "@/lib/signal/canonical-state";
import { buildSignalIntelligenceState } from "@/lib/signal/intelligence";
import { buildSignalWorkflowMap } from "@/lib/signal/workflow-map";

export interface SignalAgentRuntimeInput {
  fixtureRoute: FixtureRoute & { ingress: NonNullable<FixtureRoute["ingress"]> };
  message: string;
}

export type SignalAgentRuntimeResponse = SignalGeneratedChartDataset;

const runtimePrompt = "";

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
  "source_evidence",
  "workflow_map",
]);

const agentGeneratedChartDatasetSchema = z.object({
  id: z
    .string()
    .regex(
      /^derived:[a-z0-9][a-z0-9:_-]*$/,
      "Generated dataset ids must start with derived: and use lowercase token characters.",
    ),
  title: z.string().min(1),
  chartKind: z.enum(["bar", "stacked_bar"]),
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

const getSignalContext = tool({
  name: "get_signal_context",
  description:
    "Return the current client chart-generation context, with canonical entity instances, the workflow map, chart protocol, and known evidence source ids.",
  parameters: z.object({}),
  async execute(_args, runContext) {
    if (!runContext) {
      throw new Error("Signal agent context is required.");
    }

    const context = runContext.context as SignalAgentRuntimeInput;
    const signal = buildSignalIntelligenceState(context.fixtureRoute.ingress);
    const canonical = buildSignalCanonicalState(context.fixtureRoute.ingress);
    const workflowMap = buildSignalWorkflowMap(canonical);

    return {
      chartProtocol: buildSignalChartProtocolState(),
      canonical,
      workflowMap,
      client: {
        slug: context.fixtureRoute.slug,
        label: context.fixtureRoute.label,
      },
      scenario: signal.scenario,
      totals: signal.totals,
      evidenceRows: signal.evidenceRows.slice(0, 20),
      knownEvidenceSourceIds: signal.evidenceRows.map((row) => row.sourceId),
    };
  },
});

export async function runSignalAgent({
  fixtureRoute,
  message,
}: SignalAgentRuntimeInput): Promise<SignalAgentRuntimeResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Signal agent runtime requires OPENAI_API_KEY.");
  }

  const agent = new Agent<
    SignalAgentRuntimeInput,
    typeof agentGeneratedChartDatasetSchema
  >({
    name: "Signal chart data runtime",
    instructions: runtimePrompt,
    model: process.env.OPENAI_SIGNAL_AGENT_MODEL ?? "gpt-4.1-mini",
    tools: [getSignalContext],
    modelSettings: {
      toolChoice: "get_signal_context",
    },
    outputType: agentGeneratedChartDatasetSchema,
  });

  const result = await run(agent, message, {
    context: { fixtureRoute, message },
    maxTurns: 4,
  });

  if (!result.finalOutput) {
    throw new Error("Signal agent did not return chart data.");
  }

  const signal = buildSignalIntelligenceState(fixtureRoute.ingress);

  return parseSignalGeneratedChartDataset(toCanonicalDataset(result.finalOutput), {
    knownEvidenceSourceIds: signal.evidenceRows.map((row) => row.sourceId),
  });
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

function unique(values: string[]) {
  return Array.from(new Set(values));
}
