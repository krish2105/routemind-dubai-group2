# Atharva: Claude Code prompt (Slide 3: The AI loop)

> **Launch line (paste this into Claude Code after setup):**
> `I am Atharva. Read prompts/00_COMMON_RULES.md and prompts/members/03_Atharva.md, then do section 4 in order, one PR at a time.`

Read `prompts/00_COMMON_RULES.md` first. Then work only on the items below.

## 1. Your role
ML and optimisation (GA) owner. You train the ETA and delay model (gradient boosting), export it so it runs in the browser, build `/eta`, implement the Genetic Algorithm solver, and own Slide 3 (how the AI works: predict, optimise).

## 0. Setup (first 15 minutes, human does the terminal steps)
1. Accept the GitHub invitation email (repo `routemind-dubai-group2`). Install Node 20+, Git, Python 3.10+.
2. Unzip the kit, open a terminal in the folder, run:
   `bash tools/join_repo.sh <REPO_URL> "Atharva" "<your-github-email>"`
   (Krishna sends `<REPO_URL>`. Use the email linked to your GitHub account so the commits show as yours.)
3. `cd web && npm install` then `cd ../deck && npm install` (takes a few minutes).
4. Start Claude Code in the kit root folder and paste the **launch line** at the top of this file.
5. First task: create branch `feat/atharva-setup`, create `docs/contributions/Atharva.md` (5 lines: who I am, slide, what I will build) and `docs/prompt_logs/Atharva.md` from the template, run `cd web && npm run check`, push, open a PR. This proves your setup and your identity work.

## 1b. LIGHT MODE is the default (Next.js pages AND the PPTX); web also has a dark toggle
- **Web:** everything you build is **light mode only** ("daylight dispatch"): page background `bg-paper`/white, text `text-fg` (navy) and slate-600/700 for secondary text, cards use the `Glass` component, teal `text-ai` = AI, amber `text-base` = baseline, red `text-risk` = SLA risk, green `text-ok`. Use the tokens in `web/app/globals.css`; never hard-code dark colours, never `text-white` on a light card (only on a teal button). Charts: white/transparent background, light grey grid, teal and amber series. Maps: the free CARTO **Positron** light style. 3D scenes: pale sky background (see `components/three/HeroScene.tsx`).
- **Theme toggle (update Sun 15 Nov, Krishna):** the web app now has a light/dark toggle (top right, `components/theme/ThemeToggle.tsx`). **Light stays the default** and is used for screenshots, the demo and the PPTX. Dark mode works by swapping the tokens in `web/app/globals.css`, so use only tokens (`bg-paper`, `text-fg`, `text-ai`, `text-base`, `text-risk`, `slate-*`, `Glass`) and never hard-code hex colours; check your page in both modes. In client code, `useTheme()` tells you the active theme (for charts, maps, 3D). The PPTX stays light only.
- **PPTX:** your slide module in `deck/slides/` uses only the colours exported by `deck/theme.js` (`C.bg` ice white, `C.panel` white cards, `C.text`/`C.white` navy text, `C.ai` teal, `C.base` amber). Light background, dark text, minimum 14 pt body text, nothing under 10 pt. Open the PPTX (or export to PDF) and look at your slide before every PR.
- Check: open your pages at 1440 px and 390 px wide, in a normal browser window; text must be readable and contrast strong.

## 2. You own (only these paths)
- `notebook/routemind_models.ipynb` (ETA model; Harsh owns `notebook/rl_dispatch.ipynb`)
- `web/public/data/eta_model.json`, `web/public/data/eta_metrics.json`, `web/lib/models/eta.ts`, `web/app/eta/page.tsx`
- `web/lib/engine/ga.ts`, `web/tests/ga.test.ts`, `web/tests/eta.test.ts`
- `deck/slides/s3_atharva.js`, `docs/08_qa_prep.md` (ML questions)
- `docs/prompt_logs/Atharva.md`, `docs/contributions/Atharva.md`

## 3. Read first
- `docs/02_implementation_plan_nextjs.md` (sections 3, 6, 9; page 4 and Q2, Q7), `docs/05_slide_content.md` (Slide 3)
- `web/lib/types.ts`, `web/lib/engine/{schedule,baseline,problem}.ts` (use `evaluateRoute()` for fitness), `web/lib/models/eta.ts` (stub)
- `notebook/README.md`, `scripts/speaker_scripts.md` (Slide 3), `web/lib/engine/rng.ts`

## 4. What to build
### 4.1 ETA / delay model (notebook, finish by **Mon 10:00**: Karan and Advait need it)
- Dataset: Kaggle "Amazon Delivery Dataset" (`sujalsuthar/amazon-delivery-dataset`, ~43.7k rows). **First check columns, dates and licence** and write them in the notebook's first cell. Data is from Indian cities: say so; it demonstrates the method, not Dubai ground truth. If Kaggle download is blocked, ask the human to download the CSV into `notebook/data/raw/` (git-ignored).
- Clean, feature-engineer (distance via haversine from store/drop coordinates, hour, weekday, traffic, weather, vehicle, area, category, agent age/rating if present), **chronological split** if timestamps exist (else seeded random split, say which), no target leakage (do not use post-delivery fields).
- Train XGBoost or LightGBM (and a naive baseline: median time per distance bucket). Report **MAE, RMSE, R-squared** for model and naive on the same test set, plus feature importance and a residual plot. Keep the notebook runnable top to bottom in Colab.
- Export: `web/public/data/eta_model.json` = the trees (compact JSON, depth/num trees small enough to keep the file < 1.5 MB) + feature order + category encodings + scaler info; `web/public/data/eta_metrics.json` = `{"mae":..,"rmse":..,"r2":..,"naive_mae":..,"naive_rmse":..,"n_train":..,"n_test":..,"feature_importance":[{"name":..,"value":..}],"dataset_note":"..."}`. The freeze script refuses to run without `mae` and `naive_mae`.
### 4.2 `lib/models/eta.ts`
`predictEta(features) -> {minutes, delayRiskPct}` evaluating the exported trees in pure TypeScript (no Python at runtime), plus `loadEta()` that fetches the JSON once. Unit test: for 20 saved rows (store in `tests/fixtures/eta_samples.json` from the notebook with the Python predictions) the TS output equals Python within 1e-3. Keep the stub signature so other modules compile.
### 4.3 `/eta` page
MAE/RMSE/R-squared cards with the **naive comparison** ("model X min better than naive"), feature-importance bar chart, residual or predicted-vs-actual chart (Recharts), what-if ETA form (distance, hour, traffic, weather, vehicle, zone type) calling `predictEta`, and a visible caveat box about the data origin. Closing line "What this means for operations".
### 4.4 Genetic algorithm `ga.ts` (Sunday night to Monday noon)
Implement `solveGA(problem, opts)` (signature in stub): giant-tour permutation chromosome + split into routes by capacity/duty, order crossover (OX), swap and inversion mutation, tournament selection, elitism (keep best 2), fitness = `evaluateRoute()` cost + penalties for time-window lateness and overload (weights in one constant block). Population 60, generations 150 by default, time-boxed. `meta.convergence` = best fitness per generation (non-increasing with elitism). `opts.warmStart` seeds the population with a given plan (Karan uses it for re-routing). Seeded with `mulberry32`. Must serve every order. Report honestly if GA is worse than Clarke-Wright on the default seed; the freeze script picks the cheaper.

## 5. Tests and evidence
- Vitest `ga.test.ts`: every order served once, capacity respected, same seed gives same result, convergence non-increasing, GA cost <= baseline cost on default seed, warm start never worse than the plan passed in.
- Vitest `eta.test.ts`: TS vs Python parity on fixtures.
- Paste the notebook's metric table (model vs naive) into the PR. `npm run check` passes.

## 6. Your slide (Slide 3: The AI loop)
Module: `deck/slides/s3_atharva.js`. Message: three techniques, one loop: ML predicts delays, optimisation builds routes, GA improves them; the ETA model beats a naive baseline (use the real frozen MAE numbers, never invent). Show the data caveat in a footnote. Read your spoken text in `scripts/speaker_scripts.md` (1:15 slot), rewrite in your own words, keep numbers, rebuild PDFs. Red-outline GenAI content.

## 7. Pull requests (plan)
- You give: `eta_model.json` and `eta_metrics.json` by Mon 10:00 (Karan's re-routing and Advait's customer page use ETA); GA to Krishna's `/optimizer` and Karan's reroute (warm start).
- You need: `evaluateRoute()` (exists), Yash's `ConvergenceChart` (Sun 22:00).

## 8. Hand-offs (who needs what from you, and what you need)
- [ ] Notebook runs top to bottom; metrics for model and naive on the same test set
- [ ] `eta_model.json` < 1.5 MB, `eta_metrics.json` has all keys, TS predictions match Python
- [ ] `solveGA` real, deterministic, tested, convergence array filled
- [ ] `/eta` page complete with caveat, what-if, charts
- [ ] `s3_atharva.js` final with frozen numbers, script reviewed, PDFs rebuilt
- [ ] Prompt log and contribution note filled, PRs merged

## 9. Definition of done (tick every box; paste the evidence in your last PR)
- PR1 `feat/atharva-setup`.
- PR2 `feat/atharva-ga`: `ga.ts` + tests (Mon 12:00 at the latest; a first working version Sun 22:00).
- PR3 `feat/atharva-eta-model`: notebook, JSON files, metrics (Mon 10:00).
- PR4 `feat/atharva-eta-page`: `eta.ts` + `/eta` + tests.
- PR5 `feat/atharva-slide3`: slide module with frozen numbers.

## Rules for this session (short version; full text in `prompts/00_COMMON_RULES.md`, which you must read first)
- Edit only the files listed under "You own". Other files: ask via the human or open a `contract-change` PR.
- Branch `feat/atharva-<topic>`; never push to `main`; small PRs; `cd web && npm run check` before each PR; `git pull --rebase origin main` before you start.
- **No `Co-Authored-By`, no "Generated with Claude Code", no Claude/Anthropic name in any commit message, PR text or git identity.** If you see such a line in a draft, delete it.
- Numbers only from the engine or `docs/frozen_results.json`. Everything about DubaiDash is assumed; results are simulated.
- Log every instruction the human types in `docs/prompt_logs/Atharva.md` (verbatim) at the end of each session. Circle GenAI content on your slide.
- When blocked for 20 minutes, tell the human in one line what you need and from whom.

## Pull request routine
1. `git add` only your files; commit with a clear message (imperative, e.g. `feat(optimizer): add savings-based construction`). No AI lines.
2. `git push`; open the PR with the template filled: what changed, how I tested (paste real command output), screenshot for UI, which slide number it feeds.
3. Tell the human the PR link. Krishna merges (merge commit). After merge: `git checkout main && git pull`, then start the next branch.

## End-of-session report (max 6 lines to the human)
Done / Next / Blockers / PR links / what to paste into the group chat.
