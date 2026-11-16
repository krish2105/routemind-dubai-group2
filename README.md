# RouteMind Dubai

**AI route optimisation for last-mile delivery in Dubai: predict, cluster, optimise, re-route and inform, in one loop.**

[![Live demo](https://img.shields.io/badge/live%20demo-web--rws7.vercel.app-0891b2)](https://web-rws7.vercel.app)
![Next.js](https://img.shields.io/badge/Next.js-16-0b1b2e)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-2d4b6b)
![Tests](https://img.shields.io/badge/tests-86%20unit%20%2B%2023%20e2e-059669)
![Data](https://img.shields.io/badge/data-simulated%20%2F%20assumed-d97706)

Group 2 project for **AI in Operations (MAIB AI 218)**, SP Jain School of Global Management, Dubai.
Topic: *AI in Logistics & Route Optimization* (Implementing AI for Supply Chain Optimization).

> **Live prototype:** https://web-rws7.vercel.app
>
> All company data is **assumed** and all results are **simulated**. "DubaiDash Express" is a fictional courier.

---

## The problem

The last mile is the most expensive part of delivery: about **53% of total shipping cost worldwide** (Statista, Feb 2024: up from 41% in 2018). In Dubai it is harder still: peak-hour traffic on Sheikh Zayed Road and Al Khail Road, summer heat rules for riders, sandstorms, and addresses that are hard to find.

Most couriers still plan routes once each morning with simple rules. When a jam or a storm hits, the plan breaks and promises are missed.

## The solution: one AI loop

| Step | What it does | Technique |
|---|---|---|
| **1. Predict** | Delivery time and delay risk per order | Gradient-boosted trees (LightGBM), exported to run in the browser |
| **2. Cluster** | Delivery zones, micro-hubs and locker candidates | Seeded k-means++ with automatic k |
| **3. Optimise** | Builds the day's routes for vans and motorbikes | Clarke-Wright savings + 2-opt, relocate, swap, route elimination; genetic algorithm for comparison |
| **4. Re-route** | Re-plans live when a jam, storm or urgent order appears | Freezes completed stops, applies event slow-downs, re-optimises the rest |
| **5. Inform** | Drafts customer delay messages in English and Arabic | GenAI copilot with a template fallback (works without an API key); a dispatcher approves every message |

## Results (simulated)

Fictional courier with a hub in Al Quoz, 300 seeded orders (seed 2611), 12 vans and 8 motorbikes, 08:00 to 20:00. **Baseline and AI plan use exactly the same orders.** The baseline is an assumed "nearest order first" dispatcher rule.

| KPI | Baseline | RouteMind AI | Change |
|---|---|---|---|
| Cost per parcel | AED 17.79 | AED 13.62 | **-23.5%** |
| Distance driven | – | – | **-12.2%** |
| Vans used | – | – | **2 fewer** |
| On-time delivery | 83.7% | 98.3% | +14.6 pts |
| SLA breaches | 49 | 5 | -44 |
| Capacity utilisation | 77.9% | 92.8% | +14.9 pts |
| CO2 | – | – | **-13.5%** |
| At-risk deliveries in the 13:00 Sheikh Zayed Road jam | 23 | 10 | after one-click re-routing |
| ETA error (mean absolute) | 39.6 min (naive rule) | 17.5 min | -56% |

**Business case:** a capped AED 420,000 pilot at one hub for 90 days, with go/no-go gates. Simple payback is **6.4 months** after roll-out (30.9 months if only half the savings are real).

Numbers come only from the engine and are frozen in [`docs/frozen_results.json`](docs/frozen_results.json); a cross-check script confirms no slide or script number is typed by hand.

## Live demo pages

| Page | What you see |
|---|---|
| [`/command`](https://web-rws7.vercel.app/command) | Dubai map with animated baseline vs AI routes, 08:00 to 20:00 time slider, scenarios (normal, SZR jam, rain, sandstorm), KPI cards |
| [`/optimizer`](https://web-rws7.vercel.app/optimizer) | Order generator, algorithm picker (baseline, Clarke-Wright + 2-opt, GA), route table, GA convergence, JSON download |
| [`/rerouting`](https://web-rws7.vercel.app/rerouting) | Inject a jam, storm or urgent orders at a chosen time, re-optimise, accept or reject the new plan |
| [`/eta`](https://web-rws7.vercel.app/eta) | ETA model vs naive rule, feature importance, predicted vs actual, what-if form |
| [`/problem`](https://web-rws7.vercel.app/problem) | The last-mile problem and Dubai context, every fact sourced |
| [`/zones`](https://web-rws7.vercel.app/zones) | k-means zones, micro-hubs, stops per km, locker what-if |
| [`/fleet`](https://web-rws7.vercel.app/fleet) | Utilisation, workload fairness, km, fuel and CO2, EV-share slider |
| [`/customer`](https://web-rws7.vercel.app/customer) | On-time rate, breaches, at-risk orders, English and Arabic delay messages |
| [`/integration`](https://web-rws7.vercel.app/integration) | Architecture with outage fallback, human override, 15-risk register |
| [`/business-case`](https://web-rws7.vercel.app/business-case) | ROI calculator, sensitivity, 36-month cash, 90-day pilot with gates |
| [`/rl-lab`](https://web-rws7.vercel.app/rl-lab) | Reinforcement-learning dispatch experiment (next step), with an honest verdict |

Light mode by default, with a dark-mode toggle (top right). Works on desktop and phone.

## Architecture

```
Browser (Next.js App Router, React 19)
 ├── Pages ── Zustand store ── Comlink ──> Web Worker (all heavy compute, never on the main thread)
 │                                            └── lib/engine: problem · baseline · Clarke-Wright + local search · GA
 │                                                            · k-means · re-routing · KPIs · ROI (all seeded)
 ├── MapLibre GL (CARTO basemap) + deck.gl TripsLayer for animated routes
 ├── Recharts for charts, React Three Fiber for the 3D landing scene
 └── /api/copilot ── LLM if a key is set, otherwise validated EN/AR templates
```

- **One shared evaluator** (`lib/engine/schedule.ts`) scores every route, so baseline and AI are judged on identical rules (capacity, duty hours, time windows, traffic by hour, event slow-downs).
- **Deterministic:** all randomness is seeded; the same seed gives the same plan on every machine.
- **Honest by design:** unfinished algorithms are flagged, late deliveries are counted (never hidden), and the freeze script refuses to save numbers if any claim on a slide would be false.

## Tech stack

Next.js 16 · TypeScript (strict) · Tailwind CSS v4 · Framer Motion · MapLibre GL · deck.gl · Recharts · React Three Fiber · Zustand · Comlink Web Workers · Vitest · Playwright · Python (LightGBM, scikit-learn) for the notebooks · PptxGenJS for the slide deck · Vercel.

## Run it locally

Requires Node 20+.

```bash
cd web
npm ci
npm run dev        # http://localhost:3000
```

```bash
npm run check      # typecheck + 86 unit tests + production build
npm run build && npm run e2e   # browser smoke tests (uses installed Google Chrome)
npm run freeze -- --dry-run    # recompute the headline numbers without saving
```

Optional: set `LLM_API_KEY` in `web/.env.local` for live copilot text. Without it the copilot uses templates.

Rebuild the slide deck and speaker scripts:

```bash
cd deck && npm ci && node build_deck.js          # deliverables/RouteMind_Dubai_Group2.pptx
pip install reportlab && python3 tools/build_speaker_pdfs.py
```

## Quality

- **86 unit tests** (Vitest): feasibility, determinism, hand-checked route km / AED / CO2, GA convergence, k-means, re-routing, KPIs, ROI, copilot validation, frozen numbers.
- **23 browser tests** (Playwright): every page loads with no console errors, scenarios, jam overlay, dark mode, cancel, copilot EN/AR.
- **CI on every pull request:** build and tests, deck build, and a commit check. `main` is protected and only accepts green pull requests; Vercel deploys `main` automatically.

## Repository layout

```
web/              Next.js app (Vercel root): app/ pages, lib/engine/, workers/, store/, components/, tests/
notebook/         ETA model (LightGBM) and RL dispatch notebooks
deck/             PPTX builder, one module per slide, with speaker notes
deliverables/     Final PPTX + PDF, 90-second demo video, screenshots, combined GenAI prompt log
scripts/          Speaker scripts (source); scripts_pdf/ has the PDFs
docs/             Plan, research brief, assumptions, frozen results, Q&A, risks, ROI model,
                  verification log, contribution notes, per-member prompt logs
data_seed/        Assumed input values (fleet, costs, traffic, events)
tools/            Repo setup, speaker PDFs, submission zip, prompt log and contribution reports
```

## Team (Group 2)

| Slide | Member | Built |
|---|---|---|
| 1 | Gagandeep | Landing page and 3D scene, design system, final deck |
| 2 | Yash | Problem and market page, k-means zones, shared charts, research fact-check |
| 3 | Atharva | ETA model (notebook + browser), `/eta`, genetic algorithm |
| 4 | Krishna Mathur | Repo, CI and Vercel; Clarke-Wright + 2-opt optimiser; `/command` and `/optimizer`; demo video; integration |
| 5 | Advait | KPI engine, `/fleet`, `/customer`, GenAI copilot (EN/AR), assumptions |
| 6 | Karan Baid (presents) | Presents integration and risk. The re-routing engine, `/rerouting`, `/integration`, risk register and QA were built by Yash while Karan was away |
| 7 | Harsh | ROI model, `/business-case`, RL lab, number freeze |

Contribution notes: [`docs/contributions/`](docs/contributions/) · report from git history: [`docs/contribution_report.md`](docs/contribution_report.md).

## Honesty notes

- DubaiDash Express and all its figures are fictional and **assumed**; every result is **simulated**.
- The baseline is a simple rule; real dispatchers may do better, which is why we propose a measured pilot before scaling.
- The ETA model was trained on a public Indian delivery dataset (Kaggle, MIT licence). It shows the method, not Dubai ground truth.
- The 41% to 53% last-mile share is a **worldwide** figure. We make no claims about UAE PDPL fines.
- Customer satisfaction is not measured directly; on-time rate and SLA breaches are used as proxies.

## GenAI disclosure

GenAI tools assisted with code, text and slides, as the course allows. Every prompt is logged per member in [`docs/prompt_logs/`](docs/prompt_logs/) and combined in [`deliverables/GenAI_Prompt_Log.md`](deliverables/GenAI_Prompt_Log.md). GenAI-assisted content is circled in red on the slides.
