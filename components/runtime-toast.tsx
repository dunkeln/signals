"use client";

import * as React from "react";
import { useStateValue } from "@json-render/react";
import { toast } from "sonner";

import type { SignalRuntimeError } from "@/lib/signal/page-state";

export function RuntimeToast() {
  const runtimeError = useStateValue<SignalRuntimeError>("/runtimeError");
  const lastToastId = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!runtimeError || runtimeError.id === lastToastId.current) {
      return;
    }

    lastToastId.current = runtimeError.id;
    toast.error(runtimeError.title, {
      description: runtimeError.detail
        ? `${runtimeError.message} ${runtimeError.detail}`
        : runtimeError.message,
    });
  }, [runtimeError]);

  return null;
}
