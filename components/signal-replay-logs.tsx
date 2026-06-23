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
  const running = useSignalSimulationRunning(clientSlug);
  const [visibleCount, setVisibleCount] = React.useState(0);
  const displayedCount = running ? visibleCount : lines.length;

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
    <div className="w-full pb-12 font-mono text-xs leading-5 text-foreground">
      <pre className="whitespace-pre-wrap">
        {lines
          .slice(0, displayedCount)
          .map((line) => line.line)
          .join("\n")}
      </pre>
    </div>
  );
}
