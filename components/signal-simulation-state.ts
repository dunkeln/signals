"use client";

import * as React from "react";

const simulationChangeEvent = "signal-simulation-change";

export function useSignalSimulationRunning(clientSlug: string) {
  return React.useSyncExternalStore(
    (onChange) => {
      window.addEventListener("storage", onChange);
      window.addEventListener(simulationChangeEvent, onChange);

      return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener(simulationChangeEvent, onChange);
      };
    },
    () => window.localStorage.getItem(simulationKey(clientSlug)) === "running",
    () => false,
  );
}

export function setSignalSimulationRunning(clientSlug: string, running: boolean) {
  window.localStorage.setItem(simulationKey(clientSlug), running ? "running" : "paused");
  window.dispatchEvent(new Event(simulationChangeEvent));
}

function simulationKey(clientSlug: string) {
  return `signal:simulation:${clientSlug}`;
}
