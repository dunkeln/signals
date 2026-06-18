import type { FixtureRoute } from "@/lib/fixtures/registry";
import {
  buildSignalChartProtocolState,
  type SignalChartProtocolState,
} from "@/lib/json-render/signal-chart-protocol";
import { generateSignalChartDataset } from "@/lib/signal/generated-chart-data";
import type { SignalGeneratedChartDataset } from "@/lib/signal/generated-chart-agent";
import {
  buildSignalIntelligenceState,
  type SignalIntelligenceState,
} from "@/lib/signal/intelligence";
import {
  buildSignalOperatingMapState,
  type SignalOperatingMapState,
} from "@/lib/signal/operating-map";

export interface SignalPageState {
  client: {
    slug: string;
    label: string;
  };
  signal: SignalIntelligenceState;
  operatingMap: SignalOperatingMapState;
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
  const operatingMap = buildSignalOperatingMapState(fixtureRoute.ingress);

  return {
    client: {
      slug: fixtureRoute.slug,
      label: fixtureRoute.label,
    },
    signal,
    operatingMap,
    chartProtocol: buildSignalChartProtocolState(),
    generatedChartData: generateSignalChartDataset(signal, operatingMap),
  };
}
