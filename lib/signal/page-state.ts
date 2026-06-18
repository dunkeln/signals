import type { FixtureRoute } from "@/lib/fixtures/registry";
import {
  buildSignalChartProtocolState,
  type SignalChartProtocolState,
} from "@/lib/json-render/signal-chart-protocol";
import {
  generateSignalChartDataset,
  type SignalGeneratedChartDataset,
} from "@/lib/signal/generated-chart-data";
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
  chartProtocol: SignalChartProtocolState;
  generatedChartData: SignalGeneratedChartDataset;
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
    chartProtocol: buildSignalChartProtocolState(),
    generatedChartData: generateSignalChartDataset(signal, workflowMap),
  };
}
