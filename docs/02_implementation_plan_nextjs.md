# Implementation Plan v2: RouteMind Dubai (Next.js)

Version: Sun 15 Nov 2026. Replaces `source_material/original_implementation_plan.md`. If this file conflicts with the assignment slides, the slides win: flag it, do not silently change.

## 0. What changed from the original plan (and why)

| Change | Reason |
|---|---|
| React + Vite becomes **Next.js (App Router) + TypeScript** | Team request. One Vercel project, and the copilot becomes a Next route handler. |
| Work is split into **three tiers** with a decision gate Mon 14:00 | The original plan had 10 pages, a notebook, GA, RL, a copilot and a forecast in about 40 hours for a 10-mark, 10-minute talk. |
| **Seven-person team split** with one slide and one deliverable each | Team Collaboration is a rubric criterion. |
| Research-backed context in `04_research_brief.md` | Slides must only use cited facts. |
| Copilot gets **rate limiting and a template-first default** | A public endpoint with an API key can be abused. |
| OSRM point pool reduced to **about 150 to 250 points**, with batching and a labelled haversine fallback | The public OSRM demo server has usage limits. |
| RL is **a notebook chart and a slide line**, not a full page | Q3 names RL, so it must appear, but a full page is too costly. |
| Talk time **9:15**, not 10:00 | Leaves room for handovers. A recorded demo is the primary demo. |
| Baseline is documented as an **assumed** "how dispatchers plan today" method | A weak baseline overstates savings; we say so. |
| Results are called **simulated**; compared to a cited 5 to 20% range | Honest framing for the C-suite. |

## 1. Scenario

**DubaiDash Express** is a fictional mid-size Dubai e-commerce courier. Every company figure is **assumed** and labelled "assumed" in the UI and on slides.
- Today: a dispatcher plans static routes once each morning, ignoring live traffic, weather and late urgent orders.
- Network: one hub in Al Quoz; AI-suggested micro-hubs and parcel lockers; vans and motorbikes.
- Service: same-day and next-day, customer time windows, some cash on delivery.
- Coverage: about 20 to 25 real Dubai communities (Dubai Marina, JLT, JVC, Al Barsha, Downtown, Business Bay, DIFC, Deira, Bur Dubai, Karama, Al Nahda, Mirdif, Silicon Oasis, Motor City, Arabian Ranches, Al Quoz, Jumeirah, Umm Suqeim, Discovery Gardens, International City).
- Pain points modelled as **what-if scenarios** (not live feeds): corridor jams (Sheikh Zayed Road, Al Khail Road), sandstorm, heavy rain, failed first attempts, urgent-order surges.
- Demo day: seed 2611 (default), about 300 orders, 12 vans, 8 motorbikes, one hub, 08:00 to 20:00. Baseline and AI run on the **identical** seeded orders.
- Context stat on slide 2: last mile 41% (2018) to 53% (2023), Statista, worldwide. Do not invent other statistics.

## 2. Architecture

```
OFFLINE (Colab notebook, Atharva)                 ONLINE (Next.js on Vercel)
Kaggle ETA dataset -> clean -> ETA model -> JSON ->  public/data/eta_model.json -> in-browser ETA inference
OSM/OSRM -> Dubai point pool + travel-time matrix -> public/data/points.json, matrix.json
Synthetic zone history -> demand forecast -> public/data/forecast.json            (Tier 3)
Q-learning dispatch sim -> learning curve -> public/data/rl.json                  (Tier 3)
                                                   Web Workers (Comlink): k-means, baseline,
                                                   Clarke-Wright + 2-opt + relocate/swap, GA, re-route
                                                   MapLibre + deck.gl map, charts, KPI engine
                                                   app/api/copilot/route.ts -> LLM (key in env) | template fallback
```
No model training on Vercel. All randomness seeded. Heavy compute in Web Workers (never on the main thread).

### Next.js specifics
- App Router, TypeScript strict. Each page is a route (`app/<page>/page.tsx`); shared shell in `app/layout.tsx`.
- Map, charts and workers are **client components**; load map code with `next/dynamic` and `{ ssr: false }`.
- Workers: `new Worker(new URL('../workers/optimizer.worker.ts', import.meta.url), { type: 'module' })` wrapped with Comlink; support progress callbacks and cancel.
- Copilot: `app/api/copilot/route.ts` (Node runtime), reads `process.env.LLM_API_KEY` (optional), per-IP rate limit, max tokens cap, returns a deterministic template message when no key or on error.
- Deploy: Vercel project root `web/`. `vercel.json` only if needed. `npm run build` must pass with zero errors.

## 3. Where each computation runs

| Component | Technique | Runs where | Tier |
|---|---|---|---|
| Zoning, micro-hub and locker sites | K-means (k by silhouette/elbow), medoids as candidate sites | Browser worker, live | 3 |
| Baseline routes | Nearest-neighbour sequential fill from hub (assumed "how dispatchers plan today") | Browser worker, live | 1 and 2 |
| Optimised routes | Clarke-Wright savings, then 2-opt inside routes, then relocate/swap between routes | Browser worker, live | 1 and 2 |
| Optimised routes (GA) | Giant-tour permutation + split, order crossover (OX), swap/inversion mutation, tournament selection, elitism; fitness = cost + time-window and capacity penalties; convergence streamed per generation | Browser worker, live | 2 |
| Travel times | OSRM table over OpenStreetMap roads for the point pool; hour-of-day and event multipliers at runtime; fallback haversine x labelled detour factor | Notebook/script to JSON; multipliers live | 1 and 2 |
| Dynamic re-routing | At time t: freeze completed stops and positions, apply event multipliers, insert urgent orders (cheapest insertion), re-optimise remaining stops (2-opt + warm-start GA) | Browser worker, live | 2 |
| ETA and delay prediction | Gradient boosting (XGBoost or LightGBM) on distance, traffic, weather, vehicle, hour, area, category; export JSON trees or JS | Train in Colab, infer in browser | 2 |
| Demand forecast | Prophet or LightGBM by zone and hour on seeded synthetic history | Notebook | 3, labelled illustrative |
| Urgent-order dispatch policy | Tabular Q-learning vs greedy (state: time bucket, slack, load, distance bucket; reward: -cost - SLA penalty) | Notebook | 3 (one chart) |
| GenAI ops copilot | Delay messages (English and Arabic) and dispatcher shift summary | `/api/copilot`, template fallback | 3 |

## 4. Constraints the engine must enforce
- Each order served exactly once; capacity per vehicle type respected.
- Time windows respected, or each violation counted and shown as an SLA breach.
- Driver shift limit and fixed service time per stop (assumed).
- Same seed gives same numbers in the demo and on the slides.
- Long runs show progress and can be cancelled.

## 5. KPIs (identical definitions for baseline and AI)
Total km, drive time, AED cost (km cost + driver-hour cost), vehicles used, utilisation (capacity and shift time), on-time %, SLA breaches, failed-attempt risk, CO2 kg, driver workload fairness (coefficient of variation of route durations), solver run time. Cost per parcel = total AED cost / orders served.

## 6. Data

| Layer | Source | Status | Caveat to display |
|---|---|---|---|
| ETA training data | Kaggle Amazon Delivery Dataset (`sujalsuthar/amazon-delivery-dataset`, about 43.7k rows). **Confirm columns, dates and licence first.** | Real | Recorded in Indian cities; used for feature relationships, not as Dubai ground truth |
| Roads and travel times | OpenStreetMap via OSRM | Real | Free-flow times; congestion from assumed multipliers |
| Point pool | About 150 to 250 points sampled inside real community boundaries | Real geography | Points are sampled, not real addresses |
| Orders, windows, parcel sizes | Generated from assumed demand weights per community | Synthetic, seeded | Labelled synthetic |
| Traffic and weather events | Scenario multipliers | Synthetic | "What-if", not live; production would use traffic and weather APIs |

Assumption values live in `data_seed/assumptions.json` (copy to `web/public/data/assumptions.json`); readable table in `06_assumptions_table.md`. Shown in an "Assumptions" drawer.

## 7. Dashboard pages and tiers

Every page has a one-line "What this means for operations" note, a synthetic/precomputed badge where relevant, and consistent KPI cards.

| # | Route | Must show | Key Q | Tier |
|---|---|---|---|---|
| 1 | `/` Command Center | Baseline vs AI KPI cards with deltas; light Dubai map with animated routes (deck.gl TripsLayer); scenario selector | Q1, Q4 | 2 |
| 2 | `/optimizer` Route Optimizer | Order generator (count, seed, windows, van/bike mix, capacity); algorithm picker (Baseline, Clarke-Wright+2-opt, GA); per-vehicle route table; GA convergence chart; run time | Q1, Q3 | 2 |
| 3 | `/rerouting` Live Re-routing | Time slider; inject Sheikh Zayed Road jam, sandstorm, rain, urgent surge; re-optimise mid-shift; before/after ETAs; SLA-at-risk list | Q2 | 2 |
| 4 | `/eta` ETA and Delay | MAE, RMSE, R-squared vs naive; feature importance; what-if ETA form; data caveat | Q2, Q7 | 2 |
| 5 | `/zones` Zones and Last Mile | Clusters on the map; micro-hubs and lockers; stops per km; first-attempt success view | Q3, Q6 | 3 |
| 6 | `/fleet` Fleet and Sustainability | Utilisation per vehicle; workload fairness; km, fuel, CO2 baseline vs AI; EV-share slider | Q4 | 3 |
| 7 | `/customer` Customer and SLA | On-time %, window adherence, breaches; copilot drafting EN/AR messages and dispatcher summary | Q7 | 3 |
| 8 | `/business-case` Business Case | ROI calculator (see `10_roi_model.md`) | Slide 7 | 3 |
| 9 | `/integration` Integration and Risk | Static architecture view; risk register; human-override flow | Q5 | 3 (light) |
| 10 | `/rl-lab` RL Dispatch Lab | Learning curve; policy vs greedy on held-out days | Q3 | 3 (one chart) |

**Design:** LIGHT-MODE "daylight dispatch" theme (white/ice backgrounds, navy text, teal = AI, amber = baseline, red = SLA risk), glassmorphism panels, subtle Framer Motion, monospaced numerals, free light basemap (CARTO Positron) with OpenStreetMap attribution. Desktop-first, usable on a phone. No console errors.

**Responsible AI (learning outcome C):** workload fairness metric, explainable ETAs (feature importance), human override on any route, no personal data in the public build, assumed/synthetic badges, heat-rule awareness (midday break, R14).

## 8. Stack and folder structure

Next.js (latest stable, App Router) + TypeScript + Tailwind CSS + Framer Motion + MapLibre GL + deck.gl + Recharts (or ECharts) + Zustand + Comlink + Vitest. Notebook: pandas, numpy, scikit-learn, xgboost/lightgbm, requests.

```
routemind-dubai-submission/
  web/                        # Next.js app (Vercel root)
    app/                      # routes, layout, api/copilot/route.ts
    components/               # KPI cards, map, charts, badges, assumptions drawer
    lib/engine/               # geo, matrix, orders, baseline, clarkeWright, localSearch, ga, kmeans, reroute, kpi, events
    lib/models/               # ETA inference wrapper
    workers/optimizer.worker.ts
    store/                    # Zustand
    public/data/              # points.json, matrix.json, eta_model.json, assumptions.json, (forecast.json, rl.json)
    tests/                    # Vitest
  notebook/routemind_models.ipynb
  docs/  prompts/  scripts/  scripts_pdf/  team/  tools/  deliverables/  data_seed/  source_material/
```

## 9. Verification (show evidence as you build)
- Feasibility: every order served once; no capacity breach; time-window breaches counted correctly.
- Determinism: same seed gives identical KPIs across runs.
- Hand check: for one route, recompute distance, AED cost and CO2 by hand (notebook) and assert equality in Vitest.
- Sanity: AI km not above baseline km on the demo seed (if it is, report honestly and investigate). GA fitness non-increasing with elitism.
- ETA model: chronological split if timestamps exist; MAE, RMSE, R-squared vs naive; no target leakage.
- Build: `npm run build` passes; Lighthouse reasonable; no console errors; copilot works with and without an API key.

## 10. Cut order if time runs short
Tier 3 pages in this order: RL page (keep one chart), forecast detail, EV slider, Arabic copilot output, Zones, Integration page. **Never cut:** baseline vs AI comparison, live re-routing, ETA model, deployment (or the recorded fallback).

## 11. Definition of done
- [ ] All 7 key questions mapped to a feature and a slide (`07_traceability.md`)
- [ ] Live link works on laptop and phone, no console errors (or recorded fallback ready)
- [ ] Baseline and AI use the identical seeded orders; slide numbers equal dashboard numbers (`frozen_results.json`)
- [ ] Every assumed figure labelled; data caveats visible
- [ ] Tests pass; hand cross-check shown
- [ ] 7-slide PPTX + PDF, speaker notes under 10:00, GenAI items circled
- [ ] `docs/prompt_logs/*.md` complete (merge with `tools/build_prompt_log.py`)
- [ ] Submission zip built by `tools/make_submission_zip.sh`
