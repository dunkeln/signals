import { Agent, run } from "@openai/agents";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { FixtureRoute } from "@/lib/fixtures/registry";
import {
  buildChartProtocolState,
  chartInstructionSchema,
  createChartContextTool,
  detectUnsupportedChartRequest,
  parseChartInstruction,
  type ChartContextToolInput,
  type ChartRuntimeResult,
} from "@/lib/protocol/v0";
import { buildSignalCanonicalState } from "@/lib/signal/canonical-state";
import { buildSignalIntelligenceState } from "@/lib/signal/intelligence";
import { buildSignalWorkflowMap } from "@/lib/signal/workflow-map";

export interface SignalAgentRuntimeInput {
  fixtureRoute: FixtureRoute & { ingress: NonNullable<FixtureRoute["ingress"]> };
  message: string;
}

export type SignalAgentRuntimeResponse = ChartRuntimeResult;

const runtimePrompt = readFileSync(
  join(process.cwd(), "lib/protocol/v0/RUNTIME.md"),
  "utf8",
).trim();

export async function runSignalAgent({
  fixtureRoute,
  message,
}: SignalAgentRuntimeInput): Promise<SignalAgentRuntimeResponse> {
  const unsupportedRequest = detectUnsupportedChartRequest(message);

  if (unsupportedRequest) {
    return unsupportedRequest;
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Signal agent runtime requires OPENAI_API_KEY.");
  }

  const agent = new Agent<
    unknown,
    typeof chartInstructionSchema
  >({
    name: "Chart instruction runtime",
    instructions: runtimePrompt,
    model: process.env.OPENAI_SIGNAL_AGENT_MODEL ?? "gpt-4.1-mini",
    modelSettings: {
      toolChoice: "get_chart_context",
    },
    outputType: chartInstructionSchema,
    tools: [createChartContextTool(buildChartContextToolInput({
      fixtureRoute,
      message,
    }))],
  });

  const result = await run(agent, message, { maxTurns: 3 });

  if (!result.finalOutput) {
    throw new Error("Signal agent did not return chart instructions.");
  }

  return {
    kind: "chart_instruction",
    instruction: parseChartInstruction(result.finalOutput),
  };
}

function buildChartContextToolInput({
  fixtureRoute,
  message,
}: SignalAgentRuntimeInput): ChartContextToolInput {
  const signal = buildSignalIntelligenceState(fixtureRoute.ingress);
  const canonical = buildSignalCanonicalState(fixtureRoute.ingress);
  const workflowMap = buildSignalWorkflowMap(canonical);

  return {
    request: {
      message,
    },
    client: {
      slug: fixtureRoute.slug,
      label: fixtureRoute.label,
    },
    chartProtocol: buildChartProtocolState(),
    workflowMap,
    evidenceItems: signal.evidenceRows.map((row) => ({
      kind: row.kind,
      lane: row.lane,
      summary: row.summary,
    })),
  };
}
