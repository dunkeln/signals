"use client";

import { JSONUIProvider, Renderer } from "@json-render/react";
import type { Spec } from "@json-render/core";

import { signalRegistry } from "@/components/json-render/signal-registry";
import { SignalPrompt } from "@/components/signal-prompt";
import type { SignalPageState } from "@/lib/signal/page-state";

interface SignalRendererProps {
  spec: Spec;
  state: SignalPageState;
}

export function SignalRenderer({ spec, state }: SignalRendererProps) {
  return (
    <JSONUIProvider
      registry={signalRegistry}
      initialState={state as unknown as Record<string, unknown>}
    >
      <SignalPrompt />
      <Renderer spec={spec} registry={signalRegistry} />
    </JSONUIProvider>
  );
}
