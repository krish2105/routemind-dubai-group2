#!/usr/bin/env python3
"""Generates prompts/members/*.md from one place so the 7 prompts stay consistent. Run: python3 tools/_gen_member_prompts.py"""
import os, textwrap
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "prompts", "members")
os.makedirs(OUT, exist_ok=True)

LIGHT = """## 1b. LIGHT MODE is mandatory (Next.js pages AND the PPTX)
- **Web:** everything you build is **light mode only** ("daylight dispatch"): page background `bg-paper`/white, text `text-fg` (navy) and slate-600/700 for secondary text, cards use the `Glass` component, teal `text-ai` = AI, amber `text-base` = baseline, red `text-risk` = SLA risk, green `text-ok`. Use the tokens in `web/app/globals.css`; never hard-code dark colours, never `text-white` on a light card (only on a teal button), no dark-mode toggle. Charts: white/transparent background, light grey grid, teal and amber series. Maps: the free CARTO **Positron** light style. 3D scenes: pale sky background (see `components/three/HeroScene.tsx`).
- **PPTX:** your slide module in `deck/slides/` uses only the colours exported by `deck/theme.js` (`C.bg` ice white, `C.panel` white cards, `C.text`/`C.white` navy text, `C.ai` teal, `C.base` amber). Light background, dark text, minimum 14 pt body text, nothing under 10 pt. Open the PPTX (or export to PDF) and look at your slide before every PR.
- Check: open your pages at 1440 px and 390 px wide, in a normal browser window; text must be readable and contrast strong.

"""

SETUP = """## 0. Setup (first 15 minutes, human does the terminal steps)
1. Accept the GitHub invitation email (repo `routemind-dubai-group2`). Install Node 20+, Git, Python 3.10+.
2. Unzip the kit, open a terminal in the folder, run:
   `bash tools/join_repo.sh <REPO_URL> "{full}" "<your-github-email>"`
   (Krishna sends `<REPO_URL>`. Use the email linked to your GitHub account so the commits show as yours.)
3. `cd web && npm install` then `cd ../deck && npm install` (takes a few minutes).
4. Start Claude Code in the kit root folder and paste the **launch line** at the top of this file.
5. First task: create branch `feat/{lower}-setup`, create `docs/contributions/{name}.md` (5 lines: who I am, slide, what I will build) and `docs/prompt_logs/{name}.md` from the template, run `cd web && npm run check`, push, open a PR. This proves your setup and your identity work.
"""

COMMON_END = """## Rules for this session (short version; full text in `prompts/00_COMMON_RULES.md`, which you must read first)
- Edit only the files listed under "You own". Other files: ask via the human or open a `contract-change` PR.
- Branch `feat/{lower}-<topic>`; never push to `main`; small PRs; `cd web && npm run check` before each PR; `git pull --rebase origin main` before you start.
- **No `Co-Authored-By`, no "Generated with Claude Code", no Claude/Anthropic name in any commit message, PR text or git identity.** If you see such a line in a draft, delete it.
- Numbers only from the engine or `docs/frozen_results.json`. Everything about DubaiDash is assumed; results are simulated.
- Log every instruction the human types in `docs/prompt_logs/{name}.md` (verbatim) at the end of each session. Circle GenAI content on your slide.
- When blocked for 20 minutes, tell the human in one line what you need and from whom.

## Pull request routine
1. `git add` only your files; commit with a clear message (imperative, e.g. `feat(optimizer): add savings-based construction`). No AI lines.
2. `git push`; open the PR with the template filled: what changed, how I tested (paste real command output), screenshot for UI, which slide number it feeds.
3. Tell the human the PR link. Krishna merges (merge commit). After merge: `git checkout main && git pull`, then start the next branch.

## End-of-session report (max 6 lines to the human)
Done / Next / Blockers / PR links / what to paste into the group chat.
"""

def _unused():
    pass

def write(fname, name, full, lower, launch, role, owns, read_first, spec, tests, slide, dod, prs, handoffs, extra_setup=""):
    setup = extra_setup or SETUP.format(full=full, lower=lower, name=name)
    light = LIGHT
    body = f"""# {full}: Claude Code prompt (Slide {slide['n']}: {slide['topic']})

> **Launch line (paste this into Claude Code after setup):**
> `{launch}`

Read `prompts/00_COMMON_RULES.md` first. Then work only on the items below.

## 1. Your role
{role}

{setup}
{light}## 2. You own (only these paths)
{owns}

## 3. Read first
{read_first}

## 4. What to build
{spec}

## 5. Tests and evidence
{tests}

## 6. Your slide (Slide {slide['n']}: {slide['topic']})
{slide['text']}

## 7. Pull requests (plan)
{prs}

## 8. Hand-offs (who needs what from you, and what you need)
{handoffs}

## 9. Definition of done (tick every box; paste the evidence in your last PR)
{dod}

{COMMON_END.format(lower=lower, name=name)}"""
    with open(os.path.join(OUT, fname), "w") as f:
        f.write(body)

def bl(items, box=False):
    return "\n".join((f"- [ ] {i}" if box else f"- {i}") for i in items)

# ---------------------------------------------------------------- 01 Gagandeep
write("01_Gagandeep.md", "Gagandeep", "Gagandeep (MAIB)", "gagandeep",
 "I am Gagandeep. Read prompts/00_COMMON_RULES.md and prompts/members/01_Gagandeep.md, then do section 4 in order, one PR at a time.",
 "Design lead and deck owner. You make the prototype look ultra-premium (3D hero, glass UI, motion, mobile) and you own the PPTX framework, Slide 1 and the final PPTX/PDF assembly and QA. You open the presentation (Slide 1: the problem and the hook).",
 bl(["`web/app/page.tsx` (landing), `web/app/globals.css`, `web/app/layout.tsx`, `web/app/icon.svg`",
     "`web/components/three/*`, `web/components/ui/*`, `web/components/nav/*`",
     "`deck/theme.js`, `deck/build_deck.js`, `deck/lib/*`, `deck/slides/s1_gagandeep.js`, `deck/README.md`",
     "`deliverables/` final files (PPTX, PDF export, screenshots folder index), `docs/11_submission_checklist.md` (shared with Karan)",
     "`docs/prompt_logs/Gagandeep.md`, `docs/contributions/Gagandeep.md`"]),
 bl(["`docs/05_slide_content.md` (Slide 1 and the deck design rules), `scripts/speaker_scripts.md` (Slide 1 text)",
     "`docs/04_research_brief.md` (every Slide 1 fact comes from here)",
     "`web/components/three/HeroScene.tsx`, `web/app/globals.css`, `web/lib/pages.ts` (read-only for you except `/`)",
     "`deck/README.md`, `deck/theme.js`"]),
 f"""### 4.1 Landing page `/` (3D hero) polish, goal: first 5 seconds wow
Starter exists (procedural Dubai skyline, amber baseline zig-zag vs teal AI routes, moving vehicles). Upgrade, keep 60 fps on a normal laptop:
- Hero headline "RouteMind Dubai" with a one-line promise and two buttons: **Open live demo** (`/command`) and **See the business case** (`/business-case`).
- Scroll storytelling with Framer Motion `useScroll`: Problem (the amber chaos) → AI (teal clean routes) → Result (animated counters reading `fz()` from `lib/frozen.ts`; show "n/a until frozen" if null, never fake numbers).
- Camera rig reacts to the mouse; a toggle "Baseline view / AI view" that swaps route colours in the 3D scene.
- Reduced-motion support (`prefers-reduced-motion` disables camera sway), canvas pauses when off-screen, DPR capped at 1.75, fallback gradient if WebGL fails.
- Page grid of the 11 prototype pages from `PAGES` (owner chips, "Slide n" tags). A footer line: "Simulated prototype, assumed data (DubaiDash Express is fictional)".
### 4.2 Design system
- Keep the token set in `globals.css` (ink, ai teal, base amber, risk red, ok green). Add: skeleton loaders, a `Tooltip`, a `Drawer` (used by the Assumptions drawer, owner of content: Advait), a `Toast`, a `Tabs`, a `SegmentedControl`, a `Stat` count-up component. All typed, documented in a short comment, with focus rings and keyboard support.
- `SideNav` collapses to a bottom tab bar on mobile (<768 px). `AppShell` has a skip link, `aria-current`, and the SIMULATED badge in the header.
- Add `components/ui/README.md` listing every component with a 3-line usage example (teammates use it).
### 4.3 Quality pass (do this last on Monday, after teammates merged)
- Lighthouse on `/` and `/command`: aim for Performance >= 80, Accessibility >= 95 on desktop. Fix cheap wins (font display, image sizes, dynamic imports for three/deck.gl/recharts).
- No console errors on any route; check every route on a 390 px wide viewport.
- Consistent page headers and spacing across all pages (review teammates' PRs for consistency and comment).
### 4.4 Deck framework and final assembly
- `deck/` builds `deliverables/RouteMind_Dubai_Group2.pptx` (7 slides, speaker notes, 16:9). Keep `theme.js` the single place for colours/fonts/footers.
- Monday 18:30 after numbers freeze: `cd deck && npm run build:final` (refuses if numbers are null). Open the PPTX in PowerPoint or Keynote, check every slide for overflow, contrast and that speaker notes show in Presenter view. Export `deliverables/RouteMind_Dubai_Group2.pdf` (backup) and a notes-pages PDF.
- Check that GenAI-made items have the red outline and the legend is present on every slide that has any (slide 54 requirement), and that the QR code on Slide 1 opens the Vercel URL.
- Add slide numbers, source footers, and make all text >= 14 pt on content slides (>= 11 pt for footnotes).""",
 bl(["Vitest: no tests required for UI, but `npm run check` must pass (typecheck + build).",
     "Run `node deck/build_deck.js` and `python3 <pptx skill>/scripts/office/validate.py deliverables/RouteMind_Dubai_Group2.pptx` if that skill is available; otherwise open the file and confirm 7 slides and notes on all 7.",
     "Screenshots (desktop + mobile) of `/` in your PR; Lighthouse numbers pasted in the PR (real output only)."]),
 dict(n=1, topic="Headline and the ask", text=
  "Module: `deck/slides/s1_gagandeep.js`. Message (see `docs/05_slide_content.md`): AI routing cuts DubaiDash's cost per parcel by the frozen % and we ask the C-suite for a 90-day pilot; one line each on the four C-suite angles (business model, tech investment, ecosystem, operational risk). The only external fact is the last-mile share (R1) from `docs/04_research_brief.md`. Add the QR code to the live site (`docs/live_link.txt`). Read your spoken text in `scripts/speaker_scripts.md` (1:00 minute slot), rewrite it in your own words if you like (keep the numbers), then regenerate PDFs with `python3 tools/build_speaker_pdfs.py`. Mark with the red outline anything GenAI produced (the 3D hero image, the text draft)."),
 bl(["PR1 `feat/gagandeep-setup`: contribution file, prompt log, check passes.",
     "PR2 `feat/gagandeep-hero-v2`: landing and 3D hero upgrade (4.1).",
     "PR3 `feat/gagandeep-design-system`: components and mobile nav (4.2).",
     "PR4 `feat/gagandeep-slide1`: `s1_gagandeep.js` final, speaker text check.",
     "PR5 (Mon evening) `feat/gagandeep-final-deck`: final PPTX/PDF, QA notes in `docs/verification_log.md`."]),
 bl(["You give: component library by Sun night (teammates use it), final deck Mon 18:30.",
     "You need: frozen numbers from Harsh (Mon 18:00), screenshots from Krishna (`deliverables/screenshots/`), each slide module from its owner by Mon 16:00."]),
 bl(["Landing page wow + 60 fps + mobile OK + reduced motion",
     "Design-system components documented in `components/ui/README.md`",
     "Lighthouse run recorded; no console errors on any route",
     "`s1_gagandeep.js` final; PPTX has 7 slides, notes on all, red GenAI outlines, QR works",
     "PDF backup exported; speaker PDFs rebuilt",
     "Prompt log and contribution note filled, all PRs merged"], box=True))

# ---------------------------------------------------------------- 02 Yash
write("02_Yash.md", "Yash", "Yash", "yash",
 "I am Yash. Read prompts/00_COMMON_RULES.md and prompts/members/02_Yash.md, then do section 4 in order, one PR at a time.",
 "Problem and data owner. You build the pages that explain the problem and the last-mile geography (`/problem`, `/zones`), the k-means zoning engine, the shared chart components, and you own Slide 2 and the research fact-check.",
 bl(["`web/app/problem/page.tsx`, `web/app/zones/page.tsx`",
     "`web/lib/engine/kmeans.ts`, `web/components/charts/*` (new folder: GA convergence chart, KPI comparison bars, route-table component used by others)",
     "`web/tests/kmeans.test.ts`",
     "`deck/slides/s2_yash.js`, `docs/04_research_brief.md` (fact-check edits only, mark changes), `docs/08_qa_prep.md` section on Slide 2",
     "`docs/prompt_logs/Yash.md`, `docs/contributions/Yash.md`"]),
 bl(["`docs/02_implementation_plan_nextjs.md` (pages 5 and 1, Q3, Q6), `docs/05_slide_content.md` (Slide 2)",
     "`docs/04_research_brief.md` (all rows), `scripts/speaker_scripts.md` (Slide 2)",
     "`web/lib/types.ts`, `web/lib/engine/problem.ts` (how orders are generated), `web/lib/engine/points.ts`, `web/lib/engine/kmeans.ts` (stub with the signature to keep)"]),
 """### 4.1 `kmeans.ts` (engine, Sunday)
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
Open every row in `docs/04_research_brief.md`, open the source link, confirm the number and the wording. Fix wrong rows, mark each row `verified (date, your name)` or `could not verify` (then it must not appear on slides). Write the result in `docs/verification_log.md` (section "Research fact-check").""",
 bl(["Vitest `kmeans.test.ts`: same seed gives same assignment; every order assigned exactly once; k clusters non-empty; silhouette in [-1, 1]; auto-k returns k in range.",
     "`npm run check` passes. Screenshots of `/problem` and `/zones` (desktop + mobile) in the PR.",
     "Paste the research fact-check table in `docs/verification_log.md`."]),
 dict(n=2, topic="Last-mile problem", text=
  "Module: `deck/slides/s2_yash.js`. Message: the problem is real, big and specific to Dubai conditions. Facts only from the verified rows of the brief; one clear visual (the last-mile cost share and the Dubai growth figure). Read your spoken text in `scripts/speaker_scripts.md` (1:15 slot), edit to your own words, keep numbers, rebuild PDFs with `python3 tools/build_speaker_pdfs.py`. Red-outline what GenAI produced."),
 bl(["PR1 `feat/yash-setup`: contribution file, prompt log.",
     "PR2 `feat/yash-kmeans-charts`: `kmeans.ts` + tests + `components/charts/*` (Sunday 22:00).",
     "PR3 `feat/yash-problem-page`: `/problem`.",
     "PR4 `feat/yash-zones-page`: `/zones`.",
     "PR5 `feat/yash-slide2-factcheck`: Slide 2 module + fact-check log."]),
 bl(["You give: charts components (Sun 22:00) to Krishna, Atharva, Advait; zoning to Advait/Karan if they want zone info.",
     "You need: engine problem generator (already there), Gagandeep's `Drawer`/`Tabs` components (optional)."]),
 bl(["`clusterZones` real, deterministic, tested",
     "`/problem` and `/zones` complete, sourced, mobile OK, no stubs",
     "Shared chart components merged and documented",
     "Fact-check done, unverifiable rows removed from slides",
     "`s2_yash.js` final, script reviewed, PDFs rebuilt",
     "Prompt log and contribution note filled, PRs merged"], box=True))

# ---------------------------------------------------------------- 03 Atharva
write("03_Atharva.md", "Atharva", "Atharva", "atharva",
 "I am Atharva. Read prompts/00_COMMON_RULES.md and prompts/members/03_Atharva.md, then do section 4 in order, one PR at a time.",
 "ML and optimisation (GA) owner. You train the ETA and delay model (gradient boosting), export it so it runs in the browser, build `/eta`, implement the Genetic Algorithm solver, and own Slide 3 (how the AI works: predict, optimise).",
 bl(["`notebook/routemind_models.ipynb` (ETA model; Harsh owns `notebook/rl_dispatch.ipynb`)",
     "`web/public/data/eta_model.json`, `web/public/data/eta_metrics.json`, `web/lib/models/eta.ts`, `web/app/eta/page.tsx`",
     "`web/lib/engine/ga.ts`, `web/tests/ga.test.ts`, `web/tests/eta.test.ts`",
     "`deck/slides/s3_atharva.js`, `docs/08_qa_prep.md` (ML questions)",
     "`docs/prompt_logs/Atharva.md`, `docs/contributions/Atharva.md`"]),
 bl(["`docs/02_implementation_plan_nextjs.md` (sections 3, 6, 9; page 4 and Q2, Q7), `docs/05_slide_content.md` (Slide 3)",
     "`web/lib/types.ts`, `web/lib/engine/{schedule,baseline,problem}.ts` (use `evaluateRoute()` for fitness), `web/lib/models/eta.ts` (stub)",
     "`notebook/README.md`, `scripts/speaker_scripts.md` (Slide 3), `web/lib/engine/rng.ts`"]),
 """### 4.1 ETA / delay model (notebook, finish by **Mon 10:00**: Karan and Advait need it)
- Dataset: Kaggle "Amazon Delivery Dataset" (`sujalsuthar/amazon-delivery-dataset`, ~43.7k rows). **First check columns, dates and licence** and write them in the notebook's first cell. Data is from Indian cities: say so; it demonstrates the method, not Dubai ground truth. If Kaggle download is blocked, ask the human to download the CSV into `notebook/data/raw/` (git-ignored).
- Clean, feature-engineer (distance via haversine from store/drop coordinates, hour, weekday, traffic, weather, vehicle, area, category, agent age/rating if present), **chronological split** if timestamps exist (else seeded random split, say which), no target leakage (do not use post-delivery fields).
- Train XGBoost or LightGBM (and a naive baseline: median time per distance bucket). Report **MAE, RMSE, R-squared** for model and naive on the same test set, plus feature importance and a residual plot. Keep the notebook runnable top to bottom in Colab.
- Export: `web/public/data/eta_model.json` = the trees (compact JSON, depth/num trees small enough to keep the file < 1.5 MB) + feature order + category encodings + scaler info; `web/public/data/eta_metrics.json` = `{"mae":..,"rmse":..,"r2":..,"naive_mae":..,"naive_rmse":..,"n_train":..,"n_test":..,"feature_importance":[{"name":..,"value":..}],"dataset_note":"..."}`. The freeze script refuses to run without `mae` and `naive_mae`.
### 4.2 `lib/models/eta.ts`
`predictEta(features) -> {minutes, delayRiskPct}` evaluating the exported trees in pure TypeScript (no Python at runtime), plus `loadEta()` that fetches the JSON once. Unit test: for 20 saved rows (store in `tests/fixtures/eta_samples.json` from the notebook with the Python predictions) the TS output equals Python within 1e-3. Keep the stub signature so other modules compile.
### 4.3 `/eta` page
MAE/RMSE/R-squared cards with the **naive comparison** ("model X min better than naive"), feature-importance bar chart, residual or predicted-vs-actual chart (Recharts), what-if ETA form (distance, hour, traffic, weather, vehicle, zone type) calling `predictEta`, and a visible caveat box about the data origin. Closing line "What this means for operations".
### 4.4 Genetic algorithm `ga.ts` (Sunday night to Monday noon)
Implement `solveGA(problem, opts)` (signature in stub): giant-tour permutation chromosome + split into routes by capacity/duty, order crossover (OX), swap and inversion mutation, tournament selection, elitism (keep best 2), fitness = `evaluateRoute()` cost + penalties for time-window lateness and overload (weights in one constant block). Population 60, generations 150 by default, time-boxed. `meta.convergence` = best fitness per generation (non-increasing with elitism). `opts.warmStart` seeds the population with a given plan (Karan uses it for re-routing). Seeded with `mulberry32`. Must serve every order. Report honestly if GA is worse than Clarke-Wright on the default seed; the freeze script picks the cheaper.""",
 bl(["Vitest `ga.test.ts`: every order served once, capacity respected, same seed gives same result, convergence non-increasing, GA cost <= baseline cost on default seed, warm start never worse than the plan passed in.",
     "Vitest `eta.test.ts`: TS vs Python parity on fixtures.",
     "Paste the notebook's metric table (model vs naive) into the PR. `npm run check` passes."]),
 dict(n=3, topic="The AI loop", text=
  "Module: `deck/slides/s3_atharva.js`. Message: three techniques, one loop: ML predicts delays, optimisation builds routes, GA improves them; the ETA model beats a naive baseline (use the real frozen MAE numbers, never invent). Show the data caveat in a footnote. Read your spoken text in `scripts/speaker_scripts.md` (1:15 slot), rewrite in your own words, keep numbers, rebuild PDFs. Red-outline GenAI content."),
 bl(["PR1 `feat/atharva-setup`.",
     "PR2 `feat/atharva-ga`: `ga.ts` + tests (Mon 12:00 at the latest; a first working version Sun 22:00).",
     "PR3 `feat/atharva-eta-model`: notebook, JSON files, metrics (Mon 10:00).",
     "PR4 `feat/atharva-eta-page`: `eta.ts` + `/eta` + tests.",
     "PR5 `feat/atharva-slide3`: slide module with frozen numbers."]),
 bl(["You give: `eta_model.json` and `eta_metrics.json` by Mon 10:00 (Karan's re-routing and Advait's customer page use ETA); GA to Krishna's `/optimizer` and Karan's reroute (warm start).",
     "You need: `evaluateRoute()` (exists), Yash's `ConvergenceChart` (Sun 22:00)."]),
 bl(["Notebook runs top to bottom; metrics for model and naive on the same test set",
     "`eta_model.json` < 1.5 MB, `eta_metrics.json` has all keys, TS predictions match Python",
     "`solveGA` real, deterministic, tested, convergence array filled",
     "`/eta` page complete with caveat, what-if, charts",
     "`s3_atharva.js` final with frozen numbers, script reviewed, PDFs rebuilt",
     "Prompt log and contribution note filled, PRs merged"], box=True))

# ---------------------------------------------------------------- 04 Krishna
krishna_setup = """## 0. Setup (you go first; everyone else waits for your repo URL. Target: Sunday 16:30)
1. Install Node 20+, Git, Python 3.10+, GitHub CLI (`gh`), Vercel CLI optional (`npm i -g vercel`).
2. Open `team/collaborators.txt` and fill GitHub usernames from the group chat (Name | username). Ask in the group for missing ones. Teammates must accept the invitation email.
3. In the kit folder: `gh auth login` (HTTPS, browser), then `bash tools/setup_git.sh "Krishna Mathur" "<your-github-email>"`, then `bash tools/setup_repo.sh`. This creates a **public** repo `routemind-dubai-group2`, pushes `main`, invites collaborators with push access, writes CODEOWNERS, and protects `main` (PR required). Check the script output line by line; if "could not protect main", set it in GitHub > Settings > Branches (require a pull request, 0 approvals).
4. Send the repo URL in the group chat immediately (message in `team/WhatsApp_Messages.txt`).
5. `cd web && npm install && npm run check`; `cd ../deck && npm install`.
6. **Vercel (Sunday, 15 minutes):** vercel.com > Add New > Project > import the repo > **Root Directory = `web`** > Deploy. Production branch `main`. Put the URL in `docs/live_link.txt`, commit via PR. Merge PRs only with **"Create a merge commit"**. Test now: make a tiny PR from a teammate branch, merge it, confirm Vercel deploys. If Vercel says a deployment is blocked for a collaborator commit, deploy yourself with `cd web && npx vercel --prod` and tell the team.
7. Create branch `feat/krishna-setup`, `docs/contributions/Krishna.md`, `docs/prompt_logs/Krishna.md`, push, PR.
"""
write("04_Krishna.md", "Krishna", "Krishna Mathur", "krishna",
 "I am Krishna. Read prompts/00_COMMON_RULES.md and prompts/members/04_Krishna.md, then do section 0 with me step by step, then section 4 in order.",
 "Team lead, integrator and demo owner. You create the repo and the Vercel deployment, review and merge every PR, build the core optimiser (Clarke-Wright + 2-opt), the worker and store, the `/command` and `/optimizer` pages (the demo), record the demo, and own Slide 4 (live demo). You also build the final zip.",
 bl(["`web/lib/engine/clarkeWright.ts`, `web/lib/engine/localSearch.ts` (new), `web/workers/optimizer.worker.ts`, `web/store/useScenario.ts`",
     "`web/app/command/page.tsx`, `web/app/optimizer/page.tsx`, `web/components/map/*` (new: MapLibre + deck.gl route layers)",
     "`web/tests/cw.test.ts`, `web/tests/e2e/demo.spec.ts` (Playwright smoke test; Karan extends)",
     "`.github/*`, `tools/*`, repo settings, Vercel project, `docs/live_link.txt`, `docs/00_TEAM_WORKFLOW.md`, `docs/status.md`",
     "`deck/slides/s4_krishna.js`, `deliverables/screenshots/*`, `deliverables/demo_90s.mp4`, `dist/*` (final zip)",
     "`docs/prompt_logs/Krishna.md`, `docs/contributions/Krishna.md`"]),
 bl(["`docs/00_TEAM_WORKFLOW.md`, `docs/02_implementation_plan_nextjs.md` (whole), `docs/03_team_split.md`, `docs/11_submission_checklist.md`",
     "`web/lib/types.ts` (the contracts you maintain), `web/lib/engine/*.ts`, `web/workers/optimizer.worker.ts`, `web/store/useScenario.ts`, `web/app/command/page.tsx`",
     "`docs/05_slide_content.md` (Slide 4), `scripts/speaker_scripts.md` (Slide 4)"]),
 """### 4.1 Core optimiser `clarkeWright.ts` + `localSearch.ts` (Sunday, PR by 22:00; everyone depends on it)
- Clarke-Wright savings construction per vehicle class (vans and bikes with their capacities, duty hours, shift start 08:00 or 11:00 as in `buildVehicles`), then improvement: **2-opt inside routes**, **relocate and swap between routes**, repeated until no improvement or a time budget. Use `evaluateRoute()` for every cost and constraint check; time windows: count violations, never hide them. Return a `Plan` with `meta.runMs`, `stub:false`.
- Must serve all orders (add a vehicle of the cheapest feasible type if needed, count it). Deterministic. Update `solve.ts` to call it (contract file: this is your allowed change; note it in the PR).
- Sanity on default seed: AI km should be below baseline km; if not, investigate and say so openly.
### 4.2 Worker + store (Sunday)
Check the worker streams progress and supports cancel (`AbortController`-like flag) for GA; `useScenario` exposes `problem`, `baselinePlan`, `aiPlan`, `kpis`, `status`, `run()`; keep the public API stable for teammates (document it at the top of the file).
### 4.3 `/command` (Command Center, the demo page)
KPI cards (baseline vs AI, deltas from `computeKpis`), **light Dubai map** (MapLibre with the free CARTO Positron light style `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json` + OSM/CARTO attribution; no dark basemap) with **deck.gl TripsLayer** animated routes: left toggle baseline (amber) vs AI (teal), time scrubber 08:00 to 20:00, play/pause, vehicle trails; scenario selector (default, rain, sandstorm, SZR jam: it sets events and calls `run()`); orders as scatter points coloured by risk. Keep the 3D feel: slight map pitch, glow trails. Desktop first, usable on mobile (map above, cards below).
### 4.4 `/optimizer`
Order generator (count, seed, window tightness, van/bike mix, urgent share), algorithm picker (Baseline, Clarke-Wright+2-opt, GA), run button with progress, per-vehicle `RouteTable` (Yash's component), GA `ConvergenceChart`, run time, and a "download plan as JSON" button. Show algorithm name and stub warning if `meta.stub`.
### 4.5 Leadership duties
- Review and merge PRs (merge commit); keep `main` green; Monday 14:00 decision gate (see `docs/00_TEAM_WORKFLOW.md`); keep `docs/status.md` current.
- Monday 17:00: with Harsh run `cd web && npm run freeze` (dry run first), confirm numbers, then all members re-read their slide scripts.
- Monday 18:30: Playwright script (or manual) to take screenshots into `deliverables/screenshots/` (`01_command.png`, `02_optimizer.png`, `03_rerouting.png`, `04_eta.png`, `05_business_case.png`) from the **Vercel URL**, and record a 90 second fallback video `deliverables/demo_90s.mp4`.
- **Final zip and Blackboard (you are the only person who zips and uploads), Monday 21:00 to 23:00:** (1) `git checkout main && git pull`; confirm Gagandeep's final PPTX/PDF and Harsh's frozen numbers are merged; (2) `python3 tools/contribution_report.py` and `python3 tools/build_prompt_log.py` (writes `deliverables/GenAI_Prompt_Log.md/.csv`); (3) `cd deck && npm run build:final` if Gagandeep has not already; (4) `bash tools/make_submission_zip.sh` creates `dist/RouteMind_Dubai_Group2_Submission.zip` (no `node_modules`, `.next`, `.git`, `.env`); (5) **test it**: unzip into an empty temp folder, run `cd web && npm install && npm run check`, `cd ../deck && npm install && node build_deck.js`, and confirm `deliverables/RouteMind_Dubai_Group2.pptx` has 7 slides with speaker notes; (6) Blackboard upload before 23:59: the **PPTX** (and PDF copy), the **prompt log** (`GenAI_Prompt_Log.md` or `.csv`), the **zip**, and the live Vercel link written in the submission text; keep the upload receipt screenshot; (7) post "uploaded" in the group chat. Tuesday 07:30 final check on the live URL.""",
 bl(["Vitest `cw.test.ts`: every order served once, capacity and duty respected, deterministic, AI km <= baseline km on the default seed, hand-check one route (distance, AED cost, CO2) against a manual calculation in the test.",
     "`npm run check` passes locally and in CI; Vercel preview works for a PR; production URL loads `/command` without console errors.",
     "Playwright smoke test (`web/tests/e2e/demo.spec.ts`) visits `/`, `/command`, `/optimizer` and asserts no console errors."]),
 dict(n=4, topic="Live demo", text=
  "Module: `deck/slides/s4_krishna.js`. This is the demo slide: screenshot or live URL, baseline vs AI KPIs, the 13:00 jam moment (Karan's re-routing). Rehearse the 90 second click path (Command Center > Optimizer > Re-routing); keep the recorded video ready as fallback. Read your spoken text in `scripts/speaker_scripts.md` (2:00 slot), rewrite in your own words, keep numbers, rebuild PDFs. Red-outline GenAI content."),
 bl(["PR0 `feat/krishna-setup` (+ the repo itself, Vercel).",
     "PR1 `feat/krishna-cw`: `clarkeWright.ts`, `localSearch.ts`, tests, `solve.ts` hook (Sun 22:00).",
     "PR2 `feat/krishna-command`: `/command` with map and trips layer.",
     "PR3 `feat/krishna-optimizer`: `/optimizer`.",
     "PR4 `feat/krishna-demo-assets`: screenshots, video, slide 4, e2e smoke test.",
     "Final: zip and checklist (not a PR; zip goes to `dist/`, which is git-ignored)."]),
 bl(["You give: repo + URL (Sun 16:30), CW/engine contract (Sun 22:00), merges within 1 hour of a PR, screenshots and video (Mon 19:00).",
     "You need: Yash charts (Sun 22:00), Atharva GA (Mon noon) and ETA JSON (Mon 10:00), Karan reroute (Mon 14:00), Harsh frozen numbers (Mon 18:00)."]),
 bl(["Repo public, 7 collaborators accepted, `main` protected, CI green",
     "Vercel production deployed from `main`, URL in `docs/live_link.txt` and on Slide 1 QR",
     "`solveCW2opt` real, tested; `/command` map + animated routes; `/optimizer` complete",
     "All PRs merged with merge commits; no commit in `main` has an AI attribution line (check: `git log --format=%B | grep -iE 'co-authored|claude|anthropic'` returns nothing)",
     "Screenshots + 90 s video + `s4_krishna.js` final; contribution report and combined prompt log generated",
     "Final zip built, unzipped in a clean folder and `npm run check` passed there; PPTX, prompt log, zip and live link uploaded to Blackboard before 23:59 Monday with receipt saved"], box=True),
 extra_setup=krishna_setup)

# ---------------------------------------------------------------- 05 Advait
write("05_Advait.md", "Advait", "Advait", "advait",
 "I am Advait. Read prompts/00_COMMON_RULES.md and prompts/members/05_Advait.md, then do section 4 in order, one PR at a time.",
 "Operations and customer owner. You own the KPI engine (the single definition of every number), the Fleet & Sustainability page, the Customer & SLA page with the GenAI ops copilot (English and Arabic), the assumptions data, and Slide 5 (operational impact).",
 bl(["`web/lib/engine/kpi.ts`, `web/tests/kpi.test.ts`",
     "`web/app/fleet/page.tsx`, `web/app/customer/page.tsx`, `web/app/api/copilot/route.ts`, `web/lib/copilot/*` (new), `web/components/assumptions/*` (new Assumptions drawer content)",
     "`data_seed/assumptions.json`, `web/public/data/assumptions.json` (keep identical: `npm run sync:frozen` copies; copy manually if needed), `docs/06_assumptions_table.md`",
     "`deck/slides/s5_advait.js`, `docs/08_qa_prep.md` (operations questions)",
     "`docs/prompt_logs/Advait.md`, `docs/contributions/Advait.md`"]),
 bl(["`docs/02_implementation_plan_nextjs.md` (section 5 KPIs, pages 6 and 7, Q4, Q7), `docs/05_slide_content.md` (Slide 5), `docs/06_assumptions_table.md`",
     "`web/lib/engine/kpi.ts` (v0 exists; you finalise), `web/lib/engine/schedule.ts`, `web/lib/types.ts` (Kpis), `web/app/api/copilot/route.ts`",
     "`scripts/speaker_scripts.md` (Slide 5)"]),
 """### 4.1 KPI engine (Sunday, PR by 22:00; Krishna, Karan and Harsh read these numbers)
Finalise `computeKpis(problem, plan)` for **identical definitions for baseline and AI** (spec in plan section 5): km, drive hours, vehicles used, AED cost (km cost + driver-hour cost from assumptions), cost per parcel, capacity and shift utilisation, on-time %, SLA breaches, **at-risk count** (arrivals within the assumed risk buffer of the window end), expected failed attempts (assumed rate by window tightness and zone type), CO2 (assumed g/km by vehicle type), workload fairness (coefficient of variation of route durations), solver run time. Add `pctChange()` helpers if missing and `explainKpi(name)` returning a plain-English one-liner for tooltips. Document each formula in a comment and in `docs/06_assumptions_table.md`.
### 4.2 Assumptions
Review `data_seed/assumptions.json` against `docs/06_assumptions_table.md`: every value labelled **assumed** with a one-line reason and a range. Add the Assumptions drawer content (uses Gagandeep's `Drawer` when merged; until then a simple modal) listing every assumption, opened from the header on every page.
### 4.3 `/fleet` (Fleet and Sustainability)
Utilisation per vehicle (bar chart), workload fairness (CV, simple histogram), km, fuel and **CO2 baseline vs AI**, an **EV-share slider** (assumed emission factor, label it), the heat rule (midday break notice from the brief; check wording in `docs/04_research_brief.md`). Baseline vs AI via `useScenario` (read only). "What this means for operations" line.
### 4.4 `/customer` and the GenAI copilot
- On-time %, window adherence, breaches list (top 10 at-risk orders with reason) baseline vs AI.
- Copilot panel: choose a delayed order → generates a delay message **in English and Arabic**, and a **dispatcher shift summary**. `app/api/copilot/route.ts`: if `LLM_API_KEY` exists, call the LLM with a strict system prompt (no personal data, no promises of compensation, no invented times: only data passed in); otherwise use **template fallback** (deterministic, good quality, both languages, RTL for Arabic). Always label output "AI-drafted, human to approve" and show a "Human approve / edit" button (no sending). Never log or store customer text. Add rate limiting (simple in-memory) and input validation (zod or manual).
- Have a native Arabic speaker check the template wording (ask a classmate); record who checked in the PR.""",
 bl(["Vitest `kpi.test.ts`: hand-calculated route (distance, cost, CO2) equals the function output; same plan gives same KPIs; baseline and AI use the same function; pct change sign correct; CV of equal routes = 0.",
     "Copilot: unit tests for the template fallback (EN and AR contain the order id and new ETA; no placeholders left like `{x}`); a request without API key returns 200.",
     "`npm run check` passes; screenshots of `/fleet` and `/customer` (desktop + mobile) in the PR."]),
 dict(n=5, topic="Utilisation, CO2, SLAs", text=
  "Module: `deck/slides/s5_advait.js`. Message: what changes for operations (KPI table baseline vs AI, CO2, on-time, fairness) and what the copilot does. Numbers via `fz()` from the frozen file only. Read your spoken text in `scripts/speaker_scripts.md` (1:15 slot), rewrite in your own words, keep numbers, rebuild PDFs. Red-outline GenAI content (the copilot messages shown on the slide are GenAI)."),
 bl(["PR1 `feat/advait-setup`.",
     "PR2 `feat/advait-kpi-engine`: `kpi.ts` + tests + assumptions review (Sun 22:00).",
     "PR3 `feat/advait-fleet`: `/fleet`.",
     "PR4 `feat/advait-copilot-customer`: `/customer` + copilot API + templates + tests.",
     "PR5 `feat/advait-slide5`."]),
 bl(["You give: `computeKpis` (Sun 22:00), assumptions drawer, copilot examples for Slide 5.",
     "You need: CW plan (Krishna, Sun 22:00), ETA JSON (Atharva, Mon 10:00) if you show predicted ETAs, Gagandeep's components."]),
 bl(["KPI definitions final, documented, tested; same function for both plans",
     "Assumptions all labelled with reason; drawer available on every page",
     "`/fleet` and `/customer` complete; copilot works with and without key in EN and AR (RTL)",
     "No personal data anywhere; human-approval wording present",
     "`s5_advait.js` final with frozen numbers, script reviewed, PDFs rebuilt",
     "Prompt log and contribution note filled, PRs merged"], box=True))

# ---------------------------------------------------------------- 06 Karan
write("06_Karan.md", "Karan", "Karan Baid", "karan",
 "I am Karan Baid. Read prompts/00_COMMON_RULES.md and prompts/members/06_Karan.md, then do section 4 in order, one PR at a time.",
 "Live re-routing, integration and QA owner. You build the dynamic re-routing engine and the `/rerouting` page (the wow moment of the demo), the integration and risk page, the risk register, and you own quality: automated smoke tests, verification log and the final checklist. You own Slide 6 (integration, risks, roadmap).",
 bl(["`web/lib/engine/reroute.ts`, `web/lib/engine/events.ts`, `web/tests/reroute.test.ts`",
     "`web/app/rerouting/page.tsx`, `web/app/integration/page.tsx`, `web/components/rerouting/*` (new)",
     "`web/tests/e2e/*` (extend Krishna's Playwright smoke test; run against the Vercel URL too), `docs/verification_log.md`, `docs/09_risk_register.md`, `docs/11_submission_checklist.md` (shared with Gagandeep)",
     "`deck/slides/s6_karan.js`, `docs/08_qa_prep.md` (risk and integration questions)",
     "`docs/prompt_logs/Karan.md`, `docs/contributions/Karan.md`"]),
 bl(["`docs/02_implementation_plan_nextjs.md` (pages 3 and 9, Q2, Q5, section 9 verification), `docs/05_slide_content.md` (Slide 6), `docs/09_risk_register.md`, `docs/11_submission_checklist.md`",
     "`web/lib/engine/{reroute,events,schedule,baseline,kpi}.ts`, `web/lib/types.ts`",
     "`scripts/speaker_scripts.md` (Slide 6)"]),
 """### 4.1 `events.ts` (Sunday)
`makeEvent(kind, startMin, durationMin, area?)` for: Sheikh Zayed Road jam (multiplier on the corridor), sandstorm (all legs slower, bike sensitivity assumption 0.6), rain, urgent-order surge. Values from `assumptions.json` (assumed, labelled). Keep `DEMO_EVENT` (SZR jam at 13:00 for 120 min) working.
### 4.2 `reroute.ts` (Sunday night to Monday 14:00; the hardest and most valuable piece)
`reroute(problem, currentPlan, nowMin, newEvents) -> RerouteResult`: (1) freeze completed stops and each vehicle's position at `nowMin`; (2) apply event multipliers to remaining legs; (3) insert new urgent orders by cheapest insertion respecting capacity and windows; (4) re-optimise remaining stops (2-opt, relocate; optional warm-start with Atharva's `solveGA(..., {warmStart})`); (5) return `before` (current plan re-evaluated under the event) and `after`, with `atRiskBefore` and `atRiskAfter`. Deterministic; never drops an order silently (unserved list). The demo claim is "after has fewer at-risk and fewer breaches than before under the jam": measure it, and if it is not true on the demo seed, tune honestly or report it.
### 4.3 `/rerouting` page
Time slider (08:00-20:00) over the AI plan; buttons to inject: SZR jam, sandstorm, rain, urgent surge (count); a **Re-optimise** button with a short progress animation; before/after cards (at-risk, breaches, extra km, new ETAs), the **SLA-at-risk list** (order, customer zone, old ETA, new ETA, window end), a map or simplified route view showing changed routes highlighted (reuse Krishna's map component if merged, otherwise a simple SVG/Recharts view), and the human-override control (accept / reject suggested plan). "What this means for operations".
### 4.4 `/integration` (light) and risk register
Static architecture diagram (SVG, animated lines): TMS/WMS orders > RouteMind engine > driver app, traffic/weather APIs, Makani/address data, customer notification; shows data flows, human-in-the-loop and fallback (what happens if AI is down: dispatchers use last plan or baseline). Risk table from `docs/09_risk_register.md` (risk, likelihood, impact, mitigation, owner) with the C-suite angle: business model shifts, tech investment, ecosystem integration, operational risks. Complete the register (>= 10 risks: data quality, driver adoption, heat/labour rules, API outage, model drift, privacy, over-optimisation vs fairness, vendor lock-in, cost overrun, regulatory).
### 4.5 QA owner (continuous)
Maintain `docs/verification_log.md`: every Vitest and build run with real output, every Lighthouse/e2e run, every defect found and who fixed it. From Monday 12:00 test the **Vercel URL** on desktop and a phone every time a PR merges (script `web/tests/e2e/smoke.spec.ts`: each route loads, no console errors, key numbers visible). Raise bugs in the group chat with route + screenshot. Own `docs/11_submission_checklist.md` and run it Monday 22:00 and Tuesday 07:30.""",
 bl(["Vitest `reroute.test.ts`: all orders served or listed unserved; capacity/duty respected; frozen stops unchanged; deterministic; under the jam `atRiskAfter <= atRiskBefore` on the default seed; urgent orders inserted.",
     "Playwright smoke test passes locally and against the Vercel URL (paste output).",
     "`npm run check` passes; screenshots of `/rerouting` and `/integration` (desktop + mobile)."]),
 dict(n=6, topic="Integration and risk", text=
  "Module: `deck/slides/s6_karan.js`. Message: how it plugs into existing systems, the main operational risks with mitigations, and the 90-day pilot path into Harsh's business case. Cover the four C-suite themes: business-model shifts, tech investment, ecosystem integration, operational risks. Read your spoken text in `scripts/speaker_scripts.md` (1:15 slot), rewrite in your own words, keep numbers, rebuild PDFs. Red-outline GenAI content."),
 bl(["PR1 `feat/karan-setup`.",
     "PR2 `feat/karan-events-reroute`: `events.ts`, `reroute.ts`, tests (first working version Sun 22:00, final Mon 14:00).",
     "PR3 `feat/karan-rerouting-page`.",
     "PR4 `feat/karan-integration-risk`: `/integration`, risk register.",
     "PR5 `feat/karan-qa-slide6`: e2e tests, verification log, Slide 6, checklist."]),
 bl(["You give: re-routing for the demo (Mon 14:00), verification log, bug reports.",
     "You need: CW plan (Krishna Sun 22:00), KPI engine (Advait Sun 22:00), GA warm start (Atharva Mon noon), ETA JSON (Atharva Mon 10:00)."]),
 bl(["`reroute` real, tested, demo seed shows improvement (or an honest note)",
     "`/rerouting` and `/integration` complete; risk register >= 10 risks with mitigations and owners",
     "E2E smoke test passes on the Vercel URL; verification log has real outputs",
     "`s6_karan.js` final, script reviewed, PDFs rebuilt",
     "Submission checklist executed Mon 22:00 and Tue 07:30",
     "Prompt log and contribution note filled, PRs merged"], box=True))

# ---------------------------------------------------------------- 07 Harsh
write("07_Harsh.md", "Harsh", "Harsh Verma", "harsh",
 "I am Harsh. Read prompts/00_COMMON_RULES.md and prompts/members/07_Harsh.md, then do section 4 in order, one PR at a time.",
 "Business case and numbers owner. You build the ROI model and the Business Case page, the RL dispatch notebook and page, the **freeze script** that locks every number the deck uses, and you own Slide 7, the closer for the C-suite (investment, payback, 90-day pilot, the ask).",
 bl(["`web/lib/roi.ts`, `web/tests/roi.test.ts`, `web/app/business-case/page.tsx`, `web/components/roi/*` (new)",
     "`notebook/rl_dispatch.ipynb`, `web/public/data/rl.json`, `web/app/rl-lab/page.tsx`",
     "`web/scripts/freeze.ts`, `web/scripts/sync-frozen.mjs`, `docs/frozen_results.json`, `web/public/data/frozen_results.json`, `docs/results_template.md`, `docs/10_roi_model.md`",
     "`deck/slides/s7_harsh.js`, `docs/08_qa_prep.md` (finance questions)",
     "`docs/prompt_logs/Harsh.md`, `docs/contributions/Harsh.md`"]),
 bl(["`docs/10_roi_model.md`, `docs/02_implementation_plan_nextjs.md` (pages 8 and 10, Q3, freeze rules), `docs/05_slide_content.md` (Slide 7), `docs/06_assumptions_table.md`",
     "`web/lib/roi.ts` (v0), `web/lib/assumptions.ts`, `web/lib/frozen.ts`, `web/scripts/freeze.ts`, `docs/frozen_results.json`",
     "`scripts/speaker_scripts.md` (Slide 7)"]),
 """### 4.1 ROI model `roi.ts` (Sunday)
Finalise per `docs/10_roi_model.md`: monthly saving = (baseline cost per parcel - AI cost per parcel) x parcels per day x working days per month x adoption haircut; minus running cost (software, cloud, support); pilot investment; payback months; 12/36-month net; plus **sensitivity** (adoption 40-100 %, parcels/day, cost-per-km, saving factor) and three scenarios (conservative, base, optimistic). All inputs from `assumptions.json` (assumed, labelled). Return structured results for the page and for freezing. Handle edge cases (saving <= 0 gives "no payback").
### 4.2 `/business-case` page
ROI calculator with sliders (adoption, parcels/day, saving factor), **big payback counter**, 36-month cumulative cash chart (Recharts), sensitivity heat grid, three scenario cards, and the **90-day pilot roadmap** (Days 0-30 data and integration, 31-60 shadow mode vs dispatchers, 61-90 live on one zone) with **go/no-go gates** (on-time uplift, km reduction, dispatcher acceptance, zero safety incidents) and the ask to the C-suite. Everything labelled "assumed / simulated". Closing line "What this means for operations".
### 4.3 RL dispatch lab (Monday, small, one chart)
`notebook/rl_dispatch.ipynb`: tabular Q-learning for urgent-order dispatch (state: time bucket, slack bucket, load bucket, distance bucket; actions: assign to van / bike / defer; reward: -cost - SLA penalty) vs greedy nearest-vehicle on held-out simulated days. Seeded. Export `web/public/data/rl.json` (learning curve, policy vs greedy results). `/rl-lab` shows the learning curve and the comparison with a clear "illustrative, small simulation" label. If RL does not beat greedy, report that honestly; the slide uses it only as "next step". This is the first thing cut if time is short.
### 4.4 Freeze (Monday 17:00 to 18:00; the most important job of the project)
`web/scripts/freeze.ts` already exists (`npm run freeze`, flag `--dry-run`). It refuses to run on stub engines, unserved orders, AI not cheaper, missing ETA metrics. Read it fully, extend it with the ROI outputs (payback, annual net) and any KPI the slides need, then run: dry run, review with Krishna and Advait, real run, commit `docs/frozen_results.json` + `web/public/data/frozen_results.json` in one PR labelled `numbers-freeze`. **After the freeze nobody edits numbers.** Then run the cross-check: `tools/` or a small script that greps every slide module and script for numbers and confirms each appears in the frozen file; list any mismatch in `docs/verification_log.md`. Fill `docs/results_template.md` from the frozen file for Q&A.""",
 bl(["Vitest `roi.test.ts`: hand-calculated payback equals output; saving <= 0 gives null payback; monotonic in adoption; scenarios ordered conservative <= base <= optimistic.",
     "`npm run freeze -- --dry-run` output pasted in the PR before the real run; after the real run `jq` of the frozen file shows no null for required tokens.",
     "`npm run check` passes; screenshots of `/business-case` and `/rl-lab`."]),
 dict(n=7, topic="Roadmap and ROI", text=
  "Module: `deck/slides/s7_harsh.js`. Message: AED investment, payback, 90-day pilot with gates, risks handled, the decision we ask the C-suite to take. Numbers only from the frozen file; call them 'simulated, assumed' on the slide. Read your spoken text in `scripts/speaker_scripts.md` (1:15 slot, includes the closing line), rewrite in your own words, keep numbers, rebuild PDFs. Red-outline GenAI content."),
 bl(["PR1 `feat/harsh-setup`.",
     "PR2 `feat/harsh-roi-model`: `roi.ts` + tests + `docs/10_roi_model.md` (Sun 22:00).",
     "PR3 `feat/harsh-business-case`: `/business-case`.",
     "PR4 `feat/harsh-rl-lab`: notebook, `rl.json`, `/rl-lab` (Mon 16:00, cut if late).",
     "PR5 `feat/harsh-freeze` (label `numbers-freeze`): freeze run + cross-check (Mon 17:00-18:00).",
     "PR6 `feat/harsh-slide7`."]),
 bl(["You give: frozen numbers Mon 18:00 to everyone (slides and scripts depend on them), ROI results for Slide 7 and Karan's roadmap.",
     "You need: CW (Krishna), GA (Atharva), KPIs (Advait), reroute (Karan), ETA metrics (Atharva) all merged by Mon 16:30 for the freeze."]),
 bl(["`roi.ts` real, tested, sensitivity and scenarios work",
     "`/business-case` complete with pilot roadmap and gates",
     "`/rl-lab` complete or consciously cut (tell Krishna)",
     "Freeze run done with review, no nulls, cross-check log written",
     "`s7_harsh.js` final, script reviewed, PDFs rebuilt",
     "Prompt log and contribution note filled, PRs merged"], box=True))

print("written", sorted(os.listdir(OUT)))
