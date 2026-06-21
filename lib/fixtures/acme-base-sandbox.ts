import type { RawObservabilityFixture } from "@/lib/fixtures/raw-observability-types";
export type {
  RawCloudEvent,
  RawLogRecord,
  RawMetricPoint,
  RawTraceSpan,
} from "@/lib/fixtures/raw-observability-types";

export type AcmeBaseSandbox = RawObservabilityFixture;

export const acmeBaseSandbox: AcmeBaseSandbox = {
  "scenario": {
    "name": "Acme Base Sandbox",
    "description": "Raw observability output from a Signal-like app before any domain interpretation.",
    "capturedAt": "2026-06-19T21:00:00Z"
  },
  "logs": [
    {
      "timestamp": "2026-06-05T15:01:08.220Z",
      "provider": "otel",
      "service": "rfx-workflow",
      "env": "demo",
      "severity": "info",
      "message": "rfi request created",
      "attributes": {
        "workflow_family": "rfx",
        "request_type": "rfi",
        "workflow_id": "rfi_2026_06_sweeteners_discovery",
        "material_display_name": "rice syrup blend",
        "requested_content": [
          "capability",
          "supplier_questionnaire",
          "organic_certification",
          "spec_sheet"
        ],
        "supplier_domains": [
          "northstar-sweeteners.example",
          "cascadia-syrups.example"
        ]
      }
    },
    {
      "timestamp": "2026-06-05T15:01:10.944Z",
      "provider": "cloudwatch",
      "service": "email-ingestor",
      "env": "demo",
      "severity": "info",
      "message": "rfi outbound email queued",
      "attributes": {
        "workflow_family": "rfx",
        "request_type": "rfi",
        "workflow_id": "rfi_2026_06_sweeteners_discovery",
        "queue": "outbound-email",
        "template": "supplier_capability_rfi",
        "requested_fields": [
          "plant_location",
          "available_formats",
          "certifications",
          "current_spec_sheet"
        ]
      }
    },
    {
      "timestamp": "2026-06-05T15:12:11.084Z",
      "provider": "cloudwatch",
      "service": "email-ingestor",
      "env": "demo",
      "severity": "info",
      "message": "ses message received",
      "traceId": "0af7651916cd43dd8448eb211c80319c",
      "spanId": "b7ad6b7169203331",
      "attributes": {
        "aws_region": "us-west-2",
        "ses_message_id": "0101018f75a2c1f4-7a4e",
        "mailbox": "sourcing@demo-brand.example",
        "from_domain": "northstar-sweeteners.example",
        "subject_hash": "sha256:53f8c90b",
        "attachment_count": 2,
        "thread_id": "thread-9d1c"
      }
    },
    {
      "timestamp": "2026-06-05T15:12:12.941Z",
      "provider": "otel",
      "service": "email-ingestor",
      "env": "demo",
      "severity": "info",
      "message": "attachments stored",
      "traceId": "0af7651916cd43dd8448eb211c80319c",
      "spanId": "3e0c63257de34c92",
      "attributes": {
        "bucket": "demo-signal-ingest",
        "object_keys": [
          "raw/email/thread-9d1c/quote-sheet.xlsx",
          "raw/email/thread-9d1c/coa-lot-771-scan.pdf"
        ],
        "bytes_written": 486221,
        "mime_types": [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/pdf"
        ]
      }
    },
    {
      "timestamp": "2026-06-05T15:12:19.330Z",
      "provider": "datadog",
      "service": "document-extractor",
      "env": "demo",
      "severity": "warn",
      "message": "ocr completed with low field confidence",
      "traceId": "0af7651916cd43dd8448eb211c80319c",
      "spanId": "f0d51c2c3a4b9a18",
      "attributes": {
        "document_id": "doc_tmp_7f4a",
        "parser": "textract",
        "document_type_guess": "coa",
        "page_count": 1,
        "extracted_fields": [
          "supplier_name",
          "ship_date",
          "moisture"
        ],
        "low_confidence_fields": [
          "lot_number",
          "micro_result"
        ],
        "min_field_confidence": 0.41
      }
    },
    {
      "timestamp": "2026-06-05T15:13:36.518Z",
      "provider": "cloudwatch",
      "service": "email-ingestor",
      "env": "demo",
      "severity": "info",
      "message": "rfi response received in supplier thread",
      "attributes": {
        "workflow_family": "rfx",
        "request_type": "rfi",
        "workflow_id": "rfi_2026_06_sweeteners_discovery",
        "thread_id": "thread-9d1c",
        "from_domain": "northstar-sweeteners.example",
        "attachment_count": 2,
        "detected_document_types": [
          "spec_sheet",
          "organic_certification"
        ]
      }
    },
    {
      "timestamp": "2026-06-05T15:14:44.012Z",
      "provider": "otel",
      "service": "supplier-identity",
      "env": "demo",
      "severity": "info",
      "message": "entity candidates generated",
      "traceId": "37b51d194a7513e45b56f6524f2d51f2",
      "spanId": "1d92b79f18c24f31",
      "attributes": {
        "input_name": "Northstar Sweeteners LLC",
        "candidate_count": 3,
        "candidate_scores": [
          0.94,
          0.82,
          0.63
        ],
        "features": [
          "email_domain",
          "remit_address",
          "contact_phone"
        ]
      }
    },
    {
      "timestamp": "2026-06-05T15:14:52.604Z",
      "provider": "otel",
      "service": "document-extractor",
      "env": "demo",
      "severity": "info",
      "message": "quote fields extracted from spreadsheet",
      "traceId": "52a82d9231c54d6f9f9079a88bc834a1",
      "spanId": "ab10e1b2393e4851",
      "attributes": {
        "document_id": "doc_tmp_quote_183",
        "thread_id": "thread-9d1c",
        "parser": "xlsx-parser",
        "supplier_display_name": "Northstar Sweeteners LLC",
        "ingredient_display_name": "rice syrup blend",
        "extracted_fields": [
          "unit_price",
          "price_unit",
          "moq",
          "lead_time_days",
          "payment_terms"
        ],
        "column_header_confidence": 0.92,
        "row_match_confidence": 0.86,
        "currency_detected": "USD"
      }
    },
    {
      "timestamp": "2026-06-05T15:14:55.118Z",
      "provider": "cloudwatch",
      "service": "email-ingestor",
      "env": "demo",
      "severity": "warn",
      "message": "quote terms found in forwarded email body",
      "attributes": {
        "thread_id": "thread-9d1c",
        "from_domain": "northstar-sweeteners.example",
        "supplier_display_name": "Northstar Sweeteners LLC",
        "ingredient_display_name": "rice syrup blend",
        "extracted_fields": [
          "incoterms",
          "freight_terms"
        ],
        "incoterms": "FOB",
        "source_surface": "procurement_inbox",
        "attachment_count": 0
      }
    },
    {
      "timestamp": "2026-06-05T15:14:58.441Z",
      "provider": "cloudwatch",
      "service": "email-ingestor",
      "env": "demo",
      "severity": "info",
      "message": "ses message received",
      "traceId": "13d8a5cdd9604f2d8cb066c2d913be31",
      "spanId": "c8701e7ef1924f61",
      "attributes": {
        "aws_region": "us-west-2",
        "ses_message_id": "0101018f75a4e883-1b20",
        "mailbox": "sourcing@demo-brand.example",
        "from_domain": "harbor-milling.example",
        "subject_hash": "sha256:c8b12af0",
        "attachment_count": 1,
        "thread_id": "thread-2a6f"
      }
    },
    {
      "timestamp": "2026-06-05T16:05:00.921Z",
      "provider": "otel",
      "service": "document-extractor",
      "env": "demo",
      "severity": "warn",
      "message": "quote fields extracted with missing lead time",
      "attributes": {
        "document_id": "doc_tmp_quote_harbor_411",
        "thread_id": "thread-2a6f",
        "parser": "email-body-parser",
        "supplier_display_name": "Harbor Milling Co.",
        "ingredient_display_name": "rolled oats",
        "workflow_id": "rfp_2026_05_grains",
        "extracted_fields": [
          "unit_price",
          "moq"
        ],
        "missing_fields": [
          "lead_time_days"
        ],
        "low_confidence_fields": [
          "moq"
        ],
        "quote_revision": "inline_reply_v2",
        "row_match_confidence": 0.69
      }
    },
    {
      "timestamp": "2026-06-05T16:05:01.772Z",
      "provider": "datadog",
      "service": "document-extractor",
      "env": "demo",
      "severity": "warn",
      "message": "spec sheet extracted with missing required fields",
      "traceId": "13d8a5cdd9604f2d8cb066c2d913be31",
      "spanId": "0bd69166a4b4443f",
      "attributes": {
        "document_id": "doc_tmp_spec_909",
        "parser": "pdf-text",
        "document_type_guess": "spec_sheet",
        "supplier_display_name": "Harbor Milling Co.",
        "ingredient_display_name": "rolled oats",
        "language_detected": "en",
        "extracted_fields": [
          "ingredient_name",
          "mesh_size",
          "moisture_max",
          "country_of_origin"
        ],
        "missing_fields": [
          "allergen_statement",
          "revision_date"
        ],
        "extraction_confidence": 0.78
      }
    },
    {
      "timestamp": "2026-06-05T16:05:03.209Z",
      "provider": "datadog",
      "service": "web-app",
      "env": "demo",
      "severity": "info",
      "message": "document routed to workspace",
      "attributes": {
        "session_id": "sess_rd_42",
        "user_role": "rd",
        "route": "/rd/specs/doc_tmp_spec_909",
        "source": "email-thread",
        "source_workspace": "procurement",
        "target_workspace": "rd",
        "intended_workspace": "qa",
        "document_id": "doc_tmp_spec_909",
        "supplier_display_name": "Harbor Milling Co.",
        "ingredient_display_name": "rolled oats"
      }
    },
    {
      "timestamp": "2026-06-05T16:05:05.290Z",
      "provider": "datadog",
      "service": "web-app",
      "env": "demo",
      "severity": "info",
      "message": "frontend click tracked",
      "attributes": {
        "session_id": "sess_01hx8x",
        "user_role": "buyer",
        "route": "/rfps/sweeteners/compare",
        "component": "quote-table",
        "element": "request-follow-up",
        "supplier_display_name": "Northstar Sweeteners",
        "ingredient_display_name": "rice syrup blend",
        "viewport_width": 1440
      }
    },
    {
      "timestamp": "2026-06-05T16:05:06.117Z",
      "provider": "otel",
      "service": "rfp-workflow",
      "env": "demo",
      "severity": "info",
      "message": "supplier follow-up email queued",
      "traceId": "9c1d4bc0018e49da989b39bf58f2ad93",
      "spanId": "977ad2f348f04267",
      "attributes": {
        "workflow_id": "rfp_2026_05_sweeteners",
        "queue": "outbound-email",
        "template": "quote_followup_moq_leadtime",
        "recipient_domain": "northstar-sweeteners.example",
        "requested_fields": [
          "moq",
          "lead_time",
          "incoterms"
        ]
      }
    },
    {
      "timestamp": "2026-06-08T14:05:18.662Z",
      "provider": "datadog",
      "service": "document-extractor",
      "env": "demo",
      "severity": "warn",
      "message": "spec sheet extracted from forwarded rd thread",
      "attributes": {
        "document_id": "doc_tmp_spec_northstar_115",
        "thread_id": "thread-9d1c",
        "parser": "pdf-text",
        "document_type_guess": "spec_sheet",
        "supplier_display_name": "Northstar Sweeteners",
        "ingredient_display_name": "rice syrup blend",
        "source_workspace": "rd",
        "intended_workspace": "qa",
        "extracted_fields": [
          "ingredient_name",
          "brix_range",
          "shelf_life",
          "storage_temperature"
        ],
        "missing_fields": [
          "allergen_statement"
        ],
        "extraction_confidence": 0.83
      }
    },
    {
      "timestamp": "2026-06-08T14:05:24.901Z",
      "provider": "otel",
      "service": "rfp-workflow",
      "env": "demo",
      "severity": "info",
      "message": "supplier follow-up email queued",
      "attributes": {
        "workflow_id": "rfp_2026_05_grains",
        "queue": "outbound-email",
        "template": "quote_followup_leadtime_coa",
        "recipient_domain": "harbor-milling.example",
        "supplier_display_name": "Harbor Milling Co.",
        "ingredient_display_name": "rolled oats",
        "requested_fields": [
          "lead_time",
          "coa",
          "allergen_statement"
        ]
      }
    },
    {
      "timestamp": "2026-06-08T16:40:50.554Z",
      "provider": "cloudwatch",
      "service": "qa-review",
      "env": "demo",
      "severity": "info",
      "message": "review queue item opened",
      "traceId": "2f4f7a2c19b342909cab1aa67e521a07",
      "spanId": "7f0b4a6df9c646e0",
      "attributes": {
        "user_role": "qa",
        "queue": "ingredient-documents",
        "document_id": "doc_tmp_7f4a",
        "reason_codes": [
          "ocr_low_confidence",
          "coa_candidate"
        ],
        "dwell_ms": 33842
      }
    },
    {
      "timestamp": "2026-06-09T14:22:29.901Z",
      "provider": "otel",
      "service": "search-indexer",
      "env": "demo",
      "severity": "error",
      "message": "thread index update failed",
      "traceId": "6cbf4af47b1e4a1aa2df5fa4f01ad912",
      "spanId": "8394f8025b164aca",
      "attributes": {
        "thread_id": "thread-9d1c",
        "index": "supplier_threads_v3",
        "error_name": "VersionConflictEngineException",
        "retryable": true,
        "retry_count": 1
      }
    },
    {
      "timestamp": "2026-06-09T17:05:03.221Z",
      "provider": "datadog",
      "service": "web-app",
      "env": "demo",
      "severity": "info",
      "message": "document preview opened",
      "attributes": {
        "session_id": "sess_qa_77",
        "user_role": "qa",
        "route": "/documents/doc_tmp_7f4a",
        "panel": "ocr-overlay",
        "source": "review-queue",
        "highlighted_field": "lot_number"
      }
    },
    {
      "timestamp": "2026-06-10T14:10:21.330Z",
      "provider": "otel",
      "service": "rfx-workflow",
      "env": "demo",
      "severity": "info",
      "message": "rfq request created from qualified rfi suppliers",
      "attributes": {
        "workflow_family": "rfx",
        "request_type": "rfq",
        "workflow_id": "rfq_2026_06_sweeteners_price_check",
        "parent_workflow_id": "rfi_2026_06_sweeteners_discovery",
        "material_display_name": "rice syrup blend",
        "requested_fields": [
          "unit_price",
          "moq",
          "lead_time_days",
          "incoterms"
        ],
        "supplier_count": 3
      }
    },
    {
      "timestamp": "2026-06-10T14:10:26.772Z",
      "provider": "cloudwatch",
      "service": "email-ingestor",
      "env": "demo",
      "severity": "info",
      "message": "rfq outbound emails queued",
      "attributes": {
        "workflow_family": "rfx",
        "request_type": "rfq",
        "workflow_id": "rfq_2026_06_sweeteners_price_check",
        "queue": "outbound-email",
        "recipient_domain_count": 3,
        "template": "ingredient_price_rfq"
      }
    },
    {
      "timestamp": "2026-06-10T16:32:48.707Z",
      "provider": "cloudwatch",
      "service": "email-ingestor",
      "env": "demo",
      "severity": "warn",
      "message": "supplier reply had quote data in body and no attachment",
      "traceId": "9c1d4bc0018e49da989b39bf58f2ad93",
      "spanId": "5aa432e275514ed9",
      "attributes": {
        "thread_id": "thread-9d1c",
        "from_domain": "northstar-sweeteners.example",
        "detected_currency_tokens": 4,
        "detected_quantity_tokens": 3,
        "attachment_count": 0
      }
    },
    {
      "timestamp": "2026-06-11T13:45:18.440Z",
      "provider": "otel",
      "service": "rfp-workflow",
      "env": "demo",
      "severity": "info",
      "message": "comparison model built from extracted quote rows",
      "traceId": "52a82d9231c54d6f9f9079a88bc834a1",
      "spanId": "d75256d86a7343cf",
      "attributes": {
        "workflow_id": "rfp_2026_05_sweeteners",
        "ingredient_display_name": "rice syrup blend",
        "supplier_row_count": 3,
        "rows_with_missing_moq": 1,
        "rows_with_missing_lead_time": 1,
        "source_document_ids": [
          "doc_tmp_quote_183"
        ],
        "generated_columns": [
          "supplier",
          "unit_price",
          "moq",
          "lead_time_days",
          "terms"
        ]
      }
    },
    {
      "timestamp": "2026-06-11T13:45:18.440Z",
      "provider": "otel",
      "service": "document-extractor",
      "env": "demo",
      "severity": "info",
      "message": "rfq quote rows extracted from supplier workbook",
      "attributes": {
        "workflow_family": "rfx",
        "request_type": "rfq",
        "workflow_id": "rfq_2026_06_sweeteners_price_check",
        "source_workflow_id": "rfp_2026_05_sweeteners",
        "document_id": "doc_tmp_quote_183",
        "extracted_fields": [
          "unit_price",
          "moq",
          "lead_time_days",
          "incoterms"
        ],
        "row_count": 3
      }
    },
    {
      "timestamp": "2026-06-11T13:45:20.118Z",
      "provider": "datadog",
      "service": "document-extractor",
      "env": "demo",
      "severity": "warn",
      "message": "revised quote row extracted with ambiguous moq",
      "attributes": {
        "document_id": "doc_tmp_quote_184",
        "thread_id": "thread-9d1c",
        "parser": "email-body-parser",
        "supplier_display_name": "Northstar Sweeteners",
        "ingredient_display_name": "rice syrup blend",
        "workflow_id": "rfp_2026_05_sweeteners",
        "extracted_fields": [
          "unit_price",
          "moq",
          "lead_time_days",
          "incoterms"
        ],
        "low_confidence_fields": [
          "moq"
        ],
        "quote_revision": "inline_reply_v2",
        "row_match_confidence": 0.72
      }
    },
    {
      "timestamp": "2026-06-11T13:45:22.903Z",
      "provider": "datadog",
      "service": "web-app",
      "env": "demo",
      "severity": "info",
      "message": "rfp comparison rendered",
      "attributes": {
        "session_id": "sess_01hx8x",
        "user_role": "buyer",
        "route": "/rfps/sweeteners/compare",
        "workflow_id": "rfp_2026_05_sweeteners",
        "supplier_row_count": 3,
        "visible_warning_count": 2,
        "render_ms": 184
      }
    },
    {
      "timestamp": "2026-06-11T13:45:39.506Z",
      "provider": "otel",
      "service": "document-extractor",
      "env": "demo",
      "severity": "warn",
      "message": "coa duplicate scan matched existing document candidate",
      "attributes": {
        "document_id": "doc_tmp_7f4a",
        "parser": "textract",
        "document_type_guess": "coa",
        "supplier_display_name": "Northstar Sweeteners",
        "ingredient_display_name": "rice syrup blend",
        "duplicate_candidate_document_ids": [
          "doc_tmp_7f4a"
        ],
        "low_confidence_fields": [
          "lot_number"
        ],
        "lot_candidate_count": 2,
        "min_field_confidence": 0.46
      }
    },
    {
      "timestamp": "2026-06-11T13:45:44.810Z",
      "provider": "datadog",
      "service": "web-app",
      "env": "demo",
      "severity": "info",
      "message": "coa evidence routed from procurement to qa",
      "attributes": {
        "session_id": "sess_01hx8x",
        "user_role": "buyer",
        "route": "/documents/doc_tmp_7f4a",
        "source_workspace": "procurement",
        "target_workspace": "qa",
        "document_id": "doc_tmp_7f4a",
        "supplier_display_name": "Northstar Sweeteners",
        "ingredient_display_name": "rice syrup blend"
      }
    },
    {
      "timestamp": "2026-06-11T15:20:02.418Z",
      "provider": "otel",
      "service": "document-extractor",
      "env": "demo",
      "severity": "info",
      "message": "certification fields extracted",
      "traceId": "2f4f7a2c19b342909cab1aa67e521a07",
      "spanId": "0d3fc2017c3d41f4",
      "attributes": {
        "document_id": "doc_tmp_cert_442",
        "document_type_guess": "organic_certification",
        "supplier_display_name": "Northstar Sweeteners",
        "ingredient_display_name": "rice syrup blend",
        "extracted_fields": [
          "certificate_type",
          "issuer",
          "expiration_date",
          "scope"
        ],
        "expiration_date": "2026-05-01",
        "extraction_confidence": 0.89
      }
    },
    {
      "timestamp": "2026-06-11T15:20:07.032Z",
      "provider": "datadog",
      "service": "supplier-graph",
      "env": "demo",
      "severity": "warn",
      "message": "supplier ingredient edge marked blocked",
      "traceId": "2f4f7a2c19b342909cab1aa67e521a07",
      "spanId": "ab91cbcb19024ed1",
      "attributes": {
        "supplier_display_name": "Northstar Sweeteners",
        "ingredient_display_name": "rice syrup blend",
        "edge_id": "edge_northstar_rice_syrup_blend",
        "previous_edge_status": "in_review",
        "next_edge_status": "blocked",
        "blocked_by": "expired_certification",
        "blocking_document_id": "doc_tmp_cert_442",
        "days_since_expiration": 13
      }
    },
    {
      "timestamp": "2026-06-11T15:20:11.640Z",
      "provider": "otel",
      "service": "signal-service",
      "env": "demo",
      "severity": "info",
      "message": "supplier edge signal candidate emitted",
      "traceId": "2f4f7a2c19b342909cab1aa67e521a07",
      "spanId": "5efb4e5a6ac64640",
      "attributes": {
        "signal_candidate_id": "sigcand_8c7a",
        "signal_kind": "supplier_edge_blocked",
        "supplier_display_name": "Northstar Sweeteners",
        "ingredient_display_name": "rice syrup blend",
        "owner_role": "qa",
        "owner_user_id": "user_qa_214",
        "evidence_refs": [
          "doc_tmp_cert_442",
          "edge_northstar_rice_syrup_blend",
          "thread-9d1c"
        ],
        "impact_kind": "rfp_award_delay",
        "affected_workflow_id": "rfp_2026_05_sweeteners"
      }
    },
    {
      "timestamp": "2026-06-11T15:20:13.008Z",
      "provider": "datadog",
      "service": "supplier-graph",
      "env": "demo",
      "severity": "warn",
      "message": "supplier ingredient edge marked blocked",
      "traceId": "13d8a5cdd9604f2d8cb066c2d913be31",
      "spanId": "b6218dc5f22446fd",
      "attributes": {
        "supplier_display_name": "Harbor Milling Co.",
        "ingredient_display_name": "rolled oats",
        "edge_id": "edge_harbor_rolled_oats",
        "previous_edge_status": "needs_review",
        "next_edge_status": "blocked",
        "blocked_by": "missing_required_document",
        "missing_document_type": "coa",
        "last_seen_document_id": "doc_tmp_spec_909"
      }
    },
    {
      "timestamp": "2026-06-11T15:20:15.904Z",
      "provider": "datadog",
      "service": "web-app",
      "env": "demo",
      "severity": "info",
      "message": "signal detail rendered",
      "attributes": {
        "session_id": "sess_01hx8x",
        "user_role": "buyer",
        "route": "/signals/sigcand_8c7a",
        "signal_kind": "supplier_edge_blocked",
        "visible_sections": [
          "why",
          "owner",
          "evidence",
          "business_impact"
        ],
        "primary_cta": "request_cert_renewal"
      }
    },
    {
      "timestamp": "2026-06-11T15:20:20.337Z",
      "provider": "datadog",
      "service": "web-app",
      "env": "demo",
      "severity": "info",
      "message": "frontend click tracked",
      "attributes": {
        "session_id": "sess_01hx8x",
        "user_role": "buyer",
        "route": "/signals/sigcand_8c7a",
        "component": "signal-detail",
        "element": "request-cert-renewal",
        "signal_candidate_id": "sigcand_8c7a",
        "milliseconds_after_render": 4433
      }
    },
    {
      "timestamp": "2026-06-12T14:08:02.771Z",
      "provider": "cloudwatch",
      "service": "email-ingestor",
      "env": "demo",
      "severity": "info",
      "message": "ses message received",
      "traceId": "7bda0fb22f7f4c2187519449b872ad2f",
      "spanId": "6d0b4e88a2c14f75",
      "attributes": {
        "aws_region": "us-west-2",
        "ses_message_id": "0101018f75b9a52c-0bb2",
        "mailbox": "sourcing@demo-brand.example",
        "from_domain": "northstar-sweeteners.example",
        "subject_hash": "sha256:53f8c90b",
        "attachment_count": 1,
        "thread_id": "thread-9d1c",
        "in_reply_to_message_id": "0101018f75a2c1f4-7a4e",
        "recipient_count": 6,
        "cc_count": 4
      }
    },
    {
      "timestamp": "2026-06-12T14:08:04.188Z",
      "provider": "otel",
      "service": "email-ingestor",
      "env": "demo",
      "severity": "warn",
      "message": "reply body quoted previous thread content",
      "traceId": "7bda0fb22f7f4c2187519449b872ad2f",
      "spanId": "6b9eab3e59f64cc7",
      "attributes": {
        "thread_id": "thread-9d1c",
        "from_domain": "northstar-sweeteners.example",
        "quoted_block_count": 5,
        "new_body_lines_detected": 3,
        "detected_forward_header_count": 2,
        "parser": "email-body-parser"
      }
    },
    {
      "timestamp": "2026-06-12T14:08:07.932Z",
      "provider": "datadog",
      "service": "document-extractor",
      "env": "demo",
      "severity": "warn",
      "message": "certification attachment appeared to be renewal draft",
      "traceId": "7bda0fb22f7f4c2187519449b872ad2f",
      "spanId": "cf24c6e4d8304a37",
      "attributes": {
        "document_id": "doc_tmp_cert_443",
        "thread_id": "thread-9d1c",
        "parser": "pdf-text",
        "document_type_guess": "organic_certification",
        "supplier_display_name": "Northstar Sweeteners",
        "extracted_fields": [
          "certificate_type",
          "issuer",
          "scope"
        ],
        "missing_fields": [
          "effective_date",
          "expiration_date",
          "signature"
        ],
        "watermark_text_detected": "draft",
        "extraction_confidence": 0.74
      }
    },
    {
      "timestamp": "2026-06-12T14:08:18.409Z",
      "provider": "cloudwatch",
      "service": "email-ingestor",
      "env": "demo",
      "severity": "info",
      "message": "ses message received",
      "traceId": "04d010a547744b359884a0cb97bb00d3",
      "spanId": "5bf2dccd1aa44996",
      "attributes": {
        "aws_region": "us-west-2",
        "ses_message_id": "0101018f75b9be2d-a771",
        "mailbox": "qa@demo-brand.example",
        "from_domain": "northstar-sweeteners.example",
        "subject_hash": "sha256:a0d27ca6",
        "attachment_count": 1,
        "thread_id": "thread-qa-33b",
        "forwarded_from_mailbox": "sourcing@demo-brand.example"
      }
    },
    {
      "timestamp": "2026-06-12T14:08:21.016Z",
      "provider": "otel",
      "service": "document-extractor",
      "env": "demo",
      "severity": "warn",
      "message": "same attachment hash observed across two mailboxes",
      "traceId": "04d010a547744b359884a0cb97bb00d3",
      "spanId": "9830cce21879400a",
      "attributes": {
        "attachment_sha256": "sha256:06f4387cf4",
        "current_thread_id": "thread-qa-33b",
        "previous_thread_id": "thread-9d1c",
        "current_mailbox": "qa@demo-brand.example",
        "previous_mailbox": "sourcing@demo-brand.example",
        "duplicate_scope": "attachment_hash"
      }
    },
    {
      "timestamp": "2026-06-12T17:30:08.112Z",
      "provider": "cloudwatch",
      "service": "email-ingestor",
      "env": "demo",
      "severity": "info",
      "message": "ses message received",
      "traceId": "7c0c2463a57f4e1fa1bf35fdb398280a",
      "spanId": "4a73c7b4cdf941c8",
      "attributes": {
        "aws_region": "us-west-2",
        "ses_message_id": "0101018f75bae6d0-45cf",
        "mailbox": "sourcing@demo-brand.example",
        "from_domain": "cascadia-syrups.example",
        "subject_hash": "sha256:d517d216",
        "attachment_count": 3,
        "thread_id": "thread-cas-71e"
      }
    },
    {
      "timestamp": "2026-06-12T17:30:12.634Z",
      "provider": "datadog",
      "service": "document-extractor",
      "env": "demo",
      "severity": "info",
      "message": "price list tab names extracted",
      "traceId": "7c0c2463a57f4e1fa1bf35fdb398280a",
      "spanId": "7f8a17e02d6e4407",
      "attributes": {
        "document_id": "doc_tmp_quote_cascadia_019",
        "parser": "xlsx-parser",
        "supplier_display_name": "Cascadia Syrups",
        "ingredient_display_name": "tapioca syrup",
        "sheet_names": [
          "May Quote",
          "Freight",
          "Archive"
        ],
        "active_sheet_guess": "May Quote",
        "hidden_sheet_count": 1,
        "formula_cell_count": 14
      }
    },
    {
      "timestamp": "2026-06-12T17:30:17.982Z",
      "provider": "otel",
      "service": "document-extractor",
      "env": "demo",
      "severity": "warn",
      "message": "quote row unit basis inconsistent across sheets",
      "traceId": "7c0c2463a57f4e1fa1bf35fdb398280a",
      "spanId": "4cde6da4b6b14e2e",
      "attributes": {
        "document_id": "doc_tmp_quote_cascadia_019",
        "parser": "xlsx-parser",
        "supplier_display_name": "Cascadia Syrups",
        "ingredient_display_name": "tapioca syrup",
        "detected_price_units": [
          "per_lb",
          "per_drum"
        ],
        "detected_moq_units": [
          "pallet",
          "drum"
        ],
        "low_confidence_fields": [
          "price_unit",
          "moq_unit"
        ],
        "row_match_confidence": 0.64
      }
    },
    {
      "timestamp": "2026-06-15T14:03:01.533Z",
      "provider": "cloudwatch",
      "service": "email-ingestor",
      "env": "demo",
      "severity": "warn",
      "message": "supplier auto-reply captured in active rfp thread",
      "attributes": {
        "thread_id": "thread-evergreen-2a6f",
        "from_domain": "evergreen-grain.example",
        "mailbox": "sourcing@demo-brand.example",
        "auto_submitted_header": "auto-replied",
        "attachment_count": 0,
        "detected_business_hours_timezone": "America/Chicago"
      }
    },
    {
      "timestamp": "2026-06-15T14:03:19.777Z",
      "provider": "cloudwatch",
      "service": "email-ingestor",
      "env": "demo",
      "severity": "error",
      "message": "outbound follow-up delivery bounced",
      "traceId": "d2644e87520944a98be6c67350a6c337",
      "spanId": "e312a7ca70944aaa",
      "attributes": {
        "queue": "outbound-email",
        "recipient_domain": "evergreen-grain.example",
        "smtp_status": "550",
        "bounce_type": "mailbox_unavailable",
        "workflow_id": "rfp_2026_05_grains",
        "attempt": 1
      }
    },
    {
      "timestamp": "2026-06-15T14:03:47.040Z",
      "provider": "otel",
      "service": "rfp-workflow",
      "env": "demo",
      "severity": "info",
      "message": "outbound follow-up requeued with alternate recipient",
      "traceId": "d2644e87520944a98be6c67350a6c337",
      "spanId": "0f0cfb8ba9c4454b",
      "attributes": {
        "workflow_id": "rfp_2026_05_grains",
        "queue": "outbound-email",
        "recipient_domain": "evergreen-grain.example",
        "recipient_source": "thread_cc",
        "previous_attempts": 1,
        "requested_fields": [
          "lead_time",
          "coa",
          "allergen_statement"
        ]
      }
    },
    {
      "timestamp": "2026-06-15T19:47:03.261Z",
      "provider": "datadog",
      "service": "web-app",
      "env": "demo",
      "severity": "info",
      "message": "frontend impression tracked",
      "attributes": {
        "session_id": "sess_01hx8x",
        "user_role": "buyer",
        "route": "/rfps/sweeteners/compare",
        "component": "supplier-row",
        "element": "cascadia-syrups-row",
        "workflow_id": "rfp_2026_05_sweeteners",
        "viewport_width": 1440
      }
    },
    {
      "timestamp": "2026-06-15T19:47:08.804Z",
      "provider": "datadog",
      "service": "web-app",
      "env": "demo",
      "severity": "info",
      "message": "frontend click tracked",
      "attributes": {
        "session_id": "sess_01hx8x",
        "user_role": "buyer",
        "route": "/rfps/sweeteners/compare",
        "component": "supplier-row",
        "element": "open-source-email",
        "supplier_display_name": "Cascadia Syrups",
        "thread_id": "thread-cas-71e"
      }
    },
    {
      "timestamp": "2026-06-16T14:20:33.612Z",
      "provider": "cloudwatch",
      "service": "email-ingestor",
      "env": "demo",
      "severity": "info",
      "message": "ses message received",
      "traceId": "4c06373f2d274a34a9f32309d989248b",
      "spanId": "9f25bfbdfd474d29",
      "attributes": {
        "aws_region": "us-west-2",
        "ses_message_id": "0101018f75bc8fb0-93d4",
        "mailbox": "sourcing@demo-brand.example",
        "from_domain": "loma-packaging.example",
        "subject_hash": "sha256:6938c114",
        "attachment_count": 2,
        "thread_id": "thread-pack-4de"
      }
    },
    {
      "timestamp": "2026-06-16T14:20:37.069Z",
      "provider": "datadog",
      "service": "document-extractor",
      "env": "demo",
      "severity": "warn",
      "message": "non english spec sheet extracted",
      "traceId": "4c06373f2d274a34a9f32309d989248b",
      "spanId": "637552c9ef614cdd",
      "attributes": {
        "document_id": "doc_tmp_pack_spec_502",
        "parser": "pdf-text",
        "document_type_guess": "spec_sheet",
        "supplier_display_name": "Loma Packaging",
        "material_display_name": "printed wrapper film",
        "language_detected": "es",
        "translated_field_count": 6,
        "missing_fields": [
          "food_contact_statement"
        ],
        "extraction_confidence": 0.71
      }
    },
    {
      "timestamp": "2026-06-16T14:20:41.455Z",
      "provider": "otel",
      "service": "document-extractor",
      "env": "demo",
      "severity": "warn",
      "message": "packaging certificate file name did not match extracted supplier",
      "traceId": "4c06373f2d274a34a9f32309d989248b",
      "spanId": "fbf7ddd36f344147",
      "attributes": {
        "document_id": "doc_tmp_pack_cert_503",
        "parser": "pdf-text",
        "document_type_guess": "food_contact_certification",
        "filename_supplier_hint": "Loma Packaging",
        "extracted_supplier_name": "Loma Flexible Films S.A.",
        "candidate_scores": [
          0.87,
          0.79
        ],
        "low_confidence_fields": [
          "supplier_name"
        ]
      }
    },
    {
      "timestamp": "2026-06-17T16:10:06.100Z",
      "provider": "otel",
      "service": "search-indexer",
      "env": "demo",
      "severity": "info",
      "message": "thread index retry succeeded",
      "traceId": "6cbf4af47b1e4a1aa2df5fa4f01ad912",
      "spanId": "5e0f41f5fa76432f",
      "attributes": {
        "thread_id": "thread-9d1c",
        "index": "supplier_threads_v3",
        "retry_count": 2,
        "updated_document_count": 4,
        "previous_error_name": "VersionConflictEngineException"
      }
    },
    {
      "timestamp": "2026-06-17T16:10:16.084Z",
      "provider": "otel",
      "service": "rfx-workflow",
      "env": "demo",
      "severity": "info",
      "message": "rfp packet assembled from rfi and rfq evidence",
      "attributes": {
        "workflow_family": "rfx",
        "request_type": "rfp",
        "workflow_id": "rfp_2026_06_sweeteners_award",
        "parent_workflow_ids": [
          "rfi_2026_06_sweeteners_discovery",
          "rfq_2026_06_sweeteners_price_check"
        ],
        "source_thread_ids": [
          "thread-9d1c",
          "thread-cas-71e"
        ],
        "source_document_ids": [
          "doc_tmp_quote_183",
          "doc_tmp_quote_cascadia_019",
          "doc_tmp_cert_443"
        ],
        "packet_sections": [
          "supplier_capability",
          "quote_table",
          "spec_documents",
          "certifications"
        ]
      }
    },
    {
      "timestamp": "2026-06-18T14:40:48.930Z",
      "provider": "datadog",
      "service": "web-app",
      "env": "demo",
      "severity": "info",
      "message": "frontend click tracked",
      "attributes": {
        "session_id": "sess_qa_77",
        "user_role": "qa",
        "route": "/documents/doc_tmp_cert_443",
        "component": "document-field-panel",
        "element": "mark-field-needs-review",
        "field": "expiration_date",
        "document_id": "doc_tmp_cert_443"
      }
    },
    {
      "timestamp": "2026-06-18T19:15:15.203Z",
      "provider": "cloudwatch",
      "service": "email-ingestor",
      "env": "demo",
      "severity": "warn",
      "message": "unrelated supplier email matched active thread by subject",
      "attributes": {
        "thread_id": "thread-9d1c",
        "from_domain": "northstar-logistics.example",
        "mailbox": "sourcing@demo-brand.example",
        "subject_hash": "sha256:53f8c90b",
        "attachment_count": 1,
        "detected_invoice_terms": true,
        "supplier_domain_mismatch": true
      }
    }
  ],
  "metrics": [
    {
      "timestamp": "2026-06-05T15:00:00.000Z",
      "provider": "datadog",
      "service": "web-app",
      "env": "demo",
      "name": "browser.click",
      "kind": "counter",
      "unit": "count",
      "value": 17,
      "tags": {
        "route": "/rfps/sweeteners/compare",
        "component": "quote-table",
        "user_role": "buyer"
      }
    },
    {
      "timestamp": "2026-06-05T15:00:00.000Z",
      "provider": "datadog",
      "service": "web-app",
      "env": "demo",
      "name": "browser.impression",
      "kind": "counter",
      "unit": "count",
      "value": 31,
      "tags": {
        "route": "/rfps/sweeteners/compare",
        "component": "quote-table",
        "user_role": "buyer"
      }
    },
    {
      "timestamp": "2026-06-05T15:05:00.000Z",
      "provider": "otel",
      "service": "rfx-workflow",
      "env": "demo",
      "name": "rfx.request.created",
      "kind": "counter",
      "unit": "count",
      "value": 1,
      "tags": {
        "workflow_family": "rfx",
        "request_type": "rfi"
      }
    },
    {
      "timestamp": "2026-06-08T14:05:00.000Z",
      "provider": "cloudwatch",
      "service": "email-ingestor",
      "env": "demo",
      "name": "ses.messages_received",
      "kind": "counter",
      "unit": "count",
      "value": 8,
      "tags": {
        "mailbox": "sourcing@demo-brand.example",
        "source": "ses"
      }
    },
    {
      "timestamp": "2026-06-08T14:05:00.000Z",
      "provider": "cloudwatch",
      "service": "email-ingestor",
      "env": "demo",
      "name": "attachments.detected",
      "kind": "counter",
      "unit": "count",
      "value": 13,
      "tags": {
        "mailbox": "sourcing@demo-brand.example"
      }
    },
    {
      "timestamp": "2026-06-08T14:05:00.000Z",
      "provider": "otel",
      "service": "document-extractor",
      "env": "demo",
      "name": "document.extract.duration",
      "kind": "histogram",
      "unit": "ms",
      "value": 7312,
      "tags": {
        "parser": "textract",
        "document_type_guess": "coa",
        "status": "ok"
      }
    },
    {
      "timestamp": "2026-06-08T14:05:00.000Z",
      "provider": "otel",
      "service": "document-extractor",
      "env": "demo",
      "name": "document.field_confidence.min",
      "kind": "gauge",
      "unit": "percent",
      "value": 41,
      "tags": {
        "parser": "textract",
        "field": "lot_number",
        "document_type_guess": "coa"
      }
    },
    {
      "timestamp": "2026-06-08T14:05:00.000Z",
      "provider": "otel",
      "service": "document-extractor",
      "env": "demo",
      "name": "quote.extract.row_match_confidence",
      "kind": "gauge",
      "unit": "percent",
      "value": 86,
      "tags": {
        "parser": "xlsx-parser",
        "document_type_guess": "price_list",
        "workflow_id": "rfp_2026_05_sweeteners"
      }
    },
    {
      "timestamp": "2026-06-08T14:05:00.000Z",
      "provider": "datadog",
      "service": "document-extractor",
      "env": "demo",
      "name": "document.required_field.missing",
      "kind": "counter",
      "unit": "count",
      "value": 2,
      "tags": {
        "document_type_guess": "spec_sheet",
        "supplier_domain": "harbor-milling.example"
      }
    },
    {
      "timestamp": "2026-06-10T14:10:00.000Z",
      "provider": "datadog",
      "service": "rfp-workflow",
      "env": "demo",
      "name": "queue.depth",
      "kind": "gauge",
      "unit": "count",
      "value": 19,
      "tags": {
        "queue": "outbound-email",
        "priority": "normal"
      }
    },
    {
      "timestamp": "2026-06-10T14:10:00.000Z",
      "provider": "otel",
      "service": "search-indexer",
      "env": "demo",
      "name": "index.update.error",
      "kind": "counter",
      "unit": "count",
      "value": 1,
      "tags": {
        "index": "supplier_threads_v3",
        "retryable": true
      }
    },
    {
      "timestamp": "2026-06-10T14:10:00.000Z",
      "provider": "otel",
      "service": "rfx-workflow",
      "env": "demo",
      "name": "rfx.request.created",
      "kind": "counter",
      "unit": "count",
      "value": 1,
      "tags": {
        "workflow_family": "rfx",
        "request_type": "rfq"
      }
    },
    {
      "timestamp": "2026-06-12T17:30:00.000Z",
      "provider": "datadog",
      "service": "web-app",
      "env": "demo",
      "name": "browser.click_through_rate",
      "kind": "gauge",
      "unit": "percent",
      "value": 42,
      "tags": {
        "route": "/signals/sigcand_8c7a",
        "component": "signal-detail",
        "user_role": "buyer",
        "cta": "request-cert-renewal"
      }
    },
    {
      "timestamp": "2026-06-12T17:30:00.000Z",
      "provider": "datadog",
      "service": "supplier-graph",
      "env": "demo",
      "name": "supplier.edge.status_change",
      "kind": "counter",
      "unit": "count",
      "value": 1,
      "tags": {
        "next_status": "blocked",
        "blocked_by": "expired_certification",
        "workflow_id": "rfp_2026_05_sweeteners"
      }
    },
    {
      "timestamp": "2026-06-12T17:30:00.000Z",
      "provider": "datadog",
      "service": "signal-service",
      "env": "demo",
      "name": "signal.candidate.emitted",
      "kind": "counter",
      "unit": "count",
      "value": 1,
      "tags": {
        "signal_kind": "supplier_edge_blocked",
        "owner_role": "qa",
        "impact_kind": "rfp_award_delay"
      }
    },
    {
      "timestamp": "2026-06-12T17:30:00.000Z",
      "provider": "datadog",
      "service": "supplier-graph",
      "env": "demo",
      "name": "supplier.edge.status_change",
      "kind": "counter",
      "unit": "count",
      "value": 1,
      "tags": {
        "next_status": "blocked",
        "blocked_by": "missing_required_document",
        "workflow_id": "rfp_2026_05_grains"
      }
    },
    {
      "timestamp": "2026-06-17T16:10:00.000Z",
      "provider": "cloudwatch",
      "service": "email-ingestor",
      "env": "demo",
      "name": "ses.messages_received",
      "kind": "counter",
      "unit": "count",
      "value": 21,
      "tags": {
        "mailbox": "sourcing@demo-brand.example",
        "source": "ses",
        "window": "5m"
      }
    },
    {
      "timestamp": "2026-06-17T16:10:00.000Z",
      "provider": "cloudwatch",
      "service": "email-ingestor",
      "env": "demo",
      "name": "ses.auto_replies_detected",
      "kind": "counter",
      "unit": "count",
      "value": 3,
      "tags": {
        "mailbox": "sourcing@demo-brand.example",
        "workflow_id": "rfp_2026_05_grains"
      }
    },
    {
      "timestamp": "2026-06-17T16:10:00.000Z",
      "provider": "cloudwatch",
      "service": "email-ingestor",
      "env": "demo",
      "name": "outbound_email.bounce",
      "kind": "counter",
      "unit": "count",
      "value": 1,
      "tags": {
        "queue": "outbound-email",
        "smtp_status": "550",
        "recipient_domain": "evergreen-grain.example"
      }
    },
    {
      "timestamp": "2026-06-17T16:10:00.000Z",
      "provider": "otel",
      "service": "document-extractor",
      "env": "demo",
      "name": "document.attachments.duplicate_hash",
      "kind": "counter",
      "unit": "count",
      "value": 2,
      "tags": {
        "duplicate_scope": "attachment_hash",
        "mailboxes": "sourcing,qa"
      }
    },
    {
      "timestamp": "2026-06-17T16:10:00.000Z",
      "provider": "otel",
      "service": "document-extractor",
      "env": "demo",
      "name": "quote.extract.row_match_confidence",
      "kind": "gauge",
      "unit": "percent",
      "value": 64,
      "tags": {
        "parser": "xlsx-parser",
        "document_type_guess": "price_list",
        "supplier_domain": "cascadia-syrups.example"
      }
    },
    {
      "timestamp": "2026-06-17T16:10:00.000Z",
      "provider": "datadog",
      "service": "document-extractor",
      "env": "demo",
      "name": "document.translation.detected",
      "kind": "counter",
      "unit": "count",
      "value": 1,
      "tags": {
        "language_detected": "es",
        "document_type_guess": "spec_sheet",
        "supplier_domain": "loma-packaging.example"
      }
    },
    {
      "timestamp": "2026-06-17T16:10:00.000Z",
      "provider": "datadog",
      "service": "web-app",
      "env": "demo",
      "name": "browser.impression",
      "kind": "counter",
      "unit": "count",
      "value": 12,
      "tags": {
        "route": "/rfps/sweeteners/compare",
        "component": "supplier-row",
        "user_role": "buyer"
      }
    },
    {
      "timestamp": "2026-06-17T16:10:00.000Z",
      "provider": "datadog",
      "service": "web-app",
      "env": "demo",
      "name": "browser.click",
      "kind": "counter",
      "unit": "count",
      "value": 5,
      "tags": {
        "route": "/rfps/sweeteners/compare",
        "component": "supplier-row",
        "user_role": "buyer"
      }
    },
    {
      "timestamp": "2026-06-17T16:10:00.000Z",
      "provider": "otel",
      "service": "search-indexer",
      "env": "demo",
      "name": "index.update.retry",
      "kind": "counter",
      "unit": "count",
      "value": 2,
      "tags": {
        "index": "supplier_threads_v3",
        "previous_error": "VersionConflictEngineException"
      }
    },
    {
      "timestamp": "2026-06-17T16:10:00.000Z",
      "provider": "otel",
      "service": "rfx-workflow",
      "env": "demo",
      "name": "rfx.packet.assembled",
      "kind": "counter",
      "unit": "count",
      "value": 1,
      "tags": {
        "workflow_family": "rfx",
        "request_type": "rfp"
      }
    },
    {
      "timestamp": "2026-06-19T13:30:00.000Z",
      "provider": "datadog",
      "service": "web-app",
      "env": "demo",
      "name": "document.field_review.click",
      "kind": "counter",
      "unit": "count",
      "value": 4,
      "tags": {
        "route": "/documents/doc_tmp_cert_443",
        "component": "document-field-panel",
        "user_role": "qa"
      }
    }
  ],
  "traces": [
    {
      "traceId": "0af7651916cd43dd8448eb211c80319c",
      "spanId": "b7ad6b7169203331",
      "service": "email-ingestor",
      "name": "SES ReceiveMessage",
      "kind": "consumer",
      "startTime": "2026-06-05T15:12:11.070Z",
      "durationMs": 1912,
      "status": "ok",
      "attributes": {
        "messaging.system": "aws.ses",
        "messaging.destination.name": "sourcing@demo-brand.example",
        "email.thread_id": "thread-9d1c"
      }
    },
    {
      "traceId": "0af7651916cd43dd8448eb211c80319c",
      "spanId": "3e0c63257de34c92",
      "parentSpanId": "b7ad6b7169203331",
      "service": "email-ingestor",
      "name": "PutObject attachments",
      "kind": "client",
      "startTime": "2026-06-05T15:12:11.438Z",
      "durationMs": 1503,
      "status": "ok",
      "attributes": {
        "aws.s3.bucket": "demo-signal-ingest",
        "attachment.count": 2
      }
    },
    {
      "traceId": "0af7651916cd43dd8448eb211c80319c",
      "spanId": "f0d51c2c3a4b9a18",
      "parentSpanId": "b7ad6b7169203331",
      "service": "document-extractor",
      "name": "ExtractDocumentFields",
      "kind": "consumer",
      "startTime": "2026-06-05T15:12:12.986Z",
      "durationMs": 6344,
      "status": "ok",
      "attributes": {
        "messaging.system": "sqs",
        "document.parser": "textract",
        "document.type_guess": "coa"
      },
      "events": [
        {
          "timestamp": "2026-06-05T15:12:18.870Z",
          "name": "field.confidence.low",
          "attributes": {
            "field": "lot_number",
            "confidence": 0.41
          }
        }
      ]
    },
    {
      "traceId": "37b51d194a7513e45b56f6524f2d51f2",
      "spanId": "1d92b79f18c24f31",
      "service": "supplier-identity",
      "name": "GenerateEntityCandidates",
      "kind": "internal",
      "startTime": "2026-06-05T15:14:43.841Z",
      "durationMs": 171,
      "status": "ok",
      "attributes": {
        "entity.input_name": "Northstar Sweeteners LLC",
        "entity.candidate_count": 3,
        "entity.feature_count": 3
      }
    },
    {
      "traceId": "52a82d9231c54d6f9f9079a88bc834a1",
      "spanId": "ab10e1b2393e4851",
      "service": "document-extractor",
      "name": "ExtractQuoteRows",
      "kind": "consumer",
      "startTime": "2026-06-05T15:14:51.680Z",
      "durationMs": 924,
      "status": "ok",
      "attributes": {
        "document.id": "doc_tmp_quote_183",
        "document.parser": "xlsx-parser",
        "email.thread_id": "thread-9d1c",
        "quote.row_count": 3
      },
      "events": [
        {
          "timestamp": "2026-06-05T15:14:52.331Z",
          "name": "quote.row.missing_field",
          "attributes": {
            "row_index": 2,
            "field": "lead_time_days"
          }
        }
      ]
    },
    {
      "traceId": "13d8a5cdd9604f2d8cb066c2d913be31",
      "spanId": "c8701e7ef1924f61",
      "service": "email-ingestor",
      "name": "SES ReceiveMessage",
      "kind": "consumer",
      "startTime": "2026-06-05T15:14:58.426Z",
      "durationMs": 3346,
      "status": "ok",
      "attributes": {
        "messaging.system": "aws.ses",
        "messaging.destination.name": "sourcing@demo-brand.example",
        "email.thread_id": "thread-2a6f",
        "email.attachment_count": 1
      }
    },
    {
      "traceId": "13d8a5cdd9604f2d8cb066c2d913be31",
      "spanId": "0bd69166a4b4443f",
      "parentSpanId": "c8701e7ef1924f61",
      "service": "document-extractor",
      "name": "ExtractSpecSheet",
      "kind": "consumer",
      "startTime": "2026-06-05T15:14:59.118Z",
      "durationMs": 2654,
      "status": "ok",
      "attributes": {
        "document.id": "doc_tmp_spec_909",
        "document.type_guess": "spec_sheet",
        "document.parser": "pdf-text",
        "document.missing_required_field_count": 2
      }
    },
    {
      "traceId": "9c1d4bc0018e49da989b39bf58f2ad93",
      "spanId": "977ad2f348f04267",
      "service": "rfp-workflow",
      "name": "POST /api/rfps/{id}/followups",
      "kind": "server",
      "startTime": "2026-06-05T16:05:05.978Z",
      "durationMs": 139,
      "status": "ok",
      "attributes": {
        "http.method": "POST",
        "http.route": "/api/rfps/{id}/followups",
        "app.user_role": "buyer",
        "workflow.template": "quote_followup_moq_leadtime"
      }
    },
    {
      "traceId": "2f4f7a2c19b342909cab1aa67e521a07",
      "spanId": "7f0b4a6df9c646e0",
      "service": "qa-review",
      "name": "OpenReviewQueueItem",
      "kind": "server",
      "startTime": "2026-06-08T16:40:50.511Z",
      "durationMs": 33885,
      "status": "ok",
      "attributes": {
        "app.user_role": "qa",
        "review.queue": "ingredient-documents",
        "document.id": "doc_tmp_7f4a",
        "review.reason_codes": [
          "ocr_low_confidence",
          "coa_candidate"
        ]
      }
    },
    {
      "traceId": "6cbf4af47b1e4a1aa2df5fa4f01ad912",
      "spanId": "8394f8025b164aca",
      "service": "search-indexer",
      "name": "BulkUpdate supplier_threads_v3",
      "kind": "client",
      "startTime": "2026-06-09T14:22:29.842Z",
      "durationMs": 59,
      "status": "error",
      "attributes": {
        "db.system": "opensearch",
        "db.operation": "bulk_update",
        "error.type": "VersionConflictEngineException",
        "retryable": true
      }
    },
    {
      "traceId": "9c1d4bc0018e49da989b39bf58f2ad93",
      "spanId": "5aa432e275514ed9",
      "parentSpanId": "977ad2f348f04267",
      "service": "email-ingestor",
      "name": "ParseInboundEmailBody",
      "kind": "consumer",
      "startTime": "2026-06-10T16:32:48.221Z",
      "durationMs": 486,
      "status": "ok",
      "attributes": {
        "email.thread_id": "thread-9d1c",
        "email.attachment_count": 0,
        "quote.currency_token_count": 4,
        "quote.quantity_token_count": 3
      }
    },
    {
      "traceId": "52a82d9231c54d6f9f9079a88bc834a1",
      "spanId": "d75256d86a7343cf",
      "parentSpanId": "ab10e1b2393e4851",
      "service": "rfp-workflow",
      "name": "BuildComparisonRows",
      "kind": "internal",
      "startTime": "2026-06-11T13:45:18.281Z",
      "durationMs": 159,
      "status": "ok",
      "attributes": {
        "workflow.id": "rfp_2026_05_sweeteners",
        "comparison.row_count": 3,
        "comparison.warning_count": 2
      }
    },
    {
      "traceId": "2f4f7a2c19b342909cab1aa67e521a07",
      "spanId": "0d3fc2017c3d41f4",
      "service": "document-extractor",
      "name": "ExtractCertificationFields",
      "kind": "consumer",
      "startTime": "2026-06-11T15:20:02.122Z",
      "durationMs": 296,
      "status": "ok",
      "attributes": {
        "document.id": "doc_tmp_cert_442",
        "document.type_guess": "organic_certification",
        "cert.expiration_date": "2026-05-01"
      }
    },
    {
      "traceId": "2f4f7a2c19b342909cab1aa67e521a07",
      "spanId": "ab91cbcb19024ed1",
      "parentSpanId": "0d3fc2017c3d41f4",
      "service": "supplier-graph",
      "name": "UpdateSupplierIngredientEdge",
      "kind": "internal",
      "startTime": "2026-06-11T15:20:06.870Z",
      "durationMs": 162,
      "status": "ok",
      "attributes": {
        "edge.id": "edge_northstar_rice_syrup_blend",
        "edge.status.previous": "in_review",
        "edge.status.next": "blocked",
        "edge.blocked_by": "expired_certification"
      }
    },
    {
      "traceId": "2f4f7a2c19b342909cab1aa67e521a07",
      "spanId": "5efb4e5a6ac64640",
      "parentSpanId": "ab91cbcb19024ed1",
      "service": "signal-service",
      "name": "EmitSignalCandidate",
      "kind": "internal",
      "startTime": "2026-06-11T15:20:11.502Z",
      "durationMs": 138,
      "status": "ok",
      "attributes": {
        "signal.kind": "supplier_edge_blocked",
        "signal.owner_role": "qa",
        "signal.impact_kind": "rfp_award_delay",
        "signal.evidence_count": 3
      }
    },
    {
      "traceId": "13d8a5cdd9604f2d8cb066c2d913be31",
      "spanId": "b6218dc5f22446fd",
      "parentSpanId": "0bd69166a4b4443f",
      "service": "supplier-graph",
      "name": "UpdateSupplierIngredientEdge",
      "kind": "internal",
      "startTime": "2026-06-11T15:20:12.839Z",
      "durationMs": 169,
      "status": "ok",
      "attributes": {
        "edge.id": "edge_harbor_rolled_oats",
        "edge.status.previous": "needs_review",
        "edge.status.next": "blocked",
        "edge.blocked_by": "missing_required_document",
        "edge.missing_document_type": "coa"
      }
    },
    {
      "traceId": "7bda0fb22f7f4c2187519449b872ad2f",
      "spanId": "6d0b4e88a2c14f75",
      "service": "email-ingestor",
      "name": "SES ReceiveMessage",
      "kind": "consumer",
      "startTime": "2026-06-12T14:08:02.741Z",
      "durationMs": 1447,
      "status": "ok",
      "attributes": {
        "messaging.system": "aws.ses",
        "messaging.destination.name": "sourcing@demo-brand.example",
        "email.thread_id": "thread-9d1c",
        "email.in_reply_to": "0101018f75a2c1f4-7a4e",
        "email.recipient_count": 6
      }
    },
    {
      "traceId": "7bda0fb22f7f4c2187519449b872ad2f",
      "spanId": "6b9eab3e59f64cc7",
      "parentSpanId": "6d0b4e88a2c14f75",
      "service": "email-ingestor",
      "name": "ParseReplyBody",
      "kind": "internal",
      "startTime": "2026-06-12T14:08:03.884Z",
      "durationMs": 304,
      "status": "ok",
      "attributes": {
        "email.thread_id": "thread-9d1c",
        "email.quoted_block_count": 5,
        "email.forward_header_count": 2,
        "email.new_body_lines": 3
      }
    },
    {
      "traceId": "7bda0fb22f7f4c2187519449b872ad2f",
      "spanId": "cf24c6e4d8304a37",
      "parentSpanId": "6d0b4e88a2c14f75",
      "service": "document-extractor",
      "name": "ExtractCertificationFields",
      "kind": "consumer",
      "startTime": "2026-06-12T14:08:04.226Z",
      "durationMs": 3706,
      "status": "ok",
      "attributes": {
        "document.id": "doc_tmp_cert_443",
        "document.type_guess": "organic_certification",
        "document.missing_required_field_count": 3,
        "document.watermark_detected": "draft"
      }
    },
    {
      "traceId": "04d010a547744b359884a0cb97bb00d3",
      "spanId": "5bf2dccd1aa44996",
      "service": "email-ingestor",
      "name": "SES ReceiveMessage",
      "kind": "consumer",
      "startTime": "2026-06-12T14:08:18.375Z",
      "durationMs": 2641,
      "status": "ok",
      "attributes": {
        "messaging.system": "aws.ses",
        "messaging.destination.name": "qa@demo-brand.example",
        "email.thread_id": "thread-qa-33b",
        "email.forwarded_from_mailbox": "sourcing@demo-brand.example"
      }
    },
    {
      "traceId": "04d010a547744b359884a0cb97bb00d3",
      "spanId": "9830cce21879400a",
      "parentSpanId": "5bf2dccd1aa44996",
      "service": "document-extractor",
      "name": "DetectDuplicateAttachment",
      "kind": "internal",
      "startTime": "2026-06-12T14:08:20.761Z",
      "durationMs": 255,
      "status": "ok",
      "attributes": {
        "attachment.sha256": "sha256:06f4387cf4",
        "duplicate.current_thread_id": "thread-qa-33b",
        "duplicate.previous_thread_id": "thread-9d1c",
        "duplicate.scope": "attachment_hash"
      }
    },
    {
      "traceId": "7c0c2463a57f4e1fa1bf35fdb398280a",
      "spanId": "4a73c7b4cdf941c8",
      "service": "email-ingestor",
      "name": "SES ReceiveMessage",
      "kind": "consumer",
      "startTime": "2026-06-12T17:30:08.079Z",
      "durationMs": 9903,
      "status": "ok",
      "attributes": {
        "messaging.system": "aws.ses",
        "messaging.destination.name": "sourcing@demo-brand.example",
        "email.thread_id": "thread-cas-71e",
        "email.attachment_count": 3
      }
    },
    {
      "traceId": "7c0c2463a57f4e1fa1bf35fdb398280a",
      "spanId": "7f8a17e02d6e4407",
      "parentSpanId": "4a73c7b4cdf941c8",
      "service": "document-extractor",
      "name": "ReadWorkbookSheets",
      "kind": "consumer",
      "startTime": "2026-06-12T17:30:09.118Z",
      "durationMs": 3516,
      "status": "ok",
      "attributes": {
        "document.id": "doc_tmp_quote_cascadia_019",
        "document.parser": "xlsx-parser",
        "workbook.sheet_count": 3,
        "workbook.hidden_sheet_count": 1
      }
    },
    {
      "traceId": "7c0c2463a57f4e1fa1bf35fdb398280a",
      "spanId": "4cde6da4b6b14e2e",
      "parentSpanId": "7f8a17e02d6e4407",
      "service": "document-extractor",
      "name": "ExtractQuoteRows",
      "kind": "internal",
      "startTime": "2026-06-12T17:30:12.719Z",
      "durationMs": 5263,
      "status": "ok",
      "attributes": {
        "document.id": "doc_tmp_quote_cascadia_019",
        "quote.row_count": 5,
        "quote.detected_price_units": [
          "per_lb",
          "per_drum"
        ],
        "quote.row_match_confidence": 0.64
      },
      "events": [
        {
          "timestamp": "2026-06-12T17:30:17.113Z",
          "name": "quote.unit_basis.inconsistent",
          "attributes": {
            "fields": [
              "price_unit",
              "moq_unit"
            ],
            "supplier_domain": "cascadia-syrups.example"
          }
        }
      ]
    },
    {
      "traceId": "d2644e87520944a98be6c67350a6c337",
      "spanId": "e312a7ca70944aaa",
      "service": "email-ingestor",
      "name": "SendOutboundEmail",
      "kind": "producer",
      "startTime": "2026-06-15T14:03:18.911Z",
      "durationMs": 866,
      "status": "error",
      "attributes": {
        "messaging.system": "smtp",
        "messaging.destination.name": "evergreen-grain.example",
        "smtp.status": "550",
        "email.workflow_id": "rfp_2026_05_grains"
      }
    },
    {
      "traceId": "d2644e87520944a98be6c67350a6c337",
      "spanId": "0f0cfb8ba9c4454b",
      "parentSpanId": "e312a7ca70944aaa",
      "service": "rfp-workflow",
      "name": "RequeueOutboundEmail",
      "kind": "internal",
      "startTime": "2026-06-15T14:03:46.928Z",
      "durationMs": 112,
      "status": "ok",
      "attributes": {
        "queue.name": "outbound-email",
        "email.recipient_source": "thread_cc",
        "email.previous_attempts": 1,
        "workflow.id": "rfp_2026_05_grains"
      }
    },
    {
      "traceId": "4c06373f2d274a34a9f32309d989248b",
      "spanId": "9f25bfbdfd474d29",
      "service": "email-ingestor",
      "name": "SES ReceiveMessage",
      "kind": "consumer",
      "startTime": "2026-06-16T14:20:33.580Z",
      "durationMs": 7875,
      "status": "ok",
      "attributes": {
        "messaging.system": "aws.ses",
        "messaging.destination.name": "sourcing@demo-brand.example",
        "email.thread_id": "thread-pack-4de",
        "email.attachment_count": 2
      }
    },
    {
      "traceId": "4c06373f2d274a34a9f32309d989248b",
      "spanId": "637552c9ef614cdd",
      "parentSpanId": "9f25bfbdfd474d29",
      "service": "document-extractor",
      "name": "ExtractTranslatedSpecSheet",
      "kind": "consumer",
      "startTime": "2026-06-16T14:20:34.772Z",
      "durationMs": 2297,
      "status": "ok",
      "attributes": {
        "document.id": "doc_tmp_pack_spec_502",
        "document.language_detected": "es",
        "document.translated_field_count": 6,
        "document.missing_required_field_count": 1
      }
    },
    {
      "traceId": "4c06373f2d274a34a9f32309d989248b",
      "spanId": "fbf7ddd36f344147",
      "parentSpanId": "9f25bfbdfd474d29",
      "service": "document-extractor",
      "name": "ExtractCertificationFields",
      "kind": "consumer",
      "startTime": "2026-06-16T14:20:37.240Z",
      "durationMs": 4215,
      "status": "ok",
      "attributes": {
        "document.id": "doc_tmp_pack_cert_503",
        "document.type_guess": "food_contact_certification",
        "entity.filename_supplier_hint": "Loma Packaging",
        "entity.extracted_supplier_name": "Loma Flexible Films S.A."
      }
    },
    {
      "traceId": "6cbf4af47b1e4a1aa2df5fa4f01ad912",
      "spanId": "5e0f41f5fa76432f",
      "parentSpanId": "8394f8025b164aca",
      "service": "search-indexer",
      "name": "BulkUpdate supplier_threads_v3 retry",
      "kind": "client",
      "startTime": "2026-06-17T16:10:06.010Z",
      "durationMs": 90,
      "status": "ok",
      "attributes": {
        "db.system": "opensearch",
        "db.operation": "bulk_update",
        "retry.count": 2,
        "document.updated_count": 4
      }
    }
  ],
  "events": [
    {
      "id": "evt_01hx_rfi_request_created",
      "source": "signal.rfx-workflow",
      "type": "rfi.request.created",
      "time": "2026-06-05T15:01:08.220Z",
      "subject": "workflow/rfi_2026_06_sweeteners_discovery",
      "data": {
        "workflow_family": "rfx",
        "request_type": "rfi",
        "material_display_name": "rice syrup blend"
      }
    },
    {
      "id": "evt_01hx_rfi_outbound_queued",
      "source": "signal.email-ingestor",
      "type": "rfi.email.queued",
      "time": "2026-06-05T15:01:10.944Z",
      "subject": "workflow/rfi_2026_06_sweeteners_discovery",
      "data": {
        "workflow_family": "rfx",
        "request_type": "rfi",
        "template": "supplier_capability_rfi"
      }
    },
    {
      "id": "evt_01hx_signal_email_received",
      "source": "aws.ses",
      "type": "com.aws.ses.message.received",
      "time": "2026-06-05T15:12:11.084Z",
      "subject": "mailbox/sourcing",
      "data": {
        "message_id": "0101018f75a2c1f4-7a4e",
        "receipt_rule": "demo-brand-sourcing",
        "attachment_count": 2,
        "from_domain": "northstar-sweeteners.example"
      }
    },
    {
      "id": "evt_01hx_doc_extract_requested",
      "source": "signal.email-ingestor",
      "type": "document.extraction.requested",
      "time": "2026-06-05T15:12:12.983Z",
      "subject": "s3://demo-signal-ingest/raw/email/thread-9d1c/coa-lot-771-scan.pdf",
      "data": {
        "parser": "textract",
        "mime_type": "application/pdf",
        "thread_id": "thread-9d1c"
      }
    },
    {
      "id": "evt_01hx_rfi_response_received",
      "source": "aws.ses",
      "type": "rfi.response.received",
      "time": "2026-06-05T15:13:36.518Z",
      "subject": "thread/thread-9d1c",
      "data": {
        "workflow_family": "rfx",
        "request_type": "rfi",
        "workflow_id": "rfi_2026_06_sweeteners_discovery",
        "from_domain": "northstar-sweeteners.example"
      }
    },
    {
      "id": "evt_01hx_quote_rows_extracted",
      "source": "signal.document-extractor",
      "type": "quote.rows.extracted",
      "time": "2026-06-05T15:14:52.604Z",
      "subject": "document/doc_tmp_quote_183",
      "data": {
        "thread_id": "thread-9d1c",
        "supplier_display_name": "Northstar Sweeteners LLC",
        "ingredient_display_name": "rice syrup blend",
        "row_count": 3,
        "rows_with_missing_fields": 1,
        "parser": "xlsx-parser"
      }
    },
    {
      "id": "evt_01hx_quote_terms_extracted",
      "source": "signal.email-ingestor",
      "type": "quote.terms.extracted_from_email_body",
      "time": "2026-06-05T15:14:55.118Z",
      "subject": "thread/thread-9d1c",
      "data": {
        "supplier_display_name": "Northstar Sweeteners LLC",
        "ingredient_display_name": "rice syrup blend",
        "extracted_fields": [
          "incoterms",
          "freight_terms"
        ],
        "incoterms": "FOB",
        "source_surface": "procurement_inbox"
      }
    },
    {
      "id": "evt_01hx_second_supplier_email_received",
      "source": "aws.ses",
      "type": "com.aws.ses.message.received",
      "time": "2026-06-05T15:14:58.441Z",
      "subject": "mailbox/sourcing",
      "data": {
        "message_id": "0101018f75a4e883-1b20",
        "receipt_rule": "demo-brand-sourcing",
        "attachment_count": 1,
        "from_domain": "harbor-milling.example"
      }
    },
    {
      "id": "evt_01hx_harbor_quote_fields_extracted",
      "source": "signal.document-extractor",
      "type": "quote.fields.extracted",
      "time": "2026-06-05T16:05:00.921Z",
      "subject": "document/doc_tmp_quote_harbor_411",
      "data": {
        "thread_id": "thread-2a6f",
        "supplier_display_name": "Harbor Milling Co.",
        "ingredient_display_name": "rolled oats",
        "workflow_id": "rfp_2026_05_grains",
        "extracted_fields": [
          "unit_price",
          "moq"
        ],
        "missing_fields": [
          "lead_time_days"
        ],
        "low_confidence_fields": [
          "moq"
        ]
      }
    },
    {
      "id": "evt_01hx_spec_sheet_fields_extracted",
      "source": "signal.document-extractor",
      "type": "document.spec_sheet.fields_extracted",
      "time": "2026-06-05T16:05:01.772Z",
      "subject": "document/doc_tmp_spec_909",
      "data": {
        "supplier_display_name": "Harbor Milling Co.",
        "ingredient_display_name": "rolled oats",
        "missing_fields": [
          "allergen_statement",
          "revision_date"
        ],
        "extraction_confidence": 0.78
      }
    },
    {
      "id": "evt_01hx_spec_routed_to_rd",
      "source": "signal.web-app",
      "type": "document.workspace_routed",
      "time": "2026-06-05T16:05:03.209Z",
      "subject": "document/doc_tmp_spec_909",
      "data": {
        "supplier_display_name": "Harbor Milling Co.",
        "ingredient_display_name": "rolled oats",
        "source_workspace": "procurement",
        "target_workspace": "rd",
        "intended_workspace": "qa",
        "document_id": "doc_tmp_spec_909"
      }
    },
    {
      "id": "evt_01hx_frontend_click",
      "source": "signal.web-app",
      "type": "frontend.interaction.clicked",
      "time": "2026-06-05T16:05:05.290Z",
      "subject": "session/sess_01hx8x",
      "data": {
        "route": "/rfps/sweeteners/compare",
        "component": "quote-table",
        "element": "request-follow-up",
        "user_role": "buyer"
      }
    },
    {
      "id": "evt_01hx_northstar_spec_fields_extracted",
      "source": "signal.document-extractor",
      "type": "document.spec_sheet.fields_extracted",
      "time": "2026-06-08T14:05:18.662Z",
      "subject": "document/doc_tmp_spec_northstar_115",
      "data": {
        "thread_id": "thread-9d1c",
        "supplier_display_name": "Northstar Sweeteners",
        "ingredient_display_name": "rice syrup blend",
        "source_workspace": "rd",
        "intended_workspace": "qa",
        "missing_fields": [
          "allergen_statement"
        ],
        "extraction_confidence": 0.83
      }
    },
    {
      "id": "evt_01hx_harbor_followup_queued",
      "source": "signal.rfp-workflow",
      "type": "supplier.followup_email.queued",
      "time": "2026-06-08T14:05:24.901Z",
      "subject": "workflow/rfp_2026_05_grains",
      "data": {
        "supplier_display_name": "Harbor Milling Co.",
        "ingredient_display_name": "rolled oats",
        "workflow_id": "rfp_2026_05_grains",
        "requested_fields": [
          "lead_time",
          "coa",
          "allergen_statement"
        ]
      }
    },
    {
      "id": "evt_01hx_review_queue_opened",
      "source": "signal.qa-review",
      "type": "review.queue.item_opened",
      "time": "2026-06-08T16:40:50.554Z",
      "subject": "document/doc_tmp_7f4a",
      "data": {
        "queue": "ingredient-documents",
        "reason_codes": [
          "ocr_low_confidence",
          "coa_candidate"
        ],
        "user_role": "qa"
      }
    },
    {
      "id": "evt_01hx_rfq_request_created",
      "source": "signal.rfx-workflow",
      "type": "rfq.request.created",
      "time": "2026-06-10T14:10:21.330Z",
      "subject": "workflow/rfq_2026_06_sweeteners_price_check",
      "data": {
        "workflow_family": "rfx",
        "request_type": "rfq",
        "parent_workflow_id": "rfi_2026_06_sweeteners_discovery"
      }
    },
    {
      "id": "evt_01hx_rfq_outbound_queued",
      "source": "signal.email-ingestor",
      "type": "rfq.email.queued",
      "time": "2026-06-10T14:10:26.772Z",
      "subject": "workflow/rfq_2026_06_sweeteners_price_check",
      "data": {
        "workflow_family": "rfx",
        "request_type": "rfq",
        "recipient_domain_count": 3
      }
    },
    {
      "id": "evt_01hx_rfq_quote_rows_extracted",
      "source": "signal.document-extractor",
      "type": "rfq.quote.rows_extracted",
      "time": "2026-06-11T13:45:18.440Z",
      "subject": "document/doc_tmp_quote_183",
      "data": {
        "workflow_family": "rfx",
        "request_type": "rfq",
        "workflow_id": "rfq_2026_06_sweeteners_price_check",
        "row_count": 3
      }
    },
    {
      "id": "evt_01hx_revised_quote_row_extracted",
      "source": "signal.document-extractor",
      "type": "quote.row.revision_extracted",
      "time": "2026-06-11T13:45:20.118Z",
      "subject": "document/doc_tmp_quote_184",
      "data": {
        "thread_id": "thread-9d1c",
        "supplier_display_name": "Northstar Sweeteners",
        "ingredient_display_name": "rice syrup blend",
        "workflow_id": "rfp_2026_05_sweeteners",
        "extracted_fields": [
          "unit_price",
          "moq",
          "lead_time_days",
          "incoterms"
        ],
        "low_confidence_fields": [
          "moq"
        ],
        "quote_revision": "inline_reply_v2"
      }
    },
    {
      "id": "evt_01hx_rfp_comparison_rendered",
      "source": "signal.web-app",
      "type": "rfp.comparison.rendered",
      "time": "2026-06-11T13:45:22.903Z",
      "subject": "workflow/rfp_2026_05_sweeteners",
      "data": {
        "route": "/rfps/sweeteners/compare",
        "supplier_row_count": 3,
        "visible_warning_count": 2,
        "session_id": "sess_01hx8x"
      }
    },
    {
      "id": "evt_01hx_duplicate_coa_scan_matched",
      "source": "signal.document-extractor",
      "type": "document.coa.duplicate_scan_matched",
      "time": "2026-06-11T13:45:39.506Z",
      "subject": "document/doc_tmp_7f4a",
      "data": {
        "supplier_display_name": "Northstar Sweeteners",
        "ingredient_display_name": "rice syrup blend",
        "document_type_guess": "coa",
        "duplicate_candidate_document_ids": [
          "doc_tmp_7f4a"
        ],
        "low_confidence_fields": [
          "lot_number"
        ]
      }
    },
    {
      "id": "evt_01hx_coa_routed_to_qa",
      "source": "signal.web-app",
      "type": "document.workspace_routed",
      "time": "2026-06-11T13:45:44.810Z",
      "subject": "document/doc_tmp_7f4a",
      "data": {
        "source_workspace": "procurement",
        "target_workspace": "qa",
        "document_id": "doc_tmp_7f4a",
        "supplier_display_name": "Northstar Sweeteners",
        "ingredient_display_name": "rice syrup blend"
      }
    },
    {
      "id": "evt_01hx_cert_expired_extracted",
      "source": "signal.document-extractor",
      "type": "document.certification.expiration_extracted",
      "time": "2026-06-11T15:20:02.418Z",
      "subject": "document/doc_tmp_cert_442",
      "data": {
        "supplier_display_name": "Northstar Sweeteners",
        "ingredient_display_name": "rice syrup blend",
        "expiration_date": "2026-05-01",
        "document_type_guess": "organic_certification"
      }
    },
    {
      "id": "evt_01hx_supplier_edge_blocked",
      "source": "signal.supplier-graph",
      "type": "supplier_ingredient_edge.status_changed",
      "time": "2026-06-11T15:20:07.032Z",
      "subject": "edge/edge_northstar_rice_syrup_blend",
      "data": {
        "previous_status": "in_review",
        "next_status": "blocked",
        "blocked_by": "expired_certification",
        "blocking_document_id": "doc_tmp_cert_442"
      }
    },
    {
      "id": "evt_01hx_signal_candidate_emitted",
      "source": "signal.signal-service",
      "type": "signal.candidate.emitted",
      "time": "2026-06-11T15:20:11.640Z",
      "subject": "signal-candidate/sigcand_8c7a",
      "data": {
        "signal_kind": "supplier_edge_blocked",
        "owner_role": "qa",
        "evidence_refs": [
          "doc_tmp_cert_442",
          "edge_northstar_rice_syrup_blend",
          "thread-9d1c"
        ],
        "impact_kind": "rfp_award_delay"
      }
    },
    {
      "id": "evt_01hx_supplier_edge_blocked_missing_coa",
      "source": "signal.supplier-graph",
      "type": "supplier_ingredient_edge.status_changed",
      "time": "2026-06-11T15:20:13.008Z",
      "subject": "edge/edge_harbor_rolled_oats",
      "data": {
        "previous_status": "needs_review",
        "next_status": "blocked",
        "blocked_by": "missing_required_document",
        "missing_document_type": "coa",
        "last_seen_document_id": "doc_tmp_spec_909"
      }
    },
    {
      "id": "evt_01hx_signal_cta_clicked",
      "source": "signal.web-app",
      "type": "frontend.interaction.clicked",
      "time": "2026-06-11T15:20:20.337Z",
      "subject": "session/sess_01hx8x",
      "data": {
        "route": "/signals/sigcand_8c7a",
        "component": "signal-detail",
        "element": "request-cert-renewal",
        "signal_candidate_id": "sigcand_8c7a",
        "user_role": "buyer"
      }
    },
    {
      "id": "evt_01hx_northstar_reply_received",
      "source": "aws.ses",
      "type": "com.aws.ses.message.received",
      "time": "2026-06-12T14:08:02.771Z",
      "subject": "mailbox/sourcing",
      "data": {
        "message_id": "0101018f75b9a52c-0bb2",
        "thread_id": "thread-9d1c",
        "from_domain": "northstar-sweeteners.example",
        "attachment_count": 1,
        "in_reply_to_message_id": "0101018f75a2c1f4-7a4e"
      }
    },
    {
      "id": "evt_01hx_reply_body_quoted_content",
      "source": "signal.email-ingestor",
      "type": "email.reply_body.parsed",
      "time": "2026-06-12T14:08:04.188Z",
      "subject": "thread/thread-9d1c",
      "data": {
        "quoted_block_count": 5,
        "new_body_lines_detected": 3,
        "detected_forward_header_count": 2,
        "parser": "email-body-parser"
      }
    },
    {
      "id": "evt_01hx_cert_renewal_draft_extracted",
      "source": "signal.document-extractor",
      "type": "document.certification.fields_extracted",
      "time": "2026-06-12T14:08:07.932Z",
      "subject": "document/doc_tmp_cert_443",
      "data": {
        "thread_id": "thread-9d1c",
        "supplier_display_name": "Northstar Sweeteners",
        "document_type_guess": "organic_certification",
        "missing_fields": [
          "effective_date",
          "expiration_date",
          "signature"
        ],
        "watermark_text_detected": "draft"
      }
    },
    {
      "id": "evt_01hx_forwarded_to_qa_received",
      "source": "aws.ses",
      "type": "com.aws.ses.message.received",
      "time": "2026-06-12T14:08:18.409Z",
      "subject": "mailbox/qa",
      "data": {
        "message_id": "0101018f75b9be2d-a771",
        "thread_id": "thread-qa-33b",
        "from_domain": "northstar-sweeteners.example",
        "forwarded_from_mailbox": "sourcing@demo-brand.example",
        "attachment_count": 1
      }
    },
    {
      "id": "evt_01hx_attachment_duplicate_hash_seen",
      "source": "signal.document-extractor",
      "type": "document.attachment.duplicate_hash_detected",
      "time": "2026-06-12T14:08:21.016Z",
      "subject": "attachment/sha256:06f4387cf4",
      "data": {
        "current_thread_id": "thread-qa-33b",
        "previous_thread_id": "thread-9d1c",
        "current_mailbox": "qa@demo-brand.example",
        "previous_mailbox": "sourcing@demo-brand.example"
      }
    },
    {
      "id": "evt_01hx_cascadia_email_received",
      "source": "aws.ses",
      "type": "com.aws.ses.message.received",
      "time": "2026-06-12T17:30:08.112Z",
      "subject": "mailbox/sourcing",
      "data": {
        "message_id": "0101018f75bae6d0-45cf",
        "thread_id": "thread-cas-71e",
        "from_domain": "cascadia-syrups.example",
        "attachment_count": 3
      }
    },
    {
      "id": "evt_01hx_cascadia_workbook_sheets_read",
      "source": "signal.document-extractor",
      "type": "document.workbook.sheets_read",
      "time": "2026-06-12T17:30:12.634Z",
      "subject": "document/doc_tmp_quote_cascadia_019",
      "data": {
        "supplier_display_name": "Cascadia Syrups",
        "ingredient_display_name": "tapioca syrup",
        "sheet_names": [
          "May Quote",
          "Freight",
          "Archive"
        ],
        "hidden_sheet_count": 1,
        "formula_cell_count": 14
      }
    },
    {
      "id": "evt_01hx_cascadia_quote_units_inconsistent",
      "source": "signal.document-extractor",
      "type": "quote.row.units_inconsistent",
      "time": "2026-06-12T17:30:17.982Z",
      "subject": "document/doc_tmp_quote_cascadia_019",
      "data": {
        "supplier_display_name": "Cascadia Syrups",
        "ingredient_display_name": "tapioca syrup",
        "detected_price_units": [
          "per_lb",
          "per_drum"
        ],
        "detected_moq_units": [
          "pallet",
          "drum"
        ],
        "low_confidence_fields": [
          "price_unit",
          "moq_unit"
        ]
      }
    },
    {
      "id": "evt_01hx_evergreen_auto_reply_received",
      "source": "aws.ses",
      "type": "email.auto_reply.received",
      "time": "2026-06-15T14:03:01.533Z",
      "subject": "thread/thread-evergreen-2a6f",
      "data": {
        "from_domain": "evergreen-grain.example",
        "mailbox": "sourcing@demo-brand.example",
        "auto_submitted_header": "auto-replied",
        "attachment_count": 0
      }
    },
    {
      "id": "evt_01hx_evergreen_followup_bounced",
      "source": "signal.email-ingestor",
      "type": "outbound_email.delivery_bounced",
      "time": "2026-06-15T14:03:19.777Z",
      "subject": "workflow/rfp_2026_05_grains",
      "data": {
        "queue": "outbound-email",
        "recipient_domain": "evergreen-grain.example",
        "smtp_status": "550",
        "bounce_type": "mailbox_unavailable",
        "attempt": 1
      }
    },
    {
      "id": "evt_01hx_evergreen_followup_requeued",
      "source": "signal.rfp-workflow",
      "type": "outbound_email.requeued",
      "time": "2026-06-15T14:03:47.040Z",
      "subject": "workflow/rfp_2026_05_grains",
      "data": {
        "queue": "outbound-email",
        "recipient_domain": "evergreen-grain.example",
        "recipient_source": "thread_cc",
        "previous_attempts": 1
      }
    },
    {
      "id": "evt_01hx_cascadia_row_impressed",
      "source": "signal.web-app",
      "type": "frontend.interaction.impressed",
      "time": "2026-06-15T19:47:03.261Z",
      "subject": "session/sess_01hx8x",
      "data": {
        "route": "/rfps/sweeteners/compare",
        "component": "supplier-row",
        "element": "cascadia-syrups-row",
        "workflow_id": "rfp_2026_05_sweeteners"
      }
    },
    {
      "id": "evt_01hx_cascadia_source_email_opened",
      "source": "signal.web-app",
      "type": "frontend.interaction.clicked",
      "time": "2026-06-15T19:47:08.804Z",
      "subject": "session/sess_01hx8x",
      "data": {
        "route": "/rfps/sweeteners/compare",
        "component": "supplier-row",
        "element": "open-source-email",
        "supplier_display_name": "Cascadia Syrups",
        "thread_id": "thread-cas-71e"
      }
    },
    {
      "id": "evt_01hx_loma_packaging_email_received",
      "source": "aws.ses",
      "type": "com.aws.ses.message.received",
      "time": "2026-06-16T14:20:33.612Z",
      "subject": "mailbox/sourcing",
      "data": {
        "message_id": "0101018f75bc8fb0-93d4",
        "thread_id": "thread-pack-4de",
        "from_domain": "loma-packaging.example",
        "attachment_count": 2
      }
    },
    {
      "id": "evt_01hx_loma_spec_translated",
      "source": "signal.document-extractor",
      "type": "document.spec_sheet.translated_fields_extracted",
      "time": "2026-06-16T14:20:37.069Z",
      "subject": "document/doc_tmp_pack_spec_502",
      "data": {
        "supplier_display_name": "Loma Packaging",
        "material_display_name": "printed wrapper film",
        "language_detected": "es",
        "translated_field_count": 6,
        "missing_fields": [
          "food_contact_statement"
        ]
      }
    },
    {
      "id": "evt_01hx_loma_cert_supplier_mismatch",
      "source": "signal.document-extractor",
      "type": "document.certification.supplier_name_mismatch",
      "time": "2026-06-16T14:20:41.455Z",
      "subject": "document/doc_tmp_pack_cert_503",
      "data": {
        "filename_supplier_hint": "Loma Packaging",
        "extracted_supplier_name": "Loma Flexible Films S.A.",
        "candidate_scores": [
          0.87,
          0.79
        ],
        "low_confidence_fields": [
          "supplier_name"
        ]
      }
    },
    {
      "id": "evt_01hx_thread_index_retry_succeeded",
      "source": "signal.search-indexer",
      "type": "search.index_update.retry_succeeded",
      "time": "2026-06-17T16:10:06.100Z",
      "subject": "thread/thread-9d1c",
      "data": {
        "index": "supplier_threads_v3",
        "retry_count": 2,
        "updated_document_count": 4,
        "previous_error_name": "VersionConflictEngineException"
      }
    },
    {
      "id": "evt_01hx_rfp_packet_from_rfx_evidence",
      "source": "signal.rfx-workflow",
      "type": "rfp.packet.assembled",
      "time": "2026-06-17T16:10:16.084Z",
      "subject": "workflow/rfp_2026_06_sweeteners_award",
      "data": {
        "workflow_family": "rfx",
        "request_type": "rfp",
        "parent_workflow_ids": [
          "rfi_2026_06_sweeteners_discovery",
          "rfq_2026_06_sweeteners_price_check"
        ]
      }
    },
    {
      "id": "evt_01hx_qa_marks_cert_field_review",
      "source": "signal.web-app",
      "type": "frontend.interaction.clicked",
      "time": "2026-06-18T14:40:48.930Z",
      "subject": "session/sess_qa_77",
      "data": {
        "route": "/documents/doc_tmp_cert_443",
        "component": "document-field-panel",
        "element": "mark-field-needs-review",
        "field": "expiration_date",
        "document_id": "doc_tmp_cert_443"
      }
    },
    {
      "id": "evt_01hx_bol_fields_extracted",
      "source": "signal.document-extractor",
      "type": "document.bol.fields_extracted",
      "time": "2026-06-18T15:02:13.240Z",
      "subject": "document/doc_tmp_bol_771",
      "data": {
        "workflow_id": "rfp_2026_06_sweeteners_award",
        "request_type": "rfp",
        "supplier_display_name": "Northstar Sweeteners",
        "ingredient_display_name": "rice syrup blend",
        "document_id": "doc_tmp_bol_771",
        "document_type_guess": "bol",
        "extracted_fields": [
          "bill_of_lading",
          "carrier",
          "delivery_date",
          "lot_number"
        ]
      }
    },
    {
      "id": "evt_01hx_traceability_fields_extracted",
      "source": "signal.document-extractor",
      "type": "document.traceability.fields_extracted",
      "time": "2026-06-18T15:07:44.510Z",
      "subject": "document/doc_tmp_trace_771",
      "data": {
        "workflow_id": "rfp_2026_06_sweeteners_award",
        "request_type": "rfp",
        "supplier_display_name": "Northstar Sweeteners",
        "ingredient_display_name": "rice syrup blend",
        "document_id": "doc_tmp_trace_771",
        "document_type_guess": "traceability_document",
        "extracted_fields": [
          "traceability_document",
          "lot_number",
          "source_origin"
        ]
      }
    },
    {
      "id": "evt_01hx_rd_allergen_review_requested",
      "source": "signal.web-app",
      "type": "internal.handoff.review_requested",
      "time": "2026-06-18T15:12:02.118Z",
      "subject": "document/doc_tmp_spec_909",
      "data": {
        "workflow_id": "rfp_2026_06_sweeteners_award",
        "request_type": "rfp",
        "supplier_display_name": "Northstar Sweeteners",
        "ingredient_display_name": "rice syrup blend",
        "document_id": "doc_tmp_spec_909",
        "document_type_guess": "allergen_statement",
        "from_role": "qa",
        "to_role": "rd",
        "owner_role": "rd",
        "extracted_fields": [
          "allergen_statement",
          "cross_contact_risk"
        ]
      }
    },
    {
      "id": "evt_01hx_unrelated_subject_match_received",
      "source": "signal.email-ingestor",
      "type": "email.thread.subject_hash_collision",
      "time": "2026-06-18T19:15:15.203Z",
      "subject": "thread/thread-9d1c",
      "data": {
        "from_domain": "northstar-logistics.example",
        "mailbox": "sourcing@demo-brand.example",
        "subject_hash": "sha256:53f8c90b",
        "detected_invoice_terms": true,
        "supplier_domain_mismatch": true
      }
    }
  ]
};
