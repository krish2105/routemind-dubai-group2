# Frozen Results (fill on Mon 18:00)

Seed: ____ . Frozen at: ____ (Dubai time). Run by: ____ . Commit/hash: ____ .
Scenario: ~300 orders, 12 vans, 8 motorbikes, one hub (Al Quoz), 08:00 to 20:00. All data simulated or assumed.

## Baseline vs AI (identical seeded orders)
| KPI | Baseline (nearest neighbour) | AI (Clarke-Wright + 2-opt) | GA | Change vs baseline |
|---|---|---|---|---|
| Total km | | | | |
| Drive time (h) | | | | |
| Cost per parcel (AED) | | | | |
| Total cost (AED) | | | | |
| Vehicles used | | | | |
| Utilisation: capacity (%) | | | | |
| Utilisation: shift time (%) | | | | |
| On-time (%) | | | | |
| SLA breaches | | | | |
| Failed-attempt risk | | | | |
| CO2 (kg) | | | | |
| Workload fairness (CV) | | | | |
| Solver run time (s) | | | | |

## Live re-routing (Sheikh Zayed Road jam at 13:00)
| | Before re-route | After re-route |
|---|---|---|
| Deliveries at risk of missing window | | |
| Mean ETA error (min) | | |

## ETA model
| Metric | Model | Naive baseline |
|---|---|---|
| MAE (min) | | |
| RMSE (min) | | |
| R-squared | | |

## Business case (assumed inputs)
Pilot AED ____ ; payback ____ months ; at half the savings ____ months ; annual net saving AED ____ .

## Cross-checks
- [ ] Same numbers on dashboard, slides and scripts
- [ ] AI km is not above baseline km (if it is: explain)
- [ ] Hand-calculation of one route matches the Vitest assertion
- [ ] `docs/frozen_results.json` updated, speaker PDFs rebuilt
