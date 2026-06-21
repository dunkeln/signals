import type { FixtureRoute } from "@/lib/fixtures/registry";
import {
  buildChartProtocolState,
  type ChartProtocolState,
  type GeneratedChartDataset,
} from "@/lib/protocol/v0";
import {
  buildSignalCanonicalState,
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
  document: {
    title: string;
  };
  signal: SignalIntelligenceState;
  workflowMap: SignalWorkflowMapData;
  chartProtocol: ChartProtocolState;
  generatedChartData: GeneratedChartDataset | null;
  runtimeErrorMessage: string | null;
}

export type SignalFixtureRoute = FixtureRoute & {
  ingress: NonNullable<FixtureRoute["ingress"]>;
};

export async function buildSignalPageState(
  fixtureRoute: SignalFixtureRoute,
): Promise<SignalPageState> {
  const signal = buildSignalIntelligenceState(fixtureRoute.ingress);
  const canonical = buildSignalCanonicalState(fixtureRoute.ingress);
  const workflowMap = buildSignalWorkflowMap(canonical.packetSets, {
    clientLabel: fixtureRoute.label,
  });

  return {
    client: {
      slug: fixtureRoute.slug,
      label: fixtureRoute.label,
    },
    document: {
      title: fixtureRoute.label,
    },
    signal,
    workflowMap,
    chartProtocol: buildChartProtocolState(),
    generatedChartData: null,
    runtimeErrorMessage: null,
  };
}
