"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";
import Image from "next/image";

import { BreadcrumbEllipsis } from "@/components/ui/breadcrumb";

const actions = [
  {
    id: "mcp",
    button: "MCP",
    value: "npx add-mcp@latest https://signals-ws.vercel.app/api/mcp --name Signals",
  },
  {
    id: "claude",
    button: "here",
    href: "https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=Signals&connectorUrl=https%3A%2F%2Fsignals-ws.vercel.app%2Fapi%2Fmcp",
    copyValue: "https://signals-ws.vercel.app/api/mcp",
  },
  {
    id: "skill",
    button: "Skills",
    value: "npx skills add dunkeln/signals --skill signals-logging",
  },
];

export function HomeAgentAffordances() {
  const [copied, setCopied] = React.useState<string | null>(null);

  async function copy(id: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    window.setTimeout(() => setCopied(null), 1400);
  }

  return (
    <section
      aria-label="Agent connection affordances"
      className="mb-10 max-w-4xl space-y-7"
    >
      <section className="max-w-2xl">
        <p className="font-serif text-lg leading-7 text-muted-foreground">
          When Procurement, QA, and R&amp;D each work suppliers from their own
          inbox, the same supplier workflow gets split across teams. Signals
          brings that workflow back into one graph.
        </p>
      </section>

      <section className="max-w-3xl">
        <p className="font-serif text-lg leading-7 text-muted-foreground">
          Every supplier email, document, extraction, review, and decision
          becomes part of a connected operational trail. The graph shows how
          supplier work is moving, which teams are involved, what evidence
          exists, and where the next useful action ends up. Signals exposes that
          graph through the {renderAction("mcp")} so coding agents, your chats
          with Claude or ChatGPT, and internal tools can ask the same operational
          questions the team asks.
        </p>
      </section>

      <section className="max-w-3xl">
        <p className="font-serif text-lg leading-7 text-muted-foreground">
          For builders, that means clearer activation debugging. For operators,
          it is visibility into supplier work without reading every thread. For
          BDRs and GTM teams, it means real workflow evidence they can
          understand, chart, and use.
        </p>
        <p className="mt-3 font-serif text-lg leading-7 text-muted-foreground">
          The value here is turning deployment activity into an interpretable
          workflow graph that helps teams see how procurement intelligence
          becomes action. Let the agent expose logs for the workflow with{" "}
          {renderAction("skill")}.
        </p>
        <p className="mt-3 font-serif text-lg leading-7 text-muted-foreground">
          <Image
            alt=""
            aria-hidden="true"
            className="mr-1 inline size-4 translate-y-[-2px]"
            height={16}
            src="/claude-ai-symbol.svg"
            width={16}
          />
          Use the Claude connector to bring the graph into chat{" "}
          {renderAction("claude")}
        </p>
        <p className="mt-1 font-serif text-lg leading-7 text-muted-foreground">
          Navigate across client workflows{" "}
          <BreadcrumbEllipsis className="mx-1 inline-flex translate-y-1 rounded-md border border-border bg-background" />,
          build observed notes for the team with{" "}
          <strong className="font-semibold text-foreground">@agent</strong>{" "}
          generated graphs for builder workflows in the loop.
        </p>
      </section>
    </section>
  );

  function renderAction(id: string) {
    const action = actions.find((candidate) => candidate.id === id);

    if (!action) {
      return null;
    }

    const didCopy = copied === action.id;

    if ("href" in action) {
      return (
        <a
          key={action.id}
          href={action.href}
          onClick={(event) => {
            if (typeof action.copyValue === "string") {
              event.preventDefault();
              void copy(action.id, action.copyValue).finally(() => {
                window.location.href = action.href;
              });
            }
          }}
          className="mx-1 inline-flex h-7 translate-y-[-2px] items-center gap-1.5 bg-foreground px-2 font-sans text-xs font-medium text-background outline-none hover:bg-foreground/85 focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {didCopy ? "Copied" : action.button}
        </a>
      );
    }

    return (
      <button
        key={action.id}
        type="button"
        onClick={() => void copy(action.id, action.value)}
        className="mx-1 inline-flex h-7 translate-y-[-2px] items-center gap-1.5 bg-foreground px-2 font-sans text-xs font-medium text-background outline-none hover:bg-foreground/85 focus-visible:ring-2 focus-visible:ring-ring/40 [&_svg]:size-3.5"
      >
        {didCopy ? <CheckIcon /> : null}
        {didCopy ? "Copied" : action.button}
      </button>
    );
  }
}
