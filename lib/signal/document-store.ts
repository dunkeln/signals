import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  defaultReportBlocks,
  fileToken,
  reportDocumentSchema,
  reportMarkdown,
  type ReportDocument,
} from "@/lib/signal/report-document";

const documentRoot = join(process.cwd(), ".signal", "documents");

export async function readReportDocument(
  clientSlug: string,
  fallbackTitle: string,
) {
  try {
    const raw = await readFile(documentPath(clientSlug), "utf8");
    const document = reportDocumentSchema.parse(JSON.parse(raw));

    return withMarkdown(document);
  } catch (error) {
    if (isMissingFile(error)) {
      return withMarkdown({
        title: fallbackTitle,
        blocks: defaultReportBlocks,
      });
    }

    throw error;
  }
}

export async function writeReportDocument(
  clientSlug: string,
  document: ReportDocument,
) {
  const parsed = reportDocumentSchema.parse(document);

  await mkdir(documentRoot, { recursive: true });
  await writeFile(
    documentPath(clientSlug),
    `${JSON.stringify(parsed, null, 2)}\n`,
    "utf8",
  );

  return withMarkdown(parsed);
}

function withMarkdown(document: ReportDocument) {
  return {
    ...document,
    markdown: reportMarkdown(document),
  };
}

function documentPath(clientSlug: string) {
  return join(documentRoot, `${fileToken(clientSlug)}.json`);
}

function isMissingFile(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
