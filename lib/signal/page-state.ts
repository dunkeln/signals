import type { SignalFixtureRoute } from "@/lib/fixtures/registry";
import {
  buildChartProtocolState,
  type ChartProtocolState,
  type GeneratedChartDataset,
} from "@/lib/protocol/v0";
import {
  buildSignalCanonicalState,
} from "@/lib/signal/canonical-state";
import { readReportDocument } from "@/lib/signal/document-store";
import {
  buildSignalIntelligenceState,
  type SignalIntelligenceState,
} from "@/lib/signal/intelligence";
import type { ReportDocument } from "@/lib/signal/report-document";
import {
  buildSignalWorkflowMap,
  type SignalWorkflowMapData,
} from "@/lib/signal/workflow-map";

export interface SignalPageState {
  client: {
    slug: string;
    label: string;
  };
  document: ReportDocument;
  signal: SignalIntelligenceState;
  workflowMap: SignalWorkflowMapData;
  chartProtocol: ChartProtocolState;
  generatedChartData: GeneratedChartDataset | null;
  runtimeErrorMessage: string | null;
}

export async function buildSignalPageState(
  fixtureRoute: SignalFixtureRoute,
): Promise<SignalPageState> {
  const signal = buildSignalIntelligenceState(fixtureRoute.ingress);
  const canonical = buildSignalCanonicalState(fixtureRoute.ingress);
  const workflowMap = buildSignalWorkflowMap(canonical.packetSets, {
    clientLabel: fixtureRoute.label,
  });
  const document = await readReportDocument(fixtureRoute.slug, fixtureRoute.label);

  return {
    client: {
      slug: fixtureRoute.slug,
      label: fixtureRoute.label,
    },
    document: {
      title: document.title,
      blocks: document.blocks,
    },
    signal,
    workflowMap,
    chartProtocol: buildChartProtocolState(),
    generatedChartData: null,
    runtimeErrorMessage: null,
  };
}
