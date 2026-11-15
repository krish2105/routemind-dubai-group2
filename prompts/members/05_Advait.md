# Advait: Claude Code prompt (Slide 5: Utilisation, CO2, SLAs)

> **Launch line (paste this into Claude Code after setup):**
> `I am Advait. Read prompts/00_COMMON_RULES.md and prompts/members/05_Advait.md, then do section 4 in order, one PR at a time.`

Read `prompts/00_COMMON_RULES.md` first. Then work only on the items below.

## 1. Your role
Operations and customer owner. You own the KPI engine (the single definition of every number), the Fleet & Sustainability page, the Customer & SLA page with the GenAI ops copilot (English and Arabic), the assumptions data, and Slide 5 (operational impact).

## 0. Setup (first 15 minutes, human does the terminal steps)
1. Accept the GitHub invitation email (repo `routemind-dubai-group2`). Install Node 20+, Git, Python 3.10+.
2. Unzip the kit, open a terminal in the folder, run:
   `bash tools/join_repo.sh <REPO_URL> "Advait" "<your-github-email>"`
   (Krishna sends `<REPO_URL>`. Use the email linked to your GitHub account so the commits show as yours.)
3. `cd web && npm install` then `cd ../deck && npm install` (takes a few minutes).
4. Start Claude Code in the kit root folder and paste the **launch line** at the top of this file.
5. First task: create branch `feat/advait-setup`, create `docs/contributions/Advait.md` (5 lines: who I am, slide, what I will build) and `docs/prompt_logs/Advait.md` from the template, run `cd web && npm run check`, push, open a PR. This proves your setup and your identity work.

## 1b. LIGHT MODE is the default (Next.js pages AND the PPTX); web also has a dark toggle
- **Web:** everything you build is **light mode only** ("daylight dispatch"): page background `bg-paper`/white, text `text-fg` (navy) and slate-600/700 for secondary text, cards use the `Glass` component, teal `text-ai` = AI, amber `text-base` = baseline, red `text-risk` = SLA risk, green `text-ok`. Use the tokens in `web/app/globals.css`; never hard-code dark colours, never `text-white` on a light card (only on a teal button). Charts: white/transparent background, light grey grid, teal and amber series. Maps: the free CARTO **Positron** light style. 3D scenes: pale sky background (see `components/three/HeroScene.tsx`).
- **Theme toggle (update Sun 15 Nov, Krishna):** the web app now has a light/dark toggle (top right, `components/theme/ThemeToggle.tsx`). **Light stays the default** and is used for screenshots, the demo and the PPTX. Dark mode works by swapping the tokens in `web/app/globals.css`, so use only tokens (`bg-paper`, `text-fg`, `text-ai`, `text-base`, `text-risk`, `slate-*`, `Glass`) and never hard-code hex colours; check your page in both modes. In client code, `useTheme()` tells you the active theme (for charts, maps, 3D). The PPTX stays light only.
- **PPTX:** your slide module in `deck/slides/` uses only the colours exported by `deck/theme.js` (`C.bg` ice white, `C.panel` white cards, `C.text`/`C.white` navy text, `C.ai` teal, `C.base` amber). Light background, dark text, minimum 14 pt body text, nothing under 10 pt. Open the PPTX (or export to PDF) and look at your slide before every PR.
- Check: open your pages at 1440 px and 390 px wide, in a normal browser window; text must be readable and contrast strong.

## 2. You own (only these paths)
- `web/lib/engine/kpi.ts`, `web/tests/kpi.test.ts`
- `web/app/fleet/page.tsx`, `web/app/customer/page.tsx`, `web/app/api/copilot/route.ts`, `web/lib/copilot/*` (new), `web/components/assumptions/*` (new Assumptions drawer content)
- `data_seed/assumptions.json`, `web/public/data/assumptions.json` (keep identical: `npm run sync:frozen` copies; copy manually if needed), `docs/06_assumptions_table.md`
- `deck/slides/s5_advait.js`, `docs/08_qa_prep.md` (operations questions)
- `docs/prompt_logs/Advait.md`, `docs/contributions/Advait.md`

## 3. Read first
- `docs/02_implementation_plan_nextjs.md` (section 5 KPIs, pages 6 and 7, Q4, Q7), `docs/05_slide_content.md` (Slide 5), `docs/06_assumptions_table.md`
- `web/lib/engine/kpi.ts` (v0 exists; you finalise), `web/lib/engine/schedule.ts`, `web/lib/types.ts` (Kpis), `web/app/api/copilot/route.ts`
- `scripts/speaker_scripts.md` (Slide 5)

## 4. What to build
### 4.1 KPI engine (Sunday, PR by 22:00; Krishna, Karan and Harsh read these numbers)
Finalise `computeKpis(problem, plan)` for **identical definitions for baseline and AI** (spec in plan section 5): km, drive hours, vehicles used, AED cost (km cost + driver-hour cost from assumptions), cost per parcel, capacity and shift utilisation, on-time %, SLA breaches, **at-risk count** (arrivals within the assumed risk buffer of the window end), expected failed attempts (assumed rate by window tightness and zone type), CO2 (assumed g/km by vehicle type), workload fairness (coefficient of variation of route durations), solver run time. Add `pctChange()` helpers if missing and `explainKpi(name)` returning a plain-English one-liner for tooltips. Document each formula in a comment and in `docs/06_assumptions_table.md`.
### 4.2 Assumptions
Review `data_seed/assumptions.json` against `docs/06_assumptions_table.md`: every value labelled **assumed** with a one-line reason and a range. Add the Assumptions drawer content (uses Gagandeep's `Drawer` when merged; until then a simple modal) listing every assumption, opened from the header on every page.
### 4.3 `/fleet` (Fleet and Sustainability)
Utilisation per vehicle (bar chart), workload fairness (CV, simple histogram), km, fuel and **CO2 baseline vs AI**, an **EV-share slider** (assumed emission factor, label it), the heat rule (midday break notice from the brief; check wording in `docs/04_research_brief.md`). Baseline vs AI via `useScenario` (read only). "What this means for operations" line.
### 4.4 `/customer` and the GenAI copilot
- On-time %, window adherence, breaches list (top 10 at-risk orders with reason) baseline vs AI.
- Copilot panel: choose a delayed order → generates a delay message **in English and Arabic**, and a **dispatcher shift summary**. `app/api/copilot/route.ts`: if `LLM_API_KEY` exists, call the LLM with a strict system prompt (no personal data, no promises of compensation, no invented times: only data passed in); otherwise use **template fallback** (deterministic, good quality, both languages, RTL for Arabic). Always label output "AI-drafted, human to approve" and show a "Human approve / edit" button (no sending). Never log or store customer text. Add rate limiting (simple in-memory) and input validation (zod or manual).
- Have a native Arabic speaker check the template wording (ask a classmate); record who checked in the PR.

## 5. Tests and evidence
- Vitest `kpi.test.ts`: hand-calculated route (distance, cost, CO2) equals the function output; same plan gives same KPIs; baseline and AI use the same function; pct change sign correct; CV of equal routes = 0.
- Copilot: unit tests for the template fallback (EN and AR contain the order id and new ETA; no placeholders left like `{x}`); a request without API key returns 200.
- `npm run check` passes; screenshots of `/fleet` and `/customer` (desktop + mobile) in the PR.

## 6. Your slide (Slide 5: Utilisation, CO2, SLAs)
Module: `deck/slides/s5_advait.js`. Message: what changes for operations (KPI table baseline vs AI, CO2, on-time, fairness) and what the copilot does. Numbers via `fz()` from the frozen file only. Read your spoken text in `scripts/speaker_scripts.md` (1:15 slot), rewrite in your own words, keep numbers, rebuild PDFs. Red-outline GenAI content (the copilot messages shown on the slide are GenAI).

## 7. Pull requests (plan)
- You give: `computeKpis` (Sun 22:00), assumptions drawer, copilot examples for Slide 5.
- You need: CW plan (Krishna, Sun 22:00), ETA JSON (Atharva, Mon 10:00) if you show predicted ETAs, Gagandeep's components.

## 8. Hand-offs (who needs what from you, and what you need)
- [ ] KPI definitions final, documented, tested; same function for both plans
- [ ] Assumptions all labelled with reason; drawer available on every page
- [ ] `/fleet` and `/customer` complete; copilot works with and without key in EN and AR (RTL)
- [ ] No personal data anywhere; human-approval wording present
- [ ] `s5_advait.js` final with frozen numbers, script reviewed, PDFs rebuilt
- [ ] Prompt log and contribution note filled, PRs merged

## 9. Definition of done (tick every box; paste the evidence in your last PR)
- PR1 `feat/advait-setup`.
- PR2 `feat/advait-kpi-engine`: `kpi.ts` + tests + assumptions review (Sun 22:00).
- PR3 `feat/advait-fleet`: `/fleet`.
- PR4 `feat/advait-copilot-customer`: `/customer` + copilot API + templates + tests.
- PR5 `feat/advait-slide5`.

## Rules for this session (short version; full text in `prompts/00_COMMON_RULES.md`, which you must read first)
- Edit only the files listed under "You own". Other files: ask via the human or open a `contract-change` PR.
- Branch `feat/advait-<topic>`; never push to `main`; small PRs; `cd web && npm run check` before each PR; `git pull --rebase origin main` before you start.
- **No `Co-Authored-By`, no "Generated with Claude Code", no Claude/Anthropic name in any commit message, PR text or git identity.** If you see such a line in a draft, delete it.
- Numbers only from the engine or `docs/frozen_results.json`. Everything about DubaiDash is assumed; results are simulated.
- Log every instruction the human types in `docs/prompt_logs/Advait.md` (verbatim) at the end of each session. Circle GenAI content on your slide.
- When blocked for 20 minutes, tell the human in one line what you need and from whom.

## Pull request routine
1. `git add` only your files; commit with a clear message (imperative, e.g. `feat(optimizer): add savings-based construction`). No AI lines.
2. `git push`; open the PR with the template filled: what changed, how I tested (paste real command output), screenshot for UI, which slide number it feeds.
3. Tell the human the PR link. Krishna merges (merge commit). After merge: `git checkout main && git pull`, then start the next branch.

## End-of-session report (max 6 lines to the human)
Done / Next / Blockers / PR links / what to paste into the group chat.
