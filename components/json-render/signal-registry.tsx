"use client";

import * as React from "react";
import { defineRegistry, useStateValue } from "@json-render/react";
import { InfoIcon } from "lucide-react";
import { SankeyDiagram } from "semiotic/network";
import { BarChart, DonutChart, StackedBarChart } from "semiotic/ordinal";

import { signalCatalog } from "@/lib/json-render/signal-catalog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { GeneratedChartDataset } from "@/lib/protocol/v0";
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

type TimeSliceOption = {
  id: string;
  label: string;
  order: number;
};

const TimeSliceContext = React.createContext<string>("all");

const { registry: signalRegistry } = defineRegistry(signalCatalog, {
  components: {
    Frame: ({ props, children }) => {
      const workflowMap = useStateValue<SignalWorkflowMapData | undefined>("/workflowMap");
      const options = React.useMemo(
        () => buildTimeSliceOptions(workflowMap?.links ?? []),
        [workflowMap],
      );
      const [selectedSlice, setSelectedSlice] = React.useState("all");

      React.useEffect(() => {
        if (selectedSlice !== "all" && !options.some((option) => option.id === selectedSlice)) {
          setSelectedSlice("all");
        }
      }, [options, selectedSlice]);

      return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-7 pb-8">
          <div>
            <h1 className="inline-flex items-start gap-1.5 text-xl font-semibold text-foreground">
              <span>{props.title}</span>
              {props.description ? (
                <TitleDescriptionInfo description={props.description} />
              ) : null}
            </h1>
            <TimeSliceControls
              options={options}
              selectedSlice={selectedSlice}
              onSelect={setSelectedSlice}
            />
          </div>
          <TimeSliceContext.Provider value={selectedSlice}>
            <div className="grid gap-x-8 gap-y-7 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
              {children}
            </div>
          </TimeSliceContext.Provider>
        </div>
      );
    },
    WorkflowMapSankey: ({ props }) => {
      const data = useChartData<SignalWorkflowMapData>(props);
      const selectedSlice = React.useContext(TimeSliceContext);
      const slicedData = React.useMemo(
        () => filterWorkflowMapByTimeSlice(data, selectedSlice),
        [data, selectedSlice],
      );

      return (
        <section
          aria-label={props.title ?? "Procurement Coordination Map"}
          className="semiotic-signal-chart min-w-0 text-foreground lg:col-span-2"
        >
          <ClientOnlyChart>
            <SemioticWorkflowMapSankey data={slicedData} />
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
      const dataset = useChartData<GeneratedChartDataset | null>(props);

      if (!dataset) {
        return null;
      }

      return <GeneratedChartView dataset={dataset} title={props.title} />;
    },
  },
});

export { signalRegistry };

export function GeneratedChartView({
  dataset,
  title,
  onTitleChange,
}: {
  dataset: GeneratedChartDataset;
  title?: string;
  onTitleChange?: (title: string) => void;
}) {
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
      {onTitleChange ? (
        <EditableChartHeader
          title={dataset.title || title || "Generated Chart"}
          onTitleChange={onTitleChange}
        />
      ) : (
        <ChartHeader title={dataset.title || title || "Generated Chart"} />
      )}
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
}

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

function TimeSliceControls({
  options,
  selectedSlice,
  onSelect,
}: {
  options: TimeSliceOption[];
  selectedSlice: string;
  onSelect: (slice: string) => void;
}) {
  if (options.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5">
      <TimeSliceButton
        label="All"
        active={selectedSlice === "all"}
        onClick={() => onSelect("all")}
      />
      {options.map((option) => (
        <TimeSliceButton
          key={option.id}
          label={option.label}
          active={selectedSlice === option.id}
          onClick={() => onSelect(option.id)}
        />
      ))}
    </div>
  );
}

function TimeSliceButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        "h-7 min-w-7 border px-2 text-xs font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function ChartHeader({ title }: { title: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
    </div>
  );
}

function EditableChartHeader({
  title,
  onTitleChange,
}: {
  title: string;
  onTitleChange: (title: string) => void;
}) {
  function commit(target: HTMLInputElement) {
    const nextTitle = target.value.trim();

    if (nextTitle.length > 0 && nextTitle !== title) {
      target.value = nextTitle;
      onTitleChange(nextTitle);
    } else {
      target.value = title;
    }
  }

  return (
    <div className="mb-3">
      <input
        aria-label="Generated chart title"
        defaultValue={title}
        onBlur={(event) => commit(event.currentTarget)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== "Escape") {
            return;
          }

          event.preventDefault();
          commit(event.currentTarget);
          event.currentTarget.blur();
        }}
        className="h-6 w-full bg-transparent text-sm font-medium text-foreground outline-none"
      />
    </div>
  );
}

function buildTimeSliceOptions(links: SignalWorkflowMapLink[]) {
  const optionMap = new Map<string, TimeSliceOption>();

  for (const link of links) {
    optionMap.set(link.businessTimeSlice, {
      id: link.businessTimeSlice,
      label: link.businessTimeSlice,
      order: link.businessTimeOrder,
    });
  }

  return Array.from(optionMap.values()).sort(
    (left, right) => left.order - right.order,
  );
}

function filterWorkflowMapByTimeSlice(
  data: SignalWorkflowMapData,
  selectedSlice: string,
): SignalWorkflowMapData {
  if (selectedSlice === "all") {
    return data;
  }

  const options = buildTimeSliceOptions(data.links);
  const option = options.find((candidate) => candidate.id === selectedSlice);

  if (!option) {
    return data;
  }

  const links = data.links.filter(
    (link) => link.businessTimeSlice === option.id,
  );
  const nodeIds = new Set(links.flatMap((link) => [link.source, link.target]));

  return {
    nodes: data.nodes.filter((node) => nodeIds.has(node.id)),
    links,
  };
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
          const item = dataFromSemioticWrapper<
            Partial<SignalWorkflowMapLink & SignalWorkflowMapNode>
          >(datum);
          const blockedLinks =
            "id" in item
              ? data.links.filter(
                  (link) => link.target === item.id && link.status === "blocked",
                )
              : [];
          const edge = item as Partial<SignalWorkflowMapLink>;

          if (blockedLinks.length > 0) {
            return (
              <div className="max-w-56 text-xs text-foreground">
                <div className="font-medium">Blocked for {item.label}</div>
                <div className="mt-1 text-muted-foreground">
                  {blockedLinks
                    .map(blockingReason)
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </div>
            );
          }

          return (
            <div className="text-xs font-medium text-foreground">
              {edge.contentLabel ?? edge.summary ?? "Workflow link"} ·{" "}
              {edge.value}
            </div>
          );
        }}
      />
    </div>
  );
}

function blockingReason(link: SignalWorkflowMapLink) {
  const reason =
    stringAttribute(link.attributes.blocked_by) ??
    stringAttribute(link.attributes["edge.blocked_by"]) ??
    stringAttribute(link.attributes.missing_document_type);

  return reason?.replaceAll("_", " ");
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

function stringAttribute(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
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
