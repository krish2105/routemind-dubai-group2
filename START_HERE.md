# START HERE (Group 2, RouteMind Dubai)

Everyone works in Claude Code on **their own** task. One shared GitHub repo, `main` is deployed on Vercel. Read this page (5 minutes), then your own prompt.

## Who does what
| Member | Slide | Prompt file | Builds |
|---|---|---|---|
| Gagandeep | 1 | `prompts/members/01_Gagandeep.md` | landing + 3D hero, design system, deck framework, final PPTX/PDF |
| Yash | 2 | `prompts/members/02_Yash.md` | `/problem`, `/zones`, k-means, shared charts, research fact-check |
| Atharva | 3 | `prompts/members/03_Atharva.md` | ETA model + `/eta`, genetic algorithm |
| Krishna | 4 | `prompts/members/04_Krishna.md` | repo + Vercel, Clarke-Wright + 2-opt, `/command` map, `/optimizer`, demo, final zip |
| Advait | 5 | `prompts/members/05_Advait.md` | KPI engine, `/fleet`, `/customer` + GenAI copilot (EN/AR), assumptions |
| Karan Baid (back 16 Nov; Slide 6 content built by Yash while he was away) | 6 | `prompts/members/06_Karan.md` | live re-routing, `/rerouting`, `/integration`, risk register, QA |
| Harsh | 7 | `prompts/members/07_Harsh.md` | ROI + `/business-case`, RL lab, **number freeze**, closing slide |

## Step 1: Krishna creates the repo (Sunday, 20 minutes)
Details are in `prompts/members/04_Krishna.md` section 0: fill `team/collaborators.txt`, `gh auth login`, `bash tools/setup_git.sh "Krishna Mathur" "<email>"`, `bash tools/setup_repo.sh`, then connect Vercel (**Root Directory = `web`**). He sends the repo URL to the group.

## Step 2: everyone else (15 minutes)
1. Accept the GitHub invitation (email from GitHub).
2. Install Node 20+, Git, Python 3.10+.
3. Unzip this kit, open a terminal in the folder:
   `bash tools/join_repo.sh <REPO_URL> "Your Name" "your-github-email"`
4. `cd web && npm install` then `cd ../deck && npm install`.
5. Start Claude Code in the kit folder. Paste the **launch line** at the top of your prompt file.
6. Your first job is a tiny PR (your contribution note) to prove everything works.

## The 7 rules
1. Edit only your own files (listed in your prompt). Shared contract files need a `contract-change` PR.
2. Work on `feat/<name>-<topic>`; never push to `main`; small PRs; `cd web && npm run check` first.
3. Krishna merges (merge commit). Review each other's PRs: that counts as teamwork.
4. **No AI attribution in git**: no `Co-Authored-By`, no "Generated with Claude Code", no Claude/Anthropic as author. Guards are installed (`.claude/settings.json`, `.githooks/`, CI). Use your own name and GitHub email.
5. **GenAI disclosure the course asks for** is separate: log each prompt in `docs/prompt_logs/<Name>.md` and circle GenAI content on your slide in red.
6. **Light mode by default** (web and PPTX). The web app also has a dark-mode toggle (top right): use only the colour tokens so both modes work. PPTX stays light.
7. Numbers come only from the engine or `docs/frozen_results.json`. Everything about DubaiDash is assumed, every result simulated.

## Key times (Dubai)
Sun 17:00 repo + setup · Sun 22:00 engine v1 PRs · Mon 10:00 ETA JSON · Mon 14:00 decision gate · Mon 17:00 freeze run · Mon 18:00 numbers frozen · Mon 20:00 and 22:00 rehearsals · Tue 07:30 final check · **Tue 09:30 present** · upload before 23:59.

## If Claude Code restarts or you get stuck
Paste `prompts/99_RESUME_ANY_MEMBER.md`. Read `docs/00_TEAM_WORKFLOW.md` for the full process. Ask in the group chat after 20 minutes of being blocked.

## Folder map
`web/` app (Vercel) · `deck/` PPTX builder · `notebook/` ML notebooks · `prompts/` your prompts · `docs/` plan, research, scripts, checklists · `scripts_pdf/` speaker PDFs (one per member) · `team/` plan, role cards, WhatsApp texts · `tools/` helper scripts · `data_seed/` assumed numbers · `source_material/` original plan + slides 53/54 (kept out of the public repo; see `.gitignore`).
