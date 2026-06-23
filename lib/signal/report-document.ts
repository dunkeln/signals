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

/**
 * Returns first-open report content for demo clients when no saved document exists.
 *
 * These seeded sections are presentation fixtures, not product truth or source
 * normalization. If Signal moves beyond the PoC/demo surface, delete the
 * client-specific demo constants below and let reports come from persisted
 * user documents, generated chart instructions, or the empty default blocks.
 */
export function defaultReportBlocksForClient(clientSlug: string): ReportBlock[] {
  if (clientSlug === "acme-base-sandbox") {
    return acmeDemoReportBlocks;
  }

  if (clientSlug === "gold-coast-bakery-sandbox") {
    return goldCoastDemoReportBlocks;
  }

  return defaultReportBlocks;
}

const acmeDemoReportBlocks: ReportBlock[] = [
  { id: "workflow-map", kind: "workflow" },
  {
    id: "note-acme-findings-1",
    kind: "note",
    text: [
      "## Finding: supplier evidence is reaching the right teams, but QA is carrying the interpretive load",
      "",
      "Acme's sourcing motion is not just a procurement follow-up problem. Northstar Sweeteners returns commercial fields to Procurement, while document evidence fans into QA: CoA, organic certification, spec sheet, allergen statement, BOL, traceability, and lot context. That split is useful, but it also means the RFP trail depends on whether Procurement and QA are looking at the same supplier packet.",
      "",
      "The clearest operator read: Northstar is the most evidence-rich supplier in this slice, and the QA-facing packet has the most review surface. Harbor Milling is smaller but still creates QA work around CoA/spec/allergen evidence. Cascadia and Loma look narrower from the current telemetry. This is not a recommendation; it is shared context an FDE, operator, or customer lead would use before deciding where to inspect the workflow.",
    ].join("\n"),
  },
  {
    id: "chart-acme-qa-packet-mix",
    kind: "chart",
    dataset: {
      id: "derived:stacked_bar_qa_packet_mix_by_supplier",
      title: "QA-Facing Packet Mix by Supplier",
      chartKind: "stacked_bar",
      sourceDatasetIds: ["workflow_map"],
      derivationSummary:
        "Demo report chart over Acme workflow links, grouped by supplier and split by QA-facing packet type.",
      rows: [
        {
          id: "northstar-sweeteners",
          label: "Northstar Sweeteners",
          dimensions: { supplier: "Northstar Sweeteners", target: "QA" },
          measures: {
            CoA: 1,
            "organic certification": 1,
            "spec sheet": 1,
            "allergen statement": 2,
            "traceability document": 1,
            BOL: 1,
            "lot document": 2,
          },
          evidenceSourceIds: [
            "log:27:document-extractor",
            "event:evt_01hx_duplicate_coa_scan_matched",
            "log:37:document-extractor",
            "event:evt_01hx_cert_renewal_draft_extracted",
            "log:29:document-extractor",
            "log:30:supplier-graph",
            "event:evt_01hx_cert_expired_extracted",
            "log:15:document-extractor",
            "event:evt_01hx_northstar_spec_fields_extracted",
            "event:evt_01hx_bol_fields_extracted",
            "event:evt_01hx_traceability_fields_extracted",
            "event:evt_01hx_rd_allergen_review_requested",
          ],
          support: "strong",
          omissions: [],
        },
        {
          id: "harbor-milling-co",
          label: "Harbor Milling Co.",
          dimensions: { supplier: "Harbor Milling Co.", target: "QA" },
          measures: { CoA: 1, "spec sheet": 1, "allergen statement": 1 },
          evidenceSourceIds: [
            "log:16:rfp-workflow",
            "event:evt_01hx_harbor_followup_queued",
            "log:32:supplier-graph",
            "log:11:document-extractor",
            "event:evt_01hx_spec_sheet_fields_extracted",
          ],
          support: "strong",
          omissions: [],
        },
        {
          id: "evergreen-grain",
          label: "Evergreen Grain",
          dimensions: { supplier: "Evergreen Grain", target: "QA" },
          measures: { CoA: 1, "allergen statement": 1 },
          evidenceSourceIds: ["log:45:rfp-workflow"],
          support: "partial",
          omissions: [
            "Current evidence is a follow-up request, not returned supplier documentation.",
          ],
        },
        {
          id: "loma-packaging",
          label: "Loma Packaging",
          dimensions: { supplier: "Loma Packaging", target: "QA" },
          measures: { "spec sheet": 1 },
          evidenceSourceIds: ["log:49:document-extractor"],
          support: "strong",
          omissions: [],
        },
      ],
      evidenceSourceIds: [
        "log:27:document-extractor",
        "event:evt_01hx_duplicate_coa_scan_matched",
        "log:37:document-extractor",
        "event:evt_01hx_cert_renewal_draft_extracted",
        "log:29:document-extractor",
        "log:30:supplier-graph",
        "event:evt_01hx_cert_expired_extracted",
        "log:15:document-extractor",
        "event:evt_01hx_northstar_spec_fields_extracted",
        "event:evt_01hx_bol_fields_extracted",
        "event:evt_01hx_traceability_fields_extracted",
        "event:evt_01hx_rd_allergen_review_requested",
        "log:16:rfp-workflow",
        "event:evt_01hx_harbor_followup_queued",
        "log:32:supplier-graph",
        "log:11:document-extractor",
        "event:evt_01hx_spec_sheet_fields_extracted",
        "log:45:rfp-workflow",
        "log:49:document-extractor",
      ],
      omissions: [
        "This demo chart counts chartable packet evidence only; it does not infer dollar impact or remediation priority.",
      ],
    },
    prompt: "show QA-facing packet mix by supplier for Acme",
    sourceText: "@agent show QA-facing packet mix by supplier for Acme",
  },
];

const goldCoastDemoReportBlocks: ReportBlock[] = [
  { id: "workflow-map", kind: "workflow" },
  {
    id: "note-gold-coast-findings-1",
    kind: "note",
    text: [
      "## Finding: the bakery-input award is mixing commercial readiness with document readiness",
      "",
      "Gold Coast's workflow is not blocked by one missing field. The graph shows a broader coordination split: Harbor Milling returns commercial quote fields to Procurement, but its flour evidence also creates QA work around kosher certification, spec sheet review, allergen context, BOL, traceability, and lot documentation. Coastal Yeast contributes quote clarification work in Procurement, while Sunrise Shortening and Golden State Labels add QA-facing document review without carrying the same commercial volume.",
      "",
      "The useful read for an FDE or operator: this account needs visibility into which supplier packet is commercially complete versus which packet is document-ready. Harbor Milling is the main cross-team path, Golden State Labels introduces translation/document routing, and the allergen handoff reaches R&D. This is shared operating context, not a recommendation engine.",
    ].join("\n"),
  },
  {
    id: "chart-gold-coast-readiness-split",
    kind: "chart",
    dataset: {
      id: "derived:stacked_bar_gold_coast_packet_readiness_split",
      title: "Packet Readiness Split by Supplier",
      chartKind: "stacked_bar",
      sourceDatasetIds: ["workflow_map"],
      derivationSummary:
        "Demo report chart over Gold Coast workflow links, grouped by supplier and split by commercial, QA document, and internal review packet counts.",
      rows: [
        {
          id: "harbor-milling-co",
          label: "Harbor Milling Co.",
          dimensions: { supplier: "Harbor Milling Co." },
          measures: {
            "commercial fields": 4,
            "QA documents": 6,
            "R&D handoff": 1,
          },
          evidenceSourceIds: [
            "log:15:document-extractor",
            "log:17:document-extractor",
            "log:18:supplier-graph",
            "log:4:document-extractor",
            "event:evt_gcb_flour_spec_fields_extracted",
            "event:evt_gcb_bol_fields_extracted",
            "event:evt_gcb_traceability_fields_extracted",
            "event:evt_gcb_rd_spec_review_requested",
          ],
          support: "strong",
          omissions: [],
        },
        {
          id: "coastal-yeast",
          label: "Coastal Yeast",
          dimensions: { supplier: "Coastal Yeast" },
          measures: {
            "commercial fields": 4,
            "QA documents": 0,
            "R&D handoff": 0,
          },
          evidenceSourceIds: [
            "log:16:document-extractor",
            "log:31:rfx-workflow",
            "log:33:document-extractor",
            "log:35:supplier-graph",
          ],
          support: "strong",
          omissions: [],
        },
        {
          id: "sunrise-shortening",
          label: "Sunrise Shortening",
          dimensions: { supplier: "Sunrise Shortening" },
          measures: {
            "commercial fields": 0,
            "QA documents": 2,
            "R&D handoff": 0,
          },
          evidenceSourceIds: [
            "log:10:document-extractor",
            "event:evt_gcb_shortening_coa_extracted",
          ],
          support: "strong",
          omissions: [],
        },
        {
          id: "pacific-packaging",
          label: "Pacific Packaging",
          dimensions: { supplier: "Pacific Packaging" },
          measures: {
            "commercial fields": 0,
            "QA documents": 2,
            "R&D handoff": 0,
          },
          evidenceSourceIds: [
            "log:5:email-ingestor",
            "log:6:document-extractor",
          ],
          support: "partial",
          omissions: [
            "Packaging evidence includes missing food-contact context; current chart counts the packet surface only.",
          ],
        },
        {
          id: "golden-state-labels",
          label: "Golden State Labels",
          dimensions: { supplier: "Golden State Labels" },
          measures: {
            "commercial fields": 0,
            "QA documents": 1,
            "R&D handoff": 0,
          },
          evidenceSourceIds: [
            "log:29:document-extractor",
            "event:evt_gcb_translation_routed",
          ],
          support: "strong",
          omissions: [],
        },
      ],
      evidenceSourceIds: [
        "log:15:document-extractor",
        "log:17:document-extractor",
        "log:18:supplier-graph",
        "log:4:document-extractor",
        "event:evt_gcb_flour_spec_fields_extracted",
        "event:evt_gcb_bol_fields_extracted",
        "event:evt_gcb_traceability_fields_extracted",
        "event:evt_gcb_rd_spec_review_requested",
        "log:16:document-extractor",
        "log:31:rfx-workflow",
        "log:33:document-extractor",
        "log:35:supplier-graph",
        "log:10:document-extractor",
        "event:evt_gcb_shortening_coa_extracted",
        "log:5:email-ingestor",
        "log:6:document-extractor",
        "log:29:document-extractor",
        "event:evt_gcb_translation_routed",
      ],
      omissions: [
        "This demo chart separates packet surfaces; it does not infer supplier readiness, award priority, or business impact.",
      ],
    },
    prompt: "show packet readiness split by supplier for Gold Coast Bakery",
    sourceText: "@agent show packet readiness split by supplier for Gold Coast Bakery",
  },
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
