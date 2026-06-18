# AGENTS.md

## Philosophy

+ Restrain from concluding your intent. **Do not** assume a codebase intent. The intent is gathered from objective discussions **ONLY**.
+ When researching or implementing **never** perfect the slice of the application. This accumulates bloat that we might not need. Think vertically and roughly reason the vertical slice (aka how it looks e2e) then implement. Explain why you scoped it small. If unclear, always ask for clarifications. I personally appreciate it.

## Project direction

Signal is an FDE application artifact for email-native procurement workflows.
The goal is not to build a whole procurement platform; it is to prove one
convincing vertical slice of the mental model:

`messy supplier evidence -> extracted workflow state -> flow/slowdown/healthy lane signal -> surfaced intervention context -> business impact`

Use ambiguity tolerance by deciding what not to build. Keep asking: can a COO,
FDE, engineer, or customer success lead look at this and know where value is
flowing, where attention is needed, and what evidence supports it?

Signal should show both positive and negative flow: traffic, throughput, healthy
lanes, slowdowns, blocked handoffs, activation gaps, intervention context, and
business meaning. Do not reduce it to only RCA for failures.

Prefer one believable email-native slice over a broad demo. A good slice
starts with messy supplier emails/documents, extracts supplier/ingredient/RFP/doc
state, shows which lanes are moving or waiting, explains the emphasis, and ties
the next action to margin, RFP speed, audit readiness, production release,
supplier redundancy, renewal proof, or expansion.

## While issue debugging

### Audit discipline

Before proposing a debugging change, inspect the full relevant execution path, not necessarily the entire repository.

Relevant execution path means:

+ The entrypoint where the failing behavior is triggered.
+ The components/modules/functions directly involved in the failing flow.
+ The data contracts, schemas, API boundaries, persistence layer, or external calls touched by that flow.
+ Existing tests or test fixtures that describe the intended behavior.
+ Nearby analogous flows when they clarify expected architecture or naming conventions.

Do not perform a whole-repository audit by default. Escalate to broader repo inspection only when:

+ The failure crosses unclear architectural boundaries.
+ The same pattern appears reused in multiple places.
+ A local fix risks breaking shared contracts.
+ The root cause cannot be established from the relevant execution path.

The goal is enough context to understand architecture, data flow, and test coverage for the issue, while avoiding exhaustive exploration that delays a minimal vertical fix.

### RCA pattern

Search in this manner

`why this fails? -> why does this happen? -> why is it possible? -> what contributes to the issue -> what can I change minimally to fix all the whys?`

Before change, think if you change X, what else breaks? List downstream cascading failures. Use the /azimuth skill to validate/invalidate.

For applications, Threat model when applicable. Use STRIDE(Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege)

## Code writing practices

+ We do not write unit tests on the turn we implement. Unit tests should be built after **my approval** and when runtime execution failure is reflected.
+ Prevent contract or typed schema sprawling because of naming convention mis-maps.

## Commits

One commit per issue. Message format: what the problem is,

why it matters, what changed, what was not changed.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
