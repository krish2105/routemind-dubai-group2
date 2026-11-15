# ROI Model (owner: Harsh)

All inputs are **assumed** (see `06_assumptions_table.md`, "Business case inputs"). The savings percentage comes from the frozen simulation. Nothing here is a forecast.

## Inputs
- `cost_base` = baseline cost per parcel (AED) from the frozen run
- `cost_ai` = AI cost per parcel (AED) from the frozen run
- `parcels_per_day`, `working_days_per_year`, `pilot_investment`, `monthly_running_cost`
- `haircut` = adoption haircut (default 0.6): real savings are assumed lower than simulated savings

## Formulas
```
saving_per_parcel      = (cost_base - cost_ai) * haircut
monthly_saving         = saving_per_parcel * parcels_per_day * (working_days_per_year / 12)
net_monthly_benefit    = monthly_saving - monthly_running_cost
annual_net_saving      = net_monthly_benefit * 12
payback_months         = pilot_investment / net_monthly_benefit      (only if net_monthly_benefit > 0, else "not paid back")
```
`payback_half` = the same formulas with the saving halved (`saving_per_parcel * 0.5`).

## Sensitivity grid (build on the Business Case page)
Rows: savings factor 0.5, 0.75, 1.0 of the haircut saving. Columns: parcels per day 1,000 / 1,500 / 2,000. Cell: payback months. Highlight cells above 24 months in red.

## Slide 7 values to freeze
`pilot_cost`, `payback_months`, `payback_half`, `annual_net_saving`.

## Sanity checks
- If `cost_ai >= cost_base`, say so honestly and do not show a payback.
- Compare `(cost_base - cost_ai) / cost_base` with the 5 to 20% McKinsey range (R7). If the simulated saving is well above 20%, say the baseline is simple and the haircut covers it.
- Show units (AED) and the word "assumed" next to every input.
