import { Agent, run } from "@openai/agents";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { SignalFixtureRoute } from "@/lib/fixtures/registry";
import {
  buildChartProtocolState,
  chartInstructionSchema,
  createChartContextTool,
  parseChartInstruction,
  type ChartRuntimeResult,
} from "@/lib/protocol/v0";
import { buildSignalCanonicalState } from "@/lib/signal/canonical-state";
import { buildSignalIntelligenceState } from "@/lib/signal/intelligence";
import { buildSignalWorkflowMap } from "@/lib/signal/workflow-map";

export type SignalAgentRuntimeResponse = ChartRuntimeResult;

const runtimePrompt = readFileSync(
  join(process.cwd(), "lib/protocol/v0/RUNTIME.md"),
  "utf8",
).trim();

export async function runSignalAgent({
  fixtureRoute,
  message,
}: {
  fixtureRoute: SignalFixtureRoute;
  message: string;
}): Promise<SignalAgentRuntimeResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Signal agent runtime requires OPENAI_API_KEY.");
  }

  const signal = buildSignalIntelligenceState(fixtureRoute.ingress);
  const canonical = buildSignalCanonicalState(fixtureRoute.ingress);
  const workflowMap = buildSignalWorkflowMap(canonical.packetSets, {
    clientLabel: fixtureRoute.label,
  });

  const agent = new Agent<unknown, typeof chartInstructionSchema>({
    name: "Chart instruction runtime",
    instructions: runtimePrompt,
    model: process.env.OPENAI_SIGNAL_AGENT_MODEL ?? "gpt-4.1-mini",
    modelSettings: {
      toolChoice: "get_chart_context",
    },
    outputType: chartInstructionSchema,
    tools: [
      createChartContextTool({
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
      }),
    ],
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
