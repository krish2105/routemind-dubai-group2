# Contribution note: Krishna Mathur (Slide 4)

- Who I am and my slide: Krishna Mathur, Slide 4
- What I built (files, pages, notebook, slide): GitHub repo + CI + branch protection; light/dark theme toggle; Clarke-Wright + 2-opt optimiser (`web/lib/engine/clarkeWright.ts`, `localSearch.ts`, `tests/cw.test.ts`); worker + store; `/command` (MapLibre + deck.gl animated routes, scenarios) and `/optimizer`; Playwright smoke test + screenshot/video capture; Slide 4 (`deck/slides/s4_krishna.js`).
- My pull requests (links): https://github.com/krish2105/routemind-dubai-group2/pull/1 (engine), https://github.com/krish2105/routemind-dubai-group2/pull/2 (/command), https://github.com/krish2105/routemind-dubai-group2/pull/3 (/optimizer), https://github.com/krish2105/routemind-dubai-group2/pull/4 (demo assets), https://github.com/krish2105/routemind-dubai-group2/pull/5 (live link)
- What I learned about AI in operations: the algorithm is the easy part; the value depends on the rules you score it with. Once baseline and AI were judged by the same cost, time-window and duty rules, the AI plan used fewer vans and kept more promises, and tuning what we count (per-vehicle cost, lateness) changed the plan more than the algorithm did.
- What I would improve next: real road times (OSRM) instead of straight-line distance x detour, and testing the plan on real DubaiDash-style order history.
