import { fixtureRoutes } from "@/lib/fixtures/registry";

export const routeEntries = fixtureRoutes.map((fixture) => ({
  href: `/${fixture.slug}`,
  label: fixture.label,
  slug: fixture.slug,
}));
