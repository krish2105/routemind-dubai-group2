# Frozen Results (filled from docs/frozen_results.json by web/scripts/fill-results.ts; do not edit by hand)

Seed: 2611 . Frozen at: 2026-11-16T10:17:03+04:00 (Dubai time). Run by: Harsh (with Krishna and Advait) . Commit/hash: b54f82b+dirty .
Scenario: 300 orders, 12 vans, 8 motorbikes, one hub (Al Quoz), 08:00 to 20:00. All data simulated or assumed.

## Baseline vs AI (identical seeded orders)
| KPI | Baseline (nearest neighbour) | AI (Clarke-Wright + 2-opt) | GA | Change vs baseline (AI plan: Clarke-Wright + 2-opt) |
|---|---|---|---|---|
| Total km | 1,361 | 1,196 | 1,366 | -12.2% |
| Drive time (h) | 39.2 | 34.3 | 38.7 | -12.5% |
| Cost per parcel (AED) | 17.79 | 13.62 | 13.83 | -23.5% |
| Total cost (AED) | 5,337 | 4,085 | 4,150 | -23.5% |
| Vehicles used | 14 | 12 | 13 | -14.3% |
| Utilisation: capacity (%) | 77.9 | 92.8 | 98.0 | +19.1% |
| Utilisation: shift time (%) | 89.8 | 90.9 | 80.9 | +1.2% |
| On-time (%) | 83.7 | 98.3 | 96.3 | +17.5% |
| SLA breaches | 49 | 5 | 11 | -89.8% |
| Failed-attempt risk (expected) | 28.4 | 26.2 | 26.5 | -7.7% |
| CO2 (kg) | 308 | 266 | 285 | -13.5% |
| Workload fairness (CV) | 0.11 | 0.10 | 0.26 | -12.4% |
| Solver run time (s) | 0.00 | 0.80 | 3.88 | (this machine) |

Slide tokens: cost per parcel down 23.5%, km down 12.2%, 2 fewer vans, CO2 down 13.5%, utilisation 77.9% → 92.8%, on-time 83.7% → 98.3%, SLA breaches 49 → 5.

## Live re-routing (Sheikh Zayed Road jam at 13:00)
| | Before re-route | After re-route |
|---|---|---|
| Deliveries at risk of missing window | 23 | 10 |
| SLA breaches (remaining stops) | 4 | 4 |

## ETA model (test set, Indian data: shows the method, not Dubai truth)
| Metric | Model | Naive baseline |
|---|---|---|
| MAE (min) | 17.5 | 39.6 |
| RMSE (min) | 22.3 | 49.7 |
| R-squared | 0.82 | 0.09 |
Error 55.8% lower than the naive rule.

## Business case (assumed inputs; simple payback from roll-out)
Pilot AED 420,000 (all-in, 90 days; the most we can lose) ; payback 6.4 months after roll-out (9.4 from approval) ; at half the savings 30.9 months ; annual net saving AED 782,000 ; net after 36 months AED 1,927,000 .
Costs per parcel AED 17.8 → 13.6; we count 60% of the saving = 14.1% of cost per parcel (McKinsey 5 to 20%, R7) at 1,500 parcels a day.
Scenarios: conservative 53.4 months, optimistic 2.9 months. Day-90 cost gate: real cut of at least 7.6%.

## Cross-checks
- [x] Same numbers on dashboard, slides and scripts: `npx tsx scripts/crosscheck.ts` (see docs/verification_log.md)
- [x] AI km is not above baseline km
- [x] Hand-calculation of one route matches the Vitest assertion (tests/cw.test.ts, tests/kpi.test.ts); payback hand-check in tests/roi.test.ts
- [x] `docs/frozen_results.json` updated; speaker PDFs and deck rebuilt by Gagandeep after the freeze PR merges
