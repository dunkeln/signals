import { z } from "zod";

import { getFixtureRoute } from "@/lib/fixtures/registry";
import { writeReportDocument } from "@/lib/signal/document-store";
import { reportDocumentSchema } from "@/lib/signal/report-document";

const saveDocumentSchema = z.object({
  clientSlug: z.string().min(1),
  document: reportDocumentSchema,
});

export async function PUT(request: Request) {
  const parsed = saveDocumentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return Response.json({ error: "Document payload is invalid." }, { status: 400 });
  }

  const fixtureRoute = getFixtureRoute(parsed.data.clientSlug);

  if (!fixtureRoute) {
    return Response.json({ error: "Document client was not found." }, { status: 404 });
  }

  return Response.json(
    await writeReportDocument(parsed.data.clientSlug, parsed.data.document),
  );
}
