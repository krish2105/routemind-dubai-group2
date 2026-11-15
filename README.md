# RouteMind Dubai: Group 2 Submission Kit

**Course:** AI in Operations (MAIB AI 218), SP Jain School of Global Management, Dubai
**Project:** AI in Logistics & Route Optimization (under "Implementing AI for Supply Chain Optimization")
**Presentation:** Tue 17 Nov 2026, 9:30 am Dubai. 10 minutes + peer Q&A. Maximum 7 slides.
**Upload:** Blackboard, before 11:59 pm the same day. GenAI content must be circled; prompts shared separately.
**Marks (10):** Content Quality, Application of Techniques, Presentation Skills, Team Collaboration.

## What is inside

```
routemind-dubai-submission/
  START_HERE.md               <- read first (5 min): who does what, setup, rules
  README.md                   <- you are here
  CLAUDE.md                   <- project memory for every member's Claude Code
  prompts/
    00_COMMON_RULES.md        <- rules every Claude Code follows
    members/01..07_<Name>.md  <- ONE prompt per member (own files, spec, tests, slide, PRs, definition of done)
    99_RESUME_ANY_MEMBER.md   <- paste after a restart
  docs/
    00_TEAM_WORKFLOW.md       <- ownership by path, git rules, timeline, Vercel, no-AI-attribution rules
    01..11_*.md               <- brief, technical spec, research (20 sourced facts), slides, assumptions,
                                 traceability, Q&A prep, risks, ROI model, checklist
    prompt_logs/<Name>.md     <- each member logs their prompts here (GenAI disclosure)
    contributions/<Name>.md   <- each member's contribution note (team collaboration evidence)
    frozen_results.json       <- numbers locked Monday 18:00
  scripts/speaker_scripts.md  <- source text for the speaker PDFs
  scripts_pdf/                <- Group2_Speaker_Scripts.pdf + one PDF per member
  web/                        <- Next.js 16 prototype (3D, Tailwind, Framer Motion), Vercel root, starter app + engine contracts
  deck/                       <- PPTX builder (one module per slide, speaker notes, red GenAI outlines)
  notebook/                   <- ETA model + RL notebooks (built by Atharva and Harsh)
  team/                       <- team plan, role cards, prompt-log sheet, WhatsApp messages, collaborators.txt
  tools/                      <- setup_repo.sh, join_repo.sh, setup_git.sh, speaker PDFs, zip, reports
  .claude/ .githooks/ .github/<- keep AI attribution out of git, CI, PR template, CODEOWNERS
  data_seed/assumptions.json  <- assumed numbers used by the app
  source_material/            <- original plan + slides 53 and 54
  deliverables/               <- final PPTX, PDF, demo video, screenshots (built at the end)
```

## What is ready now vs what each member builds

| Ready in this kit | Built by the members with Claude Code |
|---|---|
| Starter web app that builds and runs (3D landing, design tokens, shared engine contracts + evaluator, baseline, tests) | The real engine parts: Clarke-Wright + 2-opt, GA, k-means, re-routing, KPIs, ETA model, ROI, copilot |
| Draft 7-slide PPTX builder with speaker notes (numbers show a dash until frozen) | All 11 dashboard pages made real, Vercel deployment, demo video |
| Plan, research brief, assumptions, Q&A, risks, ROI model, checklist | Frozen numbers (Monday 18:00), final PPTX + PDF, final zip |
| Speaker scripts for all 7 members (PDF), one prompt per member, git guards, CI | Each member's prompt log and contribution note |

The starter engine files for the algorithms are **stubs flagged `meta.stub`**: the UI shows "STUB" instead of fake AI numbers, and `npm run freeze` refuses to run until they are real.

## How to use it (short)

1. Krishna: repo + Vercel (see `START_HERE.md`, `prompts/members/04_Krishna.md` section 0).
2. Everyone else: unzip, `bash tools/join_repo.sh <url> "Name" "email"`, `npm install` in `web/` and `deck/`.
3. Start Claude Code, paste the launch line from your own file in `prompts/members/`.
4. Work on your branch, open PRs, Krishna merges. Monday 17:00 numbers freeze (Harsh). Monday evening final deck (Gagandeep) and zip (Krishna).
5. Tuesday: `docs/11_submission_checklist.md`, present at 9:30, upload before 23:59.

## Honesty notes (please keep these on the slides)

- The company ("DubaiDash Express") and all its figures are fictional and **assumed**. Results are **simulated**.
- The baseline is a simple nearest-neighbour method. Real dispatchers may do better, so the pilot is how we measure real savings.
- The ETA training data is from India: it demonstrates the method, not Dubai ground truth.
- Statista 41% to 53% is a **worldwide** figure. We do not claim fines under UAE PDPL.
- Not yet verified by us: slide 56 (the 7 key questions) and the course outline. We used the questions from the original plan. Please check.
- Customer satisfaction is not measured directly; on-time rate and breaches are proxies.

## Rebuild the speaker PDFs

```
pip install reportlab
python3 tools/build_speaker_pdfs.py
```
Numbers come from `docs/frozen_results.json`. Red `[tokens]` in the PDF mean a number is not frozen yet.
