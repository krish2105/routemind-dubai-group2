# Risk Register (owner: Karan Baid's area; completed by Yash after Karan left on 15 Nov 2026)

Likelihood (L) and impact (I): Low / Medium / High, our judgement for the fictional DubaiDash Express (assumed, not measured).
Every risk has a mitigation, a fallback if it happens, an owner role, and the C-suite theme it belongs to
(business model, tech investment, ecosystem integration, operational risk). Facts cited by row number (R#) come from `docs/04_research_brief.md`.
The same table is shown on `/integration` (source: `web/app/integration/risks.ts`; keep both in sync).

| # | Risk | L | I | Mitigation | Fallback if it happens | Owner role | C-suite theme |
|---|---|---|---|---|---|---|---|
| 1 | Poor data quality (bad addresses, missing time windows) | H | H | Address validation using Makani where available (R13); data checks before optimisation | Dispatcher confirms flagged stops by phone; use the manual plan for those stops | Data lead | Operational risk |
| 2 | Legacy TMS/WMS cannot integrate quickly | M | H | Start with file or API exports; integrate in phases | Run RouteMind in parallel as an advisory tool | IT lead | Ecosystem integration |
| 3 | Driver adoption and trust | M | H | Co-design with drivers, explain ETAs (feature importance), fair workload metric | Keep manual route available; driver feedback loop | Ops manager | Operational risk |
| 4 | Privacy and legal (UAE PDPL, R19) | M | H | Data minimisation, consent, no personal data in the public build; confirm executive-regulation status with legal counsel (R20) | Pause the feature that uses the data; revert to anonymised IDs | Legal / DPO | Operational risk |
| 5 | Model failure or bad ETA in unusual weather | M | M | Monitor ETA error; sandstorm and rain scenarios in testing | Fall back to historical average ETA; human override | ML lead | Tech investment |
| 6 | Heat and labour rules (midday break 12:30 to 15:00, 15 Jun to 15 Sep, R14) | M | H | Scheduler respects rest windows; fairness metric | Manual re-plan; add rest-area stops | Ops manager | Operational risk |
| 7 | Over-promised savings (simulation vs real) | H | M | Pilot with go/no-go gates; show results as simulated; adoption haircut in ROI | Stop at gate 1 if cost per parcel does not improve | Programme sponsor | Business model |
| 8 | Cloud/API outage (traffic feed, weather feed, LLM copilot) | M | L | Cached travel-time matrix, template messages | Template delay messages; static multipliers; last accepted plan | IT lead | Tech investment |
| 9 | Partner dependency (robots, lockers, EV charging, R16, R17) | M | M | Contract multiple partners; phase 3 only | Keep vans and bikes as base network | Partnerships lead | Ecosystem integration |
| 10 | Model drift (demand, traffic or city layout changes after go-live) | M | M | Weekly accuracy check on ETA and plan quality; retrain on new data; alert when error rises | Freeze the model version; widen safety buffers on windows | ML lead | Tech investment |
| 11 | Over-optimisation vs fairness (some drivers get the hardest routes, unsafe pace) | M | H | Workload spread (CV) as a KPI; caps on stops and duty hours; driver panel reviews | Dispatcher rebalances routes by hand; cap the optimiser's moves | Ops manager | Operational risk |
| 12 | Vendor lock-in (maps, cloud, routing APIs) | M | M | Open formats (JSON plans), open-source engine, exportable data; avoid single-vendor features | Switch provider using the haversine fallback while migrating | IT lead | Tech investment |
| 13 | Cost overrun of the pilot (integration takes longer, more licences) | M | M | Fixed-scope 90-day pilot, monthly budget review, gates before phase 2 | Stop or re-scope at the gate; keep advisory mode only | Programme sponsor | Business model |
| 14 | Regulatory change (autonomous delivery, data, labour rules, R15, R19) | L | M | Track RTA and federal updates; legal review before each phase; modular design | Disable the affected feature; keep core routing | Legal / DPO | Ecosystem integration |
| 15 | Cyber security (attack on dispatch or driver app) | L | H | Role-based access, audit log of plan changes, no customer personal data in the engine | Revert to last accepted plan and paper manifests | IT lead | Operational risk |

## Human-override flow (slide 6 diagram)
Dispatcher sees the AI route, then **accept**, **edit** (drag a stop) or **reject**. Edits are logged. If rejected, the manual plan is used and the case is added to review. The `/rerouting` page shows accept and reject; edit is a pilot feature.

## Fallback when the AI is down
1. Dispatchers keep the **last accepted plan** (already on the driver app).
2. If there is none, use the **baseline nearest-neighbour plan** (same rule as today).
3. Customer messages switch to **templates** (no LLM needed); travel times use the **cached matrix** with static multipliers.
