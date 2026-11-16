# Slide Content: exactly 7 slides

Titles state the finding. Values in `{{double braces}}` come only from `docs/frozen_results.json` (filled Mon 18:00 by Phase 5). Full spoken scripts are in `scripts/speaker_scripts.md` and the PDFs in `scripts_pdf/`. Facts and sources: `04_research_brief.md` (R# = row number there).

**Look:** one LIGHT "daylight dispatch" style across deck and dashboard (white/ice background, navy text, teal = AI, amber = baseline, red = SLA risk). One message and one visual per slide. Text under 35 words per slide, all detail in the speaker notes.

---
## Slide 1: Gagandeep (1:00)
**Title:** AI routing cuts DubaiDash's cost per parcel by {{cost_pct}}%, and we ask for a 90-day pilot
- Problem in one line: last mile is the biggest shipping cost (R1)
- Solution: RouteMind Dubai, one AI loop (predict, cluster, optimise, re-route, inform)
- Proof: {{cost_pct}}% lower cost, {{vans_fewer}} fewer vans (simulated, same orders)
- The ask: approve a 90-day pilot
- Four C-suite angles, one short line each: business model, tech investment, ecosystem, operational risk
**Visual:** big KPI number + QR code and link to the live demo. **Qs:** all. **GenAI:** none planned (if GenAI wrote the headline text, circle it).

## Slide 2: Yash (1:15)
**Title:** The last mile is 53% of shipping cost, and Dubai makes it harder
- Chart: 41% (2018) to 53% (2023), "worldwide, Statista, Feb 2024" (R1)
- UAE e-commerce AED 42.2B in 2025, about 15.7% of retail (R2)
- Dubai pain points (icons): congestion on Sheikh Zayed Road and Al Khail Road, sandstorms and heat, heavy rain, failed first attempts, urgent-order surges
- DubaiDash today: static routes planned once each morning
**Qs:** Q1, Q6.

## Slide 3: Atharva (1:15)
**Title:** One AI loop: predict, cluster, optimise, re-route, inform
- Workflow diagram: data (orders, traffic, weather) to models to decisions to driver app and customer
- Predict: gradient-boosting ETA, error {{eta_mae}} min vs {{eta_naive_mae}} min naive
- Cluster: k-means zones, micro-hubs, lockers
- Optimise: Clarke-Wright + 2-opt, genetic algorithm (R9)
- Re-route live; RL for urgent orders is the next step (R10)
- Footnote: ETA data from Indian cities, used for relationships only
**Qs:** Q2, Q3. **GenAI:** circle the workflow diagram if GenAI generated it.

## Slide 4: Krishna (2:00)
**Title:** Live demo: same Dubai orders, {{km_pct}}% fewer km and {{vans_fewer}} fewer vans
- Recorded 90-second demo (primary) or live link: baseline (amber) vs AI (teal) KPI cards
- GA convergence chart
- One live event: Sheikh Zayed Road jam at 13:00; at-risk deliveries {{risk_before}} to {{risk_after}}
- Footnote 1: "All data synthetic or assumed; baseline is an assumed nearest-neighbour method"
- Footnote 2: "Prototype built with AI assistance (Claude Code); prompts shared separately"
**Qs:** Q1, Q3. **GenAI:** circle the whole prototype screenshot and the footnote.

## Slide 5: Advait (1:15)
**Title:** Better routes lift utilisation, cut CO2 and protect SLAs
- Utilisation {{util_base}}% to {{util_ai}}%; CO2 down {{co2_pct}}%; on-time {{ontime_base}}% to {{ontime_ai}}%; SLA breaches {{breaches_base}} to {{breaches_ai}}
- Fairness: driver workload spread (coefficient of variation)
- External scale check: UPS-reported ORION savings (R4)
- GenAI customer delay message, English and Arabic (example)
- New revenue options: paid delivery slots, parcel lockers
**Qs:** Q4, Q6, Q7. **GenAI:** circle the customer message example.

## Slide 6: Karan (1:15; content built by Yash while Karan was away)
**Title:** Integration is the real risk, and we have a fallback for each
- Integration map: TMS/WMS, driver app, traffic and weather APIs, Makani (R13), e-commerce platforms
- Risk to fallback table (4 rows): data quality, driver adoption, privacy (UAE PDPL, R19), model failure
- Human dispatcher can override any route; heat rules respected (R14)
- Ecosystem: robots, EV fleets, lockers (R15 to R18)
**Qs:** Q5. **GenAI:** circle the integration diagram if GenAI generated it.

## Slide 7: Harsh (1:15)
**Title:** A 3-phase rollout pays back in {{payback_months}} months
- Roadmap: Pilot (90 days) to Scale to Optimise, with go/no-go gates
- Investment AED {{pilot_cost}} (assumed); payback {{payback_months}} months; at half the savings {{payback_half}} months
- Benchmark: McKinsey range for AI in distribution, 5 to 20% logistics cost (R7)
- Decision requested: approve the pilot, name a sponsor
**Qs:** recap, investment.

---
## Speaker notes timing
9:15 total. The scripts in `scripts/speaker_scripts.md` are timed at about 135 words per minute. `tools/build_speaker_pdfs.py` prints the estimate per slide.

## GenAI marking list (circle these in red on the slides; also in `docs/prompt_logs/`)
| Slide | Element | GenAI tool | Prompt log ref |
|---|---|---|---|
| 3 | Workflow diagram (if GenAI-made) | Claude | to fill |
| 4 | Prototype (code written with Claude Code), screenshot and footnote | Claude Code | to fill |
| 5 | Customer delay message example (EN/AR) | Claude | to fill |
| 6 | Integration diagram (if GenAI-made) | Claude | to fill |
| All | Speaker-note drafts, research summaries, role cards | Claude | prompt log entries (see `docs/prompt_logs/`) |

Everything not listed is the team's own work. If a member used GenAI for a slide element not listed here, add a row and circle it.
