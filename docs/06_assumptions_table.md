# Assumptions Table (owner: Advait)

These are **model inputs, not statistics**. Every row is **assumed** (DubaiDash Express is fictional) unless a source is given. Each value has a one-line reason and a plausible range. The machine-readable copy is `data_seed/assumptions.json` (identical copy in `web/public/data/assumptions.json`; the reasons and ranges live in its `provenance` block and feed the dashboard "Assumptions" drawer). Keep this table, both JSON files and the drawer in sync.

## Vehicles
| Parameter | Van | Motorbike | Unit | Status | Reason | Range (van / bike) |
|---|---|---|---|---|---|---|
| Count | 12 | 8 | vehicles | assumed | mid-size courier fleet; bikes common for small parcels | 8-16 / 4-12 |
| Capacity | 45 | 10 | parcels | assumed | small panel van; top box plus bag | 35-60 / 6-15 |
| Cost per km | 0.85 | 0.35 | AED/km | assumed | fuel + maintenance + depreciation | 0.6-1.2 / 0.2-0.5 |
| CO2 per km (fuel) | 0.24 | 0.09 | kg/km | assumed | light diesel van, small petrol bike (replace with a cited factor if time) | 0.18-0.30 / 0.06-0.12 |
| CO2 per km (electric, grid mix) | 0.07 | 0.02 | kg/km | assumed | indirect emissions of grid electricity | 0.03-0.10 / 0.01-0.04 |
| CO2 per litre of fuel | 2.68 | 2.31 | kg/litre | assumed | standard diesel / petrol combustion factor, used only to show litres | 2.6-2.7 / 2.2-2.4 |
| Service time per stop | 4 | 3 | minutes | assumed | park, walk, hand over; bikes park faster | 3-8 / 2-6 |
| Max duty time | 540 | 540 | minutes | assumed | 9 h on duty inside the 08:00 to 20:00 window | 480-600 |
| Shift starts | 08:00 / 11:00 | 08:00 / 11:00 | time | assumed | two waves, half of each type; second covers the evening peak | 07-09 / 10-12 |

## Orders, costs, service
| Parameter | Value | Unit | Status | Reason | Range |
|---|---|---|---|---|---|
| Orders per demo day | 300 | orders | assumed | one day for a mid-size courier | 200-400 |
| Time window length | 120 | minutes | assumed | standard 2-hour customer slot | 60-240 |
| Urgent share | 0.10 | of orders | assumed | express orders | 0.05-0.20 |
| Urgent window | 60 | minutes | assumed | express 1-hour slot | 30-90 |
| Urgent-order surge | 25 | extra orders | assumed | what-if surge for re-routing | 10-50 |
| Cash-on-delivery share | 0.15 | of orders | assumed | COD still used in the UAE | 0.05-0.30 |
| Driver cost | 28 | AED per hour | assumed | loaded cost (salary, visa, housing share) | 20-40 |
| Failed-delivery cost | 12 | AED per failed stop | assumed | re-delivery trip and handling | 8-25 |
| SLA penalty | 15 | AED per breach | assumed | voucher / goodwill for a missed window | 5-30 |
| At-risk buffer | 15 | minutes of slack | assumed | dispatcher wants 15 min warning | 10-30 |
| Failed first attempt, base | 0.08 | probability per stop | assumed | industry sources report a wide 8 to 20% range (R3, indicative only) | 0.05-0.20 |
| + if late | 0.05 | probability | assumed | customer may have left after the window | 0.02-0.10 |
| + if cash on delivery | 0.03 | probability | assumed | cash not ready or refused | 0.01-0.06 |
| + if tight (1 h) window | 0.02 | probability | assumed | less room to retry | 0.00-0.05 |
| + in a sandstorm | 0.04 | probability | assumed | access harder | 0.00-0.08 |
| Demo seed | 2611 | n/a | design choice | identical orders for baseline, AI, slides, demo | n/a |

## Hour-of-day traffic multipliers (on free-flow travel time), assumed
Reason: morning and evening peaks. Range 1.0 to 1.6 per hour. Free-flow speed 40 km/h (assumed, range 30-55); road km = straight line x 1.35 detour (assumed, range 1.2-1.5) when OSRM is not used. Bikes feel 60% of any slow-down (assumed, range 0.4-0.8).

| Hour | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Multiplier | 1.35 | 1.25 | 1.05 | 1.00 | 1.00 | 1.05 | 1.00 | 1.05 | 1.20 | 1.45 | 1.45 | 1.25 |

## Event multipliers (what-if scenarios, not live feeds), assumed
| Event | Effect | Range |
|---|---|---|
| Sheikh Zayed Road jam | x1.8 travel time on legs that use that corridor | 1.4-2.2 |
| Al Khail Road jam | x1.6 on legs that use that corridor | 1.3-2.0 |
| Sandstorm | x1.35 city-wide and +0.04 failed-attempt probability | 1.2-1.6 |
| Heavy rain | x1.4 city-wide | 1.2-1.8 |
| Urgent surge | +25 orders appear at the event time | 10-50 |

## Business case inputs (for `10_roi_model.md`), assumed
| Parameter | Default | Unit | Reason | Range |
|---|---|---|---|---|
| Pilot investment | 420,000 | AED | 90-day pilot build, integration, training | 300k-600k |
| Monthly running cost | 38,000 | AED per month | cloud, APIs, support | 25k-60k |
| Parcels per day (scaled network) | 1,500 | parcels | after rollout | 1,000-3,000 |
| Working days per year | 330 | days | 6-day operation minus holidays | 300-350 |
| Adoption haircut on demo savings | 0.6 | factor | real savings are lower than simulation | 0.4-0.8 |

## KPI definitions (`web/lib/engine/kpi.ts`, identical for baseline and AI)
A vehicle is "used" when its route has at least one stop. Results are **simulated**.

| KPI | Formula |
|---|---|
| Total km | sum of route km (hub -> stops -> hub) |
| Drive hours | sum of route drive minutes / 60 (traffic and event multipliers included) |
| Vehicles used | routes with at least one stop |
| Total AED cost | km x vehicle AED/km + duty hours (route end - start) x 28 AED/h + expected failed attempts x 12 AED + SLA breaches x 15 AED |
| Cost per parcel | total AED cost / orders served |
| Capacity utilisation | parcels loaded / capacity of used vehicles |
| Shift utilisation | duty minutes / max duty minutes of used vehicles |
| On-time % | stops arriving by window end / all orders (unserved = not on time) |
| SLA breaches | late stops + unserved orders |
| At risk | late stops + on-time stops with under 15 min slack |
| Expected failed attempts | sum over stops of (base + late + COD + tight-window + sandstorm extras), capped at 1 |
| CO2 kg | sum of route km x (fuel kg/km x (1 - EV share) + electric kg/km x EV share) |
| Fuel litres | CO2 of the fuel share / kg CO2 per litre |
| Workload fairness (CV) | standard deviation / mean of route durations of used vehicles (0 = perfectly even) |
| Solver run time | `plan.meta.runMs`, measured in the browser worker |

Hand check: `web/tests/kpi.test.ts` (one van, 20 km, 2 stops, 1 unserved: total 90.28 AED, 4.8 kg CO2).

## Rules
1. Never present an assumed value as a fact. The UI shows an "assumed" badge next to it.
2. If a value changes after Mon 18:00, re-run and re-freeze **everything**.
3. If you replace a value with a sourced one, put the URL in the Reason column and add it to `04_research_brief.md`.
