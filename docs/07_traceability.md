# Traceability: key questions, features, slides, evidence

The 7 key questions come from the original implementation plan. **Confirm them against slide 56** (not yet seen by us).

| ID | Key question | Dashboard feature | Slide(s) | Evidence to show | Owner |
|---|---|---|---|---|---|
| Q1 | How can AI optimise delivery routes and reduce transportation costs? | Command Center, Route Optimizer (baseline vs Clarke-Wright+2-opt vs GA) | 1, 2, 4 | km and cost per parcel on identical seeded orders; UPS ORION as external scale (R4) | Krishna |
| Q2 | What role do real-time traffic, weather and demand data play in dynamic routing? | Live Re-routing (events), ETA page, small forecast chart | 3, 4 | At-risk deliveries before/after the jam; ETA MAE vs naive | Karan, Atharva |
| Q3 | Which algorithms are commonly used (genetic algorithms, reinforcement learning, clustering)? | Optimizer (GA + convergence), Zones (k-means), RL chart | 3, 4 | GA convergence chart; k-means zones; RL learning curve (notebook) | Atharva, Yash, Harsh |
| Q4 | How can AI improve fleet utilisation and reduce carbon footprint? | Fleet and Sustainability (utilisation, CO2, EV slider) | 5 | Utilisation and CO2 before/after; Road2.0 and Green Mobility context (R17, R18) | Advait |
| Q5 | What are the challenges in integrating AI with existing logistics systems? | Integration and Risk (architecture, risk register, human override) | 6 | Risk to fallback table; Makani, PDPL, TMS/WMS | Karan |
| Q6 | How does AI contribute to last-mile delivery efficiency? | Zones and Last Mile (micro-hubs, lockers, first-attempt view) | 2, 5 | Stops per km; failed-attempt risk; lockers as new service | Yash, Advait |
| Q7 | What are the implications for customer satisfaction and service-level agreements? | Customer and SLA (on-time %, breaches, copilot messages) | 5 | On-time % and breach counts; EN/AR delay message. Note: we measure on-time and breaches as proxies, not CSAT. | Advait |

## Unit learning outcomes (from the original plan; confirm with the course outline)
| LO | Meaning | Where we evidence it |
|---|---|---|
| A | Use AI to optimise operations | Optimiser, re-routing, ETA model |
| B | Evaluate AI impact on supply chain and logistics | KPI comparison, ROI, benchmarks (R4, R7) |
| C | Responsible AI | Fairness metric, explainable ETAs, human override, no personal data, heat-rule awareness |
| D | Integrate GenAI tools | Copilot (EN/AR messages), AI-assisted build disclosed on slide 4, prompt log |

## Rubric mapping (slide 54)
| Criterion | How we address it |
|---|---|
| Content Quality | Seven questions answered with cited context and a quantified simulation |
| Application of Techniques | ML (ETA, k-means, forecast, Q-learning) + optimisation (Clarke-Wright, 2-opt, GA), with tests and a baseline |
| Presentation Skills | One message per slide, demo, 9:15 timing, rehearsed scripts |
| Team Collaboration | 7 speakers, 7 owned deliverables, shared prompt log |

## Professor's four scope bullets (slide 53) -> where we deliver
| Scope bullet | Delivered by |
|---|---|
| Identify a real-world supply chain challenge | Slide 2 + `/problem` (Yash) |
| Propose an AI-driven solution using ML, optimisation, predictive analytics | Slides 3 and 4: ETA model (Atharva), Clarke-Wright + GA (Krishna, Atharva), re-routing (Karan) |
| Design a conceptual workflow or prototype | Deployed Next.js prototype (all members), Slide 4 demo |
| Present findings and an implementation roadmap | Slides 5 to 7: KPIs (Advait), integration + risk (Karan), ROI + 90-day pilot (Harsh) |

## Boardroom (C-suite) themes -> where
Business model shifts: Slides 1 and 7 (paid slots, lockers) · Technology investment: Slide 7 (`/business-case`) · Ecosystem integration: Slide 6 (`/integration`) · Operational risks: Slide 6 (risk register) and Slide 4 (jam re-routing).
