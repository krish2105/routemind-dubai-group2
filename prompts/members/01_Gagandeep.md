# Gagandeep (MAIB): Claude Code prompt (Slide 1: Headline and the ask)

> **Launch line (paste this into Claude Code after setup):**
> `I am Gagandeep. Read prompts/00_COMMON_RULES.md and prompts/members/01_Gagandeep.md, then do section 4 in order, one PR at a time.`

Read `prompts/00_COMMON_RULES.md` first. Then work only on the items below.

## 1. Your role
Design lead and deck owner. You make the prototype look ultra-premium (3D hero, glass UI, motion, mobile) and you own the PPTX framework, Slide 1 and the final PPTX/PDF assembly and QA. You open the presentation (Slide 1: the problem and the hook).

## 0. Setup (first 15 minutes, human does the terminal steps)
1. Accept the GitHub invitation email (repo `routemind-dubai-group2`). Install Node 20+, Git, Python 3.10+.
2. Unzip the kit, open a terminal in the folder, run:
   `bash tools/join_repo.sh <REPO_URL> "Gagandeep (MAIB)" "<your-github-email>"`
   (Krishna sends `<REPO_URL>`. Use the email linked to your GitHub account so the commits show as yours.)
3. `cd web && npm install` then `cd ../deck && npm install` (takes a few minutes).
4. Start Claude Code in the kit root folder and paste the **launch line** at the top of this file.
5. First task: create branch `feat/gagandeep-setup`, create `docs/contributions/Gagandeep.md` (5 lines: who I am, slide, what I will build) and `docs/prompt_logs/Gagandeep.md` from the template, run `cd web && npm run check`, push, open a PR. This proves your setup and your identity work.

## 1b. LIGHT MODE is the default (Next.js pages AND the PPTX); web also has a dark toggle
- **Web:** everything you build is **light mode only** ("daylight dispatch"): page background `bg-paper`/white, text `text-fg` (navy) and slate-600/700 for secondary text, cards use the `Glass` component, teal `text-ai` = AI, amber `text-base` = baseline, red `text-risk` = SLA risk, green `text-ok`. Use the tokens in `web/app/globals.css`; never hard-code dark colours, never `text-white` on a light card (only on a teal button). Charts: white/transparent background, light grey grid, teal and amber series. Maps: the free CARTO **Positron** light style. 3D scenes: pale sky background (see `components/three/HeroScene.tsx`).
- **Theme toggle (update Sun 15 Nov, Krishna):** the web app now has a light/dark toggle (top right, `components/theme/ThemeToggle.tsx`). **Light stays the default** and is used for screenshots, the demo and the PPTX. Dark mode works by swapping the tokens in `web/app/globals.css`, so use only tokens (`bg-paper`, `text-fg`, `text-ai`, `text-base`, `text-risk`, `slate-*`, `Glass`) and never hard-code hex colours; check your page in both modes. In client code, `useTheme()` tells you the active theme (for charts, maps, 3D). The PPTX stays light only.
- **PPTX:** your slide module in `deck/slides/` uses only the colours exported by `deck/theme.js` (`C.bg` ice white, `C.panel` white cards, `C.text`/`C.white` navy text, `C.ai` teal, `C.base` amber). Light background, dark text, minimum 14 pt body text, nothing under 10 pt. Open the PPTX (or export to PDF) and look at your slide before every PR.
- Check: open your pages at 1440 px and 390 px wide, in a normal browser window; text must be readable and contrast strong.

## 2. You own (only these paths)
- `web/app/page.tsx` (landing), `web/app/globals.css`, `web/app/layout.tsx`, `web/app/icon.svg`
- `web/components/three/*`, `web/components/ui/*`, `web/components/nav/*`
- `deck/theme.js`, `deck/build_deck.js`, `deck/lib/*`, `deck/slides/s1_gagandeep.js`, `deck/README.md`
- `deliverables/` final files (PPTX, PDF export, screenshots folder index), `docs/11_submission_checklist.md` (shared with Karan)
- `docs/prompt_logs/Gagandeep.md`, `docs/contributions/Gagandeep.md`

## 3. Read first
- `docs/05_slide_content.md` (Slide 1 and the deck design rules), `scripts/speaker_scripts.md` (Slide 1 text)
- `docs/04_research_brief.md` (every Slide 1 fact comes from here)
- `web/components/three/HeroScene.tsx`, `web/app/globals.css`, `web/lib/pages.ts` (read-only for you except `/`)
- `deck/README.md`, `deck/theme.js`

## 4. What to build
### 4.1 Landing page `/` (3D hero) polish, goal: first 5 seconds wow
Starter exists (procedural Dubai skyline, amber baseline zig-zag vs teal AI routes, moving vehicles). Upgrade, keep 60 fps on a normal laptop:
- Hero headline "RouteMind Dubai" with a one-line promise and two buttons: **Open live demo** (`/command`) and **See the business case** (`/business-case`).
- Scroll storytelling with Framer Motion `useScroll`: Problem (the amber chaos) → AI (teal clean routes) → Result (animated counters reading `fz()` from `lib/frozen.ts`; show "n/a until frozen" if null, never fake numbers).
- Camera rig reacts to the mouse; a toggle "Baseline view / AI view" that swaps route colours in the 3D scene.
- Reduced-motion support (`prefers-reduced-motion` disables camera sway), canvas pauses when off-screen, DPR capped at 1.75, fallback gradient if WebGL fails.
- Page grid of the 11 prototype pages from `PAGES` (owner chips, "Slide n" tags). A footer line: "Simulated prototype, assumed data (DubaiDash Express is fictional)".
### 4.2 Design system
- Keep the token set in `globals.css` (ink, ai teal, base amber, risk red, ok green). Add: skeleton loaders, a `Tooltip`, a `Drawer` (used by the Assumptions drawer, owner of content: Advait), a `Toast`, a `Tabs`, a `SegmentedControl`, a `Stat` count-up component. All typed, documented in a short comment, with focus rings and keyboard support.
- `SideNav` collapses to a bottom tab bar on mobile (<768 px). `AppShell` has a skip link, `aria-current`, and the SIMULATED badge in the header.
- Add `components/ui/README.md` listing every component with a 3-line usage example (teammates use it).
### 4.3 Quality pass (do this last on Monday, after teammates merged)
- Lighthouse on `/` and `/command`: aim for Performance >= 80, Accessibility >= 95 on desktop. Fix cheap wins (font display, image sizes, dynamic imports for three/deck.gl/recharts).
- No console errors on any route; check every route on a 390 px wide viewport.
- Consistent page headers and spacing across all pages (review teammates' PRs for consistency and comment).
### 4.4 Deck framework and final assembly
- `deck/` builds `deliverables/RouteMind_Dubai_Group2.pptx` (7 slides, speaker notes, 16:9). Keep `theme.js` the single place for colours/fonts/footers.
- Monday 18:30 after numbers freeze: `cd deck && npm run build:final` (refuses if numbers are null). Open the PPTX in PowerPoint or Keynote, check every slide for overflow, contrast and that speaker notes show in Presenter view. Export `deliverables/RouteMind_Dubai_Group2.pdf` (backup) and a notes-pages PDF.
- Check that GenAI-made items have the red outline and the legend is present on every slide that has any (slide 54 requirement), and that the QR code on Slide 1 opens the Vercel URL.
- Add slide numbers, source footers, and make all text >= 14 pt on content slides (>= 11 pt for footnotes).

## 5. Tests and evidence
- Vitest: no tests required for UI, but `npm run check` must pass (typecheck + build).
- Run `node deck/build_deck.js` and `python3 <pptx skill>/scripts/office/validate.py deliverables/RouteMind_Dubai_Group2.pptx` if that skill is available; otherwise open the file and confirm 7 slides and notes on all 7.
- Screenshots (desktop + mobile) of `/` in your PR; Lighthouse numbers pasted in the PR (real output only).

## 6. Your slide (Slide 1: Headline and the ask)
Module: `deck/slides/s1_gagandeep.js`. Message (see `docs/05_slide_content.md`): AI routing cuts DubaiDash's cost per parcel by the frozen % and we ask the C-suite for a 90-day pilot; one line each on the four C-suite angles (business model, tech investment, ecosystem, operational risk). The only external fact is the last-mile share (R1) from `docs/04_research_brief.md`. Add the QR code to the live site (`docs/live_link.txt`). Read your spoken text in `scripts/speaker_scripts.md` (1:00 minute slot), rewrite it in your own words if you like (keep the numbers), then regenerate PDFs with `python3 tools/build_speaker_pdfs.py`. Mark with the red outline anything GenAI produced (the 3D hero image, the text draft).

## 7. Pull requests (plan)
- You give: component library by Sun night (teammates use it), final deck Mon 18:30.
- You need: frozen numbers from Harsh (Mon 18:00), screenshots from Krishna (`deliverables/screenshots/`), each slide module from its owner by Mon 16:00.

## 8. Hand-offs (who needs what from you, and what you need)
- [ ] Landing page wow + 60 fps + mobile OK + reduced motion
- [ ] Design-system components documented in `components/ui/README.md`
- [ ] Lighthouse run recorded; no console errors on any route
- [ ] `s1_gagandeep.js` final; PPTX has 7 slides, notes on all, red GenAI outlines, QR works
- [ ] PDF backup exported; speaker PDFs rebuilt
- [ ] Prompt log and contribution note filled, all PRs merged

## 9. Definition of done (tick every box; paste the evidence in your last PR)
- PR1 `feat/gagandeep-setup`: contribution file, prompt log, check passes.
- PR2 `feat/gagandeep-hero-v2`: landing and 3D hero upgrade (4.1).
- PR3 `feat/gagandeep-design-system`: components and mobile nav (4.2).
- PR4 `feat/gagandeep-slide1`: `s1_gagandeep.js` final, speaker text check.
- PR5 (Mon evening) `feat/gagandeep-final-deck`: final PPTX/PDF, QA notes in `docs/verification_log.md`.

## Rules for this session (short version; full text in `prompts/00_COMMON_RULES.md`, which you must read first)
- Edit only the files listed under "You own". Other files: ask via the human or open a `contract-change` PR.
- Branch `feat/gagandeep-<topic>`; never push to `main`; small PRs; `cd web && npm run check` before each PR; `git pull --rebase origin main` before you start.
- **No `Co-Authored-By`, no "Generated with Claude Code", no Claude/Anthropic name in any commit message, PR text or git identity.** If you see such a line in a draft, delete it.
- Numbers only from the engine or `docs/frozen_results.json`. Everything about DubaiDash is assumed; results are simulated.
- Log every instruction the human types in `docs/prompt_logs/Gagandeep.md` (verbatim) at the end of each session. Circle GenAI content on your slide.
- When blocked for 20 minutes, tell the human in one line what you need and from whom.

## Pull request routine
1. `git add` only your files; commit with a clear message (imperative, e.g. `feat(optimizer): add savings-based construction`). No AI lines.
2. `git push`; open the PR with the template filled: what changed, how I tested (paste real command output), screenshot for UI, which slide number it feeds.
3. Tell the human the PR link. Krishna merges (merge commit). After merge: `git checkout main && git pull`, then start the next branch.

## End-of-session report (max 6 lines to the human)
Done / Next / Blockers / PR links / what to paste into the group chat.
