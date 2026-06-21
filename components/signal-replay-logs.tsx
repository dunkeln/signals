"use client";

import * as React from "react";

import { useSignalSimulationRunning } from "@/components/signal-simulation-state";
import type { ReplayLogLine } from "@/lib/signal/replay-observability-fixture";

export function SignalReplayLogs({
  clientSlug,
  lines,
}: {
  clientSlug: string;
  lines: ReplayLogLine[];
}) {
  const [visibleCount, setVisibleCount] = React.useState(0);
  const running = useSignalSimulationRunning(clientSlug);

  React.useEffect(() => {
    if (!running) {
      return;
    }

    const interval = window.setInterval(() => {
      setVisibleCount((count) => {
        const next = Math.min(count + 8, lines.length);

        if (next === lines.length) {
          window.clearInterval(interval);
        }

        return next;
      });
    }, 250);

    return () => window.clearInterval(interval);
  }, [lines, running]);

  return (
    <main className="fixed inset-0 z-50 overflow-auto bg-background p-4 font-mono text-xs leading-5 text-foreground">
      <pre className="whitespace-pre-wrap">
        {lines
          .slice(0, visibleCount)
          .map((line) => line.line)
          .join("\n")}
      </pre>
    </main>
  );
}
