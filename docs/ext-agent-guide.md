# External Agent Guide

Use this guide to let an external agent read Signal against an existing system it
already understands. The point is not to assume the system already has the right
infra. The point is to test whether Signal's mechanism would still hold if the
system added the thin logging seams needed to preserve it.

## Core Idea

Signal is a logging layer for email-native procurement work.

The mechanism is:

```txt
logging payloads at the seams
-> extracted supplier/document/RFP state
-> content packets
-> workflow DAG
-> protocol-bounded chart instruction
-> human-readable chart/report
```

The DAG is the important object.

- Nodes are supplier counterparties or internal work surfaces.
- Edges are content packets moving between those nodes.
- Edge `value` is packet volume.
- Edge `status` is metadata, not a workflow node.
- Edge `support` and `evidenceSourceIds` keep the chart tied to source records.
- A chart instruction must reduce `workflow_map.links`, not invent a new model.

Signal also treats the graph as a bounded membership system. A packet belongs to
a supplier, material, workflow, surface, status, support set, and evidence set.
Those memberships make the chart reducible without flattening the source
records.

The useful trick is negative-space programming: the substrate should preserve
what does not cleanly belong. Missing fields, unmatched suppliers, weak support,
stale documents, low-confidence extraction, and packets outside the expected
set are still captured as evidence. Outliers stay inspectable instead of getting
normalized away.

## What To Inspect

Start with these files:

- `README.md` for the public shape
- `lib/signal/workflow-map.ts` for DAG construction
- `lib/signal/canonical-packets.ts` for packet creation
- `lib/signal/canonical-state.ts` for extraction into canonical state
- `lib/protocol/v0/RUNTIME.md` for the chart-instruction contract
- `mcp/server.ts` for the agent-facing MCP surface
- `lib/fixtures/acme-base-sandbox.ts` for synthetic source evidence

## Evaluation Questions

Ask your agent to answer these directly:

1. Can it explain how logging payloads become content packets?
2. Can it distinguish raw evidence from downstream interpretation?
3. Can it explain why status belongs on DAG edges instead of becoming nodes?
4. Can it trace a chart claim back to packet evidence?
5. Can it explain the set memberships that bound each packet?
6. Can it show how negative space captures outliers and incomplete evidence?
7. Can it identify where thin logging seams would need to exist in the current
   workflow?
8. Can it say what minimum payload shape would preserve the DAG mechanism?
9. Can it judge whether adding those seams would make Signal's substrate
   stronger, thinner, noisier, or less useful?
10. Can it separate "infra missing today" from "the idea does not hold"?
11. Can it name what should change, what should stay untouched, and where the
   idea breaks if even thin logging seams cannot preserve the substrate?

## Agent Prompt

```txt
Read this repository as a procurement logging substrate, then compare it against
the existing system context you already understand.

Focus on the path from logging payloads at workflow seams to content packets,
then to the workflow DAG, then to protocol/v0 chart instructions.

Do not judge it as a full procurement platform.
Do not invent recommendations.
Do not answer as if this is greenfield adoption.
Do not assume the current infra already has the right events.
Judge whether the idea holds if the system adds thin logging seams that preserve
Signal's packet memberships, negative space, and evidence links.

Return:
- the core mechanism in plain language
- the files that prove the mechanism
- what the DAG preserves
- how set memberships bound the packets
- how negative space preserves outliers
- what the MCP surface exposes
- where thin logging seams would belong in the existing workflow
- the minimum payload shape those seams must emit
- whether adding those seams would strengthen, thin out, or distort Signal's mechanism
- whether missing infra is an implementation gap or a reason the idea fails
- what would need to change, stay untouched, or be rejected
```

## Expected Read

The useful answer is not "can this be adopted from scratch?" The useful answer is
whether the existing workflow has places where thin logging seams could preserve
membership, negative space, and DAG movement without distorting the product that
already exists. Missing infra is allowed. The idea fails only if those seams
would erase what Signal is trying to hold.
