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
import { replayRawObservabilityFixture } from "@/lib/signal/replay-observability-fixture";
import {
  buildSignalWorkflowMap,
  type SignalWorkflowMapData,
} from "@/lib/signal/workflow-map";

const replaySyncWindowMs = 2 * 60 * 1000;

export interface SignalReplayFrame {
  signal: SignalIntelligenceState;
  workflowMap: SignalWorkflowMapData;
}

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
  replayFrames: SignalReplayFrame[];
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
    replayFrames: buildSignalReplayFrames(fixtureRoute),
    runtimeErrorMessage: null,
  };
}

export function buildSignalReplayFrames(fixtureRoute: SignalFixtureRoute) {
  const frames = Array.from(
    replayRawObservabilityFixture(fixtureRoute.ingress, {
      windowMs: replaySyncWindowMs,
    }),
    (frame): SignalReplayFrame => {
      const signal = buildSignalIntelligenceState(frame.fixture);
      const canonical = buildSignalCanonicalState(frame.fixture);

      return {
        signal,
        workflowMap: buildSignalWorkflowMap(canonical.packetSets, {
          clientLabel: fixtureRoute.label,
        }),
      };
    },
  );
  const chartableFrames = frames.filter((frame) => frame.workflowMap.links.length > 0);

  return chartableFrames.length > 0 ? chartableFrames : frames;
}
