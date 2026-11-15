# Submission Checklist (Tue 17 Nov 2026)

## Repo and deployment (Karan checks Mon 22:00 and Tue 07:30)
- [ ] Vercel production URL loads `/`, `/command`, `/optimizer`, `/rerouting`, `/eta` on laptop and phone, no console errors; URL is in the PPT
- [ ] `main` contains merged PRs from all 7 members (`python3 tools/contribution_report.py`)
- [ ] No AI attribution in history: `git log --format=%B | grep -iE 'co-authored|claude|anthropic|generated with'` prints nothing; GitHub shows only the 7 members as contributors
- [ ] Every member's `docs/prompt_logs/<Name>.md` and `docs/contributions/<Name>.md` are filled
- [ ] `docs/frozen_results.json` has no null tokens; `npm run build:final` in `deck/` succeeds

## Before presenting (9:30 am)
- [ ] PPTX has **exactly 7 slides** (`deliverables/RouteMind_Dubai_Group2.pptx`), plus a PDF copy
- [ ] GenAI-made content circled in red on slides (list in `05_slide_content.md`)
- [ ] Every slide number equals `docs/frozen_results.json` and the dashboard
- [ ] "Assumed" / "simulated" labels visible; Statista labelled "worldwide"
- [ ] Demo recording plays offline; live link tested on laptop and phone
- [ ] Speaker scripts rehearsed twice with a timer (under 10:00 including handovers)
- [ ] Every member knows their slide and has read `08_qa_prep.md`
- [ ] Laptop, charger, HDMI/USB-C adapter, backup PDF on a USB stick and on phone

## Blackboard upload (before 11:59 pm)
- [ ] PPT (and PDF copy)
- [ ] Prompt log (`deliverables/GenAI_Prompt_Log.md/.csv` from `python3 tools/build_prompt_log.py`), so GenAI prompts are shared separately
- [ ] Live demo link in the PPT (slide 1 or 4)
- [ ] Submission zip: `dist/RouteMind_Dubai_Group2_Submission.zip` (kit + code + docs + scripts)
- [ ] Confirm the upload receipt in Blackboard

## What is inside the zip
See `README.md` for the full tree. The zip never contains `node_modules`, `.next` or raw datasets.
