export interface SignalAgentRequest {
  clientSlug: string;
  message: string;
}

export interface SignalAgentResponse {
  message: string;
  evidenceSourceIds: string[];
  suggestedPrompts: string[];
}

export async function submitSignalPrompt(
  request: SignalAgentRequest,
): Promise<SignalAgentResponse> {
  const response = await fetch("/api/signal-agent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const payload = (await response.json()) as
    | SignalAgentResponse
    | { error?: string };

  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
  }

  return payload as SignalAgentResponse;
}

function getErrorMessage(payload: SignalAgentResponse | { error?: string }) {
  return "error" in payload && payload.error
    ? payload.error
    : "Signal agent request failed.";
}
