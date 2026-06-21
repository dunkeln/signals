import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { getFixtureRoute, hasFixtureIngress } from "@/lib/fixtures/registry";
import {
  buildChartProtocolState,
  buildRuntimeContextPack,
  serializeRuntimeInput,
} from "@/lib/protocol/v0";
import { buildSignalCanonicalState } from "@/lib/signal/canonical-state";
import { readReportDocument } from "@/lib/signal/document-store";
import { buildSignalIntelligenceState } from "@/lib/signal/intelligence";
import { buildSignalWorkflowMap } from "@/lib/signal/workflow-map";

export function createSignalsMcpServer() {
  const server = new McpServer({
    name: "signals-extractor",
    version: "0.1.0",
  });
  const clientInput = {
    clientSlug: z.string().min(1),
  };

  server.registerTool(
    "get_protocol_context",
    {
      title: "Get protocol context",
      description:
        "Return Signal protocol/v0 context for a client: workflow map links, field domains, candidate reductions, and context reduction metadata.",
      inputSchema: {
        ...clientInput,
        request: z.string().min(1).optional(),
      },
    },
    async ({ clientSlug, request }) =>
      jsonToolResult(
        serializeRuntimeInput(buildProtocolContext(clientSlug, request)),
      ),
  );

  server.registerTool(
    "get_document",
    {
      title: "Get document",
      description:
        "Return the persisted Signal report document for a client, including structured blocks and markdown.",
      inputSchema: clientInput,
    },
    async ({ clientSlug }) => jsonToolResult(await buildDocument(clientSlug)),
  );

  return server;
}

function buildProtocolContext(clientSlug: string, request = "Fetch protocol context") {
  const fixtureRoute = requireFixtureRoute(clientSlug);
  const signal = buildSignalIntelligenceState(fixtureRoute.ingress);
  const canonical = buildSignalCanonicalState(fixtureRoute.ingress);
  const workflowMap = buildSignalWorkflowMap(canonical.packetSets, {
    clientLabel: fixtureRoute.label,
  });

  return buildRuntimeContextPack({
    request: {
      message: request,
    },
    client: {
      slug: fixtureRoute.slug,
      label: fixtureRoute.label,
    },
    chartProtocol: buildChartProtocolState(),
    workflowMap,
    evidenceItems: signal.evidenceRows.map((row) => ({
      kind: row.kind,
      lane: row.lane,
      summary: row.summary,
    })),
  });
}

async function buildDocument(clientSlug: string) {
  const fixtureRoute = requireFixtureRoute(clientSlug);
  const document = await readReportDocument(clientSlug, fixtureRoute.label);

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
