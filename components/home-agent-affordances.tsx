"use client";

import * as React from "react";
import { CheckIcon, PlugIcon, TerminalIcon } from "lucide-react";

const actions = [
  {
    id: "skill",
    icon: TerminalIcon,
    title: "Skills make product logs legible.",
    body: "Give coding agents a conservative logging contract so new workflow events can flow into Signal without blocking the product path.",
    button: "Copy skill install",
    value: "npx skills add dunkeln/signals --skill signals-logging",
  },
  {
    id: "mcp",
    icon: PlugIcon,
    title: "MCP gives agents the report substrate.",
    body: "Let coding agents fetch report context, protocol context, and chartable evidence instead of working from screenshots or prose.",
    button: "Copy MCP connector",
    value: "https://signals-ws.vercel.app/api/mcp",
  },
  {
    id: "claude",
    icon: PlugIcon,
    title: "Claude starts from live context.",
    body: "Connect Claude or another agent to the same substrate so the conversation starts from the current procurement flow.",
    button: "Copy local connector",
    value: "http://localhost:3000/api/mcp",
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
      className="mb-8 grid gap-5 text-sm sm:grid-cols-3"
    >
      {actions.map((action) => {
        const Icon = action.icon;
        const didCopy = copied === action.id;

        return (
          <div key={action.id} className="min-w-0">
            <div className="mb-1 flex items-center gap-2 font-semibold">
              <Icon className="size-4" />
              {action.title}
            </div>
            <p className="mb-3 text-muted-foreground">{action.body}</p>
            <button
              type="button"
              onClick={() => void copy(action.id, action.value)}
              className="inline-flex h-8 items-center gap-1.5 bg-foreground px-2.5 text-xs font-medium text-background outline-none hover:bg-foreground/85 focus-visible:ring-2 focus-visible:ring-ring/40 [&_svg]:size-3.5"
            >
              {didCopy ? <CheckIcon /> : null}
              {didCopy ? "Copied" : action.button}
            </button>
          </div>
        );
      })}
    </section>
  );
}
