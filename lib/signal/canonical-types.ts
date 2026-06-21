import type { JsonValue } from "@/lib/signal/intelligence";

export type SignalWorkflowStatus =
  | "requested"
  | "received"
  | "review_required"
  | "blocked";
export type SignalEvidenceSupport = "strong" | "partial";

export interface SignalEntityInstance {
  id: string;
  nodeId: SignalWorkflowNodeId;
  parentRefs: string[];
  payload: SignalEntityPayload;
  asOf: string;
  evidenceSourceIds: string[];
  support: SignalEvidenceSupport;
  summary: string;
  supplier?: string;
  material?: string;
  workflowId?: string;
  ownerRole?: string;
  status?: SignalWorkflowStatus;
}

export interface SignalCanonicalState {
  entities: SignalEntityInstance[];
  packetSets: SignalPacketSetState;
}

export interface SignalContentPacket {
  id: string;
  source: SignalWorkSurface;
  target: SignalWorkSurface;
  value: number;
  flowUnit: "content_packet";
  contentLabel: string;
  contentKinds: string[];
  packetState?: SignalWorkflowStatus;
  ownerRole?: string;
  supplier?: string;
  material?: string;
  workflowId?: string;
  support: SignalEvidenceSupport;
  evidenceSourceIds: string[];
  sourceEntityIds: string[];
  observedAt: string;
  timeBucket: string;
  attributes: Record<string, JsonValue>;
  summary: string;
}

export interface SignalWorkSurface {
  id: string;
  label: string;
  kind: "client_role" | "supplier";
}

export interface SignalPacketOmission {
  reason: "not_dag_mappable" | "not_renderable";
  sourceEntityId: string;
  summary: string;
}

export interface SignalPacketSetState {
  admittedPackets: SignalContentPacket[];
  dagMappablePackets: SignalContentPacket[];
  renderablePackets: SignalContentPacket[];
  omissions: SignalPacketOmission[];
}

export type SignalWorkflowNodeId =
  | "supplier_email_inbox"
  | "email_instance"
  | "rfx_related_content"
  | "document_instance"
  | "rfp"
  | "rfq"
  | "rfi"
  | "supplier_boundary"
  | "price_received"
  | "moq_received"
  | "lead_time_received"
  | "incoterms_received"
  | "docs_received"
  | "rfp_response_received"
  | "coa"
  | "spec_sheet"
  | "haccp_plan"
  | "sds"
  | "supplier_questionnaire"
  | "insurance_certificate"
  | "certification"
  | "qa_gate"
  | "system_entry"
  | "purchase_order"
  | "invoice"
  | "bol"
  | "lot_coa"
  | "otif"
  | "realized_value";

type SignalEntityPayload =
  | {
      kind: "supplier_email_inbox";
      mailbox: string;
    }
  | {
      kind: "email_instance";
      threadId: string;
      supplierDomain: string;
      attachmentCount: number;
    }
  | {
      kind: "rfx_related_content";
      requestKind: "rfp" | "rfq" | "rfi";
      workflowId: string;
      fields: string[];
    }
  | {
      kind: "document_instance";
      documentId: string;
      documentType: string;
    }
  | {
      kind: "client_request";
      requestKind: "rfp" | "rfq" | "rfi";
      workflowId: string;
    }
  | {
      kind: "supplier_boundary";
      supplierId: string;
      sourcingProcessRef: string;
      clientRequestRef: string;
      enteredBoundaryAt: string;
    }
  | {
      kind: "sourcing_field";
      field: string;
      valueState: "received" | "requested";
    }
  | {
      kind: "document";
      documentId: string;
      documentType: string;
      confidence?: number;
      expirationDate?: string;
      certificateType?: string;
      lowConfidenceFields?: string[];
    }
  | {
      kind: "supplier_gate";
      gateKind: "qa_review" | "supplier_document_gate";
      reasonCodes: string[];
    }
  | {
      kind: "empty_future_node";
    };

