# Risk Register (owner: Karan Baid)

Likelihood and impact: L/M/H, our judgement (assumed). Each risk has a fallback and an owner role.

| # | Risk | L | I | Mitigation | Fallback if it happens | Owner role |
|---|---|---|---|---|---|---|
| 1 | Poor data quality (bad addresses, missing time windows) | H | H | Address validation using Makani where available (R13); data checks before optimisation | Dispatcher confirms flagged stops by phone; use the manual plan for those stops | Data lead |
| 2 | Legacy TMS/WMS cannot integrate quickly | M | H | Start with file or API exports; integrate in phases | Run RouteMind in parallel as an advisory tool | IT lead |
| 3 | Driver adoption and trust | M | H | Co-design with drivers, explain ETAs (feature importance), fair workload metric | Keep manual route available; driver feedback loop | Ops manager |
| 4 | Privacy and legal (UAE PDPL, R19) | M | H | Data minimisation, consent, no personal data in the public build; confirm executive-regulation status with counsel | Pause the feature that uses the data; revert to anonymised IDs | Legal/DPO |
| 5 | Model failure or bad ETA in unusual weather | M | M | Monitor MAE; sandstorm and rain scenarios in testing | Fall back to historical average ETA; human override | ML lead |
| 6 | Heat-rule non-compliance (midday break, R14) | M | H | Scheduler respects rest windows; fairness metric | Manual re-plan; add rest-area stops | Ops manager |
| 7 | Over-promised savings (simulation vs real) | H | M | Pilot with go/no-go gates; show results as simulated; adoption haircut in ROI | Stop at gate 1 if cost per parcel does not improve | Programme sponsor |
| 8 | Cloud/API outage (traffic feed, LLM copilot) | M | L | Cached travel-time matrix, template messages | Template delay messages; static multipliers | IT lead |
| 9 | Partner dependency (robots, lockers, EV charging) | M | M | Contract multiple partners; phase 3 only | Keep vans and bikes as base network | Partnerships lead |

## Human-override flow (slide 6 diagram)
Dispatcher sees AI route, then **accept**, **edit** (drag a stop) or **reject**; edits are logged; if rejected, the manual plan is used and the case is added to review.
