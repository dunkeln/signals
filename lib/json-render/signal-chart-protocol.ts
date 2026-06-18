import type { Spec } from "@json-render/core";
import { z } from "zod";

/**
 * Chart protocol for Signal's JSON-render surface.
 *
 * The protocol is the allowlist between state and UI: it names datasets,
 * allowed components, evidence joins, and default chart intents. Keep this file
 * strict so LLM-generated or future dynamic chart plans select from known data
 * contracts instead of arbitrary state paths.
 */
const protocolVersion = "signal-chart-protocol/v0";
const maxChartIntents = 4;

const chartComponentSchema = z.enum([
  "WorkflowMapSankey",
  "SourceEvidenceTable",
  "GeneratedBarChart",
]);

export const signalProtocolDatasetIdSchema = z.enum([
  "source_evidence",
  "canonical_entities",
  "workflow_map",
  "generated_canonical_link_health_by_owner",
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
  sourceLayer: "raw_substrate" | "canonical_state" | "generated_chart_data";
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
    id: "source_evidence",
    statePath: "/signal/evidenceRows",
    sourceLayer: "raw_substrate",
    allowedComponents: ["SourceEvidenceTable"],
    purpose: "Show source records and references behind the rendered charts.",
  },
  {
    id: "canonical_entities",
    statePath: "/canonical/entities",
    sourceLayer: "canonical_state",
    allowedComponents: [],
    purpose:
      "Expose canonical entity instances with parentRefs and source evidence; renderable only through derived chart datasets.",
    evidenceDataset: "source_evidence",
  },
  {
    id: "workflow_map",
    statePath: "/workflowMap",
    sourceLayer: "canonical_state",
    allowedComponents: ["WorkflowMapSankey"],
    purpose:
      "Render the deterministic canonical workflow Sankey; nodes are canonical stages and link color carries health.",
    evidenceDataset: "source_evidence",
  },
  {
    id: "generated_canonical_link_health_by_owner",
    statePath: "/generatedChartData",
    sourceLayer: "generated_chart_data",
    allowedComponents: ["GeneratedBarChart"],
    purpose:
      "Render the validated generated dataset that groups canonical link health by owner role.",
    evidenceDataset: "source_evidence",
  },
];

const datasetById = new Map(datasets.map((dataset) => [dataset.id, dataset]));

/**
 * Returns the protocol visible to chart planners and runtime state.
 *
 * Add datasets here only after their state path is stable and their allowed
 * renderer is known. Canonical datasets can be exposed with no renderers until
 * a projection/component exists, which prevents premature UI promises while
 * still letting agents understand the available semantic layer.
 */
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
      "Canonical datasets remain visible to the protocol but blocked from rendering until matching components exist.",
      "Evidence-backed charts should carry an evidenceDataset when the protocol provides one.",
      "The compiler throws on invalid or duplicate intent ids; it does not repair malformed plans.",
    ],
  };
}

export function buildDefaultSignalChartIntents(): SignalChartIntent[] {
  return [
    {
      id: "workflow-map-sankey",
      component: "WorkflowMapSankey",
      dataset: "workflow_map",
      title: "Canonical Workflow Map",
      rationale:
        "Use the canonical workflow Sankey as the source of truth for entity-instance flow.",
      evidenceDataset: "source_evidence",
    },
    {
      id: "generated-workflow-status-chart",
      component: "GeneratedBarChart",
      dataset: "generated_canonical_link_health_by_owner",
      title: "Canonical Link Health By Owner",
      rationale:
        "Show a generated secondary view derived from health metadata on canonical workflow links.",
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
  ];
}

/**
 * Compiles chart intents into a JSON-render spec after protocol validation.
 *
 * This function enforces the product boundary: an intent must use a known
 * dataset, a permitted component, and the expected evidence dataset. If you add
 * a richer Sankey or flow map, wire its dataset/component pair through the
 * protocol first instead of bypassing validation in the renderer.
 */
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
          title: "Canonical Workflow Map",
          description:
            "Source-backed supplier evidence normalized into canonical entity flow with health carried on links.",
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
