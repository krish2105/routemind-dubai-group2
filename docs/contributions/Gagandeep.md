# Contribution note: Gagandeep (Slide 1)

- Who I am and my slide: Gagandeep, design lead and deck owner, Slide 1 (Headline and the ask, 1:00).
- What I built (files, pages, notebook, slide):
  - Landing page `/`: 3D scroll story (problem, AI loop, result), camera driven by scroll and mouse, Baseline/AI view toggle, reduced-motion support, pauses off-screen, WebGL fallback, page grid with owners (`web/app/page.tsx`, `web/components/three/*`).
  - Design system used by every page: Skeleton, Tooltip, Drawer, Toast, Tabs, SegmentedControl, Stat count-up, documented in `web/components/ui/README.md`; phone bottom tab bar, skip link and SIMULATED badge in the app shell (`web/components/nav/*`, `web/app/globals.css`).
  - Quality pass: Lighthouse (`/` Performance 95 to 98, Accessibility 100), AA contrast fix for teal buttons, console check of all 12 routes (results in `docs/verification_log.md`).
  - Slide 1 module (`deck/slides/s1_gagandeep.js`), Slide 1 script trimmed to 1:00, deck framework and final PPTX/PDF assembly.
- My pull requests (links):
  - [#33 setup](https://github.com/krish2105/routemind-dubai-group2/pull/33)
  - [#34 3D hero v2](https://github.com/krish2105/routemind-dubai-group2/pull/34)
  - [#36 design system and mobile nav](https://github.com/krish2105/routemind-dubai-group2/pull/36)
  - [#38 Slide 1](https://github.com/krish2105/routemind-dubai-group2/pull/38)
  - [#40 Lighthouse and quality pass](https://github.com/krish2105/routemind-dubai-group2/pull/40)
  - Final deck and PDF: after the Mon 18:00 freeze
- What I learned about AI in operations: an AI routing plan only wins trust when managers can compare it with today's plan on the same orders and see what the AI changed. Clear visuals and honest "simulated" labels matter as much as the algorithm.
- What I would improve next: test the prototype with a real dispatcher on a phone in the depot and redesign the screens around their questions.
