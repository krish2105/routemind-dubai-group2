# CLAUDE.md: RouteMind Dubai (Group 2, AI in Operations, MAIB AI 218)

## Project
Fictional courier "DubaiDash Express" (hub Al Quoz, ~300 seeded orders, 12 vans + 8 motorbikes, 08:00 to 20:00). Product: **RouteMind Dubai** = ML + optimisation loop: predict (ETA), cluster (zones), optimise (Clarke-Wright + 2-opt, GA), re-route live, inform (GenAI copilot EN/AR).

## Deadlines (Dubai time)
Presentation Tue 17 Nov 2026 9:30 am; Blackboard upload before 11:59 pm. Max 7 slides, 10 min + Q&A. Decision gate Mon 16 Nov 14:00. Numbers frozen Mon 18:00.

## Rules that must never be broken
1. All company data is assumed; all results are simulated. Label them.
2. Baseline and AI use identical seeded orders (seed 2611).
3. Slide and script numbers come only from `docs/frozen_results.json`.
4. Only cite facts in `docs/04_research_brief.md`. Statista is "worldwide". No PDPL fine claims.
5. No personal data, no secrets in the repo. Copilot must work without an API key.
6. Never claim a test passed unless you ran it. Log real output in `docs/verification_log.md`.
7. Never cut: baseline vs AI, live re-routing, ETA model, deployment or recorded fallback.
8. GenAI disclosure for the course: log prompts in `docs/prompt_logs/<Name>.md`; circle GenAI content on slides.
9. **Git hygiene: never add `Co-Authored-By`, `Claude-Session`, "Generated with Claude Code" or any Claude/Anthropic attribution to commit messages, PR descriptions or git identity.** Commits use the human member's own identity (`git config user.name`). Guards exist in `.claude/settings.json`, `.githooks/` and CI; never bypass them.
10. Seven members work in parallel: edit only the paths you own (`docs/00_TEAM_WORKFLOW.md`); contract files (`web/lib/types.ts`, `package.json`, shared engine files) change only via a `contract-change` PR approved by Krishna. Branch `feat/<name>-<topic>`; never push to `main`.

## Stack
Next.js (App Router) + TypeScript strict + Tailwind + Framer Motion + MapLibre GL + deck.gl + Recharts + Zustand + Comlink Web Workers + Vitest. Vercel root = `web/`. Notebook in `notebook/`. Heavy compute in workers, never on the main thread. All randomness seeded.

## Where things are
- Your prompt: `prompts/00_COMMON_RULES.md` + `prompts/members/<NN>_<Name>.md`; resume with `prompts/99_RESUME_ANY_MEMBER.md`; process in `docs/00_TEAM_WORKFLOW.md`
- Spec: `docs/02_implementation_plan_nextjs.md`; assumptions: `data_seed/assumptions.json`
- Slides: `docs/05_slide_content.md`; speaker text: `scripts/speaker_scripts.md`
- Status: `docs/status.md` (update at the end of every phase)

## Team (7 slides)
Gagandeep S1, Yash S2, Atharva S3, Krishna S4 (demo), Advait S5, Karan Baid S6 (left 15 Nov 2026, back 16 Nov; Slide 6 content built by Yash), Harsh S7.

## Style
Simple English. Short replies. Tables where useful. No new scope after Phase 2.
