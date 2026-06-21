"use client";

import * as React from "react";
import { useStateValue } from "@json-render/react";
import { toast } from "sonner";

export function RuntimeToast() {
  const runtimeErrorMessage = useStateValue<string | null>("/runtimeErrorMessage");
  const lastToastMessage = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!runtimeErrorMessage || runtimeErrorMessage === lastToastMessage.current) {
      return;
    }

    lastToastMessage.current = runtimeErrorMessage;
    toast.error("Could not generate chart", {
      description: runtimeErrorMessage,
    });
  }, [runtimeErrorMessage]);

  return null;
}
