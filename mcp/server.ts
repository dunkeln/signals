import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  fixtureRoutes,
  getFixtureRoute,
  hasFixtureIngress,
} from "@/lib/fixtures/registry";
import {
  buildChartProtocolState,
  buildRuntimeContextPack,
  serializeRuntimeInput,
} from "@/lib/protocol/v0";
import { buildSignalCanonicalState } from "@/lib/signal/canonical-state";
import { readReportDocument } from "@/lib/signal/document-store";
import { buildSignalIntelligenceState } from "@/lib/signal/intelligence";
import {
  buildSignalWorkflowMap,
  type SignalWorkflowMapLink,
} from "@/lib/signal/workflow-map";

const packetDistributionDimensionSchema = z.enum([
  "contentLabel",
  "supplier",
  "target",
  "source",
  "ownerRole",
  "status",
  "support",
  "material",
]);
type PacketDistributionDimension = z.infer<typeof packetDistributionDimensionSchema>;
const timeScopeSchema = z.enum(["latest", "all_time"]);
type TimeScope = z.infer<typeof timeScopeSchema>;
type PacketTimeScope = {
  mode: TimeScope;
  latestDays: number;
  from: string | null;
  to: string | null;
};

export function createSignalsMcpServer() {
  const server = new McpServer({
    name: "signals-extractor",
    version: "0.1.0",
  });
  const clientOptions = fixtureRoutes
    .map((fixture) => [fixture.slug, ...(fixture.aliases ?? [])].join(", "))
    .join("; ");
  const clientInput = {
    clientSlug: z
      .string()
      .min(1)
      .describe(
        `Client slug or alias. Available: ${clientOptions}. Call list_clients first when unsure.`,
      ),
  };

  server.registerTool(
    "list_clients",
    {
      title: "List clients",
      description:
        "Return active Signal client slugs, labels, and aliases available through this connector.",
      inputSchema: {},
    },
    async () => jsonToolResult({ clients: activeClients() }),
  );

  server.registerTool(
    "get_protocol_context",
    {
      title: "Get protocol context",
      description:
        "Return Signal protocol/v0 context for a client, scoped to the latest observed packet window by default. Use all_time only when the user asks for all history.",
      inputSchema: {
        ...clientInput,
        request: z.string().min(1).optional(),
        timeScope: timeScopeSchema
          .optional()
          .describe("Defaults to latest observed packet window. Use all_time only when the user asks for all history."),
        latestDays: z
          .number()
          .int()
          .min(1)
          .max(14)
          .optional()
          .describe("Days in latest window. Defaults to 2."),
      },
    },
    async ({ clientSlug, request, timeScope, latestDays }) =>
      jsonToolResult(
        serializeRuntimeInput(
          buildProtocolContext(clientSlug, request, {
            timeScope: timeScope ?? "latest",
            latestDays: latestDays ?? 2,
          }),
        ),
      ),
  );

  server.registerTool(
    "get_packet_distribution",
    {
      title: "Get packet distribution",
      description:
        "Use for packet distribution questions. Returns a focused reducer over the latest observed workflow packets by default; not QA-only report charts.",
      inputSchema: {
        ...clientInput,
        groupBy: packetDistributionDimensionSchema
          .optional()
          .describe("Primary grouping. Defaults to contentLabel."),
        splitBy: packetDistributionDimensionSchema
          .optional()
          .describe("Optional measure split inside each group."),
        measure: z
          .enum(["packet_count", "packet_value"])
          .optional()
          .describe("Defaults to packet_count."),
        timeScope: timeScopeSchema
          .optional()
          .describe("Defaults to latest observed packet window. Use all_time only when the user asks for all history."),
        latestDays: z
          .number()
          .int()
          .min(1)
          .max(14)
          .optional()
          .describe("Days in latest window. Defaults to 2."),
      },
    },
    async ({ clientSlug, groupBy, splitBy, measure, timeScope, latestDays }) =>
      jsonToolResult(
        buildPacketDistribution({
          clientSlug,
          groupBy: groupBy ?? "contentLabel",
          splitBy,
          measure: measure ?? "packet_count",
          timeScope: timeScope ?? "latest",
          latestDays: latestDays ?? 2,
        }),
      ),
  );

  server.registerTool(
    "get_document",
    {
      title: "Get document",
      description:
        "Return the persisted Signal report document for a client, including structured blocks and markdown. Use get_packet_distribution for ad hoc packet distribution questions.",
      inputSchema: clientInput,
    },
    async ({ clientSlug }) => jsonToolResult(await buildDocument(clientSlug)),
  );

  return server;
}

function activeClients() {
  return fixtureRoutes.filter(hasFixtureIngress).map((fixture) => ({
    slug: fixture.slug,
    label: fixture.label,
    aliases: fixture.aliases ?? [],
  }));
}

function buildProtocolContext(
  clientSlug: string,
  request = "Fetch protocol context",
  scopeInput: {
    timeScope: TimeScope;
    latestDays: number;
  },
) {
  const fixtureRoute = requireFixtureRoute(clientSlug);
  const signal = buildSignalIntelligenceState(fixtureRoute.ingress);
  const canonical = buildSignalCanonicalState(fixtureRoute.ingress);
  const workflowMap = buildSignalWorkflowMap(canonical.packetSets, {
    clientLabel: fixtureRoute.label,
  });
  const scope = packetTimeScope(workflowMap.links, scopeInput);
  const scopedWorkflowMap = {
    nodes: workflowMap.nodes,
    links: scopedLinks(workflowMap.links, scope),
  };

  return buildRuntimeContextPack({
    request: {
      message: request,
    },
    client: {
      slug: fixtureRoute.slug,
      label: fixtureRoute.label,
    },
    chartProtocol: buildChartProtocolState(),
    workflowMap: scopedWorkflowMap,
    evidenceItems: signal.evidenceRows.map((row) => ({
      kind: row.kind,
      lane: row.lane,
      summary: row.summary,
    })),
    timeScope: scope,
  });
}

function buildPacketDistribution({
  clientSlug,
  groupBy,
  splitBy,
  measure,
  timeScope,
  latestDays,
}: {
  clientSlug: string;
  groupBy: PacketDistributionDimension;
  splitBy?: PacketDistributionDimension;
  measure: "packet_count" | "packet_value";
  timeScope: TimeScope;
  latestDays: number;
}) {
  const fixtureRoute = requireFixtureRoute(clientSlug);
  const canonical = buildSignalCanonicalState(fixtureRoute.ingress);
  const workflowMap = buildSignalWorkflowMap(canonical.packetSets, {
    clientLabel: fixtureRoute.label,
  });
  const nodeLabels = new Map(
    workflowMap.nodes.map((node) => [node.id, node.label]),
  );
  const scope = packetTimeScope(workflowMap.links, {
    timeScope,
    latestDays,
  });
  const links = scopedLinks(workflowMap.links, scope);
  const rows = new Map<
    string,
    {
      label: string;
      dimensions: Record<string, string>;
      measures: Record<string, number>;
      evidenceSourceIds: string[];
      support: "strong" | "partial";
    }
  >();

  for (const link of links) {
    const label = dimensionValue(groupBy, link, nodeLabels);
    const measureKey = splitBy
      ? dimensionValue(splitBy, link, nodeLabels)
      : measure === "packet_count"
        ? "packet count"
        : "packet value";
    const row =
      rows.get(label) ??
      {
        label,
        dimensions: { [groupBy]: label },
        measures: {},
        evidenceSourceIds: [],
        support: "strong",
      };

    row.measures[measureKey] =
      (row.measures[measureKey] ?? 0) +
      (measure === "packet_count" ? 1 : link.value);
    row.evidenceSourceIds.push(...link.evidenceSourceIds);

    if (link.support === "partial") {
      row.support = "partial";
    }

    rows.set(label, row);
  }

  return {
    client: {
      slug: fixtureRoute.slug,
      label: fixtureRoute.label,
    },
    source: "workflow_map.links",
    reducer: {
      groupBy,
      splitBy: splitBy ?? null,
      measure,
      timeScope: scope,
      scope: "scoped workflow packets; no QA-only filter unless target or ownerRole is set to QA by the caller",
    },
    totals: {
      links: links.length,
      allTimeLinks: workflowMap.links.length,
      packetCount: links.length,
      packetValue: links.reduce((total, link) => total + link.value, 0),
    },
    rows: Array.from(rows.values())
      .map((row) => ({
        ...row,
        evidenceSourceIds: unique(row.evidenceSourceIds),
      }))
      .sort((left, right) => rowTotal(right) - rowTotal(left)),
  };
}

async function buildDocument(clientSlug: string) {
  const fixtureRoute = requireFixtureRoute(clientSlug);
  const document = await readReportDocument(fixtureRoute.slug, fixtureRoute.label);

  return {
    client: {
      slug: fixtureRoute.slug,
      label: fixtureRoute.label,
    },
    document,
  };
}

function requireFixtureRoute(clientSlug: string) {
  const fixtureRoute = getFixtureRoute(clientSlug);

  if (!hasFixtureIngress(fixtureRoute)) {
    throw new Error(`No signal fixture is available for ${clientSlug}.`);
  }

  return fixtureRoute;
}

function packetTimeScope(
  links: SignalWorkflowMapLink[],
  {
    timeScope,
    latestDays,
  }: {
    timeScope: TimeScope;
    latestDays: number;
  },
): PacketTimeScope {
  if (timeScope === "all_time") {
    return {
      mode: "all_time",
      latestDays,
      from: null,
      to: null,
    };
  }

  const latest = Math.max(...links.map((link) => Date.parse(link.observedAt)));

  if (!Number.isFinite(latest)) {
    return {
      mode: "latest",
      latestDays,
      from: null,
      to: null,
    };
  }

  const from = latest - Math.max(0, latestDays - 1) * 24 * 60 * 60 * 1000;

  return {
    mode: "latest",
    latestDays,
    from: new Date(from).toISOString(),
    to: new Date(latest).toISOString(),
  };
}

function scopedLinks(links: SignalWorkflowMapLink[], scope: PacketTimeScope) {
  if (scope.mode === "all_time" || !scope.from || !scope.to) {
    return links;
  }

  const from = Date.parse(scope.from);
  const to = Date.parse(scope.to);

  return links.filter((link) => {
    const observedAt = Date.parse(link.observedAt);

    return observedAt >= from && observedAt <= to;
  });
}

function dimensionValue(
  dimension: PacketDistributionDimension,
  link: SignalWorkflowMapLink,
  nodeLabels: Map<string, string>,
) {
  switch (dimension) {
    case "contentLabel":
      return link.contentLabel;
    case "supplier":
      return link.supplier ?? "unspecified";
    case "target":
      return nodeLabels.get(link.target) ?? link.target;
    case "source":
      return nodeLabels.get(link.source) ?? link.source;
    case "ownerRole":
      return link.ownerRole ?? "unassigned";
    case "status":
      return link.status ?? "unspecified";
    case "support":
      return link.support;
    case "material":
      return link.material ?? "unspecified";
  }
}

function rowTotal(row: { measures: Record<string, number> }) {
  return Object.values(row.measures).reduce((total, value) => total + value, 0);
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function jsonToolResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}
