---
name: signals-logging
description: Use when adding or reviewing product logs that should be ingestible by Signal. Guides agents to add non-blocking, privacy-conscious JSON workflow boundary logs with stable fields for downstream normalization into chartable flow/DAG data.
---

# signals:logging

Add logs that help Signal understand product workflow state without changing product behavior.

## Rules

- Log durable workflow boundaries, not every interaction.
- Prefer the product's existing logger, queue, or telemetry client.
- Logging must be non-blocking: logging failure must not fail the product path.
- Do not add business decisions, recommendations, or status interpretation.
- Do not log secrets, credentials, tokens, payment data, raw email bodies, full document text, or unnecessary personal data.
- Supplier names, company names, material names, document types, workflow ids, entity ids, and coarse roles are okay when they are needed to understand workflow state.
- If sensitive context is needed, log a stable reference id instead of the raw content.
- Keep unknowns explicit. Use `"unknown"` or omit optional fields; do not invent data.

## Log at these boundaries

- Input received.
- Document classified.
- Entity extracted.
- Confidence scored.
- Human reviewed.
- Counterparty or supplier state updated.
- Request sent.
- Response received.
- Gate checked.
- Handoff completed.

## Minimum event shape

```ts
{
  event_name: string;
  occurred_at: string; // ISO 8601
  surface: string;
  actor_role?: string;
  counterparty?: string;
  workflow_id?: string;
  entity_kind?: string;
  entity_id?: string;
  content_kind?: string;
  value_state?: "requested" | "received" | "unknown";
  support?: "direct" | "partial" | "inferred";
  attributes?: Record<string, unknown>;
}
```

## Good example

```ts
logger.info("signal.workflow_event", {
  event_name: "supplier.response.received",
  occurred_at: new Date().toISOString(),
  surface: "procurement",
  actor_role: "supplier",
  counterparty: supplier.name,
  workflow_id: rfp.id,
  entity_kind: "quote",
  entity_id: quote.id,
  content_kind: "lead_time",
  value_state: "received",
  support: "direct",
  attributes: {
    source: "email",
    confidence: 0.92,
  },
});
```

## Bad example

```ts
logger.info("signal.workflow_event", {
  email_body: rawEmail.body,
  attachment_text: extractedFullDocument,
  api_token: process.env.API_TOKEN,
  supplier_contact_email: supplier.contactEmail,
});
```

## Patch workflow

1. Inspect the existing logging/telemetry path first.
2. Add the smallest log at the workflow boundary.
3. Keep the log payload JSON-serializable.
4. Wrap best-effort logging if the existing logger can throw.
5. Verify the product path still works without relying on the log succeeding.
