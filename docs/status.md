# Status (update at the end of every work session; Krishna keeps the master copy)

| Item | Owner | State |
|---|---|---|
| Repo + Vercel | Krishna | done: https://web-rws7.vercel.app (smoke test 3/3 on live site) |
| Clarke-Wright + 2-opt | Krishna | done, merged (PR #1), 7 tests |
| `/command` map + `/optimizer` | Krishna | done, merged (PR #2, #3) |
| e2e smoke test, screenshots, 90 s video, Slide 4 | Krishna | draft done (re-capture Mon 18:30 from Vercel URL) |
| Light/dark theme toggle | Krishna | done (light default) |
| GA | Atharva | done, merged (PR #10) |
| ETA model + `/eta` | Atharva | model + JSON merged (PR #19); `/eta` page next |
| KPI engine, `/fleet`, `/customer`, copilot | Advait | v0 / placeholders |
| k-means, `/problem`, `/zones`, charts | Yash | done, merged (PR #12, #14, #15) |
| Re-routing, `/rerouting`, `/integration`, QA | Yash (Karan left 15 Nov) | done, merged (PR #13, #16, #17, #18) |
| ROI, `/business-case`, RL, freeze | Harsh | v0 / placeholders |
| Landing + design system + deck | Gagandeep | starter done |
| Numbers frozen | Harsh | no |
| Final PPTX/PDF + zip | Gagandeep, Krishna | no |

Rehearsals done Sun: `npm run freeze -- --dry-run --allow-stub` works (blocked only on Atharva's eta_metrics.json and Karan's re-routing); final zip built, unzipped in a clean folder, `npm run check` 12/12 + build OK, deck 7 slides with notes.

Team change: Karan Baid left on 15 Nov; Yash presents Slide 6.

Freeze dry run (no stubs) is clean as of Sun evening.

Blockers: Gagandeep and Harsh not yet added as GitHub collaborators.

Last update: Sun 15 Nov, Krishna.
