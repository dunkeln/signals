import type { Spec } from "@json-render/core";
import { z } from "zod";

const protocolVersion = "signal-chart-protocol/v0";
const maxChartIntents = 4;

const chartComponentSchema = z.enum([
  "DomainCoverageChart",
  "ServiceFlowSankey",
  "SourceEvidenceTable",
  "GeneratedBarChart",
]);

export const signalProtocolDatasetIdSchema = z.enum([
  "domain_coverage",
  "service_flow",
  "source_evidence",
  "workflow_lanes",
  "workflow_signals",
  "intervention_candidates",
  "business_impact",
  "generated_workflow_status_by_owner",
]);

export const signalChartIntentSchema = z.object({
  id: z.string().min(1),
  component: chartComponentSchema,
  dataset: signalProtocolDatasetIdSchema,
  title: z.string().min(1),
  rationale: z.string().min(1),
  evidenceDataset: signalProtocolDatasetIdSchema.optional(),
});

export const signalChartIntentListSchema = z
  .array(signalChartIntentSchema)
  .min(1)
  .max(maxChartIntents);

export type SignalChartComponent = z.infer<typeof chartComponentSchema>;
export type SignalProtocolDatasetId = z.infer<
  typeof signalProtocolDatasetIdSchema
>;
export type SignalChartIntent = z.infer<typeof signalChartIntentSchema>;

export interface SignalProtocolDataset {
  id: SignalProtocolDatasetId;
  statePath: string;
  sourceLayer: "raw_substrate" | "operating_map" | "generated_chart_data";
  allowedComponents: SignalChartComponent[];
  purpose: string;
  evidenceDataset?: SignalProtocolDatasetId;
}

export interface SignalChartProtocolState {
  version: typeof protocolVersion;
  maxChartIntents: typeof maxChartIntents;
  allowedComponents: SignalChartComponent[];
  datasets: SignalProtocolDataset[];
  defaultIntents: SignalChartIntent[];
  rules: string[];
}

const datasets: SignalProtocolDataset[] = [
  {
    id: "domain_coverage",
    statePath: "/signal/domainCoverageRows",
    sourceLayer: "raw_substrate",
    allowedComponents: ["DomainCoverageChart"],
    purpose:
      "Show which procurement dimensions are present across logs, metrics, traces, and events.",
    evidenceDataset: "source_evidence",
  },
  {
    id: "service_flow",
    statePath: "/signal/serviceFlow",
    sourceLayer: "raw_substrate",
    allowedComponents: ["ServiceFlowSankey"],
    purpose:
      "Show deterministic telemetry movement into operating lanes without assigning root cause.",
    evidenceDataset: "source_evidence",
  },
  {
    id: "source_evidence",
    statePath: "/signal/evidenceRows",
    sourceLayer: "raw_substrate",
    allowedComponents: ["SourceEvidenceTable"],
    purpose: "Show source records and references behind the rendered charts.",
  },
  {
    id: "workflow_lanes",
    statePath: "/operatingMap/workflowLanes",
    sourceLayer: "operating_map",
    allowedComponents: [],
    purpose:
      "Expose workflow lane state for future components; not renderable until a lane component exists.",
    evidenceDataset: "source_evidence",
  },
  {
    id: "workflow_signals",
    statePath: "/operatingMap/workflowSignals",
    sourceLayer: "operating_map",
    allowedComponents: [],
    purpose:
      "Expose source-backed workflow signals for future components; not renderable until a signal component exists.",
    evidenceDataset: "source_evidence",
  },
  {
    id: "intervention_candidates",
    statePath: "/operatingMap/interventionCandidates",
    sourceLayer: "operating_map",
    allowedComponents: [],
    purpose:
      "Expose deterministic action-context candidates for future components; not renderable until a matching component exists.",
    evidenceDataset: "workflow_signals",
  },
  {
    id: "business_impact",
    statePath: "/operatingMap/businessImpactRows",
    sourceLayer: "operating_map",
    allowedComponents: [],
    purpose:
      "Expose business impact rows for future components; not renderable until an impact component exists.",
    evidenceDataset: "source_evidence",
  },
  {
    id: "generated_workflow_status_by_owner",
    statePath: "/generatedChartData",
    sourceLayer: "generated_chart_data",
    allowedComponents: ["GeneratedBarChart"],
    purpose:
      "Render the validated generated dataset that groups workflow lane status by owner role.",
    evidenceDataset: "source_evidence",
  },
];

const datasetById = new Map(datasets.map((dataset) => [dataset.id, dataset]));

export function buildSignalChartProtocolState(): SignalChartProtocolState {
  return {
    version: protocolVersion,
    maxChartIntents,
    allowedComponents: chartComponentSchema.options,
    datasets,
    defaultIntents: buildDefaultSignalChartIntents(),
    rules: [
      "Chart intents must name a dataset id from this protocol, not an arbitrary state path.",
      "A component may render a dataset only when the dataset explicitly allows that component.",
      "Operating-map datasets remain visible to the protocol but blocked from rendering until matching components exist.",
      "Evidence-backed charts should carry an evidenceDataset when the protocol provides one.",
      "The compiler throws on invalid or duplicate intent ids; it does not repair malformed plans.",
    ],
  };
}

export function buildDefaultSignalChartIntents(): SignalChartIntent[] {
  return [
    {
      id: "domain-coverage-chart",
      component: "DomainCoverageChart",
      dataset: "domain_coverage",
      title: "Domain Coverage",
      rationale:
        "Start with the raw substrate coverage before asking for workflow interpretation.",
      evidenceDataset: "source_evidence",
    },
    {
      id: "service-flow-sankey",
      component: "ServiceFlowSankey",
      dataset: "service_flow",
      title: "Telemetry To Operating Lanes",
      rationale:
        "Show how source telemetry maps into deterministic operating lanes.",
      evidenceDataset: "source_evidence",
    },
    {
      id: "source-evidence-table",
      component: "SourceEvidenceTable",
      dataset: "source_evidence",
      title: "Source Evidence",
      rationale:
        "Keep the rendered view traceable to the source records behind each rollup.",
    },
    {
      id: "generated-workflow-status-chart",
      component: "GeneratedBarChart",
      dataset: "generated_workflow_status_by_owner",
      title: "Workflow Status By Owner",
      rationale:
        "Show the first validated generated chart dataset derived from operating-map lanes.",
      evidenceDataset: "source_evidence",
    },
  ];
}

export function compileSignalChartSpec(
  intents: SignalChartIntent[] = buildDefaultSignalChartIntents(),
): Spec {
  const chartIntents = signalChartIntentListSchema.parse(intents);
  assertUniqueIntentIds(chartIntents);

  const children = chartIntents.map((intent) => intent.id);

  return {
    root: "signal-frame",
    elements: {
      "signal-frame": {
        type: "SignalFrame",
        props: {
          title: "Signal Intelligence Substrate",
          description:
            "Deterministic rollups from email-native procurement telemetry into chart-ready evidence.",
        },
        children,
      },
      ...Object.fromEntries(
        chartIntents.map((intent) => {
          const dataset = datasetForIntent(intent);

          return [
            intent.id,
            {
              type: intent.component,
              props: {
                title: intent.title,
                dataPath: dataset.statePath,
              },
              children: [],
            },
          ];
        }),
      ),
    },
  };
}

function datasetForIntent(intent: SignalChartIntent): SignalProtocolDataset {
  const dataset = datasetById.get(intent.dataset);

  if (!dataset) {
    throw new Error(`Unknown chart dataset: ${intent.dataset}`);
  }

  if (!dataset.allowedComponents.includes(intent.component)) {
    throw new Error(
      `${intent.component} cannot render ${intent.dataset}; allowed components: ${dataset.allowedComponents.join(", ") || "none"}`,
    );
  }

  if (dataset.evidenceDataset && intent.evidenceDataset !== dataset.evidenceDataset) {
    throw new Error(
      `${intent.dataset} must declare evidenceDataset=${dataset.evidenceDataset}`,
    );
  }

  return dataset;
}

function assertUniqueIntentIds(intents: SignalChartIntent[]) {
  const seen = new Set<string>();

  for (const intent of intents) {
    if (seen.has(intent.id)) {
      throw new Error(`Duplicate chart intent id: ${intent.id}`);
    }

    seen.add(intent.id);
  }
}
