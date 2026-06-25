# Signals

Signals is a logging layer for email-native procurement work.

Procurement rarely begins as a clean workflow. It begins as supplier emails, PDFs, spreadsheets, partial logs, review clicks, stale docs, and people deciding what matters.

Signals structures that into an observable substrate:

```txt
messy supplier evidence
-> extracted workflow state
-> content-flow DAG
-> protocol-bounded chart instruction
-> human interpretation
```

The core unit is a content packet: what moved, between which supplier and internal surface, with what status, support, and source evidence behind it.

## Check Fit With Your Agent
Ask a local agent to read [docs/ext-agent-guide.md](docs/ext-agent-guide.md) and decide whether Signals fits the workflow it is comparing against.

## What It Does
- keeps supplier communication as raw-ish evidence first
- extracts entities such as supplier, ingredient, document, RFx state, etc.
- projects that state into a workflow DAG
- keeps status as link metadata, not workflow nodes
- lets an agent request charts through a narrow protocol
- renders validated chart data for human interpretation

## Demo Shape
Fixtures: `acme-base-sandbox` and `gold-coast-bakery-sandbox`.
They are synthetic, not customer case studies. They look like app evidence: logs, metrics, traces, and events before the intelligence layer cleans anything up. The repo keeps that boundary explicit.
Stack: Next.js app, block canvas, canonical procurement state, workflow DAG, protocol `v0`, JSON renderer, and MCP endpoint.

## Run
```bash
npm install
npm run dev
```
Open `http://localhost:3000/acme-base-sandbox` or `http://localhost:3000/gold-coast-bakery-sandbox`.
## MCP
```bash
npx add-mcp@latest https://signals-ws.vercel.app/api/mcp --name Signals
```
The MCP surface is granular. Discover findings, resolve aliases, default reads to `latest`, ask explicitly for `all_time`, and serialize bounded contracts for agents.

## Agent Skill
```bash
npx skills add dunkeln/signals --skill signals-logging
```
Handoff to the agent to track logging payloads at the seams while development.

## How It Works
A buyer asks suppliers for rice syrup pricing. Northstar replies with a quote
sheet, a CoA, and a changed lead time. Evergreen replies later with a spec sheet,
but the allergen field is missing.

Signals watches the workflow seams:

```txt
email received -> attachment stored -> document extracted
field confidence recorded -> review opened -> chart requested
```

Those payloads become extracted state: supplier, ingredient, document, RFx
thread, confidence, timestamp, owner surface, and evidence id.

Signals turns that state into packets:

```txt
Northstar -> Procurement: price, MOQ, lead time
Northstar -> QA: CoA, certification, spec evidence
Evergreen -> QA: spec sheet with missing allergen context
```

The DAG is those packets made inspectable: suppliers and work surfaces are nodes;
packets are edges; status, support, and evidence stay on the edge.

The negative space stays visible too. Missing allergen context, stale documents,
weak confidence, or unmatched suppliers become weak support, missing membership,
omitted packets, or low-confidence evidence.

An agent can ask through MCP for packet mix, QA support split, or a reduction
over `workflow_map.links`. The human gets the last mile: a chart, a report block,
and enough evidence to decide what the procurement workflow is saying.
