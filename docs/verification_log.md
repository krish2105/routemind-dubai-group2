# Verification log (QA owner: Karan's area, kept by Yash after Karan left)

Rule: only real command output goes here. "Passes" means it was run. Newest entries on top.

## 2026-11-15 (Sun) · Yash · all Yash + Karan branches merged locally (scratch branch, not pushed)

Branches checked together: `feat/yash-setup`, `feat/yash-kmeans-charts`, `feat/yash-problem-page`, `feat/yash-zones-page`,
`feat/yash-events-reroute`, `feat/yash-rerouting-page`, `feat/yash-integration-risk`, `feat/yash-slides-qa`, on top of `main` at `c17ea92`.
All eight merged with no conflicts.

### `cd web && npm run check` (typecheck + Vitest + next build)
```
 Test Files  4 passed (4)
      Tests  35 passed (35)
✓ Compiled successfully in 5.0s
✓ Generating static pages using 13 workers (16/16) in 808ms
exit code 0
```

### Vitest, verbose (35 tests)
```
 ✓ tests/kmeans.test.ts > k-means zoning (owner: Yash) > same seed gives the same assignment (deterministic) 12ms
 ✓ tests/kmeans.test.ts > k-means zoning (owner: Yash) > every order is assigned exactly once to a valid zone, and all k zones are non-empty 22ms
 ✓ tests/kmeans.test.ts > k-means zoning (owner: Yash) > silhouette is in [-1, 1] 8ms
 ✓ tests/kmeans.test.ts > k-means zoning (owner: Yash) > auto-k returns k in 3..10 and picks the best silhouette it tried 23ms
 ✓ tests/kmeans.test.ts > k-means zoning (owner: Yash) > each micro-hub is a real order inside its own zone (medoid nearest the centroid) 3ms
 ✓ tests/kmeans.test.ts > k-means zoning (owner: Yash) > separates two obvious, hand-built clusters perfectly 1ms
 ✓ tests/kmeans.test.ts > k-means zoning (owner: Yash) > silhouette matches a hand calculation on a 1-D example 0ms
 ✓ tests/kmeans.test.ts > k-means zoning (owner: Yash) > zoneStats covers every order once and urgent shares are in [0, 1] 10ms
 ✓ tests/kmeans.test.ts > k-means zoning (owner: Yash) > empty input does not crash 0ms
 ✓ tests/engine.test.ts > engine contracts (scaffold tests; owners add more) > same seed gives identical problems and KPIs 32ms
 ✓ tests/engine.test.ts > engine contracts (scaffold tests; owners add more) > baseline serves each order at most once and respects capacity 28ms
 ✓ tests/engine.test.ts > engine contracts (scaffold tests; owners add more) > order count matches the scenario and windows are inside operating hours 17ms
 ✓ tests/engine.test.ts > engine contracts (scaffold tests; owners add more) > a jam event makes the same plan slower (events change travel time) 15ms
 ✓ tests/engine.test.ts > engine contracts (scaffold tests; owners add more) > stub algorithms are flagged so the UI never shows fake AI results silently 1012ms
 ✓ tests/reroute.test.ts > events (assumed what-ifs) > DEMO_EVENT is the Sheikh Zayed Road jam at 13:00 for 120 min 3ms
 ✓ tests/reroute.test.ts > events (assumed what-ifs) > makeEvent accepts HH:MM or minutes and gives the same id 0ms
 ✓ tests/reroute.test.ts > events (assumed what-ifs) > multipliers come from assumptions.json; bikes feel 60% of the slow-down 2ms
 ✓ tests/reroute.test.ts > events (assumed what-ifs) > the jam slows a corridor leg only while it is active (hand-checked factor) 0ms
 ✓ tests/reroute.test.ts > events (assumed what-ifs) > mergeEvents drops duplicates by id 1ms
 ✓ tests/reroute.test.ts > reroute (live re-routing) > every order is served exactly once or listed unserved (nothing dropped silently) 0ms
 ✓ tests/reroute.test.ts > reroute (live re-routing) > frozen stops keep their vehicle and exact times 2ms
 ✓ tests/reroute.test.ts > reroute (live re-routing) > capacity is respected and no extra route goes over duty 0ms
 ✓ tests/reroute.test.ts > reroute (live re-routing) > is deterministic 101ms
 ✓ tests/reroute.test.ts > reroute (live re-routing) > under the 13:00 SZR jam on the default seed: fewer at-risk deliveries and no more breaches 0ms
 ✓ tests/reroute.test.ts > reroute (live re-routing) > before = the morning plan re-timed (same stop order per vehicle) 0ms
 ✓ tests/reroute.test.ts > reroute (live re-routing) > urgent surge: new urgent orders are inserted, never dropped 82ms
 ✓ tests/reroute.test.ts > reroute (live re-routing) > events that started earlier only act from now on (past legs are history) 0ms
 ✓ tests/reroute.test.ts > reroute (live re-routing) > before the day starts nothing is frozen; after the day ends nothing changes 1190ms
 ✓ tests/cw.test.ts > Clarke-Wright + 2-opt (AI plan) > is a real solver, not the stub 2ms
 ✓ tests/cw.test.ts > Clarke-Wright + 2-opt (AI plan) > serves every order once, respects capacity and duty hours (default seed) 3ms
 ✓ tests/cw.test.ts > Clarke-Wright + 2-opt (AI plan) > is valid under the 13:00 Sheikh Zayed Road jam too 2ms
 ✓ tests/cw.test.ts > Clarke-Wright + 2-opt (AI plan) > is deterministic: same seed, identical plan 958ms
 ✓ tests/cw.test.ts > Clarke-Wright + 2-opt (AI plan) > beats the baseline on the default seed (km, cost per parcel, on-time, vehicles) 10ms
 ✓ tests/cw.test.ts > Clarke-Wright + 2-opt (AI plan) > hand-check one route: distance, AED vehicle cost and CO2 match a manual calculation 2ms
 ✓ tests/cw.test.ts > Clarke-Wright + 2-opt (AI plan) > runs fast enough for the browser worker 0ms
```

### Route smoke test, production build (`npx next start -p 3001`, then `BASE_URL=http://localhost:3001 node tests/e2e/smoke.mjs`)
```
Smoke test against http://localhost:3001
PASS  /               200     51 ms
PASS  /command        200      5 ms
PASS  /optimizer      200      5 ms
PASS  /rerouting      200      6 ms
PASS  /eta            200      4 ms
PASS  /problem        200      4 ms
PASS  /zones          200      6 ms
PASS  /fleet          200      3 ms
PASS  /customer       200      3 ms
PASS  /integration    200      3 ms
PASS  /business-case  200      3 ms
PASS  /rl-lab         200      3 ms
12/12 routes passed in 100 ms
```
Defect found in my own test and fixed: the first run reported 12/12 FAIL because Next.js embeds "This page could not be found"
in every page payload. A missing page is now detected by its HTTP 404 status (checked: `/does-not-exist` returns 404).

### Browser checks (in-app browser, production build on :3001)
| Route | Console errors | Notes |
|---|---|---|
| /problem | none | all sections render; count-ups end on the sourced values |
| /zones | none | Positron basemap tiles load; 375 px wide: no horizontal scroll (scrollWidth 375 = innerWidth 375) |
| /rerouting | none | Re-optimise in the Web Worker: "128 stops frozen, 172 re-planned, 11 routes changed, 7 orders moved, every order placed" |
| /integration | none | outage toggle switches to the fallback path; 375 px: stacked list instead of SVG, no horizontal scroll |
Other routes (Krishna, Gagandeep, Atharva, Advait, Harsh) passed the HTTP smoke test only; their console check is for after merge on Vercel.

### Re-routing numbers (default seed 2611, AI plan = Clarke-Wright + 2-opt, re-route at 13:00)
`npm run freeze -- --dry-run --allow-stub` (writes nothing; GA is still a stub so `--allow-stub` is needed):
```
  "risk_before": 23,
  "risk_after": 10,
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
- [ ] After each merge from Mon 12:00: `BASE_URL=<vercel-url> node web/tests/e2e/smoke.mjs` and a console check on desktop and phone.
- [ ] Mon 22:00 and Tue 07:30: run `docs/11_submission_checklist.md`.
