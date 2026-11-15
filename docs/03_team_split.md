# Team Split (7 members, 7 slides)

Group chat names: Gagandeep, Yash, Atharva, Krishna, Advait, Karan Baid, Harsh. Swap slides if someone prefers another, but keep one slide and one deliverable per person. Printable version: `team/Group2_Team_Plan.pdf` and `team/Group2_Role_Cards.pdf`.

| Member | Slide (time) | Slide content | Code / prototype ownership | Prompt file |
|---|---|---|---|---|
| **Gagandeep** | 1: Headline and the ask (1:00) | Headline, proof, the ask, four C-suite angles | Landing + 3D hero, design system, deck framework, final PPTX/PDF | `prompts/members/01_Gagandeep.md` |
| **Yash** | 2: Last-mile problem (1:15) | 41% to 53% chart, Dubai pain points, sources | `/problem`, `/zones`, `kmeans.ts`, shared charts, research fact-check | `02_Yash.md` |
| **Atharva** | 3: The AI loop (1:15) | Workflow diagram, ETA error vs naive, techniques | ETA notebook + JSON + `/eta`, `ga.ts` | `03_Atharva.md` |
| **Krishna** | 4: Live demo (2:00) | Demo, baseline vs AI, jam moment | Repo + Vercel, `clarkeWright.ts`, worker, store, `/command`, `/optimizer`, demo recording, final zip | `04_Krishna.md` |
| **Advait** | 5: Utilisation, CO2, SLAs (1:15) | KPI table, CO2, on-time, fairness, copilot example | `kpi.ts`, `/fleet`, `/customer`, copilot API (EN/AR), assumptions | `05_Advait.md` |
| **Karan Baid** | 6: Integration and risk (1:15) | Integration map, risk table, override, ecosystem | `reroute.ts`, `events.ts`, `/rerouting`, `/integration`, risk register, QA and checklist | `06_Karan.md` |
| **Harsh** | 7: Roadmap and ROI (1:15) | 3-phase rollout, payback, gates, the ask | `roi.ts`, `/business-case`, RL notebook + `/rl-lab`, **freeze script and cross-check** | `07_Harsh.md` |

Talk time: 1:00 + 1:15 + 1:15 + 2:00 + 1:15 + 1:15 + 1:15 = **9:15** (leaves about 45 seconds for handovers).
Every member owns one slide, one or two pages, one engine part and their own pull requests, so the contribution is equal and visible in git (`python3 tools/contribution_report.py`). Full process: `00_TEAM_WORKFLOW.md`.

## Timeline (Dubai time)

| When | Who | What |
|---|---|---|
| Sun 15 Nov 16:30 | Krishna | Repo + Vercel up, URL sent to the group |
| Sun 17:00 | All | Joined repo, setup done, first tiny PR (contribution note) |
| Sun 22:00 | Krishna, Advait, Yash, Atharva, Karan, Harsh | Engine v1 PRs: Clarke-Wright, KPIs, k-means + charts, GA (first version), events/reroute (first version), ROI |
| Mon 16 Nov 10:00 | Atharva | ETA model JSON merged |
| Mon 14:00 | Krishna | **Decision gate**: Tier 2 pages (`/command`, `/optimizer`, `/rerouting`, `/eta`) work on the Vercel URL |
| Mon 16:00 | Owners | Tier 3 pages merged |
| Mon 17:00 | Harsh, Krishna | Freeze run (dry run first) |
| Mon 18:00 | Harsh | **Numbers frozen** (`docs/frozen_results.json`) |
| Mon 18:30 | Gagandeep, Krishna | Final PPTX + PDF, screenshots, 90 s video |
| Mon 20:00 and 22:00 | All | Two timed rehearsals using `scripts_pdf/` |
| Mon 22:00 | Krishna, Karan | Zip, prompt log, contribution report, checklist, Blackboard upload |
| Tue 17 Nov 07:30 | All | Final check. **Present 9:30 am** |

## Rules
1. Everyone logs every GenAI prompt in `docs/prompt_logs/<Name>.md`; `python3 tools/build_prompt_log.py` merges them for Blackboard.
2. Slide numbers come only from `docs/frozen_results.json`. Do not type your own.
3. Do not edit another person's files without telling them (path ownership in `00_TEAM_WORKFLOW.md`).
4. Everyone reads the whole deck and `docs/08_qa_prep.md`: peer Q&A can ask anyone anything.
5. Rehearse twice with a timer; stay under 10:00 including handovers.
6. No AI attribution lines in git (see `00_TEAM_WORKFLOW.md`).
