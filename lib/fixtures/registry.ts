import { acmeBaseSandbox } from "@/lib/fixtures/acme-base-sandbox";
import { goldCoastBakerySandbox } from "@/lib/fixtures/gold-coast-bakery-sandbox";
import type { RawObservabilityFixture } from "@/lib/fixtures/raw-observability-types";

export interface FixtureRoute {
  slug: string;
  label: string;
  ingress?: RawObservabilityFixture;
}

export const fixtureRoutes = [
  {
    slug: "acme-base-sandbox",
    label: acmeBaseSandbox.scenario.name,
    ingress: acmeBaseSandbox,
  },
  {
    slug: "gold-coast-bakery-sandbox",
    label: goldCoastBakerySandbox.scenario.name,
    ingress: goldCoastBakerySandbox,
  },
] satisfies FixtureRoute[];

export function getFixtureRoute(slug: string) {
  return fixtureRoutes.find((fixture) => fixture.slug === slug);
}
