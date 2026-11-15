# Harsh Verma: Claude Code prompt (Slide 7: Roadmap and ROI)

> **Launch line (paste this into Claude Code after setup):**
> `I am Harsh. Read prompts/00_COMMON_RULES.md and prompts/members/07_Harsh.md, then do section 4 in order, one PR at a time.`

Read `prompts/00_COMMON_RULES.md` first. Then work only on the items below.

## 1. Your role
Business case and numbers owner. You build the ROI model and the Business Case page, the RL dispatch notebook and page, the **freeze script** that locks every number the deck uses, and you own Slide 7, the closer for the C-suite (investment, payback, 90-day pilot, the ask).

## 0. Setup (first 15 minutes, human does the terminal steps)
1. Accept the GitHub invitation email (repo `routemind-dubai-group2`). Install Node 20+, Git, Python 3.10+.
2. Unzip the kit, open a terminal in the folder, run:
   `bash tools/join_repo.sh <REPO_URL> "Harsh Verma" "<your-github-email>"`
   (Krishna sends `<REPO_URL>`. Use the email linked to your GitHub account so the commits show as yours.)
3. `cd web && npm install` then `cd ../deck && npm install` (takes a few minutes).
4. Start Claude Code in the kit root folder and paste the **launch line** at the top of this file.
5. First task: create branch `feat/harsh-setup`, create `docs/contributions/Harsh.md` (5 lines: who I am, slide, what I will build) and `docs/prompt_logs/Harsh.md` from the template, run `cd web && npm run check`, push, open a PR. This proves your setup and your identity work.

## 1b. LIGHT MODE is the default (Next.js pages AND the PPTX); web also has a dark toggle
- **Web:** everything you build is **light mode only** ("daylight dispatch"): page background `bg-paper`/white, text `text-fg` (navy) and slate-600/700 for secondary text, cards use the `Glass` component, teal `text-ai` = AI, amber `text-base` = baseline, red `text-risk` = SLA risk, green `text-ok`. Use the tokens in `web/app/globals.css`; never hard-code dark colours, never `text-white` on a light card (only on a teal button). Charts: white/transparent background, light grey grid, teal and amber series. Maps: the free CARTO **Positron** light style. 3D scenes: pale sky background (see `components/three/HeroScene.tsx`).
- **Theme toggle (update Sun 15 Nov, Krishna):** the web app now has a light/dark toggle (top right, `components/theme/ThemeToggle.tsx`). **Light stays the default** and is used for screenshots, the demo and the PPTX. Dark mode works by swapping the tokens in `web/app/globals.css`, so use only tokens (`bg-paper`, `text-fg`, `text-ai`, `text-base`, `text-risk`, `slate-*`, `Glass`) and never hard-code hex colours; check your page in both modes. In client code, `useTheme()` tells you the active theme (for charts, maps, 3D). The PPTX stays light only.
- **PPTX:** your slide module in `deck/slides/` uses only the colours exported by `deck/theme.js` (`C.bg` ice white, `C.panel` white cards, `C.text`/`C.white` navy text, `C.ai` teal, `C.base` amber). Light background, dark text, minimum 14 pt body text, nothing under 10 pt. Open the PPTX (or export to PDF) and look at your slide before every PR.
- Check: open your pages at 1440 px and 390 px wide, in a normal browser window; text must be readable and contrast strong.

## 2. You own (only these paths)
- `web/lib/roi.ts`, `web/tests/roi.test.ts`, `web/app/business-case/page.tsx`, `web/components/roi/*` (new)
- `notebook/rl_dispatch.ipynb`, `web/public/data/rl.json`, `web/app/rl-lab/page.tsx`
- `web/scripts/freeze.ts`, `web/scripts/sync-frozen.mjs`, `docs/frozen_results.json`, `web/public/data/frozen_results.json`, `docs/results_template.md`, `docs/10_roi_model.md`
- `deck/slides/s7_harsh.js`, `docs/08_qa_prep.md` (finance questions)
- `docs/prompt_logs/Harsh.md`, `docs/contributions/Harsh.md`

## 3. Read first
- `docs/10_roi_model.md`, `docs/02_implementation_plan_nextjs.md` (pages 8 and 10, Q3, freeze rules), `docs/05_slide_content.md` (Slide 7), `docs/06_assumptions_table.md`
- `web/lib/roi.ts` (v0), `web/lib/assumptions.ts`, `web/lib/frozen.ts`, `web/scripts/freeze.ts`, `docs/frozen_results.json`
- `scripts/speaker_scripts.md` (Slide 7)

## 4. What to build
### 4.1 ROI model `roi.ts` (Sunday)
Finalise per `docs/10_roi_model.md`: monthly saving = (baseline cost per parcel - AI cost per parcel) x parcels per day x working days per month x adoption haircut; minus running cost (software, cloud, support); pilot investment; payback months; 12/36-month net; plus **sensitivity** (adoption 40-100 %, parcels/day, cost-per-km, saving factor) and three scenarios (conservative, base, optimistic). All inputs from `assumptions.json` (assumed, labelled). Return structured results for the page and for freezing. Handle edge cases (saving <= 0 gives "no payback").
### 4.2 `/business-case` page
ROI calculator with sliders (adoption, parcels/day, saving factor), **big payback counter**, 36-month cumulative cash chart (Recharts), sensitivity heat grid, three scenario cards, and the **90-day pilot roadmap** (Days 0-30 data and integration, 31-60 shadow mode vs dispatchers, 61-90 live on one zone) with **go/no-go gates** (on-time uplift, km reduction, dispatcher acceptance, zero safety incidents) and the ask to the C-suite. Everything labelled "assumed / simulated". Closing line "What this means for operations".
### 4.3 RL dispatch lab (Monday, small, one chart)
`notebook/rl_dispatch.ipynb`: tabular Q-learning for urgent-order dispatch (state: time bucket, slack bucket, load bucket, distance bucket; actions: assign to van / bike / defer; reward: -cost - SLA penalty) vs greedy nearest-vehicle on held-out simulated days. Seeded. Export `web/public/data/rl.json` (learning curve, policy vs greedy results). `/rl-lab` shows the learning curve and the comparison with a clear "illustrative, small simulation" label. If RL does not beat greedy, report that honestly; the slide uses it only as "next step". This is the first thing cut if time is short.
### 4.4 Freeze (Monday 17:00 to 18:00; the most important job of the project)
`web/scripts/freeze.ts` already exists (`npm run freeze`, flag `--dry-run`). It refuses to run on stub engines, unserved orders, AI not cheaper, missing ETA metrics. Read it fully, extend it with the ROI outputs (payback, annual net) and any KPI the slides need, then run: dry run, review with Krishna and Advait, real run, commit `docs/frozen_results.json` + `web/public/data/frozen_results.json` in one PR labelled `numbers-freeze`. **After the freeze nobody edits numbers.** Then run the cross-check: `tools/` or a small script that greps every slide module and script for numbers and confirms each appears in the frozen file; list any mismatch in `docs/verification_log.md`. Fill `docs/results_template.md` from the frozen file for Q&A.

## 5. Tests and evidence
- Vitest `roi.test.ts`: hand-calculated payback equals output; saving <= 0 gives null payback; monotonic in adoption; scenarios ordered conservative <= base <= optimistic.
- `npm run freeze -- --dry-run` output pasted in the PR before the real run; after the real run `jq` of the frozen file shows no null for required tokens.
- `npm run check` passes; screenshots of `/business-case` and `/rl-lab`.

## 6. Your slide (Slide 7: Roadmap and ROI)
Module: `deck/slides/s7_harsh.js`. Message: AED investment, payback, 90-day pilot with gates, risks handled, the decision we ask the C-suite to take. Numbers only from the frozen file; call them 'simulated, assumed' on the slide. Read your spoken text in `scripts/speaker_scripts.md` (1:15 slot, includes the closing line), rewrite in your own words, keep numbers, rebuild PDFs. Red-outline GenAI content.

## 7. Pull requests (plan)
- You give: frozen numbers Mon 18:00 to everyone (slides and scripts depend on them), ROI results for Slide 7 and Karan's roadmap.
- You need: CW (Krishna), GA (Atharva), KPIs (Advait), reroute (Karan), ETA metrics (Atharva) all merged by Mon 16:30 for the freeze.

## 8. Hand-offs (who needs what from you, and what you need)
- [ ] `roi.ts` real, tested, sensitivity and scenarios work
- [ ] `/business-case` complete with pilot roadmap and gates
- [ ] `/rl-lab` complete or consciously cut (tell Krishna)
- [ ] Freeze run done with review, no nulls, cross-check log written
- [ ] `s7_harsh.js` final, script reviewed, PDFs rebuilt
- [ ] Prompt log and contribution note filled, PRs merged

## 9. Definition of done (tick every box; paste the evidence in your last PR)
- PR1 `feat/harsh-setup`.
- PR2 `feat/harsh-roi-model`: `roi.ts` + tests + `docs/10_roi_model.md` (Sun 22:00).
- PR3 `feat/harsh-business-case`: `/business-case`.
- PR4 `feat/harsh-rl-lab`: notebook, `rl.json`, `/rl-lab` (Mon 16:00, cut if late).
- PR5 `feat/harsh-freeze` (label `numbers-freeze`): freeze run + cross-check (Mon 17:00-18:00).
- PR6 `feat/harsh-slide7`.

## Rules for this session (short version; full text in `prompts/00_COMMON_RULES.md`, which you must read first)
- Edit only the files listed under "You own". Other files: ask via the human or open a `contract-change` PR.
- Branch `feat/harsh-<topic>`; never push to `main`; small PRs; `cd web && npm run check` before each PR; `git pull --rebase origin main` before you start.
- **No `Co-Authored-By`, no "Generated with Claude Code", no Claude/Anthropic name in any commit message, PR text or git identity.** If you see such a line in a draft, delete it.
- Numbers only from the engine or `docs/frozen_results.json`. Everything about DubaiDash is assumed; results are simulated.
- Log every instruction the human types in `docs/prompt_logs/Harsh.md` (verbatim) at the end of each session. Circle GenAI content on your slide.
- When blocked for 20 minutes, tell the human in one line what you need and from whom.

## Pull request routine
1. `git add` only your files; commit with a clear message (imperative, e.g. `feat(optimizer): add savings-based construction`). No AI lines.
2. `git push`; open the PR with the template filled: what changed, how I tested (paste real command output), screenshot for UI, which slide number it feeds.
3. Tell the human the PR link. Krishna merges (merge commit). After merge: `git checkout main && git pull`, then start the next branch.

## End-of-session report (max 6 lines to the human)
Done / Next / Blockers / PR links / what to paste into the group chat.
