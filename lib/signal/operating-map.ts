import type { AcmeBaseSandbox } from "@/lib/fixtures/acme-base-sandbox";
import {
  collectSourceRecords,
  type SourceRecord,
} from "@/lib/signal/intelligence";

export type SignalWorkflowLaneStatus =
  | "moving"
  | "slow"
  | "blocked"
  | "healthy";

export type SignalEvidenceStrength = "strong" | "partial";

export interface SignalWorkflowLane {
  id: string;
  laneKind:
    | "supplier_quote_followup"
    | "document_extraction_review"
    | "supplier_document_gate"
    | "operator_visibility";
  supplier: string;
  material: string;
  workflowId: string;
  ownerRole: string;
  status: SignalWorkflowLaneStatus;
  evidenceStrength: SignalEvidenceStrength;
  evidenceSourceIds: string[];
  summary: string;
}

export interface SignalWorkflowSignal {
  id: string;
  signalKind: string;
  severity: "watch" | "blocking";
  supplier: string;
  material: string;
  ownerRole: string;
  workflowId: string;
  evidenceSourceIds: string[];
  summary: string;
  businessImpactKind: string;
}

export interface SignalInterventionCandidate {
  id: string;
  action: string;
  ownerRole: string;
  sourceSignalId: string;
  evidenceSourceIds: string[];
  whyNow: string;
  expectedBusinessOutcome: string;
}

export interface SignalBusinessImpactRow {
  id: string;
  impactKind:
    | "rfp_speed"
    | "audit_readiness"
    | "supplier_redundancy"
    | "margin_leverage";
  evidenceStrength: SignalEvidenceStrength;
  workflowId: string;
  supplier: string;
  material: string;
  evidenceSourceIds: string[];
  summary: string;
}

export interface SignalOperatingMapState {
  workflowLanes: SignalWorkflowLane[];
  workflowSignals: SignalWorkflowSignal[];
  interventionCandidates: SignalInterventionCandidate[];
  businessImpactRows: SignalBusinessImpactRow[];
}

const northstarWorkflow = {
  supplier: "Northstar Sweeteners",
  material: "rice syrup blend",
  workflowId: "rfp_2026_05_sweeteners",
};

export function buildSignalOperatingMapState(
  ingress: AcmeBaseSandbox,
): SignalOperatingMapState {
  const records = collectSourceRecords(ingress);
  const blockedSignal = buildBlockedEdgeSignal(records);

  return {
    workflowLanes: buildWorkflowLanes(records),
    workflowSignals: [blockedSignal],
    interventionCandidates: [buildCertRenewalIntervention(blockedSignal)],
    businessImpactRows: buildBusinessImpactRows(records, blockedSignal),
  };
}

function buildWorkflowLanes(records: SourceRecord[]): SignalWorkflowLane[] {
  return [
    {
      id: "lane:northstar:rice-syrup-blend:quote-followup",
      laneKind: "supplier_quote_followup",
      ...northstarWorkflow,
      ownerRole: "buyer",
      status: "moving",
      evidenceStrength: "partial",
      evidenceSourceIds: sourceIds(
        records,
        hasAttribute("requested_fields"),
        hasAttributeValue("template", "quote_followup_moq_leadtime"),
        hasAttribute("detected_currency_tokens"),
        hasAttribute("detected_quantity_tokens"),
      ),
      summary:
        "Buyer follow-up is in motion for MOQ, lead time, and incoterms after supplier quote data appeared in email body.",
    },
    {
      id: "lane:northstar:rice-syrup-blend:coa-review",
      laneKind: "document_extraction_review",
      ...northstarWorkflow,
      ownerRole: "qa",
      status: "slow",
      evidenceStrength: "strong",
      evidenceSourceIds: sourceIds(
        records,
        hasAttributeValue("document_type_guess", "coa"),
        hasAttributeValue("document.type_guess", "coa"),
        hasAttribute("low_confidence_fields"),
        hasAttributeValue("reason_codes", "ocr_low_confidence"),
        hasAttributeValue("highlighted_field", "lot_number"),
      ),
      summary:
        "CoA extraction reached QA review because lot number and micro result fields carried low confidence.",
    },
    {
      id: "lane:northstar:rice-syrup-blend:certification-gate",
      laneKind: "supplier_document_gate",
      ...northstarWorkflow,
      ownerRole: "qa",
      status: "blocked",
      evidenceStrength: "strong",
      evidenceSourceIds: sourceIds(
        records,
        hasAttributeValue("document_type_guess", "organic_certification"),
        hasAttributeValue("document.type_guess", "organic_certification"),
        hasAttributeValue("blocked_by", "expired_certification"),
        hasAttributeValue("edge.blocked_by", "expired_certification"),
        hasAttributeValue("next_edge_status", "blocked"),
        hasAttributeValue("next_status", "blocked"),
        hasAttributeValue("edge.status.next", "blocked"),
      ),
      summary:
        "Organic certification evidence is expired, and the supplier-material edge is blocked before RFP award.",
    },
    {
      id: "lane:northstar:rice-syrup-blend:operator-visibility",
      laneKind: "operator_visibility",
      ...northstarWorkflow,
      ownerRole: "buyer",
      status: "healthy",
      evidenceStrength: "partial",
      evidenceSourceIds: sourceIds(
        records,
        hasAttributeValue("route", "/signals/sigcand_8c7a"),
        hasAttributeValue("signal_kind", "supplier_edge_blocked"),
        hasAttributeValue("signal.kind", "supplier_edge_blocked"),
        hasAttributeValue("primary_cta", "request_cert_renewal"),
      ),
      summary:
        "The generated signal was visible in the workspace with owner, evidence, business impact, and renewal action sections.",
    },
  ];
}

function buildBlockedEdgeSignal(
  records: SourceRecord[],
): SignalWorkflowSignal {
  const evidenceSourceIds = sourceIds(
    records,
    hasAttributeValue("signal_candidate_id", "sigcand_8c7a"),
    hasAttributeValue("signal_kind", "supplier_edge_blocked"),
    hasAttributeValue("signal.kind", "supplier_edge_blocked"),
    hasAttributeValue("blocked_by", "expired_certification"),
    hasAttributeValue("edge.blocked_by", "expired_certification"),
    hasAttributeValue("impact_kind", "rfp_award_delay"),
    hasAttributeValue("signal.impact_kind", "rfp_award_delay"),
  );

  return {
    id: "sigcand_8c7a",
    signalKind: "supplier_edge_blocked",
    severity: "blocking",
    ...northstarWorkflow,
    ownerRole: "qa",
    evidenceSourceIds,
    summary:
      "Northstar Sweeteners cannot move to RFP award for rice syrup blend while the organic certification gate is blocked.",
    businessImpactKind: "rfp_award_delay",
  };
}

function buildCertRenewalIntervention(
  signal: SignalWorkflowSignal,
): SignalInterventionCandidate {
  return {
    id: "intervention:sigcand_8c7a:request-cert-renewal",
    action: "request_cert_renewal",
    ownerRole: "qa",
    sourceSignalId: signal.id,
    evidenceSourceIds: signal.evidenceSourceIds,
    whyNow:
      "The supplier-material edge is blocked by expired organic certification, and the signal already names QA ownership.",
    expectedBusinessOutcome:
      "Renewed certification evidence can unblock the Northstar RFP award path.",
  };
}

function buildBusinessImpactRows(
  records: SourceRecord[],
  signal: SignalWorkflowSignal,
): SignalBusinessImpactRow[] {
  return [
    {
      id: "impact:northstar:rfp-speed",
      impactKind: "rfp_speed",
      evidenceStrength: "strong",
      ...northstarWorkflow,
      evidenceSourceIds: signal.evidenceSourceIds,
      summary:
        "The fixture explicitly marks the blocked edge signal with rfp_award_delay impact.",
    },
    {
      id: "impact:northstar:audit-readiness",
      impactKind: "audit_readiness",
      evidenceStrength: "partial",
      ...northstarWorkflow,
      evidenceSourceIds: sourceIds(
        records,
        hasAttributeValue("document_type_guess", "organic_certification"),
        hasAttributeValue("document.type_guess", "organic_certification"),
        hasAttribute("expiration_date"),
        hasAttribute("cert.expiration_date"),
        hasAttributeValue("blocking_document_id", "doc_tmp_cert_442"),
      ),
      summary:
        "Expired organic certification is enough to flag audit-readiness exposure, but the fixture does not include the full audit packet.",
    },
  ];
}

function sourceIds(
  records: SourceRecord[],
  ...predicates: Array<(record: SourceRecord) => boolean>
) {
  return Array.from(
    new Set(
      records
        .filter((record) => predicates.some((predicate) => predicate(record)))
        .map((record) => record.id),
    ),
  );
}

function hasAttribute(key: string) {
  return (record: SourceRecord) => key in record.attributes;
}

function hasAttributeValue(key: string, expectedValue: string) {
  return (record: SourceRecord) => {
    const value = record.attributes[key];

    if (Array.isArray(value)) {
      return value.includes(expectedValue);
    }

    return value === expectedValue;
  };
}
