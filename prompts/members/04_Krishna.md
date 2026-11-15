# Krishna Mathur: Claude Code prompt (Slide 4: Live demo)

> **Launch line (paste this into Claude Code after setup):**
> `I am Krishna. Read prompts/00_COMMON_RULES.md and prompts/members/04_Krishna.md, then do section 0 with me step by step, then section 4 in order.`

Read `prompts/00_COMMON_RULES.md` first. Then work only on the items below.

## 1. Your role
Team lead, integrator and demo owner. You create the repo and the Vercel deployment, review and merge every PR, build the core optimiser (Clarke-Wright + 2-opt), the worker and store, the `/command` and `/optimizer` pages (the demo), record the demo, and own Slide 4 (live demo). You also build the final zip.

## 0. Setup (you go first; everyone else waits for your repo URL. Target: Sunday 16:30)
1. Install Node 20+, Git, Python 3.10+, GitHub CLI (`gh`), Vercel CLI optional (`npm i -g vercel`).
2. Open `team/collaborators.txt` and fill GitHub usernames from the group chat (Name | username). Ask in the group for missing ones. Teammates must accept the invitation email.
3. In the kit folder: `gh auth login` (HTTPS, browser), then `bash tools/setup_git.sh "Krishna Mathur" "<your-github-email>"`, then `bash tools/setup_repo.sh`. This creates a **public** repo `routemind-dubai-group2`, pushes `main`, invites collaborators with push access, writes CODEOWNERS, and protects `main` (PR required). Check the script output line by line; if "could not protect main", set it in GitHub > Settings > Branches (require a pull request, 0 approvals).
4. Send the repo URL in the group chat immediately (message in `team/WhatsApp_Messages.txt`).
5. `cd web && npm install && npm run check`; `cd ../deck && npm install`.
6. **Vercel (Sunday, 15 minutes):** vercel.com > Add New > Project > import the repo > **Root Directory = `web`** > Deploy. Production branch `main`. Put the URL in `docs/live_link.txt`, commit via PR. Merge PRs only with **"Create a merge commit"**. Test now: make a tiny PR from a teammate branch, merge it, confirm Vercel deploys. If Vercel says a deployment is blocked for a collaborator commit, deploy yourself with `cd web && npx vercel --prod` and tell the team.
7. Create branch `feat/krishna-setup`, `docs/contributions/Krishna.md`, `docs/prompt_logs/Krishna.md`, push, PR.

## 1b. LIGHT MODE is the default (Next.js pages AND the PPTX); web also has a dark toggle
- **Web:** everything you build is **light mode only** ("daylight dispatch"): page background `bg-paper`/white, text `text-fg` (navy) and slate-600/700 for secondary text, cards use the `Glass` component, teal `text-ai` = AI, amber `text-base` = baseline, red `text-risk` = SLA risk, green `text-ok`. Use the tokens in `web/app/globals.css`; never hard-code dark colours, never `text-white` on a light card (only on a teal button). Charts: white/transparent background, light grey grid, teal and amber series. Maps: the free CARTO **Positron** light style. 3D scenes: pale sky background (see `components/three/HeroScene.tsx`).
- **Theme toggle (update Sun 15 Nov, Krishna):** the web app now has a light/dark toggle (top right, `components/theme/ThemeToggle.tsx`). **Light stays the default** and is used for screenshots, the demo and the PPTX. Dark mode works by swapping the tokens in `web/app/globals.css`, so use only tokens (`bg-paper`, `text-fg`, `text-ai`, `text-base`, `text-risk`, `slate-*`, `Glass`) and never hard-code hex colours; check your page in both modes. In client code, `useTheme()` tells you the active theme (for charts, maps, 3D). The PPTX stays light only.
- **PPTX:** your slide module in `deck/slides/` uses only the colours exported by `deck/theme.js` (`C.bg` ice white, `C.panel` white cards, `C.text`/`C.white` navy text, `C.ai` teal, `C.base` amber). Light background, dark text, minimum 14 pt body text, nothing under 10 pt. Open the PPTX (or export to PDF) and look at your slide before every PR.
- Check: open your pages at 1440 px and 390 px wide, in a normal browser window; text must be readable and contrast strong.

## 2. You own (only these paths)
- `web/lib/engine/clarkeWright.ts`, `web/lib/engine/localSearch.ts` (new), `web/workers/optimizer.worker.ts`, `web/store/useScenario.ts`
- `web/app/command/page.tsx`, `web/app/optimizer/page.tsx`, `web/components/map/*` (new: MapLibre + deck.gl route layers)
- `web/tests/cw.test.ts`, `web/tests/e2e/demo.spec.ts` (Playwright smoke test; Karan extends)
- `.github/*`, `tools/*`, repo settings, Vercel project, `docs/live_link.txt`, `docs/00_TEAM_WORKFLOW.md`, `docs/status.md`
- `deck/slides/s4_krishna.js`, `deliverables/screenshots/*`, `deliverables/demo_90s.mp4`, `dist/*` (final zip)
- `docs/prompt_logs/Krishna.md`, `docs/contributions/Krishna.md`

## 3. Read first
- `docs/00_TEAM_WORKFLOW.md`, `docs/02_implementation_plan_nextjs.md` (whole), `docs/03_team_split.md`, `docs/11_submission_checklist.md`
- `web/lib/types.ts` (the contracts you maintain), `web/lib/engine/*.ts`, `web/workers/optimizer.worker.ts`, `web/store/useScenario.ts`, `web/app/command/page.tsx`
- `docs/05_slide_content.md` (Slide 4), `scripts/speaker_scripts.md` (Slide 4)

## 4. What to build
### 4.1 Core optimiser `clarkeWright.ts` + `localSearch.ts` (Sunday, PR by 22:00; everyone depends on it)
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
- **Final zip and Blackboard (you are the only person who zips and uploads), Monday 21:00 to 23:00:** (1) `git checkout main && git pull`; confirm Gagandeep's final PPTX/PDF and Harsh's frozen numbers are merged; (2) `python3 tools/contribution_report.py` and `python3 tools/build_prompt_log.py` (writes `deliverables/GenAI_Prompt_Log.md/.csv`); (3) `cd deck && npm run build:final` if Gagandeep has not already; (4) `bash tools/make_submission_zip.sh` creates `dist/RouteMind_Dubai_Group2_Submission.zip` (no `node_modules`, `.next`, `.git`, `.env`); (5) **test it**: unzip into an empty temp folder, run `cd web && npm install && npm run check`, `cd ../deck && npm install && node build_deck.js`, and confirm `deliverables/RouteMind_Dubai_Group2.pptx` has 7 slides with speaker notes; (6) Blackboard upload before 23:59: the **PPTX** (and PDF copy), the **prompt log** (`GenAI_Prompt_Log.md` or `.csv`), the **zip**, and the live Vercel link written in the submission text; keep the upload receipt screenshot; (7) post "uploaded" in the group chat. Tuesday 07:30 final check on the live URL.

## 5. Tests and evidence
- Vitest `cw.test.ts`: every order served once, capacity and duty respected, deterministic, AI km <= baseline km on the default seed, hand-check one route (distance, AED cost, CO2) against a manual calculation in the test.
- `npm run check` passes locally and in CI; Vercel preview works for a PR; production URL loads `/command` without console errors.
- Playwright smoke test (`web/tests/e2e/demo.spec.ts`) visits `/`, `/command`, `/optimizer` and asserts no console errors.

## 6. Your slide (Slide 4: Live demo)
Module: `deck/slides/s4_krishna.js`. This is the demo slide: screenshot or live URL, baseline vs AI KPIs, the 13:00 jam moment (Karan's re-routing). Rehearse the 90 second click path (Command Center > Optimizer > Re-routing); keep the recorded video ready as fallback. Read your spoken text in `scripts/speaker_scripts.md` (2:00 slot), rewrite in your own words, keep numbers, rebuild PDFs. Red-outline GenAI content.

## 7. Pull requests (plan)
- You give: repo + URL (Sun 16:30), CW/engine contract (Sun 22:00), merges within 1 hour of a PR, screenshots and video (Mon 19:00).
- You need: Yash charts (Sun 22:00), Atharva GA (Mon noon) and ETA JSON (Mon 10:00), Karan reroute (Mon 14:00), Harsh frozen numbers (Mon 18:00).

## 8. Hand-offs (who needs what from you, and what you need)
- [ ] Repo public, 7 collaborators accepted, `main` protected, CI green
- [ ] Vercel production deployed from `main`, URL in `docs/live_link.txt` and on Slide 1 QR
- [ ] `solveCW2opt` real, tested; `/command` map + animated routes; `/optimizer` complete
- [ ] All PRs merged with merge commits; no commit in `main` has an AI attribution line (check: `git log --format=%B | grep -iE 'co-authored|claude|anthropic'` returns nothing)
- [ ] Screenshots + 90 s video + `s4_krishna.js` final; contribution report and combined prompt log generated
- [ ] Final zip built, unzipped in a clean folder and `npm run check` passed there; PPTX, prompt log, zip and live link uploaded to Blackboard before 23:59 Monday with receipt saved

## 9. Definition of done (tick every box; paste the evidence in your last PR)
- PR0 `feat/krishna-setup` (+ the repo itself, Vercel).
- PR1 `feat/krishna-cw`: `clarkeWright.ts`, `localSearch.ts`, tests, `solve.ts` hook (Sun 22:00).
- PR2 `feat/krishna-command`: `/command` with map and trips layer.
- PR3 `feat/krishna-optimizer`: `/optimizer`.
- PR4 `feat/krishna-demo-assets`: screenshots, video, slide 4, e2e smoke test.
- Final: zip and checklist (not a PR; zip goes to `dist/`, which is git-ignored).

## Rules for this session (short version; full text in `prompts/00_COMMON_RULES.md`, which you must read first)
- Edit only the files listed under "You own". Other files: ask via the human or open a `contract-change` PR.
- Branch `feat/krishna-<topic>`; never push to `main`; small PRs; `cd web && npm run check` before each PR; `git pull --rebase origin main` before you start.
- **No `Co-Authored-By`, no "Generated with Claude Code", no Claude/Anthropic name in any commit message, PR text or git identity.** If you see such a line in a draft, delete it.
- Numbers only from the engine or `docs/frozen_results.json`. Everything about DubaiDash is assumed; results are simulated.
- Log every instruction the human types in `docs/prompt_logs/Krishna.md` (verbatim) at the end of each session. Circle GenAI content on your slide.
- When blocked for 20 minutes, tell the human in one line what you need and from whom.

## Pull request routine
1. `git add` only your files; commit with a clear message (imperative, e.g. `feat(optimizer): add savings-based construction`). No AI lines.
2. `git push`; open the PR with the template filled: what changed, how I tested (paste real command output), screenshot for UI, which slide number it feeds.
3. Tell the human the PR link. Krishna merges (merge commit). After merge: `git checkout main && git pull`, then start the next branch.

## End-of-session report (max 6 lines to the human)
Done / Next / Blockers / PR links / what to paste into the group chat.
