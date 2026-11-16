# ROI Model (owner: Harsh)

Code: `web/lib/roi.ts` · tests: `web/tests/roi.test.ts` · page: `/business-case` · frozen by `web/scripts/freeze.ts` · slide: `deck/slides/s7_harsh.js`.

All inputs are **assumed** (see `06_assumptions_table.md`, "Business case inputs", and the `provenance` block of `data_seed/assumptions.json`). Only the two costs per parcel are **simulated** (engine, seed 2611, baseline vs AI on identical orders). Nothing here is a forecast.

## Inputs
| Input | Default | Source |
|---|---|---|
| `cost_base` = baseline cost per parcel (AED) | from the frozen run | simulated (engine) |
| `cost_ai` = AI cost per parcel (AED) | from the frozen run | simulated (engine) |
| km part of each cost per parcel (AED) | from the frozen run | simulated (`costBreakdown` in `kpi.ts`), only for the cost-per-km what-if |
| `pilot_investment` | AED 420,000 | assumed (range 300,000 to 600,000); all-in 90-day pilot budget |
| `monthly_running_cost` | AED 38,000 | assumed (range 25,000 to 60,000); from roll-out |
| `parcels_per_day` (scaled network) | 1,500 | assumed (range 1,000 to 3,000) |
| `working_days_per_year` | 330 | assumed (range 300 to 350) |
| `haircut` = adoption haircut | 0.6 | assumed (range 0.4 to 0.8): real savings are assumed lower than simulated savings |
| `saving_factor` | 1.0 | stress test (0.5 = half the savings) |
| `cost_per_km_factor` | 1.0 | what-if on fuel and upkeep (van AED/km range 0.6 to 1.2 vs 0.85 assumed) |

## Formulas
```
saving_per_parcel      = (cost_base - cost_ai) * haircut * saving_factor
monthly_saving         = saving_per_parcel * parcels_per_day * (working_days_per_year / 12)
net_monthly_benefit    = monthly_saving - monthly_running_cost
annual_net_saving      = net_monthly_benefit * 12
payback_months         = pilot_investment / net_monthly_benefit      (only if net_monthly_benefit > 0, else "no payback")
cumulative_cash(m)     = -pilot_investment + net_monthly_benefit * m   for m = 0..36
net_12m, net_36m       = cumulative_cash(12), cumulative_cash(36)
```
`payback_half` = the same formulas with `saving_factor = 0.5`.
With the cost-per-km factor `f`, each cost per parcel becomes `cost + (f - 1) * km_cost` (only the km part moves).

**Wording:** the haircut is the *share of the simulated saving we keep* (0.6 = we count 60 %). Say "payback 6.4 months counting 60 % of the simulated saving", never "at simulated savings".

**Payback clock and exposure.** Payback is counted from **roll-out** after the 90-day pilot; from approval add 3 months (`payback_from_approval`). The pilot alone does not pay back (one zone has too little volume to cover the running cost); it buys evidence. The AED 420,000 pilot investment is the **all-in** 90-day budget (build, integration, training and running the pilot zone); the AED 38,000 a month starts at roll-out. So one basis holds everywhere: if the board stops at the Day-90 gate the most it loses is `pilot_exposure` = the pilot investment, and the same figure is month 0 of the cash chart and the numerator of payback. Scale-up cost beyond the running cost is not modelled (assumed: the pilot build is reused).

**Simple payback, on purpose.** Full network volume from month 1, no ramp-up, no discounting, no tax. That is what the page and the slide say. The haircut and the half-savings stress test are the safety margin, and the pilot measures the real numbers before any scale-up.

## Scenarios (three cards on the page)
Only the two least certain drivers move, one step each way; costs stay as assumed.
| Scenario | Adoption haircut | Parcels per day |
|---|---|---|
| Conservative | 0.4 (low end of the assumed range) | 1,000 (base - 500) |
| Base | 0.6 | 1,500 |
| Optimistic | 0.8 (high end of the assumed range) | 2,000 (base + 500) |

## Sensitivity
- **Heat grid** (page): payback months for rows = adoption 40, 50, 60, 70, 80, 100 % (or saving factor 0.5 / 0.75 / 1.0, or cost per km 70 to 140 %) and columns = parcels per day 1,000 to 3,000. Cells above **24 months** are red, "no payback" is red.
- **Tornado** (page): payback at the low and high end of every input's assumed range, one input at a time, biggest swing first. The saving factor is left out (it is a stress test on top of the share kept and would double-count it); it appears as "payback at half the savings".
- Paybacks above 36 months are shown as "beyond 36 months" (the decimal is noise there).

## Cost gate for Day 90 (go/no-go)
Inverting the payback formula gives the **real** saving per parcel the pilot must show for a 24-month payback at the assumed volume and running cost:
```
needed_net_monthly   = pilot_investment / 24
needed_saving        = (needed_net_monthly + monthly_running_cost) / (parcels_per_day * working_days_per_year / 12)
gate_cost_pct        = needed_saving / cost_base * 100      (also shown as a share of the simulated saving)
```
This turns "cost per parcel" from a vague gate into a number the pilot either meets or does not.

## Values frozen for Slide 7 (`docs/frozen_results.json`)
`pilot_cost`, `payback_months`, `payback_half`, `annual_net_saving` (plus the ROI extras the freeze writes: costs per parcel, 36-month net, scenario paybacks, effective saving after the haircut, cost gate). The freeze computes them from the **rounded** frozen costs per parcel, so the page and the slide show the same numbers.

## Sanity checks
- If `cost_ai >= cost_base`, the model returns no payback and the freeze refuses to run: say so honestly.
- Compare the effective saving `(cost_base - cost_ai) * haircut / cost_base` with the 5 to 20 % McKinsey range (R7). The raw simulated saving is above 20 % because the baseline is a simple nearest-neighbour method; the haircut brings it inside the range. R7 must be checked by hand before the slide quotes it (see `verification_log.md`).
- Units (AED) and the word "assumed" next to every input on the page and the slide.
