import { SignalReplayLogs } from "@/components/signal-replay-logs";
import { fixtureRoutes, hasFixtureIngress } from "@/lib/fixtures/registry";
import { replayLogLines } from "@/lib/signal/replay-observability-fixture";

export default function LogsPage() {
  const lines = fixtureRoutes
    .filter(hasFixtureIngress)
    .flatMap((fixture) => replayLogLines(fixture.ingress))
    .sort((left, right) => left.line.localeCompare(right.line));

  return <SignalReplayLogs clientSlug="__merged__" lines={lines} />;
}
