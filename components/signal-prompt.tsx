"use client";

import * as React from "react";
import { ArrowUpIcon, SquareIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useStateStore } from "@json-render/react";

import { Button } from "@/components/ui/button";
import { submitSignalPrompt } from "@/lib/signal/agent-client";

type PromptStatus = "idle" | "sending" | "answered" | "error";

export function SignalPrompt() {
  const pathname = usePathname();
  const { set } = useStateStore();
  const [message, setMessage] = React.useState("");
  const [status, setStatus] = React.useState<PromptStatus>("idle");
  const clientSlug = getClientSlug(pathname);
  const canSend = message.trim().length > 0 && status !== "sending";
  const isSending = status === "sending";

  async function sendPrompt() {
    const prompt = message.trim();

    if (!prompt || !clientSlug || status === "sending") {
      return;
    }

    setStatus("sending");

    try {
      const generatedChartData = await submitSignalPrompt({
        clientSlug,
        message: prompt,
      });

      set("/generatedChartData", generatedChartData);
      setMessage("");
      setStatus("answered");
    } catch {
      setStatus("error");
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
          }
        }}
        onKeyDown={handleKeyDown}
        className="absolute inset-x-2 top-2 bottom-10 resize-none bg-transparent text-sm text-primary-foreground outline-none placeholder:text-primary-foreground/55"
      />
      <div className="absolute inset-x-2 bottom-2 flex h-7 items-center justify-end">
        <Button
          type="submit"
          size="icon-sm"
          aria-label={isSending ? "Sending message" : "Send message"}
          disabled={!canSend}
          className="size-7 rounded-full bg-primary-foreground text-primary shadow-sm hover:bg-primary-foreground/90"
        >
          {isSending ? (
            <SquareIcon data-icon="inline-start" fill="currentColor" />
          ) : (
            <ArrowUpIcon data-icon="inline-start" />
          )}
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
