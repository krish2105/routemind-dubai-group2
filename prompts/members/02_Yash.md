# Yash: Claude Code prompt (Slide 2: Last-mile problem)

> **Launch line (paste this into Claude Code after setup):**
> `I am Yash. Read prompts/00_COMMON_RULES.md and prompts/members/02_Yash.md, then do section 4 in order, one PR at a time.`

Read `prompts/00_COMMON_RULES.md` first. Then work only on the items below.

## 1. Your role
Problem and data owner. You build the pages that explain the problem and the last-mile geography (`/problem`, `/zones`), the k-means zoning engine, the shared chart components, and you own Slide 2 and the research fact-check.

## 0. Setup (first 15 minutes, human does the terminal steps)
1. Accept the GitHub invitation email (repo `routemind-dubai-group2`). Install Node 20+, Git, Python 3.10+.
2. Unzip the kit, open a terminal in the folder, run:
   `bash tools/join_repo.sh <REPO_URL> "Yash" "<your-github-email>"`
   (Krishna sends `<REPO_URL>`. Use the email linked to your GitHub account so the commits show as yours.)
3. `cd web && npm install` then `cd ../deck && npm install` (takes a few minutes).
4. Start Claude Code in the kit root folder and paste the **launch line** at the top of this file.
5. First task: create branch `feat/yash-setup`, create `docs/contributions/Yash.md` (5 lines: who I am, slide, what I will build) and `docs/prompt_logs/Yash.md` from the template, run `cd web && npm run check`, push, open a PR. This proves your setup and your identity work.

## 1b. LIGHT MODE is the default (Next.js pages AND the PPTX); web also has a dark toggle
- **Web:** everything you build is **light mode only** ("daylight dispatch"): page background `bg-paper`/white, text `text-fg` (navy) and slate-600/700 for secondary text, cards use the `Glass` component, teal `text-ai` = AI, amber `text-base` = baseline, red `text-risk` = SLA risk, green `text-ok`. Use the tokens in `web/app/globals.css`; never hard-code dark colours, never `text-white` on a light card (only on a teal button). Charts: white/transparent background, light grey grid, teal and amber series. Maps: the free CARTO **Positron** light style. 3D scenes: pale sky background (see `components/three/HeroScene.tsx`).
- **Theme toggle (update Sun 15 Nov, Krishna):** the web app now has a light/dark toggle (top right, `components/theme/ThemeToggle.tsx`). **Light stays the default** and is used for screenshots, the demo and the PPTX. Dark mode works by swapping the tokens in `web/app/globals.css`, so use only tokens (`bg-paper`, `text-fg`, `text-ai`, `text-base`, `text-risk`, `slate-*`, `Glass`) and never hard-code hex colours; check your page in both modes. In client code, `useTheme()` tells you the active theme (for charts, maps, 3D). The PPTX stays light only.
- **PPTX:** your slide module in `deck/slides/` uses only the colours exported by `deck/theme.js` (`C.bg` ice white, `C.panel` white cards, `C.text`/`C.white` navy text, `C.ai` teal, `C.base` amber). Light background, dark text, minimum 14 pt body text, nothing under 10 pt. Open the PPTX (or export to PDF) and look at your slide before every PR.
- Check: open your pages at 1440 px and 390 px wide, in a normal browser window; text must be readable and contrast strong.

## 2. You own (only these paths)
- `web/app/problem/page.tsx`, `web/app/zones/page.tsx`
- `web/lib/engine/kmeans.ts`, `web/components/charts/*` (new folder: GA convergence chart, KPI comparison bars, route-table component used by others)
- `web/tests/kmeans.test.ts`
- `deck/slides/s2_yash.js`, `docs/04_research_brief.md` (fact-check edits only, mark changes), `docs/08_qa_prep.md` section on Slide 2
- `docs/prompt_logs/Yash.md`, `docs/contributions/Yash.md`

## 3. Read first
- `docs/02_implementation_plan_nextjs.md` (pages 5 and 1, Q3, Q6), `docs/05_slide_content.md` (Slide 2)
- `docs/04_research_brief.md` (all rows), `scripts/speaker_scripts.md` (Slide 2)
- `web/lib/types.ts`, `web/lib/engine/problem.ts` (how orders are generated), `web/lib/engine/points.ts`, `web/lib/engine/kmeans.ts` (stub with the signature to keep)

## 4. What to build
### 4.1 `kmeans.ts` (engine, Sunday)
Implement `clusterZones(orders, k, seed)` (signature already in the stub): seeded k-means++ init (use `mulberry32` from `rng.ts`), Lloyd iterations on lat/lng (convert to km with `geo.ts` for distances), stop on no change or 50 iterations. Pick `k` automatically when the caller passes none, using silhouette score over k = 3..10. Return `assignment`, `centroids`, `silhouette`, and for each cluster a **medoid order** (micro-hub / locker candidate: the order closest to the centroid) plus stops per km estimate. Deterministic. Export a helper `zoneStats()` (orders per zone, avg intra-zone distance, share of urgent orders).
### 4.2 `/problem` page (The Problem and Market)
- Story page with 4 animated sections: (1) last mile is the costly leg (use the research-brief figure and cite its source name in small text, label Statista "worldwide"), (2) Dubai growth drivers from the brief, (3) why it is hard here (heat, traffic corridors, gated access, tight time windows), (4) "what we simulate" with the assumed DubaiDash scenario numbers read from `lib/assumptions.ts`.
- Every fact has a source chip linking to the source (from the brief). No fact outside the brief. No PDPL fine claims. Add "Simulated / assumed" badges where relevant. Closing line "What this means for operations".
### 4.3 `/zones` page (Zones and Last Mile)
- Map view (MapLibre with the free CARTO Positron light basemap and OSM/CARTO attribution; if MapLibre is too heavy, a Recharts scatter on lat/lng is an acceptable first version) with orders coloured by zone, centroids, micro-hub markers.
- Controls: k slider (3..10) and "auto k"; show silhouette, orders per zone bar chart, stops per km, and a **first-attempt-success** what-if (a locker share slider that reduces failed-attempt expectation using the assumption in `assumptions.json`; label as assumed).
- Uses `useScenario` store for the current problem (read only; do not edit the store).
### 4.4 Shared charts (Sunday night, others depend on this)
`components/charts/`: `ConvergenceChart` (Recharts line, takes `number[]`), `CompareBars` (baseline amber vs AI teal for a KPI list), `RouteTable` (per-vehicle rows: vehicle, stops, km, hours, load %, breaches; sortable), `Sparkline`. Typed, theme-aware, with empty-state and "stub" state. Document props in a comment at the top of each file.
### 4.5 Research fact-check (Monday morning)
Open every row in `docs/04_research_brief.md`, open the source link, confirm the number and the wording. Fix wrong rows, mark each row `verified (date, your name)` or `could not verify` (then it must not appear on slides). Write the result in `docs/verification_log.md` (section "Research fact-check").

## 5. Tests and evidence
- Vitest `kmeans.test.ts`: same seed gives same assignment; every order assigned exactly once; k clusters non-empty; silhouette in [-1, 1]; auto-k returns k in range.
- `npm run check` passes. Screenshots of `/problem` and `/zones` (desktop + mobile) in the PR.
- Paste the research fact-check table in `docs/verification_log.md`.

## 6. Your slide (Slide 2: Last-mile problem)
Module: `deck/slides/s2_yash.js`. Message: the problem is real, big and specific to Dubai conditions. Facts only from the verified rows of the brief; one clear visual (the last-mile cost share and the Dubai growth figure). Read your spoken text in `scripts/speaker_scripts.md` (1:15 slot), edit to your own words, keep numbers, rebuild PDFs with `python3 tools/build_speaker_pdfs.py`. Red-outline what GenAI produced.

## 7. Pull requests (plan)
- You give: charts components (Sun 22:00) to Krishna, Atharva, Advait; zoning to Advait/Karan if they want zone info.
- You need: engine problem generator (already there), Gagandeep's `Drawer`/`Tabs` components (optional).

## 8. Hand-offs (who needs what from you, and what you need)
- [ ] `clusterZones` real, deterministic, tested
- [ ] `/problem` and `/zones` complete, sourced, mobile OK, no stubs
- [ ] Shared chart components merged and documented
- [ ] Fact-check done, unverifiable rows removed from slides
- [ ] `s2_yash.js` final, script reviewed, PDFs rebuilt
- [ ] Prompt log and contribution note filled, PRs merged

## 9. Definition of done (tick every box; paste the evidence in your last PR)
- PR1 `feat/yash-setup`: contribution file, prompt log.
- PR2 `feat/yash-kmeans-charts`: `kmeans.ts` + tests + `components/charts/*` (Sunday 22:00).
- PR3 `feat/yash-problem-page`: `/problem`.
- PR4 `feat/yash-zones-page`: `/zones`.
- PR5 `feat/yash-slide2-factcheck`: Slide 2 module + fact-check log.

## Rules for this session (short version; full text in `prompts/00_COMMON_RULES.md`, which you must read first)
- Edit only the files listed under "You own". Other files: ask via the human or open a `contract-change` PR.
- Branch `feat/yash-<topic>`; never push to `main`; small PRs; `cd web && npm run check` before each PR; `git pull --rebase origin main` before you start.
- **No `Co-Authored-By`, no "Generated with Claude Code", no Claude/Anthropic name in any commit message, PR text or git identity.** If you see such a line in a draft, delete it.
- Numbers only from the engine or `docs/frozen_results.json`. Everything about DubaiDash is assumed; results are simulated.
- Log every instruction the human types in `docs/prompt_logs/Yash.md` (verbatim) at the end of each session. Circle GenAI content on your slide.
- When blocked for 20 minutes, tell the human in one line what you need and from whom.

## Pull request routine
1. `git add` only your files; commit with a clear message (imperative, e.g. `feat(optimizer): add savings-based construction`). No AI lines.
2. `git push`; open the PR with the template filled: what changed, how I tested (paste real command output), screenshot for UI, which slide number it feeds.
3. Tell the human the PR link. Krishna merges (merge commit). After merge: `git checkout main && git pull`, then start the next branch.

## End-of-session report (max 6 lines to the human)
Done / Next / Blockers / PR links / what to paste into the group chat.
