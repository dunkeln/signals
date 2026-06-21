import { HomeAgentAffordances } from "@/components/home-agent-affordances";
import { HomeWorkflowMap } from "@/components/home-workflow-map";
import { fixtureRoutes, hasFixtureIngress } from "@/lib/fixtures/registry";
import { compileChartSpec } from "@/lib/protocol/v0";
import { buildSignalCanonicalState } from "@/lib/signal/canonical-state";
import {
  buildSignalReplayFrames,
  type SignalReplayFrame,
} from "@/lib/signal/page-state";
import {
  buildSignalWorkflowMap,
  type SignalWorkflowMapData,
} from "@/lib/signal/workflow-map";

export default function Home() {
  const workflowMap = buildMergedWorkflowMap();
  const replayFrames = buildMergedReplayFrames();
  const spec = compileChartSpec([
    {
      id: "workflow_map",
      component: "WorkflowMapSankey",
      dataset: "workflow_map",
      title: "Procurement Coordination Map",
      rationale: "Show merged supplier content flow across available reports.",
      evidenceDataset: "source_evidence",
    },
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-normal">Signals</h1>
        <p className="mt-2 max-w-xl text-sm italic">
          Team alignment takes time. AI models in the loop, shared context is affordance more than an afterthought. Signals bundles product facing data, the real signals for teams to connect with client workflows just off the logs.
          Product procurement workflows are another Graph representation, the boundaries build the communication tax. How do you close the loop? Let agents get context of the real signals from CPGs leveraging the AI workflows. Let the real signals dictate the slice to improve.
          This is product improvement on real data.
        </p>
      </div>
      <HomeAgentAffordances />
      <HomeWorkflowMap
        spec={spec}
        workflowMap={workflowMap}
        replayFrames={replayFrames}
      />
    </div>
  );
}

function buildMergedWorkflowMap(): SignalWorkflowMapData {
  const maps = fixtureRoutes.filter(hasFixtureIngress).map((fixture) => {
    const canonical = buildSignalCanonicalState(fixture.ingress);
    const workflowMap = buildSignalWorkflowMap(canonical.packetSets, {
      clientLabel: fixture.label,
    });

    return {
      slug: fixture.slug,
      workflowMap,
    };
  });

  return {
    nodes: maps.flatMap(({ slug, workflowMap }) =>
      workflowMap.nodes.map((node) => ({
        ...node,
        id: scopedId(slug, node.id),
      })),
    ),
    links: maps.flatMap(({ slug, workflowMap }) =>
      workflowMap.links.map((link) => ({
        ...link,
        source: scopedId(slug, link.source),
        target: scopedId(slug, link.target),
      })),
    ),
  };
}

function scopedId(slug: string, id: string) {
  return `${slug}:${id}`;
}

function buildMergedReplayFrames(): SignalReplayFrame[] {
  const fixtureFrames = fixtureRoutes.filter(hasFixtureIngress).map((fixture) => ({
    slug: fixture.slug,
    frames: buildSignalReplayFrames(fixture),
  }));
  const frameCount = Math.max(0, ...fixtureFrames.map(({ frames }) => frames.length));

  if (frameCount === 0 || fixtureFrames.length === 0) {
    return [];
  }

  return Array.from({ length: frameCount }, (_, index) => ({
    signal: fixtureFrames[0].frames[Math.min(index, fixtureFrames[0].frames.length - 1)].signal,
    workflowMap: {
      nodes: fixtureFrames.flatMap(({ slug, frames }) => {
        const frame = frames[Math.min(index, frames.length - 1)];

        return frame.workflowMap.nodes.map((node) => ({
          ...node,
          id: scopedId(slug, node.id),
        }));
      }),
      links: fixtureFrames.flatMap(({ slug, frames }) => {
        const frame = frames[Math.min(index, frames.length - 1)];

        return frame.workflowMap.links.map((link) => ({
          ...link,
          source: scopedId(slug, link.source),
          target: scopedId(slug, link.target),
        }));
      }),
    },
  }));
}
