import type { FixtureRoute } from "@/lib/fixtures/registry";
import {
  buildChartProtocolState,
  type ChartInstruction,
  type ChartProtocolState,
  type GeneratedChartDataset,
} from "@/lib/protocol/v0";
import {
  buildSignalCanonicalState,
  type SignalCanonicalState,
} from "@/lib/signal/canonical-state";
import {
  buildSignalIntelligenceState,
  type SignalIntelligenceState,
} from "@/lib/signal/intelligence";
import {
  buildSignalWorkflowMap,
  type SignalWorkflowMapData,
} from "@/lib/signal/workflow-map";

export interface SignalPageState {
  client: {
    slug: string;
    label: string;
  };
  signal: SignalIntelligenceState;
  canonical: SignalCanonicalState;
  workflowMap: SignalWorkflowMapData;
  chartProtocol: ChartProtocolState;
  generatedChartInstruction: ChartInstruction | null;
  generatedChartData: GeneratedChartDataset | null;
  runtimeError: SignalRuntimeError | null;
}

export interface SignalRuntimeError {
  id: string;
  title: string;
  message: string;
  detail?: string;
}

export type SignalFixtureRoute = FixtureRoute & {
  ingress: NonNullable<FixtureRoute["ingress"]>;
};

export async function buildSignalPageState(
  fixtureRoute: SignalFixtureRoute,
): Promise<SignalPageState> {
  const signal = buildSignalIntelligenceState(fixtureRoute.ingress);
  const canonical = buildSignalCanonicalState(fixtureRoute.ingress);
  const workflowMap = buildSignalWorkflowMap(canonical);

  return {
    client: {
      slug: fixtureRoute.slug,
      label: fixtureRoute.label,
    },
    signal,
    canonical,
    workflowMap,
    chartProtocol: buildChartProtocolState(),
    generatedChartInstruction: null,
    generatedChartData: null,
    runtimeError: null,
  };
}
