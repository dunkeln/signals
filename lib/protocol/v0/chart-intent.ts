import type { Spec } from "@json-render/core";
import { z } from "zod";

/**
 * Chart protocol for the JSON-render surface.
 *
 * The protocol is the allowlist between state and UI: it names datasets,
 * allowed components, evidence joins, and default chart intents. Keep this file
 * strict so LLM-generated or future dynamic chart plans select from known data
 * contracts instead of arbitrary state paths.
 */
export const protocolVersion = "protocol/v0";
const maxChartIntents = 4;

const chartComponentSchema = z.enum([
  "WorkflowMapSankey",
  "SourceEvidenceTable",
  "GeneratedBarChart",
]);

export const protocolDatasetIdSchema = z.enum([
  "source_evidence",
  "canonical_entities",
  "workflow_map",
  "generated_content_state_by_owner",
]);

export const chartIntentSchema = z.object({
  id: z.string().min(1),
  component: chartComponentSchema,
  dataset: protocolDatasetIdSchema,
  title: z.string().min(1),
  rationale: z.string().min(1),
  evidenceDataset: protocolDatasetIdSchema.optional(),
});

export const chartIntentListSchema = z
  .array(chartIntentSchema)
  .min(1)
  .max(maxChartIntents);

export type ChartComponent = z.infer<typeof chartComponentSchema>;
export type ProtocolDatasetId = z.infer<typeof protocolDatasetIdSchema>;
export type ChartIntent = z.infer<typeof chartIntentSchema>;

export interface ProtocolDataset {
  id: ProtocolDatasetId;
  statePath: string;
  sourceLayer: "raw_substrate" | "canonical_state" | "generated_chart_data";
  allowedComponents: ChartComponent[];
  purpose: string;
  evidenceDataset?: ProtocolDatasetId;
}

export interface ChartProtocolState {
  version: typeof protocolVersion;
  maxChartIntents: typeof maxChartIntents;
  allowedComponents: ChartComponent[];
  datasets: ProtocolDataset[];
  defaultIntents: ChartIntent[];
  rules: string[];
}

const datasets: ProtocolDataset[] = [
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
      "Render deterministic supplier-content flow; nodes are client roles and supplier counterparties, while links are glossary-backed content packets with evidence state as visual metadata.",
    evidenceDataset: "source_evidence",
  },
  {
    id: "generated_content_state_by_owner",
    statePath: "/generatedChartData",
    sourceLayer: "generated_chart_data",
    allowedComponents: ["GeneratedBarChart"],
    purpose:
      "Render the validated generated dataset that groups supplier content-packet evidence state by owner role.",
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
export function buildChartProtocolState(): ChartProtocolState {
  return {
    version: protocolVersion,
    maxChartIntents,
    allowedComponents: chartComponentSchema.options,
    datasets,
    defaultIntents: buildDefaultChartIntents(),
    rules: [
      "Chart intents must name a dataset id from this protocol, not an arbitrary state path.",
      "A component may render a dataset only when the dataset explicitly allows that component.",
      "Canonical datasets remain visible to the protocol but blocked from rendering until matching components exist.",
      "Evidence-backed charts should carry an evidenceDataset when the protocol provides one.",
      "The compiler throws on invalid or duplicate intent ids; it does not repair malformed plans.",
    ],
  };
}

export function buildDefaultChartIntents(): ChartIntent[] {
  return [
    {
      id: "workflow-map-sankey",
      component: "WorkflowMapSankey",
      dataset: "workflow_map",
      title: "Supplier Content Flow",
      rationale:
        "Show supplier content packets exchanged between the client role work surfaces and supplier counterparty.",
      evidenceDataset: "source_evidence",
    },
    {
      id: "generated-chart",
      component: "GeneratedBarChart",
      dataset: "generated_content_state_by_owner",
      title: "Generated Chart",
      rationale:
        "Render the latest validated chart dataset built from an agent instruction.",
      evidenceDataset: "source_evidence",
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
export function compileChartSpec(
  intents: ChartIntent[] = buildDefaultChartIntents(),
): Spec {
  const chartIntents = chartIntentListSchema.parse(intents);
  assertUniqueIntentIds(chartIntents);

  const children = chartIntents.map((intent) => intent.id);

  return {
    root: "frame",
    elements: {
      frame: {
        type: "Frame",
        props: {
          title: "Supplier Content Flow",
          description:
            "Supplier request and return packets, split by the client workspace that owns each received content type.",
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

function datasetForIntent(intent: ChartIntent): ProtocolDataset {
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

function assertUniqueIntentIds(intents: ChartIntent[]) {
  const seen = new Set<string>();

  for (const intent of intents) {
    if (seen.has(intent.id)) {
      throw new Error(`Duplicate chart intent id: ${intent.id}`);
    }

    seen.add(intent.id);
  }
}
