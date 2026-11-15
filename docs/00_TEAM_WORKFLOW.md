# Team Workflow: 7 members, 7 Claude Codes, one repo

Goal: a **best-prototype** submission where every member visibly owns a real part (rubric: "equal contribution from members"). Everyone works with Claude Code on their own branch of one shared GitHub repo. `main` is deployed on Vercel for the professor and for the 17 Nov presentation.

## 1. Who owns what (stay inside your paths)

| Member | Slide | Owns (code) | Owns (other) |
|---|---|---|---|
| **Krishna** (lead + demo) | 4 | `lib/engine/clarkeWright.ts`, `localSearch.ts`, `workers/`, `store/`, `/command`, `/optimizer`; repo, Vercel, merges, CI health | Demo recording and screenshots, `deck/slides/s4_krishna.js`, final zip |
| **Gagandeep** (design + deck) | 1 | `/` landing and 3D hero, `components/three/`, `components/ui/`, `components/nav/`, `app/globals.css`; `deck/theme.js`, `build_deck.js` | `deck/slides/s1_gagandeep.js`, final PPTX + PDF assembly and QA |
| **Yash** (problem + zones) | 2 | `/problem`, `/zones`, `lib/engine/kmeans.ts`, `components/charts/` (GA convergence, comparison bars) | `deck/slides/s2_yash.js`, fact-check of research rows R1, R2, Dubai pain points |
| **Atharva** (ML) | 3 | `notebook/routemind_models.ipynb`, `lib/models/eta.ts`, `/eta`, `lib/engine/ga.ts` | `deck/slides/s3_atharva.js`, `public/data/eta_model.json` and `eta_metrics.json` |
| **Advait** (operations) | 5 | `lib/engine/kpi.ts`, `/fleet`, `/customer`, `app/api/copilot/` | `data_seed/assumptions.json` + `docs/06`, `deck/slides/s5_advait.js` |
| **Yash** (integration + QA; took over from Karan Baid, who left on 15 Nov) | 6 | `lib/engine/reroute.ts`, `events.ts`, `/rerouting`, `/integration`, `tests/e2e/` | `docs/09_risk_register.md`, `docs/verification_log.md`, `deck/slides/s6_karan.js` |
| **Harsh** (business case) | 7 | `lib/roi.ts`, `/business-case`, `/rl-lab`, `notebook/rl_dispatch.ipynb`, `scripts/freeze.ts` | `docs/10_roi_model.md`, number cross-check, `deck/slides/s7_harsh.js` |

Shared files (`lib/types.ts`, `lib/pages.ts`, `package.json`, `tsconfig.json`, `next.config.ts`, `lib/engine/problem.ts`, `schedule.ts`, `baseline.ts`, `solve.ts`) are **contracts**. Change one only with the `contract-change` label on your PR, a message in the group chat, and Krishna's approval. Adding a dependency counts as a contract change (ask first). `lib/pages.ts`: edit only your own entries.

## 2. Day-to-day rules
1. **Never push to `main`.** Work on a branch named `feat/<yourname>-<topic>`, push, open a Pull Request (the template appears).
2. **Small PRs, often** (at least one every 2 to 3 hours). Pull before you start: `git pull --rebase origin main`.
3. Before a PR run `cd web && npm run check` (typecheck + tests + build). CI runs the same on GitHub and also builds the deck.
4. **Krishna merges PRs** using **"Create a merge commit"** (not squash), so every member's own commits stay visible in the history and Vercel sees a team-owner commit. Other members review at least one PR from a teammate (comment on it); that is part of team collaboration.
5. Use **your own** GitHub identity (`bash tools/setup_git.sh "Name" "github-email"`). Do not commit as someone else.
6. **No AI attribution in git.** No `Co-Authored-By`, no "Generated with" lines, no `Claude-Session`. Three guards exist: `.claude/settings.json` (Claude Code adds nothing), `.githooks/commit-msg` (strips such lines), `.githooks/pre-push` and CI (block them). If a guard blocks you, fix the commit message, do not bypass.
7. **GenAI disclosure is separate and mandatory** (slide 54): log every prompt you type in `docs/prompt_logs/<YourName>.md` and circle GenAI content on your slide. Git history is not where AI use is disclosed; the prompt log and the red circles are.
8. **Light mode is the default** for both the Next.js app and the PPTX (tokens in `web/app/globals.css` and `deck/theme.js`). The web app also has a **light/dark toggle** (top right); dark mode swaps the same tokens, so never hard-code colours. Screenshots, demo and PPTX use light.
9. Numbers: only from the engine or `docs/frozen_results.json`. Everything about DubaiDash is **assumed**, every result **simulated**; label it.
10. Ask in the group chat when blocked for more than 20 minutes. Do not wait silently.

## 2b. Who zips and uploads
**Krishna only**: final zip with `tools/make_submission_zip.sh`, clean-unzip test, Blackboard upload (PPTX + PDF, prompt log, zip, live link) before Mon 23:59. Gagandeep delivers the final PPTX/PDF by Mon 18:30, Karan runs the checklist, Harsh delivers frozen numbers by Mon 18:00.

## 3. Timeline (Dubai time)
| When | Milestone | Who |
|---|---|---|
| Sun 15 Nov 17:00 | Repo exists, all 7 cloned, `setup_git` done, first tiny PR merged (your name in `docs/contributions/<Name>.md`) | everyone |
| Sun 15 Nov 22:00 | Engine v1 PRs: `clarkeWright`, `ga`, `kpi`, `kmeans`, `reroute`, `events` | Krishna, Atharva, Advait, Yash |
| Mon 16 Nov 10:00 | ETA model JSON merged; `/problem`, `/eta` pages in | Atharva, Yash |
| Mon 14:00 | **Decision gate:** `/command`, `/optimizer`, `/rerouting`, `/eta` work on the Vercel URL. If not, cut Tier 3 (order in `docs/02`) | Krishna calls it |
| Mon 16:00 | Tier 3 pages merged (`/fleet`, `/customer`, `/integration`, `/business-case`, `/zones`, `/rl-lab`); copilot works with and without key | owners |
| Mon 17:00 | `npm run freeze` (Harsh + Krishna), numbers reviewed by everyone | Harsh |
| Mon 18:00 | **Numbers frozen.** Rebuild speaker PDFs and deck: `npm run build:final` | Gagandeep |
| Mon 18:30 | Screenshots + 90 s recording (Krishna), final PPTX + PDF (Gagandeep) | Krishna, Gagandeep |
| Mon 20:00 | Rehearsal 1 with timer (call), 22:00 Rehearsal 2 | everyone |
| Mon 22:00 | Final zip + prompt log + contribution report; Yash runs the checklist | Krishna, Yash |
| Tue 07:30 | Final check on laptop and phone, backup PDF on USB | Yash, Krishna |
| Tue 09:30 | Present. Upload to Blackboard before 23:59 | all |

## 4. Repo setup (Krishna, 10 minutes, once)
1. Collect everyone's GitHub username in the group chat; fill `team/collaborators.txt`.
2. `gh auth login` (GitHub CLI), then from the kit folder: `bash tools/setup_git.sh "Krishna Mathur" "<github-email>"` and `bash tools/setup_repo.sh`.
   It creates a **public** repo `routemind-dubai-group2`, pushes, invites everyone as collaborators (push access), writes CODEOWNERS, and protects `main` (PR required).
3. Send the repo URL to the group. Each member (who received the zip): unzip, then `bash tools/join_repo.sh <url> "Name" "github-email"`, then `cd web && npm install` and `cd ../deck && npm install`. Members who prefer: `git clone <url>` instead.
4. Everyone accepts the GitHub invitation email first.

## 5. Vercel (Krishna)
1. vercel.com, sign in with GitHub, **Add New Project**, import the repo.
2. **Root Directory: `web`**. Framework: Next.js (auto). No env vars needed (optional `LLM_API_KEY`).
3. Deploy. Production branch = `main`. Every PR also gets a preview URL.
4. Put the live URL in `docs/live_link.txt` (used for the QR code on slide 1).
5. Why the repo is public and only Krishna merges: Vercel's free (Hobby) plan can block deployments of commits authored by people who are not on your Vercel team, especially for private repos. If a deployment is ever "blocked", deploy from Krishna's laptop: `cd web && npx vercel --prod`. Do this check on Sunday, not Monday night.
6. The repo contains only synthetic data and public facts. Never commit keys; `.env*` is git-ignored.

## 6. Conflict rules of thumb
- Own files only. New files for your feature go in your folders.
- Two people need the same change in a shared file: one opens the PR, the other waits for the merge, then pulls.
- A merge conflict you do not understand: stop, post in the chat, do not force-push. Never `git push --force` to `main`.

## 7. Evidence of equal contribution (rubric: Team Collaboration)
- `docs/contributions/<Name>.md`: 5 lines each (what I built, PR links, what I learned).
- `python3 tools/contribution_report.py` (Krishna, Mon night): commits and lines per author from git.
- `python3 tools/build_prompt_log.py`: one combined prompt log for Blackboard.
- 7 slides = 7 speakers = 7 owners. State this in the first 10 seconds of Q&A if asked.
