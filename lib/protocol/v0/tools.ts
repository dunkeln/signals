import { tool } from "@openai/agents";
import { z } from "zod";

import {
  protocolVersion,
  type ChartProtocolState,
} from "@/lib/protocol/v0/chart-intent";
import type { ChartInstruction } from "@/lib/protocol/v0/instructions";

type ReductionField = ChartInstruction["reduction"]["groupBy"][number];

const runtimeWorkflowNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  surfaceKind: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
});

const runtimeWorkflowLinkSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  sourceLabel: z.string().min(1),
  targetLabel: z.string().min(1),
  contentLabel: z.string().min(1),
  contentKinds: z.array(z.string().min(1)).min(1),
  value: z.number().finite(),
  status: z.string().min(1).optional(),
  ownerRole: z.string().min(1).optional(),
  support: z.enum(["strong", "partial"]),
});

const runtimeEvidenceItemSchema = z.object({
  kind: z.string().min(1),
  lane: z.string().min(1),
  summary: z.string().min(1),
});

const fieldDomainSchema = z.object({
  field: z.string().min(1),
  values: z.array(
    z.object({
      value: z.string().min(1),
      count: z.number().int().nonnegative(),
    }),
  ),
  omittedValueCount: z.number().int().nonnegative(),
});

export const runtimeInputSchema = z.object({
  protocolVersion: z.literal(protocolVersion),
  request: z.object({
    message: z.string().min(1),
  }),
  context: z.object({
    client: z.object({
      slug: z.string().min(1),
      label: z.string().min(1),
    }),
    chartProtocol: z.custom<ChartProtocolState>(),
    workflowMap: z.object({
      nodes: z.array(runtimeWorkflowNodeSchema),
      links: z.array(runtimeWorkflowLinkSchema),
    }),
    fieldDomains: z.array(fieldDomainSchema),
    availableReductions: z.object({
      source: z.literal("workflow_map.links"),
      groupBy: z.array(z.string().min(1)),
      splitBy: z.array(z.string().min(1)),
      measures: z.array(z.string().min(1)),
    }),
    evidenceCatalog: z.array(runtimeEvidenceItemSchema).max(20),
    contextReduction: z.object({
      includedLinks: z.number().int().nonnegative(),
      totalLinks: z.number().int().nonnegative(),
      includedEvidenceItems: z.number().int().nonnegative(),
      totalEvidenceItems: z.number().int().nonnegative(),
      omissions: z.array(z.string().min(1)),
    }),
  }),
});

export type RuntimeInput = z.infer<typeof runtimeInputSchema>;

export interface ProtocolWorkflowNode {
  id: string;
  label: string;
  surfaceKind?: string;
  role?: string;
}

export interface ProtocolWorkflowLink {
  source: string;
  target: string;
  value: number;
  contentLabel: string;
  contentKinds: string[];
  status?: string;
  ownerRole?: string;
  support: "strong" | "partial";
}

export interface ProtocolEvidenceItem {
  kind: string;
  lane: string;
  summary: string;
}

export interface RuntimeContextPackInput {
  request: {
    message: string;
  };
  client: {
    slug: string;
    label: string;
  };
  chartProtocol: ChartProtocolState;
  workflowMap: {
    nodes: ProtocolWorkflowNode[];
    links: ProtocolWorkflowLink[];
  };
  evidenceItems: ProtocolEvidenceItem[];
  limits?: {
    maxLinks?: number;
    maxEvidenceItems?: number;
    maxDomainValues?: number;
  };
}

export type ChartContextToolInput = RuntimeContextPackInput;

const reductionFields: ReductionField[] = [
  "source.label",
  "target.label",
  "ownerRole",
  "status",
  "contentKind",
  "contentLabel",
  "support",
];

const defaultLimits = {
  maxLinks: 24,
  maxEvidenceItems: 20,
  maxDomainValues: 12,
};

export function buildRuntimeContextPack({
  request,
  client,
  chartProtocol,
  workflowMap,
  evidenceItems,
  limits,
}: RuntimeContextPackInput): RuntimeInput {
  const activeLimits = { ...defaultLimits, ...limits };
  const nodeLabels = new Map(
    workflowMap.nodes.map((node) => [node.id, node.label]),
  );
  const links = workflowMap.links.map((link) =>
    compactRuntimeLink(link, nodeLabels),
  );
  const evidenceCatalog = evidenceItems.slice(0, activeLimits.maxEvidenceItems);
  const omissions: string[] = [];

  if (links.length > activeLimits.maxLinks) {
    omissions.push(
      `${links.length - activeLimits.maxLinks} workflow links omitted from sample; field domains still summarize all links.`,
    );
  }

  if (evidenceItems.length > activeLimits.maxEvidenceItems) {
    omissions.push(
      `${evidenceItems.length - activeLimits.maxEvidenceItems} evidence summaries omitted from context pack.`,
    );
  }

  return runtimeInputSchema.parse({
    protocolVersion,
    request,
    context: {
      client,
      chartProtocol,
      workflowMap: {
        nodes: workflowMap.nodes,
        links: links.slice(0, activeLimits.maxLinks),
      },
      fieldDomains: reductionFields.map((field) =>
        summarizeFieldDomain(field, links, activeLimits.maxDomainValues),
      ),
      availableReductions: {
        source: "workflow_map.links",
        groupBy: reductionFields,
        splitBy: reductionFields,
        measures: ["packet_value", "packet_count"],
      },
      evidenceCatalog,
      contextReduction: {
        includedLinks: Math.min(links.length, activeLimits.maxLinks),
        totalLinks: links.length,
        includedEvidenceItems: evidenceCatalog.length,
        totalEvidenceItems: evidenceItems.length,
        omissions,
      },
    },
  });
}

export function serializeRuntimeInput(input: RuntimeInput): string {
  return JSON.stringify(runtimeInputSchema.parse(input), null, 2);
}

export function createChartContextTool(input: ChartContextToolInput) {
  return tool({
    name: "get_chart_context",
    description:
      "Return the bounded protocol/v0 chart context: renderer capabilities, workflow links, field domains, available reductions, evidence summaries, and context reduction metadata.",
    parameters: z.object({}),
    execute: () => serializeRuntimeInput(buildRuntimeContextPack(input)),
  });
}

function compactRuntimeLink(
  link: ProtocolWorkflowLink,
  nodeLabels: Map<string, string>,
) {
  return {
    source: link.source,
    target: link.target,
    sourceLabel: nodeLabels.get(link.source) ?? link.source,
    targetLabel: nodeLabels.get(link.target) ?? link.target,
    contentLabel: link.contentLabel,
    contentKinds: link.contentKinds,
    value: link.value,
    status: link.status,
    ownerRole: link.ownerRole,
    support: link.support,
  };
}

function summarizeFieldDomain(
  field: ReductionField,
  links: ReturnType<typeof compactRuntimeLink>[],
  maxValues: number,
) {
  const counts = new Map<string, number>();

  for (const link of links) {
    for (const value of fieldValues(field, link)) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  const values = Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([value, count]) => ({ value, count }));

  return {
    field,
    values: values.slice(0, maxValues),
    omittedValueCount: Math.max(0, values.length - maxValues),
  };
}

function fieldValues(
  field: ReductionField,
  link: ReturnType<typeof compactRuntimeLink>,
) {
  switch (field) {
    case "source.label":
      return [link.sourceLabel];
    case "target.label":
      return [link.targetLabel];
    case "ownerRole":
      return [link.ownerRole ?? "unassigned"];
    case "status":
      return [link.status ?? "unspecified"];
    case "contentKind":
      return link.contentKinds.length > 0 ? link.contentKinds : ["unspecified"];
    case "contentLabel":
      return [link.contentLabel];
    case "support":
      return [link.support];
  }
}
