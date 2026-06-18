"use client";

import * as React from "react";
import { ArrowUpIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { submitSignalPrompt } from "@/lib/signal/agent-client";

type PromptStatus = "idle" | "sending" | "answered" | "error";

export function SignalPrompt() {
  const pathname = usePathname();
  const [message, setMessage] = React.useState("");
  const [status, setStatus] = React.useState<PromptStatus>("idle");
  const [statusText, setStatusText] = React.useState("");
  const clientSlug = getClientSlug(pathname);
  const canSend = message.trim().length > 0 && status !== "sending";

  async function sendPrompt() {
    const prompt = message.trim();

    if (!prompt || !clientSlug || status === "sending") {
      return;
    }

    setStatus("sending");
    setStatusText("Sending");

    try {
      const response = await submitSignalPrompt({
        clientSlug,
        message: prompt,
      });

      setMessage("");
      setStatus("answered");
      setStatusText(response.message);
    } catch (error) {
      setStatus("error");
      setStatusText(
        error instanceof Error ? error.message : "Signal agent failed",
      );
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendPrompt();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendPrompt();
    }
  }

  return (
    <form
      aria-label="Signal prompt"
      onSubmit={handleSubmit}
      className="debug-dock fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 z-50 h-24 w-[min(42rem,calc(100vw-2.5rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-primary/10 bg-primary text-primary-foreground shadow-lg"
    >
      <textarea
        aria-label="Message"
        placeholder="Type a message..."
        value={message}
        onChange={(event) => {
          setMessage(event.target.value);
          if (status !== "sending") {
            setStatus("idle");
            setStatusText("");
          }
        }}
        onKeyDown={handleKeyDown}
        className="absolute inset-x-2 top-2 bottom-10 resize-none bg-transparent text-sm text-primary-foreground outline-none placeholder:text-primary-foreground/55"
      />
      <div className="absolute inset-x-2 bottom-2 flex h-7 items-center justify-between gap-3">
        <p
          aria-live="polite"
          className="min-w-0 truncate px-1 text-xs text-primary-foreground/55"
        >
          {statusText}
        </p>
        <Button
          type="submit"
          size="icon-sm"
          aria-label="Send message"
          disabled={!canSend}
          className="size-7 rounded-full bg-primary-foreground text-primary shadow-sm hover:bg-primary-foreground/90"
        >
          <ArrowUpIcon data-icon="inline-start" />
        </Button>
      </div>
    </form>
  );
}

function getClientSlug(pathname: string) {
  if (pathname === "/") {
    return null;
  }

  return decodeURIComponent(pathname.split("/")[1] ?? "");
}
