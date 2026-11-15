# Assumptions Table (owner: Advait)

These are **model inputs, not statistics**. Every row is **assumed** unless a source is given. Starting values are reasonable placeholders for a fictional courier; Advait tunes them by Sun 20:00 and records any source. The machine-readable copy is `data_seed/assumptions.json` (copy to `web/public/data/assumptions.json`). Keep both in sync. Show this table in the dashboard "Assumptions" drawer.

| Parameter | Van | Motorbike | Unit | Status |
|---|---|---|---|---|
| Capacity | 45 | 10 | parcels | assumed |
| Cost per km | 0.85 | 0.35 | AED/km | assumed |
| CO2 per km (fuel) | 0.24 | 0.09 | kg/km | assumed (replace with a cited conversion factor if time) |
| CO2 per km (electric, grid mix) | 0.07 | 0.02 | kg/km | assumed |
| Service time per stop | 4 | 3 | minutes | assumed |
| Max duty time | 540 | 540 | minutes (09:00 on duty inside the 08:00 to 20:00 operating window) | assumed |

| Parameter | Value | Unit | Status |
|---|---|---|---|
| Driver cost | 28 | AED per hour | assumed |
| Failed-first-attempt probability (baseline) | 0.08 | share of stops | assumed (industry sources report a wide 8 to 20% range, R3, indicative only) |
| Failed-delivery cost | 12 | AED per failed stop | assumed |
| SLA penalty | 15 | AED per window breach | assumed |
| Time window length | 120 | minutes | assumed |
| Urgent-order surge | 25 | extra orders | assumed |
| Cash-on-delivery share | 0.15 | of orders | assumed |
| Demo seed | 2611 | n/a | design choice |

## Hour-of-day traffic multipliers (on free-flow travel time), assumed
| Hour | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Multiplier | 1.35 | 1.25 | 1.05 | 1.00 | 1.00 | 1.05 | 1.00 | 1.05 | 1.20 | 1.45 | 1.45 | 1.25 |

## Event multipliers (what-if scenarios, not live feeds), assumed
| Event | Effect |
|---|---|
| Sheikh Zayed Road jam | x1.8 travel time on legs that use that corridor |
| Al Khail Road jam | x1.6 on legs that use that corridor |
| Sandstorm | x1.35 city-wide and +0.04 failed-attempt probability |
| Heavy rain | x1.4 city-wide |
| Urgent surge | +25 orders appear at the event time |

## Business case inputs (for `10_roi_model.md`), assumed
| Parameter | Default | Unit |
|---|---|---|
| Pilot investment | 420,000 | AED |
| Monthly running cost | 38,000 | AED per month |
| Parcels per day (scaled network) | 1,500 | parcels |
| Working days per year | 330 | days |
| Adoption haircut on demo savings | 0.6 | factor (real-world savings are lower than simulation) |

## Rules
1. Never present an assumed value as a fact. The UI shows an "assumed" badge next to it.
2. If a value changes after Mon 18:00, re-run and re-freeze **everything**.
3. If you replace a value with a sourced one, put the URL in the Source column and add it to `04_research_brief.md`.
