import { notFound } from "next/navigation";

import { SignalRenderer } from "@/components/json-render/signal-renderer";
import { SignalPageStatePayload } from "@/components/signal-page-state-payload";
import { getFixtureRoute } from "@/lib/fixtures/registry";
import { compileChartSpec } from "@/lib/protocol/v0";
import { buildSignalPageState } from "@/lib/signal/page-state";

export default async function ClientPage({
  params,
}: PageProps<"/[client]">) {
  const { client } = await params;
  const fixtureRoute = getFixtureRoute(client);

  if (!fixtureRoute) {
    notFound();
  }

  if (!fixtureRoute.ingress) {
    notFound();
  }

  const state = await buildSignalPageState({
    ...fixtureRoute,
    ingress: fixtureRoute.ingress,
  });
  const spec = compileChartSpec();

  return (
    <>
      <SignalRenderer spec={spec} state={state} />
      <SignalPageStatePayload state={state} />
    </>
  );
}
