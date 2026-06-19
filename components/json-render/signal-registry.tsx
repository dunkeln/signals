"use client";

import * as React from "react";
import { defineRegistry, useStateValue } from "@json-render/react";
import { Sankey, sankeyLinkHorizontal } from "@visx/sankey";
import type { SankeyGraph, SankeyLink, SankeyNode } from "@visx/sankey";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { signalCatalog } from "@/lib/json-render/signal-catalog";
import type { GeneratedChartDataset } from "@/lib/protocol/v0";
import type {
  SignalEvidenceRow,
} from "@/lib/signal/intelligence";
import type {
  SignalWorkflowMapData,
  SignalWorkflowMapLink,
  SignalWorkflowMapNode,
} from "@/lib/signal/workflow-map";

interface DataPathProps {
  dataPath: string;
  title?: string;
}

const { registry: signalRegistry } = defineRegistry(signalCatalog, {
  components: {
    Frame: ({ props, children }) => (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-7 pb-8">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">
            {props.title}
          </h1>
          {props.description ? (
            <p className="max-w-2xl text-sm text-muted-foreground">
              {props.description}
            </p>
          ) : null}
        </div>
        <div className="grid gap-x-8 gap-y-7 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
          {children}
        </div>
      </div>
    ),
    WorkflowMapSankey: ({ props }) => {
      const data = useChartData<SignalWorkflowMapData>(props);

      return (
        <section className="min-w-0 text-foreground lg:col-span-2">
          <ChartHeader title={props.title ?? "Supplier Content Flow"} />
          <ClientOnlyChart>
            <VisxWorkflowMapSankey data={data} />
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

      const measureKeys = measureKeysForDataset(dataset);
      const rows = dataset.rows.map((row) => ({
        label: row.label,
        ...Object.fromEntries(
          measureKeys.map((key) => [key, row.measures[key] ?? 0]),
        ),
      }));

      return (
        <section className="min-w-0 text-foreground lg:col-span-2">
          <ChartHeader title={dataset.title || props.title || "Generated Chart"} />
          <div className="h-72 overflow-x-auto overflow-y-hidden">
            <ClientOnlyChart>
              <BarChart
                width={760}
                height={288}
                data={rows}
                margin={{ top: 10, right: 16, bottom: 38, left: -18 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    boxShadow: "0 12px 30px rgb(0 0 0 / 0.08)",
                  }}
                />
                {measureKeys.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="generated"
                    fill={generatedBarColors[index % generatedBarColors.length]}
                  />
                ))}
              </BarChart>
            </ClientOnlyChart>
          </div>
        </section>
      );
    },
  },
});

export { signalRegistry };

function ChartHeader({ title }: { title: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
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

function VisxWorkflowMapSankey({ data }: { data: SignalWorkflowMapData }) {
  const width = 760;
  const height = 360;
  const topInset = 22;
  const graph: SankeyGraph<SignalWorkflowMapNode, SignalWorkflowMapLink> = {
    nodes: data.nodes.map((node) => ({ ...node })),
    links: data.links.map((link) => ({ ...link })),
  };

  if (data.nodes.length === 0 || data.links.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        No workflow links available.
      </div>
    );
  }

  return (
    <div className="h-80 overflow-hidden">
      <svg
        role="img"
        aria-label="Evidence-backed supplier content flow"
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
      >
        <Sankey
          root={graph}
          nodeId={(node) => node.id}
          nodeWidth={7}
          nodePadding={18}
          size={[width, height - topInset]}
        >
          {({ graph: layoutGraph }) => (
            <g transform={`translate(0 ${topInset})`}>
              {layoutGraph.links.map((link, index) => (
                <WorkflowMapLinkPath key={index} link={link} />
              ))}
              {layoutGraph.nodes.map((node) => (
                <WorkflowMapNodeRect key={node.id} node={node} />
              ))}
            </g>
          )}
        </Sankey>
      </svg>
    </div>
  );
}

function WorkflowMapLinkPath({
  link,
}: {
  link: SankeyLink<SignalWorkflowMapNode, SignalWorkflowMapLink>;
}) {
  const path = sankeyLinkHorizontal<
    SignalWorkflowMapNode,
    SignalWorkflowMapLink
  >()(link);
  const source = link.source as unknown as { x1?: number };
  const target = link.target as unknown as { x0?: number };
  const sourceX = source.x1 ?? 0;
  const targetX = target.x0 ?? 0;

  return (
    <g>
      <path
        d={path ?? undefined}
        fill="none"
        stroke="var(--background)"
        strokeOpacity={0.86}
        strokeWidth={Math.max(3, (link.width ?? 1) + 3)}
      />
      <path
        d={path ?? undefined}
        fill="none"
        stroke={workflowStatusColor(link.status)}
        strokeOpacity={link.support === "partial" ? 0.28 : 0.48}
        strokeWidth={Math.max(1, link.width ?? 1)}
      />
      <text
        x={(sourceX + targetX) / 2}
        y={((link.y0 ?? 0) + (link.y1 ?? 0)) / 2 - 8}
        textAnchor="middle"
        className="fill-muted-foreground text-[10px]"
      >
        {link.contentLabel}
      </text>
    </g>
  );
}

function WorkflowMapNodeRect({
  node,
}: {
  node: SankeyNode<SignalWorkflowMapNode, SignalWorkflowMapLink>;
}) {
  const x0 = node.x0 ?? 0;
  const x1 = node.x1 ?? x0;
  const y0 = node.y0 ?? 0;
  const y1 = node.y1 ?? y0;
  const labelX = (x0 + x1) / 2;
  const labelY = y0 - 8;

  return (
    <g>
      <rect
        x={x0}
        y={y0}
        width={Math.max(1, x1 - x0)}
        height={Math.max(1, y1 - y0)}
        rx={3}
        fill={workflowNodeColor(node)}
        opacity={0.92}
      />
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        className="fill-foreground text-[10px]"
      >
        {node.label}
      </text>
    </g>
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

function useChartData<Value>(props: DataPathProps): Value {
  return useStateValue(props.dataPath) as Value;
}

const generatedBarColors = [
  "var(--foreground)",
  "var(--muted-foreground)",
  "var(--border)",
  "var(--muted)",
];

function measureKeysForDataset(dataset: GeneratedChartDataset) {
  return Array.from(
    new Set(dataset.rows.flatMap((row) => Object.keys(row.measures))),
  );
}
