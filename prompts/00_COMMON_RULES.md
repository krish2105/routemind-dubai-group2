# Common rules for every member's Claude Code (read this first, then your own prompt)

You are Claude Code working for ONE member of **Group 2**, course **AI in Operations (MAIB AI 218)**, SP Jain School of Global Management, Dubai. Project: **RouteMind Dubai** (AI in Logistics & Route Optimization). Presentation **Tue 17 Nov 2026, 9:30 am Dubai**; upload to Blackboard before 11:59 pm. Max **7 slides**, 10 minutes + peer Q&A. Marks: Content Quality, Application of Techniques, Presentation Skills, **Team Collaboration (equal contribution)**.

## What the professor asked (slides 53 and 54)
Identify a real-world supply chain challenge; propose an AI-driven solution using ML, optimisation and predictive analytics; design a conceptual workflow **or prototype**; present findings and an **implementation roadmap**. It is a boardroom presentation to C-suite executives: business model shifts, tech investment, ecosystem integration, operational risks. Deliverable: **PPT**. GenAI-generated content must be **circled** and the **prompts shared separately**.
Our answer: a PPTX (7 slides, speaker notes) + a deployed Next.js prototype with 3D elements + simulation results + a 90-day pilot roadmap.

## Non-negotiables
1. **Own your area only.** Your files are listed in your prompt and in `docs/00_TEAM_WORKFLOW.md`. Do not edit other members' files. Shared contracts (`web/lib/types.ts`, `package.json`, `lib/pages.ts` entries of others, `problem.ts`, `schedule.ts`, `baseline.ts`, `solve.ts`) need a PR with the `contract-change` label and Krishna's approval. Adding a dependency is a contract change.
2. **Git rules.** Work on branch `feat/<yourname>-<topic>`. Never push to `main`. Small PRs, at least every 2 to 3 hours. `git pull --rebase origin main` before you start. Run `cd web && npm run check` before every PR. Merge conflicts you do not understand: stop and tell the human. Never force-push.
3. **No AI attribution in git, ever.** Do not add `Co-Authored-By`, `Claude-Session`, "Generated with Claude Code", or any mention of Claude/Anthropic as author or co-author in commit messages, PR descriptions or git identity. `.claude/settings.json` already disables it; if you still see such a line in a draft message, delete it. Commits use the human's own git identity (`git config user.name`; do not change it). If `git config user.email` is empty, ask the human to run `bash tools/setup_git.sh "Name" "email"`.
4. **Honesty.** DubaiDash Express is fictional; every company figure is **assumed**, every result **simulated**. Show a "SIMULATED · ASSUMED DATA" badge on every page with such data. Baseline = assumed nearest-neighbour method. ETA training data is from India (shows the method, not Dubai truth). Never invent a statistic. Facts on slides come only from `docs/04_research_brief.md` (quote Statista as "worldwide"; no PDPL fine claims; say "confirm with legal counsel").
5. **One source of truth for numbers.** Results come from the engine (`web/lib/engine`) or `docs/frozen_results.json`. Never type a result by hand into a page, slide or script.
6. **Real tests, real evidence.** Say "passes" only if you ran it. Engine code needs Vitest tests in `web/tests/` (feasibility, determinism, hand-checked values). Paste real command output into your PR description or `docs/verification_log.md`.
7. **Prompt log.** Every instruction the human types to you is logged **verbatim** in `docs/prompt_logs/<HumanName>.md` (table row: date | slide/area | prompt | what it produced | circled on slide?). Add rows at the end of each work session. Mark GenAI-made content on your slide with the red outline (`genaiCircle` in the deck module) only where GenAI really made it.
8. **Quality bar: premium and clean.** **LIGHT MODE by default** (the web app also has a light/dark toggle; use tokens only so both work; PPTX light only) ("daylight dispatch": white/ice backgrounds, navy text, teal = AI, amber = baseline, red = SLA risk; tokens in `web/app/globals.css`, use `text-fg`, `bg-paper`, `text-ai`, never hard-coded dark colours; no dark mode toggle), glass panels, mono numerals, smooth Framer Motion, no console errors, works on a phone. No placeholder text left behind (delete the `<OwnerTodo />` box when your page is real). Every page keeps its "What this means for operations" line.
9. **No secrets, no personal data.** Synthetic data only. `.env*` is git-ignored. The copilot works without a key.
10. **Ask early.** If something blocks you for more than 20 minutes or a requirement is unclear, ask the human one short question.

## Session start checklist (every time)
1. `git status` and `git pull --rebase origin main`. 2. Read `docs/status.md` if it exists and the latest PRs. 3. Open your prompt file and tick what is done. 4. Work on the next unticked item.

## Session end checklist
1. `cd web && npm run check` passes. 2. Commit (clear message, no AI lines), push, open or update the PR. 3. Add your prompts to `docs/prompt_logs/<Name>.md`. 4. Tell the human in at most 6 lines: done, next, blockers.

## Repo map
`web/` Next.js app (Vercel root) · `deck/` PPTX builder (one file per slide) · `notebook/` ML notebooks · `docs/` plan, research, scripts, checklists · `scripts/speaker_scripts.md` + `scripts_pdf/` spoken text · `tools/` setup and packaging scripts · `data_seed/` assumed numbers.
Start with: `docs/02_implementation_plan_nextjs.md` (spec), `docs/05_slide_content.md` (slides), `docs/06_assumptions_table.md`, `docs/04_research_brief.md`, `docs/07_traceability.md`.
