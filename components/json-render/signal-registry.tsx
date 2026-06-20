"use client";

import * as React from "react";
import { defineRegistry, useStateStore, useStateValue } from "@json-render/react";
import { InfoIcon, PencilIcon } from "lucide-react";
import { SankeyDiagram } from "semiotic/network";
import { BarChart, DonutChart, StackedBarChart } from "semiotic/ordinal";

import { signalCatalog } from "@/lib/json-render/signal-catalog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ChartInstruction, GeneratedChartDataset } from "@/lib/protocol/v0";
import type {
  SignalEvidenceRow,
} from "@/lib/signal/intelligence";
import type {
  SignalWorkflowMapData,
  SignalWorkflowMapLink,
  SignalWorkflowMapNode,
} from "@/lib/signal/workflow-map";

const workflowMapSankeySize = {
  width: 760,
  height: 360,
};

interface DataPathProps {
  dataPath: string;
  title?: string;
}

const { registry: signalRegistry } = defineRegistry(signalCatalog, {
  components: {
    Frame: ({ props, children }) => (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-7 pb-8">
        <div>
          <h1 className="inline-flex items-start gap-1.5 text-xl font-semibold text-foreground">
            <span>{props.title}</span>
            {props.description ? (
              <TitleDescriptionInfo description={props.description} />
            ) : null}
          </h1>
        </div>
        <div className="grid gap-x-8 gap-y-7 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
          {children}
        </div>
      </div>
    ),
    WorkflowMapSankey: ({ props }) => {
      const data = useChartData<SignalWorkflowMapData>(props);

      return (
        <section
          aria-label={props.title ?? "Supplier Content Flow"}
          className="semiotic-signal-chart min-w-0 text-foreground lg:col-span-2"
        >
          <ClientOnlyChart>
            <SemioticWorkflowMapSankey data={data} />
          </ClientOnlyChart>
        </section>
      );
    },
    SourceEvidenceTable: ({ props }) => {
      const rows = useChartData<SignalEvidenceRow[]>(props);

      return (
        <section className="min-w-0 text-foreground lg:col-span-2">
          <ChartHeader title={props.title ?? "Source Evidence"} />
          <div className="overflow-hidden">
            <table className="w-full table-fixed border-collapse text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground">
                <tr>
                  <th className="w-[18%] px-3 py-2 font-medium">Source</th>
                  <th className="w-[11%] px-3 py-2 font-medium">Kind</th>
                  <th className="w-[15%] px-3 py-2 font-medium">Lane</th>
                  <th className="px-3 py-2 font-medium">Summary</th>
                  <th className="w-[28%] px-3 py-2 font-medium">
                    Source Refs
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.sourceId} className="border-b align-top">
                    <td className="truncate px-3 py-2 font-mono text-xs">
                      {row.sourceId}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.kind}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.lane}
                    </td>
                    <td className="px-3 py-2">{row.summary}</td>
                    <td className="truncate px-3 py-2 text-xs text-muted-foreground">
                      {row.sourceRefs}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    },
    GeneratedBarChart: ({ props }) => {
      const { set } = useStateStore();
      const dataset = useChartData<GeneratedChartDataset | null>(props);
      const instruction = useStateValue<ChartInstruction | null>(
        "/generatedChartInstruction",
      );

      if (!dataset) {
        return null;
      }

      const measureKeys = measureKeysForDataset(dataset);
      const rows = dataset.rows.map((row) => ({
        label: row.label,
        value: row.measures[measureKeys[0] ?? ""] ?? 0,
        ...Object.fromEntries(
          measureKeys.map((key) => [key, row.measures[key] ?? 0]),
        ),
      }));
      const stackedRows = dataset.rows.flatMap((row) =>
        measureKeys.map((key) => ({
          label: row.label,
          measure: key,
          value: row.measures[key] ?? 0,
        })),
      );
      const isStacked = dataset.chartKind === "stacked_bar" && measureKeys.length > 1;
      const isDonut = dataset.chartKind === "donut";

      return (
        <section className="semiotic-signal-chart min-w-0 text-foreground lg:col-span-2">
          <EditableGeneratedChartHeader
            title={dataset.title || props.title || "Generated Chart"}
            onCommit={(title) => {
              set(props.dataPath, { ...dataset, title });

              if (instruction) {
                set("/generatedChartInstruction", { ...instruction, title });
              }
            }}
          />
          <div className="h-72 overflow-x-auto overflow-y-hidden">
            <ClientOnlyChart>
              {isDonut ? (
                <DonutChart
                  data={rows}
                  width={760}
                  height={288}
                  margin={{ top: 8, right: 120, bottom: 8, left: 120 }}
                  categoryAccessor="label"
                  valueAccessor="value"
                  colorBy="label"
                  colorScheme={generatedBarColors}
                  innerRadius={66}
                  cornerRadius={3}
                  showLegend={false}
                  showCategoryTicks
                  enableHover
                  accessibleTable={false}
                  frameProps={{
                    pieceStyle: (datum) => ({
                      stroke: "var(--background)",
                      lineWidth: 1,
                      fill: generatedBarColor(String(datum.label)),
                    }),
                  }}
                />
              ) : isStacked ? (
                <StackedBarChart
                  data={stackedRows}
                  width={760}
                  height={288}
                  margin={{ top: 10, right: 16, bottom: 54, left: 36 }}
                  categoryAccessor="label"
                  valueAccessor="value"
                  stackBy="measure"
                  colorBy="measure"
                  colorScheme={generatedBarColors}
                  sort={false}
                  showGrid
                  showLegend={false}
                  roundedTop={3}
                  enableHover
                  accessibleTable={false}
                  frameProps={{
                    pieceStyle: (datum) => ({
                      stroke: "var(--background)",
                      lineWidth: 1,
                      fill: generatedBarColor(String(datum.measure)),
                    }),
                  }}
                />
              ) : (
                <BarChart
                  data={rows}
                  width={760}
                  height={288}
                  margin={{ top: 10, right: 16, bottom: 54, left: 36 }}
                  categoryAccessor="label"
                  valueAccessor="value"
                  color={generatedBarColors[0]}
                  sort={false}
                  showGrid
                  showLegend={false}
                  roundedTop={3}
                  gradientFill={false}
                  enableHover
                  accessibleTable={false}
                  frameProps={{
                    pieceStyle: () => ({
                      stroke: "var(--background)",
                      lineWidth: 1,
                      fill: generatedBarColors[0],
                    }),
                  }}
                />
              )}
            </ClientOnlyChart>
          </div>
        </section>
      );
    },
  },
});

export { signalRegistry };

function TitleDescriptionInfo({ description }: { description: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label="About this view"
        className="mt-0.5 inline-flex size-4 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <InfoIcon className="size-3" />
      </TooltipTrigger>
      <TooltipContent
        side="right"
        align="start"
        sideOffset={8}
        className="max-w-72 items-start text-left leading-5"
      >
        {description}
      </TooltipContent>
    </Tooltip>
  );
}

function ChartHeader({ title }: { title: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
    </div>
  );
}

function EditableGeneratedChartHeader({
  title,
  onCommit,
}: {
  title: string;
  onCommit: (title: string) => void;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(title);

  function commitTitle() {
    const nextTitle = draft.trim();
    setIsEditing(false);

    if (nextTitle.length > 0 && nextTitle !== title) {
      onCommit(nextTitle);
    } else {
      setDraft(title);
    }
  }

  function cancelEdit() {
    setDraft(title);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <form
        className="mb-3"
        onSubmit={(event) => {
          event.preventDefault();
          commitTitle();
        }}
      >
        <input
          autoFocus
          aria-label="Generated chart title"
          value={draft}
          onBlur={commitTitle}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              cancelEdit();
            } else if (event.key === "Enter") {
              event.preventDefault();
              commitTitle();
            }
          }}
          className="h-6 w-full max-w-sm rounded-sm border border-border bg-background px-1.5 text-sm font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </form>
    );
  }

  return (
    <div className="mb-3 flex items-center gap-1.5">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      <button
        type="button"
        aria-label="Edit generated chart title"
        onClick={() => {
          setDraft(title);
          setIsEditing(true);
        }}
        className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <PencilIcon className="size-3" />
      </button>
    </div>
  );
}

function ClientOnlyChart({ children }: { children: React.ReactNode }) {
  const mounted = React.useSyncExternalStore(
    subscribeNoop,
    getClientSnapshot,
    getServerSnapshot,
  );

  if (!mounted) {
    return <ChartPlaceholder />;
  }

  return children;
}

function subscribeNoop() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function ChartPlaceholder() {
  return (
    <div className="flex h-full min-h-72 items-center justify-center text-sm text-muted-foreground">
      Preparing chart
    </div>
  );
}

function SemioticWorkflowMapSankey({ data }: { data: SignalWorkflowMapData }) {
  if (data.nodes.length === 0 || data.links.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
      No workflow links available.
      </div>
    );
  }

  const edges = data.links.map((link, index) => ({
    ...link,
    edgeId: `${link.source}:${link.target}:${link.contentLabel}:${index}`,
  }));

  return (
    <div
      className="overflow-x-auto overflow-y-visible"
      style={{ minHeight: workflowMapSankeySize.height }}
    >
      <SankeyDiagram
        nodes={data.nodes}
        edges={edges}
        width={workflowMapSankeySize.width}
        height={workflowMapSankeySize.height}
        margin={{ top: 26, right: 148, bottom: 0, left: 116 }}
        nodeIdAccessor="id"
        sourceAccessor="source"
        targetAccessor="target"
        valueAccessor="value"
        nodeLabel="label"
        showLabels
        nodeWidth={7}
        nodePaddingRatio={0.34}
        edgeOpacity={0.48}
        enableHover
        accessibleTable={false}
        edgeColorBy={(edge) => workflowStatusColor(edge.status)}
        frameProps={{
          edgeIdAccessor: "edgeId",
          animate: { intro: false },
          nodeStyle: (node) => ({
            fill: workflowNodeColor(
              dataFromSemioticWrapper<SignalWorkflowMapNode>(node),
            ),
            opacity: 0.92,
            stroke: "var(--background)",
            lineWidth: 1,
          }),
          edgeStyle: (edge) => {
            const link = dataFromSemioticWrapper<SignalWorkflowMapLink>(edge);

            return {
              stroke: workflowStatusColor(link.status),
              fill: workflowStatusColor(link.status),
              opacity: link.support === "partial" ? 0.28 : 0.48,
            };
          },
        }}
        tooltip={(datum) => {
          const edge =
            dataFromSemioticWrapper<Partial<SignalWorkflowMapLink>>(datum);

          return (
            <div className="text-xs font-medium text-foreground">
              {edge.contentLabel ?? edge.summary ?? "Workflow link"}
            </div>
          );
        }}
      />
    </div>
  );
}

function workflowStatusColor(status?: SignalWorkflowMapLink["status"]) {
  switch (status) {
    case "blocked":
      return "var(--destructive)";
    case "review_required":
      return "var(--muted-foreground)";
    case "received":
      return "var(--chart-2)";
    case "requested":
      return "var(--foreground)";
    default:
      return "var(--border)";
  }
}

function workflowNodeColor(node: SignalWorkflowMapNode) {
  switch (node.surfaceKind) {
    case "supplier":
      return "var(--muted-foreground)";
    case "client_role":
      return "var(--border)";
  }
}

function dataFromSemioticWrapper<Value>(datum: unknown): Value {
  if (datum && typeof datum === "object" && "data" in datum) {
    return (datum as { data?: Value }).data ?? (datum as Value);
  }

  return datum as Value;
}

function useChartData<Value>(props: DataPathProps): Value {
  return useStateValue(props.dataPath) as Value;
}

const generatedBarColors = [
  "var(--foreground)",
  "var(--muted-foreground)",
  "var(--border)",
  "var(--muted)",
];

function generatedBarColor(key: string) {
  const hash = Array.from(key).reduce((total, char) => total + char.charCodeAt(0), 0);

  return generatedBarColors[hash % generatedBarColors.length];
}

function measureKeysForDataset(dataset: GeneratedChartDataset) {
  return Array.from(
    new Set(dataset.rows.flatMap((row) => Object.keys(row.measures))),
  );
}
