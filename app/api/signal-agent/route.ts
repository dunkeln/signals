import { z } from "zod";

import { getFixtureRoute } from "@/lib/fixtures/registry";
import { runSignalAgent } from "@/lib/signal/agent-runtime";

const signalAgentRequestSchema = z.object({
  clientSlug: z.string().min(1),
  message: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request) {
  const parsed = signalAgentRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return Response.json(
      { error: "Signal prompt request is invalid." },
      { status: 400 },
    );
  }

  const fixtureRoute = getFixtureRoute(parsed.data.clientSlug);

  if (!fixtureRoute?.ingress) {
    return Response.json(
      { error: "No signal fixture is available for this client." },
      { status: 404 },
    );
  }

  try {
    return Response.json(
      await runSignalAgent({
        fixtureRoute: {
          ...fixtureRoute,
          ingress: fixtureRoute.ingress,
        },
        message: parsed.data.message,
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Signal agent request failed.";

    return Response.json(
      { error: message },
      { status: message.includes("OPENAI_API_KEY") ? 503 : 500 },
    );
  }
}
