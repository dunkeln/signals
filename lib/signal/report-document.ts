import { z } from "zod";

import { generatedChartDatasetSchema } from "@/lib/protocol/v0";

export const reportBlockSchema = z.discriminatedUnion("kind", [
  z.object({
    id: z.literal("workflow-map"),
    kind: z.literal("workflow"),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal("note"),
    text: z.string(),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal("chart"),
    dataset: generatedChartDatasetSchema,
    prompt: z.string().optional(),
    sourceText: z.string().optional(),
  }),
]);

export const reportDocumentSchema = z.object({
  title: z.string(),
  blocks: z.array(reportBlockSchema).min(1),
});

export type ReportBlock = z.infer<typeof reportBlockSchema>;
export type ReportDocument = z.infer<typeof reportDocumentSchema>;

export const defaultReportBlocks: ReportBlock[] = [
  { id: "workflow-map", kind: "workflow" },
  { id: "note-1", kind: "note", text: "" },
];

export function reportMarkdown(document: ReportDocument) {
  return [
    `# ${document.title.trim() || "Untitled report"}`,
    "",
    ...document.blocks.flatMap((block) => {
      if (block.kind === "workflow") {
        return [
          "## Procurement Coordination Map",
          "",
          "_Workflow map included in Signal._",
          "",
        ];
      }

      if (block.kind === "note") {
        return block.text.trim() ? [block.text.trim(), ""] : [];
      }

      return [
        `## ${block.dataset.title}`,
        "",
        "```json",
        JSON.stringify(block.dataset, null, 2),
        "```",
        "",
      ];
    }),
  ].join("\n");
}

export function fileToken(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "signal-report"
  );
}
