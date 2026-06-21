import { notFound } from "next/navigation";

import { SignalReplayLogs } from "@/components/signal-replay-logs";
import { getFixtureRoute, hasFixtureIngress } from "@/lib/fixtures/registry";
import { replayLogLines } from "@/lib/signal/replay-observability-fixture";

export default async function ClientLogsPage({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client } = await params;
  const fixtureRoute = getFixtureRoute(client);

  if (!hasFixtureIngress(fixtureRoute)) {
    notFound();
  }

  return (
    <SignalReplayLogs
      clientSlug={client}
      lines={replayLogLines(fixtureRoute.ingress)}
    />
  );
}
