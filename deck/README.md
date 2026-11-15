# deck/ (PowerPoint builder with speaker notes)

Builds `deliverables/RouteMind_Dubai_Group2.pptx`: **exactly 7 slides**, LIGHT theme, native charts and tables, **speaker notes on every slide** (open Presenter View in PowerPoint to see them), GenAI-assisted content outlined in red.

```
cd deck
npm install            # once
npm run build          # draft: missing numbers show as an em dash
npm run build:final    # final: refuses to build if any number in docs/frozen_results.json is null
```

## One file per slide, one owner per file
| File | Owner |
|---|---|
| `slides/s1_gagandeep.js` | Gagandeep |
| `slides/s2_yash.js` | Yash |
| `slides/s3_atharva.js` | Atharva |
| `slides/s4_krishna.js` | Krishna |
| `slides/s5_advait.js` | Advait |
| `slides/s6_karan.js` | Karan Baid |
| `slides/s7_harsh.js` | Harsh |
| `theme.js`, `build_deck.js`, `lib/` | Gagandeep (shared look; tell the team before changing) |

Rules
- Every number comes from `docs/frozen_results.json` through `fz("key")`. Never type a result by hand.
- Speaker notes come from `scripts/speaker_scripts.md` (same words as the speaker PDFs). Edit the script there, not in the slide file.
- **Red outline = GenAI-assisted** (course rule: circle GenAI content and share prompts separately). Keep the outline only on content that GenAI really produced; delete the `genaiCircle` line otherwise. Log the prompt in `docs/prompt_logs/<YourName>.md`.
- Dashboard screenshots go in `deliverables/screenshots/` (`01_command.png` is used on slide 4). The live link in `docs/live_link.txt` becomes the QR code on slide 1.
- Keep body text at 12 pt or larger and nothing outside the slide edges. After building, render to PDF and look at every slide:
  `soffice --headless --convert-to pdf deliverables/RouteMind_Dubai_Group2.pptx` (or open in PowerPoint).
