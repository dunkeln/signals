import { acmeBaseSandbox } from "@/lib/fixtures/acme-base-sandbox";
import { goldCoastBakerySandbox } from "@/lib/fixtures/gold-coast-bakery-sandbox";
import type { RawObservabilityFixture } from "@/lib/fixtures/raw-observability-types";

export interface FixtureRoute {
  slug: string;
  label: string;
  aliases?: readonly string[];
  ingress?: RawObservabilityFixture;
}

export type SignalFixtureRoute = FixtureRoute & {
  ingress: RawObservabilityFixture;
};

export const fixtureRoutes = [
  {
    slug: "acme-base-sandbox",
    label: acmeBaseSandbox.scenario.name,
    aliases: ["acme"],
    ingress: acmeBaseSandbox,
  },
  {
    slug: "gold-coast-bakery-sandbox",
    label: goldCoastBakerySandbox.scenario.name,
    aliases: ["gold-coast", "gold-coast-bakery"],
    ingress: goldCoastBakerySandbox,
  },
] satisfies FixtureRoute[];

export function getFixtureRoute(slug: string) {
  const token = slug.trim().toLowerCase();

  return fixtureRoutes.find(
    (fixture) => fixture.slug === token || fixture.aliases?.includes(token),
  );
}

export function hasFixtureIngress(
  fixtureRoute: FixtureRoute | undefined,
): fixtureRoute is SignalFixtureRoute {
  return Boolean(fixtureRoute?.ingress);
}
