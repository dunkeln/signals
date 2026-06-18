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
import type { SignalGeneratedChartDataset } from "@/lib/signal/generated-chart-agent";
import type {
  SignalDimensionRow,
  SignalEvidenceRow,
  SignalFlowData,
  SignalFlowLink,
  SignalFlowNode,
} from "@/lib/signal/intelligence";

interface DataPathProps {
  dataPath: string;
  title?: string;
}

const { registry: signalRegistry } = defineRegistry(signalCatalog, {
  components: {
    SignalFrame: ({ props, children }) => (
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
    DomainCoverageChart: ({ props }) => {
      const rows = useChartData<SignalDimensionRow[]>(props);

      return (
        <section className="min-w-0 text-foreground">
          <ChartHeader title={props.title ?? "Domain Coverage"} />
          <div className="h-72 overflow-x-auto overflow-y-hidden">
            <ClientOnlyChart>
              <BarChart
                width={560}
                height={288}
                data={rows}
                margin={{ top: 10, right: 8, bottom: 52, left: -18 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="dimension"
                  interval={0}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  angle={-28}
                  textAnchor="end"
                  height={64}
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
                <Bar dataKey="logs" stackId="kind" fill="var(--foreground)" />
                <Bar
                  dataKey="metrics"
                  stackId="kind"
                  fill="var(--muted-foreground)"
                />
                <Bar dataKey="traces" stackId="kind" fill="var(--border)" />
                <Bar dataKey="events" stackId="kind" fill="var(--muted)" />
              </BarChart>
            </ClientOnlyChart>
          </div>
        </section>
      );
    },
    ServiceFlowSankey: ({ props }) => {
      const data = useChartData<SignalFlowData>(props);

      return (
        <section className="min-w-0 text-foreground">
          <ChartHeader title={props.title ?? "Service Flow"} />
          <ClientOnlyChart>
            <VisxSankey data={data} />
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
      const dataset = useChartData<SignalGeneratedChartDataset>(props);
      const measureKeys = measureKeysForDataset(dataset);
      const rows = dataset.rows.map((row) => ({
        label: row.label,
        ...row.measures,
      }));

      return (
        <section className="min-w-0 text-foreground lg:col-span-2">
          <ChartHeader title={props.title ?? dataset.title} />
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

function VisxSankey({ data }: { data: SignalFlowData }) {
  const width = 560;
  const height = 280;
  const graph: SankeyGraph<SignalFlowNode, SignalFlowLink> = {
    nodes: data.nodes,
    links: data.links,
  };

  if (data.nodes.length === 0 || data.links.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        No flow links available.
      </div>
    );
  }

  return (
    <div className="h-72 overflow-hidden">
      <svg
        role="img"
        aria-label="Telemetry to operating lanes"
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
      >
        <Sankey
          root={graph}
          nodeId={(node) => node.id}
          nodeWidth={10}
          nodePadding={16}
          size={[width, height]}
        >
          {({ graph: layoutGraph }) => (
            <g>
              {layoutGraph.links.map((link, index) => (
                <SankeyLinkPath key={index} link={link} />
              ))}
              {layoutGraph.nodes.map((node) => (
                <SankeyNodeRect key={node.id} node={node} />
              ))}
            </g>
          )}
        </Sankey>
      </svg>
    </div>
  );
}

function SankeyLinkPath({
  link,
}: {
  link: SankeyLink<SignalFlowNode, SignalFlowLink>;
}) {
  const path = sankeyLinkHorizontal<
    SignalFlowNode,
    SignalFlowLink
  >()(link);

  return (
    <path
      d={path ?? undefined}
      fill="none"
      stroke="var(--muted-foreground)"
      strokeOpacity={0.28}
      strokeWidth={Math.max(1, link.width ?? 1)}
    />
  );
}

function SankeyNodeRect({
  node,
}: {
  node: SankeyNode<SignalFlowNode, SignalFlowLink>;
}) {
  const x0 = node.x0 ?? 0;
  const x1 = node.x1 ?? x0;
  const y0 = node.y0 ?? 0;
  const y1 = node.y1 ?? y0;
  const labelX = x0 < 280 ? x1 + 8 : x0 - 8;
  const textAnchor = x0 < 280 ? "start" : "end";

  return (
    <g>
      <rect
        x={x0}
        y={y0}
        width={Math.max(1, x1 - x0)}
        height={Math.max(1, y1 - y0)}
        rx={3}
        fill="var(--foreground)"
        opacity={0.88}
      />
      <text
        x={labelX}
        y={(y0 + y1) / 2}
        dy="0.32em"
        textAnchor={textAnchor}
        className="fill-muted-foreground text-[10px]"
      >
        {node.label}
      </text>
    </g>
  );
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

function measureKeysForDataset(dataset: SignalGeneratedChartDataset) {
  return Array.from(
    new Set(dataset.rows.flatMap((row) => Object.keys(row.measures))),
  );
}
