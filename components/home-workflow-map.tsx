"use client";

import * as React from "react";
import { JSONUIProvider, Renderer, useStateStore } from "@json-render/react";
import type { Spec } from "@json-render/core";
import { ExternalLinkIcon, PauseIcon, PlayIcon, RefreshCwIcon } from "lucide-react";

import { signalRegistry } from "@/components/json-render/signal-registry";
import {
  setSignalSimulationRunning,
  useSignalSimulationRunning,
} from "@/components/signal-simulation-state";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SignalReplayFrame } from "@/lib/signal/page-state";
import type { SignalWorkflowMapData } from "@/lib/signal/workflow-map";

interface HomeWorkflowMapProps {
  spec: Spec;
  workflowMap: SignalWorkflowMapData;
  replayFrames: SignalReplayFrame[];
}

const mergedSimulationSlug = "__merged__";

export function HomeWorkflowMap({
  spec,
  workflowMap,
  replayFrames,
}: HomeWorkflowMapProps) {
  return (
    <JSONUIProvider
      registry={signalRegistry}
      initialState={{ workflowMap }}
    >
      <MergedSimulationControls replayFrames={replayFrames} />
      <Renderer registry={signalRegistry} spec={spec} />
    </JSONUIProvider>
  );
}

function MergedSimulationControls({
  replayFrames,
}: {
  replayFrames: SignalReplayFrame[];
}) {
  const { set } = useStateStore();
  const simulationRunning = useSignalSimulationRunning(mergedSimulationSlug);
  const [frameIndex, setFrameIndex] = React.useState(replayFrames.length - 1);

  function applyFrame(index: number) {
    const frame = replayFrames[index];

    if (!frame) return;

    set("/workflowMap", frame.workflowMap);
    setFrameIndex(index);
  }

  function syncNextFrame() {
    const next = Math.min(frameIndex + 1, replayFrames.length - 1);

    applyFrame(next);
    set("/workflowMapStreaming", next < replayFrames.length - 1);
  }

  function toggleSimulation() {
    if (simulationRunning) {
      applyFrame(replayFrames.length - 1);
      set("/workflowMapStreaming", false);
      setSignalSimulationRunning(mergedSimulationSlug, false);
      return;
    }

    if (frameIndex >= replayFrames.length - 1) {
      applyFrame(0);
    }

    set("/workflowMapStreaming", true);
    setSignalSimulationRunning(mergedSimulationSlug, true);
  }

  React.useEffect(() => {
    if (!simulationRunning) return;

    const interval = window.setInterval(() => {
      setFrameIndex((current) => {
        const next = Math.min(current + 1, replayFrames.length - 1);
        const frame = replayFrames[next];

        if (frame) {
          set("/workflowMap", frame.workflowMap);
        }

        if (next >= replayFrames.length - 1) {
          set("/workflowMapStreaming", false);
          setSignalSimulationRunning(mergedSimulationSlug, false);
        }

        return next;
      });
    }, 2000);

    return () => window.clearInterval(interval);
  }, [replayFrames, set, simulationRunning]);

  return (
    <div className="mb-3 flex justify-end gap-2">
      <IconButton
        label={simulationRunning ? "Pause simulation" : "Simulate logs"}
        onClick={toggleSimulation}
      >
        {simulationRunning ? <PauseIcon /> : <PlayIcon />}
      </IconButton>
      <IconButton
        label="Sync now"
        onClick={syncNextFrame}
        disabled={replayFrames.length === 0 || frameIndex >= replayFrames.length - 1}
      >
        <RefreshCwIcon />
      </IconButton>
      {simulationRunning ? (
        <a
          href="/logs"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 outline-none hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-ring/40 [&_svg]:size-4"
        >
          <ExternalLinkIcon />
          Open logs
        </a>
      ) : null}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
          type="button"
          aria-label={label}
          onClick={onClick}
          disabled={disabled}
          className="inline-flex size-8 items-center justify-center text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-4"
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
