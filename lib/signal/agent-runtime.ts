import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";

import type { FixtureRoute } from "@/lib/fixtures/registry";
import { buildSignalIntelligenceState } from "@/lib/signal/intelligence";
import { buildSignalOperatingMapState } from "@/lib/signal/operating-map";

export interface SignalAgentRuntimeInput {
  fixtureRoute: FixtureRoute & { ingress: NonNullable<FixtureRoute["ingress"]> };
  message: string;
}

const signalAgentResponseSchema = z.object({
  message: z.string().min(1),
  evidenceSourceIds: z.array(z.string().min(1)).default([]),
  suggestedPrompts: z.array(z.string().min(1)).max(3).default([]),
});

export type SignalAgentRuntimeResponse = z.infer<
  typeof signalAgentResponseSchema
>;

const runtimePrompt = "";

const getSignalContext = tool({
  name: "get_signal_context",
  description:
    "Return the current client signal context, including workflow lanes, generated signals, interventions, business impact rows, totals, and evidence source ids.",
  parameters: z.object({}),
  async execute(_args, runContext) {
    if (!runContext) {
      throw new Error("Signal agent context is required.");
    }

    const context = runContext.context as SignalAgentRuntimeInput;
    const signal = buildSignalIntelligenceState(context.fixtureRoute.ingress);
    const operatingMap = buildSignalOperatingMapState(
      context.fixtureRoute.ingress,
    );

    return {
      client: {
        slug: context.fixtureRoute.slug,
        label: context.fixtureRoute.label,
      },
      scenario: signal.scenario,
      totals: signal.totals,
      workflowLanes: operatingMap.workflowLanes,
      workflowSignals: operatingMap.workflowSignals,
      interventionCandidates: operatingMap.interventionCandidates,
      businessImpactRows: operatingMap.businessImpactRows,
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
    typeof signalAgentResponseSchema
  >({
    name: "Signal workflow x-ray runtime",
    instructions: runtimePrompt,
    model: process.env.OPENAI_SIGNAL_AGENT_MODEL ?? "gpt-4.1-mini",
    tools: [getSignalContext],
    modelSettings: {
      toolChoice: "get_signal_context",
    },
    outputType: signalAgentResponseSchema,
  });

  const result = await run(agent, message, {
    context: { fixtureRoute, message },
    maxTurns: 4,
  });

  if (!result.finalOutput) {
    throw new Error("Signal agent did not return a response.");
  }

  return signalAgentResponseSchema.parse(result.finalOutput);
}
