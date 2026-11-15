# Karan Baid: Claude Code prompt (Slide 6: Integration and risk)

> **Launch line (paste this into Claude Code after setup):**
> `I am Karan Baid. Read prompts/00_COMMON_RULES.md and prompts/members/06_Karan.md, then do section 4 in order, one PR at a time.`

Read `prompts/00_COMMON_RULES.md` first. Then work only on the items below.

## 1. Your role
Live re-routing, integration and QA owner. You build the dynamic re-routing engine and the `/rerouting` page (the wow moment of the demo), the integration and risk page, the risk register, and you own quality: automated smoke tests, verification log and the final checklist. You own Slide 6 (integration, risks, roadmap).

## 0. Setup (first 15 minutes, human does the terminal steps)
1. Accept the GitHub invitation email (repo `routemind-dubai-group2`). Install Node 20+, Git, Python 3.10+.
2. Unzip the kit, open a terminal in the folder, run:
   `bash tools/join_repo.sh <REPO_URL> "Karan Baid" "<your-github-email>"`
   (Krishna sends `<REPO_URL>`. Use the email linked to your GitHub account so the commits show as yours.)
3. `cd web && npm install` then `cd ../deck && npm install` (takes a few minutes).
4. Start Claude Code in the kit root folder and paste the **launch line** at the top of this file.
5. First task: create branch `feat/karan-setup`, create `docs/contributions/Karan.md` (5 lines: who I am, slide, what I will build) and `docs/prompt_logs/Karan.md` from the template, run `cd web && npm run check`, push, open a PR. This proves your setup and your identity work.

## 1b. LIGHT MODE is the default (Next.js pages AND the PPTX); web also has a dark toggle
- **Web:** everything you build is **light mode only** ("daylight dispatch"): page background `bg-paper`/white, text `text-fg` (navy) and slate-600/700 for secondary text, cards use the `Glass` component, teal `text-ai` = AI, amber `text-base` = baseline, red `text-risk` = SLA risk, green `text-ok`. Use the tokens in `web/app/globals.css`; never hard-code dark colours, never `text-white` on a light card (only on a teal button). Charts: white/transparent background, light grey grid, teal and amber series. Maps: the free CARTO **Positron** light style. 3D scenes: pale sky background (see `components/three/HeroScene.tsx`).
- **Theme toggle (update Sun 15 Nov, Krishna):** the web app now has a light/dark toggle (top right, `components/theme/ThemeToggle.tsx`). **Light stays the default** and is used for screenshots, the demo and the PPTX. Dark mode works by swapping the tokens in `web/app/globals.css`, so use only tokens (`bg-paper`, `text-fg`, `text-ai`, `text-base`, `text-risk`, `slate-*`, `Glass`) and never hard-code hex colours; check your page in both modes. In client code, `useTheme()` tells you the active theme (for charts, maps, 3D). The PPTX stays light only.
- **PPTX:** your slide module in `deck/slides/` uses only the colours exported by `deck/theme.js` (`C.bg` ice white, `C.panel` white cards, `C.text`/`C.white` navy text, `C.ai` teal, `C.base` amber). Light background, dark text, minimum 14 pt body text, nothing under 10 pt. Open the PPTX (or export to PDF) and look at your slide before every PR.
- Check: open your pages at 1440 px and 390 px wide, in a normal browser window; text must be readable and contrast strong.

## 2. You own (only these paths)
- `web/lib/engine/reroute.ts`, `web/lib/engine/events.ts`, `web/tests/reroute.test.ts`
- `web/app/rerouting/page.tsx`, `web/app/integration/page.tsx`, `web/components/rerouting/*` (new)
- `web/tests/e2e/*` (extend Krishna's Playwright smoke test; run against the Vercel URL too), `docs/verification_log.md`, `docs/09_risk_register.md`, `docs/11_submission_checklist.md` (shared with Gagandeep)
- `deck/slides/s6_karan.js`, `docs/08_qa_prep.md` (risk and integration questions)
- `docs/prompt_logs/Karan.md`, `docs/contributions/Karan.md`

## 3. Read first
- `docs/02_implementation_plan_nextjs.md` (pages 3 and 9, Q2, Q5, section 9 verification), `docs/05_slide_content.md` (Slide 6), `docs/09_risk_register.md`, `docs/11_submission_checklist.md`
- `web/lib/engine/{reroute,events,schedule,baseline,kpi}.ts`, `web/lib/types.ts`
- `scripts/speaker_scripts.md` (Slide 6)

## 4. What to build
### 4.1 `events.ts` (Sunday)
`makeEvent(kind, startMin, durationMin, area?)` for: Sheikh Zayed Road jam (multiplier on the corridor), sandstorm (all legs slower, bike sensitivity assumption 0.6), rain, urgent-order surge. Values from `assumptions.json` (assumed, labelled). Keep `DEMO_EVENT` (SZR jam at 13:00 for 120 min) working.
### 4.2 `reroute.ts` (Sunday night to Monday 14:00; the hardest and most valuable piece)
`reroute(problem, currentPlan, nowMin, newEvents) -> RerouteResult`: (1) freeze completed stops and each vehicle's position at `nowMin`; (2) apply event multipliers to remaining legs; (3) insert new urgent orders by cheapest insertion respecting capacity and windows; (4) re-optimise remaining stops (2-opt, relocate; optional warm-start with Atharva's `solveGA(..., {warmStart})`); (5) return `before` (current plan re-evaluated under the event) and `after`, with `atRiskBefore` and `atRiskAfter`. Deterministic; never drops an order silently (unserved list). The demo claim is "after has fewer at-risk and fewer breaches than before under the jam": measure it, and if it is not true on the demo seed, tune honestly or report it.
### 4.3 `/rerouting` page
Time slider (08:00-20:00) over the AI plan; buttons to inject: SZR jam, sandstorm, rain, urgent surge (count); a **Re-optimise** button with a short progress animation; before/after cards (at-risk, breaches, extra km, new ETAs), the **SLA-at-risk list** (order, customer zone, old ETA, new ETA, window end), a map or simplified route view showing changed routes highlighted (reuse Krishna's map component if merged, otherwise a simple SVG/Recharts view), and the human-override control (accept / reject suggested plan). "What this means for operations".
### 4.4 `/integration` (light) and risk register
Static architecture diagram (SVG, animated lines): TMS/WMS orders > RouteMind engine > driver app, traffic/weather APIs, Makani/address data, customer notification; shows data flows, human-in-the-loop and fallback (what happens if AI is down: dispatchers use last plan or baseline). Risk table from `docs/09_risk_register.md` (risk, likelihood, impact, mitigation, owner) with the C-suite angle: business model shifts, tech investment, ecosystem integration, operational risks. Complete the register (>= 10 risks: data quality, driver adoption, heat/labour rules, API outage, model drift, privacy, over-optimisation vs fairness, vendor lock-in, cost overrun, regulatory).
### 4.5 QA owner (continuous)
Maintain `docs/verification_log.md`: every Vitest and build run with real output, every Lighthouse/e2e run, every defect found and who fixed it. From Monday 12:00 test the **Vercel URL** on desktop and a phone every time a PR merges (script `web/tests/e2e/smoke.spec.ts`: each route loads, no console errors, key numbers visible). Raise bugs in the group chat with route + screenshot. Own `docs/11_submission_checklist.md` and run it Monday 22:00 and Tuesday 07:30.

## 5. Tests and evidence
- Vitest `reroute.test.ts`: all orders served or listed unserved; capacity/duty respected; frozen stops unchanged; deterministic; under the jam `atRiskAfter <= atRiskBefore` on the default seed; urgent orders inserted.
- Playwright smoke test passes locally and against the Vercel URL (paste output).
- `npm run check` passes; screenshots of `/rerouting` and `/integration` (desktop + mobile).

## 6. Your slide (Slide 6: Integration and risk)
Module: `deck/slides/s6_karan.js`. Message: how it plugs into existing systems, the main operational risks with mitigations, and the 90-day pilot path into Harsh's business case. Cover the four C-suite themes: business-model shifts, tech investment, ecosystem integration, operational risks. Read your spoken text in `scripts/speaker_scripts.md` (1:15 slot), rewrite in your own words, keep numbers, rebuild PDFs. Red-outline GenAI content.

## 7. Pull requests (plan)
- You give: re-routing for the demo (Mon 14:00), verification log, bug reports.
- You need: CW plan (Krishna Sun 22:00), KPI engine (Advait Sun 22:00), GA warm start (Atharva Mon noon), ETA JSON (Atharva Mon 10:00).

## 8. Hand-offs (who needs what from you, and what you need)
- [ ] `reroute` real, tested, demo seed shows improvement (or an honest note)
- [ ] `/rerouting` and `/integration` complete; risk register >= 10 risks with mitigations and owners
- [ ] E2E smoke test passes on the Vercel URL; verification log has real outputs
- [ ] `s6_karan.js` final, script reviewed, PDFs rebuilt
- [ ] Submission checklist executed Mon 22:00 and Tue 07:30
- [ ] Prompt log and contribution note filled, PRs merged

## 9. Definition of done (tick every box; paste the evidence in your last PR)
- PR1 `feat/karan-setup`.
- PR2 `feat/karan-events-reroute`: `events.ts`, `reroute.ts`, tests (first working version Sun 22:00, final Mon 14:00).
- PR3 `feat/karan-rerouting-page`.
- PR4 `feat/karan-integration-risk`: `/integration`, risk register.
- PR5 `feat/karan-qa-slide6`: e2e tests, verification log, Slide 6, checklist.

## Rules for this session (short version; full text in `prompts/00_COMMON_RULES.md`, which you must read first)
- Edit only the files listed under "You own". Other files: ask via the human or open a `contract-change` PR.
- Branch `feat/karan-<topic>`; never push to `main`; small PRs; `cd web && npm run check` before each PR; `git pull --rebase origin main` before you start.
- **No `Co-Authored-By`, no "Generated with Claude Code", no Claude/Anthropic name in any commit message, PR text or git identity.** If you see such a line in a draft, delete it.
- Numbers only from the engine or `docs/frozen_results.json`. Everything about DubaiDash is assumed; results are simulated.
- Log every instruction the human types in `docs/prompt_logs/Karan.md` (verbatim) at the end of each session. Circle GenAI content on your slide.
- When blocked for 20 minutes, tell the human in one line what you need and from whom.

## Pull request routine
1. `git add` only your files; commit with a clear message (imperative, e.g. `feat(optimizer): add savings-based construction`). No AI lines.
2. `git push`; open the PR with the template filled: what changed, how I tested (paste real command output), screenshot for UI, which slide number it feeds.
3. Tell the human the PR link. Krishna merges (merge commit). After merge: `git checkout main && git pull`, then start the next branch.

## End-of-session report (max 6 lines to the human)
Done / Next / Blockers / PR links / what to paste into the group chat.
