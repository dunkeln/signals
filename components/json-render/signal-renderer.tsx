"use client";

import { JSONUIProvider } from "@json-render/react";
import type { Spec } from "@json-render/core";

import { signalRegistry } from "@/components/json-render/signal-registry";
import { RuntimeToast } from "@/components/runtime-toast";
import { SignalBlockCanvas } from "@/components/signal-block-canvas";
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
      <RuntimeToast />
      <SignalBlockCanvas clientSlug={state.client.slug} workflowSpec={spec} />
    </JSONUIProvider>
  );
}
