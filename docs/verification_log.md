# Verification log (QA owner: Karan's area, kept by Yash after Karan left)

Rule: only real command output goes here. "Passes" means it was run. Newest entries on top.

## 2026-11-15 (Sun, evening) · Yash · all Yash + Karan branches merged locally on top of main `76c65f9` (scratch branch, not pushed)

Branches checked together: `feat/yash-setup`, `feat/yash-kmeans-charts`, `feat/yash-problem-page`, `feat/yash-zones-page`,
`feat/yash-events-reroute`, `feat/yash-rerouting-page`, `feat/yash-integration-risk`, `feat/yash-slides-qa`.
All were rebased onto the new main (GA, demo polish, Playwright) and merged with no conflicts
(only the generated speaker PDFs conflicted during the rebase; rebuilt with `python tools/build_speaker_pdfs.py`).

### `cd web && npm run check` (typecheck + Vitest + next build)
```
 Test Files  5 passed (5)
      Tests  41 passed (41)
✓ Compiled successfully in 4.5s
exit code 0
```

### Vitest, verbose (41 tests)
```
 ✓ tests/engine.test.ts > engine contracts (scaffold tests; owners add more) > same seed gives identical problems and KPIs 51ms
 ✓ tests/engine.test.ts > engine contracts (scaffold tests; owners add more) > baseline serves each order at most once and respects capacity 12ms
 ✓ tests/engine.test.ts > engine contracts (scaffold tests; owners add more) > order count matches the scenario and windows are inside operating hours 17ms
 ✓ tests/engine.test.ts > engine contracts (scaffold tests; owners add more) > a jam event makes the same plan slower (events change travel time) 21ms
 ✓ tests/kmeans.test.ts > k-means zoning (owner: Yash) > same seed gives the same assignment (deterministic) 16ms
 ✓ tests/kmeans.test.ts > k-means zoning (owner: Yash) > every order is assigned exactly once to a valid zone, and all k zones are non-empty 18ms
 ✓ tests/kmeans.test.ts > k-means zoning (owner: Yash) > silhouette is in [-1, 1] 10ms
 ✓ tests/kmeans.test.ts > k-means zoning (owner: Yash) > auto-k returns k in 3..10 and picks the best silhouette it tried 12ms
 ✓ tests/kmeans.test.ts > k-means zoning (owner: Yash) > each micro-hub is a real order inside its own zone (medoid nearest the centroid) 3ms
 ✓ tests/kmeans.test.ts > k-means zoning (owner: Yash) > separates two obvious, hand-built clusters perfectly 1ms
 ✓ tests/kmeans.test.ts > k-means zoning (owner: Yash) > silhouette matches a hand calculation on a 1-D example 0ms
 ✓ tests/kmeans.test.ts > k-means zoning (owner: Yash) > zoneStats covers every order once and urgent shares are in [0, 1] 5ms
 ✓ tests/kmeans.test.ts > k-means zoning (owner: Yash) > empty input does not crash 1ms
 ✓ tests/engine.test.ts > engine contracts (scaffold tests; owners add more) > stub algorithms are flagged so the UI never shows fake AI results silently 1079ms
 ✓ tests/reroute.test.ts > events (assumed what-ifs) > DEMO_EVENT is the Sheikh Zayed Road jam at 13:00 for 120 min 1ms
 ✓ tests/reroute.test.ts > events (assumed what-ifs) > makeEvent accepts HH:MM or minutes and gives the same id 0ms
 ✓ tests/reroute.test.ts > events (assumed what-ifs) > multipliers come from assumptions.json; bikes feel 60% of the slow-down 0ms
 ✓ tests/reroute.test.ts > events (assumed what-ifs) > the jam slows a corridor leg only while it is active (hand-checked factor) 0ms
 ✓ tests/reroute.test.ts > events (assumed what-ifs) > mergeEvents drops duplicates by id 1ms
 ✓ tests/reroute.test.ts > reroute (live re-routing) > every order is served exactly once or listed unserved (nothing dropped silently) 0ms
 ✓ tests/reroute.test.ts > reroute (live re-routing) > frozen stops keep their vehicle and exact times 4ms
 ✓ tests/reroute.test.ts > reroute (live re-routing) > capacity is respected and no extra route goes over duty 1ms
 ✓ tests/reroute.test.ts > reroute (live re-routing) > is deterministic 117ms
 ✓ tests/reroute.test.ts > reroute (live re-routing) > under the 13:00 SZR jam on the default seed: fewer at-risk deliveries and no more breaches 0ms
 ✓ tests/reroute.test.ts > reroute (live re-routing) > before = the morning plan re-timed (same stop order per vehicle) 0ms
 ✓ tests/reroute.test.ts > reroute (live re-routing) > urgent surge: new urgent orders are inserted, never dropped 85ms
 ✓ tests/reroute.test.ts > reroute (live re-routing) > events that started earlier only act from now on (past legs are history) 0ms
 ✓ tests/reroute.test.ts > reroute (live re-routing) > before the day starts nothing is frozen; after the day ends nothing changes 1397ms
 ✓ tests/cw.test.ts > Clarke-Wright + 2-opt (AI plan) > is a real solver, not the stub 1ms
 ✓ tests/cw.test.ts > Clarke-Wright + 2-opt (AI plan) > serves every order once, respects capacity and duty hours (default seed) 2ms
 ✓ tests/cw.test.ts > Clarke-Wright + 2-opt (AI plan) > is valid under the 13:00 Sheikh Zayed Road jam too 1ms
 ✓ tests/cw.test.ts > Clarke-Wright + 2-opt (AI plan) > is deterministic: same seed, identical plan 915ms
 ✓ tests/cw.test.ts > Clarke-Wright + 2-opt (AI plan) > beats the baseline on the default seed (km, cost per parcel, on-time, vehicles) 4ms
 ✓ tests/cw.test.ts > Clarke-Wright + 2-opt (AI plan) > hand-check one route: distance, AED vehicle cost and CO2 match a manual calculation 1ms
 ✓ tests/cw.test.ts > Clarke-Wright + 2-opt (AI plan) > runs fast enough for the browser worker 0ms
 ✓ tests/ga.test.ts > Genetic algorithm > is real, not the stub, and fills convergence 2ms
 ✓ tests/ga.test.ts > Genetic algorithm > serves every order exactly once, respects capacity and duty 1ms
 ✓ tests/ga.test.ts > Genetic algorithm > convergence never goes up (elitism) 1ms
 ✓ tests/ga.test.ts > Genetic algorithm > same seed gives the same plan 1863ms
 ✓ tests/ga.test.ts > Genetic algorithm > costs no more than the baseline on the default seed 1ms
 ✓ tests/ga.test.ts > Genetic algorithm > warm start is never worse than the plan passed in 1305ms
```

### Playwright, all e2e specs (`npm run build`, then `npx playwright test`; local `next start` on :3210, Chrome)
```
  -   1 tests\e2e\capture.spec.ts:21:1 › screenshots
  -   2 tests\e2e\capture.spec.ts:54:1 › demo video (~90 s click path)
  ok  4 tests\e2e\smoke.spec.ts:30:1 › landing page loads without console errors (1.6s)
  ok  3 tests\e2e\demo.spec.ts:14:1 › landing page loads without console errors (2.0s)
  ok  6 tests\e2e\smoke.spec.ts:40:3 › /command loads with title, SIMULATED badge and no console errors (3.4s)
  ok  5 tests\e2e\rerouting.spec.ts:14:1 › /rerouting: SZR jam, Re-optimise, before/after, accept (7.3s)
  ok  8 tests\e2e\smoke.spec.ts:40:3 › /optimizer loads with title, SIMULATED badge and no console errors (2.9s)
  ok  7 tests\e2e\demo.spec.ts:22:1 › /command shows real baseline vs AI KPIs, the map and the jam scenario (8.0s)
  ok 10 tests\e2e\smoke.spec.ts:40:3 › /rerouting loads with title, SIMULATED badge and no console errors (3.0s)
  ok  9 tests\e2e\rerouting.spec.ts:29:1 › /rerouting: urgent surge inserts new orders (4.1s)
  ok 11 tests\e2e\demo.spec.ts:37:1 › /optimizer runs the algorithms and fills the comparison (1.9s)
  ok 12 tests\e2e\smoke.spec.ts:40:3 › /eta loads with title, SIMULATED badge and no console errors (2.8s)
  ok 14 tests\e2e\smoke.spec.ts:40:3 › /problem loads with title, SIMULATED badge and no console errors (3.0s)
  ok 15 tests\e2e\smoke.spec.ts:40:3 › /zones loads with title, SIMULATED badge and no console errors (3.2s)
  ok 13 tests\e2e\demo.spec.ts:46:1 › every scenario re-runs the engine, and the SZR jam shows on the map at 13:30 (10.1s)
  ok 16 tests\e2e\smoke.spec.ts:40:3 › /fleet loads with title, SIMULATED badge and no console errors (2.8s)
  ok 17 tests\e2e\demo.spec.ts:65:1 › dark mode toggle works, persists after reload, and pages stay error-free (3.7s)
  ok 18 tests\e2e\smoke.spec.ts:40:3 › /customer loads with title, SIMULATED badge and no console errors (2.9s)
  ok 19 tests\e2e\demo.spec.ts:84:1 › a run can be cancelled and the next run still works (2.2s)
  ok 20 tests\e2e\smoke.spec.ts:40:3 › /integration loads with title, SIMULATED badge and no console errors (3.0s)
  ok 21 tests\e2e\smoke.spec.ts:40:3 › /business-case loads with title, SIMULATED badge and no console errors (2.8s)
  ok 22 tests\e2e\smoke.spec.ts:40:3 › /rl-lab loads with title, SIMULATED badge and no console errors (2.8s)
  ok 23 tests\e2e\smoke.spec.ts:51:1 › an unknown route returns 404 (322ms)
  2 skipped
  21 passed (39.7s)
```
The 2 skipped tests are Krishna's capture specs (they only run with `SHOTS=1`).
My smoke spec replaced an earlier no-dependency script. That first version reported every route as failed because Next.js embeds the
"This page could not be found" text in every page; a missing page is now checked by its HTTP 404 status.

### Browser checks (in-app browser, production build on :3001)
| Route | Console errors | Notes |
|---|---|---|
| /problem | none | all sections render; count-ups end on the sourced values |
| /zones | none | Positron basemap tiles load; 375 px wide: no horizontal scroll (scrollWidth 375 = innerWidth 375) |
| /rerouting | none | Re-optimise in the Web Worker: "128 stops frozen, 172 re-planned, 11 routes changed, 7 orders moved, every order placed" |
| /integration | none | outage toggle switches to the fallback path; 375 px: stacked list instead of SVG, no horizontal scroll |
Other routes (Krishna, Gagandeep, Atharva, Advait, Harsh) passed the HTTP smoke test only; their console check is for after merge on Vercel.

### Re-routing numbers (default seed 2611, AI plan = Clarke-Wright + 2-opt, re-route at 13:00)
`npm run freeze -- --dry-run` (writes nothing; GA is real now, the cheaper AI plan is still cw2opt):
```
  "risk_before": 23,
  "risk_after": 10,
    "ai_algorithm": "cw2opt",
- public/data/eta_metrics.json missing (Atharva exports it from the notebook)
```
Other events (probe run in Vitest, same plan; at risk = remaining stops late or < 15 min slack, plus unplaced orders):

| Event (time of re-route) | At risk before → after | Breaches before → after | Run time |
|---|---|---|---|
| SZR jam 13:00 (demo, freeze call) | 23 → 10 | 4 → 4 | ~110 ms |
| SZR jam injected at 12:00 | 25 → 11 | 4 → 4 | ~220 ms |
| Sandstorm 12:00, 4 h | 30 → 11 | 11 → 4 | ~400 ms |
| Urgent surge 13:00, 25 orders | 46 → 18 | 29 → 8 | ~100 ms |
| Heavy rain 10:00, 3 h | 44 → 20 | 11 → 8 | ~500 ms |

Honest notes:
- With the plain 1x SLA penalty in the search, one case got worse on breaches (SZR jam at 12:00: 4 → 5). The search now weighs
  lateness at 2x (search only, `LATE_SEARCH_FACTOR` in `reroute.ts`; KPIs unchanged). After that no tested case ends with more breaches.
- The 4 breaches left under the demo jam were already late in the morning plan (their windows closed before 13:00), so re-routing cannot recover them.
- Re-routing adds about 42 km to the day under the demo jam (1196 → 1238 km) to protect time windows; day cost changes 4069 → 4093 AED.

### Deck
`cd deck && node build_deck.js` → `wrote deliverables/RouteMind_Dubai_Group2.pptx (7 slides)` (draft: 16 numbers not frozen yet, shown as em dash).
Slides 2 and 6 exported to PNG with PowerPoint and inspected: light theme, body text 14 pt or more, nothing off-slide (Slide 6 theme cards
were 0.15 in past the right margin on the first build; fixed).
`python tools/build_speaker_pdfs.py` → slide 2 Yash 176 words 1:18 vs 1:15 ok; slide 6 Karan Baid 179 words 1:20 vs 1:15 ok.

## Research fact-check (Yash, 15 Nov 2026)
Each source link in `docs/04_research_brief.md` was opened with an automated fetch on 15 Nov 2026. Full row status is in section 7a of the brief.

| Row | Result | What the source says |
|---|---|---|
| R1 | verified | Statista: 41% (2018) to 53% (2023), worldwide study (not named), updated 14 Feb 2024 |
| R2 | verified | Gulf Today 28 Sep 2026 (WAM): AED 42.2B (US$11.5B) 2025, AED 17.6B 2020, 19% CAGR, 15.7% of retail, >20% by 2030 (EZDubai + Euromonitor). WAM page returned no article text |
| R3 | verified as quoted, low confidence | SmartRoutes: 8 to 20% fail first attempt globally (links HBR); US$17.2 per failed parcel, no source |
| R4 | partly verified | VentureBeat: ~100M miles, ~10M gallons, ~100,000 t CO2 a year. INFORMS returned HTTP 403, so US$300 to 400M could not be verified |
| R5 | could not verify | app.3blmedia.com does not resolve (DNS) |
| R6 | verified | VentureBeat: dynamic re-routing added to ORION |
| R7 | could not verify (automated) | McKinsey page timed out twice (WebFetch and curl). Needs a manual browser check before slide 7 or Q&A uses "5 to 20%" |
| R8 | corrected | Supply Chain Connect attributes the 15% to Cohen and Tang, not McKinsey |
| R9 | verified | JKSUS VRPTW review lists simulated annealing, tabu search, genetic algorithms |
| R10 | verified | arXiv 2205.02453 covers RL and supervised learning for VRPs |
| R11 | verified | arXiv 2303.04147 "Heuristics for Vehicle Routing Problem: A Survey and Recent Advances" |
| R12 | not checked | low-confidence summary; not on any slide |
| R13 | verified | Gulf News: 10-digit Makani number, building entrance, Dubai Municipality, 2015 |
| R14 | verified | Khaleej Times: 12:30 to 15:00, 15 Jun to 15 Sep, riders cannot be compelled; RTA 22 Jun 2026: 23 rest areas |
| R15 | verified with caveat | Enterprise AM: RTA 25% by 2030; Khaleej Times: 20%; keep "check before using a number" |
| R16 | partly verified | Yango (with ROOTS) robots at Sobha Hartland from 24 Mar 2025, 2 km radius (Truck & Fleet ME); noon + Yango robots begun (KT, 10 Dec 2025); Gulf Insider talabots link failed (TLS certificate error) |
| R17 | verified with source note | 1,500+ DEWA charging points in Gulf News (2 Oct 2025); strategies in Khaleej Times |
| R18 | verified | Emirates Nature-WWF: 17 companies, talabat and Unilever support, 30% by 2030, 100% by 2040 |
| R19 | verified | CyberSigma: issued 20 Sep 2021, published 26 Sep 2021, effective 2 Jan 2022, UAE Data Office, consent default |
| R20 | verified (open question stands) | executive regulations status unresolved; no fine claims |

Slides 2 and 6 use only R1, R2, R13, R14 and R19 (all verified). R5 and R7 must not appear on slides until checked by hand
(R7 is on Harsh's slide 7 and in Q&A answer A1: flagged to Harsh).

## Still to run (Karan's QA schedule, now Yash)
- [ ] After each merge from Mon 12:00: `cd web && BASE_URL=<vercel-url> npx playwright test smoke rerouting` and a phone check.
- [ ] Mon 22:00 and Tue 07:30: run `docs/11_submission_checklist.md`.

## 2026-11-16 (Mon) · Gagandeep · Lighthouse and console pass (task 4.3)
Build: `npm run build` + `next start` (production) on branch `feat/gagandeep-quality` (my PRs #33, #34, #36, #38 stacked on main `b6c5471`; base commit `250d184`). Lighthouse 12, `--preset=desktop`, headless Chrome, localhost.

| Page | Run | Performance | Accessibility | Best practices | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| `/` | 1 | 98 | 100 | 100 | | | |
| `/` | 2 (after fixes) | 95 | 100 | 100 | 0.7 s | 180 ms | 0 |
| `/command` | 1 | 47 | 96 | 100 | 1.4 s | 1,950 ms | 0.264 |
| `/command` | 2 (after my fixes) | 49 | 96 | 100 | 1.4 s | 1,380 ms | 0.264 |
| `/command` | 3 (local test of Krishna's one-line fix, reverted) | 59 | 96 | 100 | 1.0 s | 4,340 ms | 0 |

- Fixed in my files: `bg-ai text-white` buttons failed AA contrast, so they now use the deep teal (`globals.css`); after the fix the Play button and scenario pills no longer fail. `KpiCard` keeps its delta line height before results arrive (prevents a shift on slower runs).
- `/command` CLS 0.264: measured in the browser with a layout-shift observer at 615 ms. The status text next to the scenario pills wraps to a second line while "Optimising in a Web Worker…" shows, then the shorter "Same 300 seeded orders…" text fits on one line and the KPI grid and map jump up 32 px. Giving that span `basis-full` (its own line) gave CLS 0 in run 3. Owner: Krishna (`app/command/page.tsx`).
- `/command` TBT varies 1.4 to 4.3 s between runs. Most of it is "Unattributable" plus the map chunk (maplibre + deck.gl), probably WebGL start-up in headless Chrome with no GPU. Not reproduced on a real GPU laptop yet. Accessibility 96: the remaining failure is the Assumptions button (`text-base` amber 11 px on white, owner Advait); `text-base-deep` fixes it.
- Console: all 12 routes opened in the production build at 1350x940. `read_console_messages` showed no errors and no warnings.
- 390 px: all 12 routes had `scrollWidth = 390` (no horizontal scroll), checked in the dev server earlier the same day (PR #36).
