# Q&A Prep (everyone reads this)

Rule for answers: short, honest, one number if possible. If you do not know, say what you would check. Sources: `04_research_brief.md` (R#).

## A. The 10 most likely C-suite questions (owner: Harsh)

| # | Question | Short answer |
|---|---|---|
| 1 | Is your baseline realistic? | It is an assumed nearest-neighbour method that mimics manual morning planning, so the simulated {{cost_pct}}% cut is optimistic. That is why we count only {{share_kept_pct}}% of it ({{saving_pct_kept}}% of cost per parcel), which sits inside the 5 to 20% cut in logistics costs McKinsey reports for AI in distribution (R7, checked 16 Nov), and why the pilot measures against a control zone. |
| 2 | Are these savings real? | They are simulated on seeded, assumed data. They show the decision logic works. They become cash only through fewer vans and shifts or growth without new hires. The 90-day pilot exists to measure real savings before scaling. |
| 3 | What does it cost and when does it pay back? | Assumed pilot AED {{pilot_cost}}, all-in for 90 days; then AED 38,000 a month to run. Counting {{share_kept_pct}}% of the simulated saving, payback is {{payback_months}} months after roll-out ({{payback_from_approval}} months from approval); at half the saving {{payback_half}} months, which is why we gate. |
| 4 | What if the AI is wrong? | A dispatcher can override any route, and the manual plan is the fallback. We track on-time rate and breaches as go/no-go gates. |
| 5 | How does it connect to our systems? | Start with file or API exports from the TMS/WMS, add a driver app and traffic/weather feeds, use Makani for address accuracy (R13). Integrate step by step. |
| 6 | How do you protect customer data? | Minimise personal data, use consent, follow UAE PDPL (in force since 2 Jan 2022, R19); no personal data in the demo. We would confirm executive-regulation status with counsel. |
| 7 | Will drivers accept it? | Co-design with drivers, keep workload fair (we measure it), respect heat rules (R14), and keep a human override. |
| 8 | What is your edge over existing route tools? | One loop: ETA prediction, live re-routing on events, and customer messaging, built around Dubai conditions. |
| 9 | How does this cut carbon? | Fewer km means less fuel and CO2; an EV-share option shows more. UPS reports about 100,000 t of CO2 avoided a year with ORION (R4). Our CO2 factors are assumed. |
| 10 | What happens next if we approve? | A 90-day pilot at one hub: connect the data (days 0 to 30), shadow the dispatchers (days 31 to 60), live on one zone next to a control zone (days 61 to 90). We scale only if all five gates pass: cost per parcel down at least {{gate_cost_pct}}%, km down, on-time up, at least 70% of AI routes used (proposed target), zero safety or privacy incidents. |

## F. Business case follow-ups (owner: Harsh)
Numbers: read them from the filled `docs/results_template.md` after the freeze (the double-brace names below are the keys in `docs/frozen_results.json`).

| Question | Short answer |
|---|---|
| Does the pilot itself pay back? | No, and it is not meant to. One zone has too little volume to cover the running cost. The pilot buys evidence; payback starts at roll-out ({{parcels_per_day}} parcels a day, assumed). |
| What is the most we can lose? | The all-in pilot budget, AED {{pilot_cost}}, if the Day-90 gate says stop. Scale-up waits for the gate. |
| Why does half the saving take {{payback_half}} months, not double {{payback_months}}? | The AED 38,000 monthly running cost is fixed. Halve the gross saving and the net monthly benefit falls by much more than half. That is why the cost gate is a real cut of at least {{gate_cost_pct}}%, not "any improvement". |
| What has to be true for this to work? | A real cut in cost per parcel of at least {{gate_cost_pct}}% at the planned volume gives payback within 24 months. Below that, we stop. |
| Worst case? | Conservative scenario (40% of the saving kept, 1,000 parcels a day): payback beyond 36 months. That is the case the gate catches. |
| Your cost cut and your rounded costs differ by a tenth of a point? | {{cost_pct}}% is on unrounded engine costs; from the rounded AED {{cost_base_aed}} and {{cost_ai_aed}} you get a tenth less. Payback is computed from the rounded costs so anyone can recheck it. |
| NPV or discounting? | Simple payback, no discount rate assumed. At a few months it barely matters; at two or three years it would, which is another reason for the gate. |
| How do you know the saving is the AI and not the season? | A control zone keeps today's planning in the same weeks; the pilot (Dec to Feb) likely overlaps Ramadan, so we compare like with like. |
| What does the scale-up cost? | Not in this case (assumed: the pilot build is reused). We bring a costed scale-up plan to the gate review with real data. |
| Does reinforcement learning beat your rules? | Not yet. In our small simulation it beat nearest-vehicle dispatch by about AED 2.55 per urgent order but was slightly worse than a simple cost-aware rule, because it optimises the same per-order cost with less information. Learning how one dispatch affects the next orders is the next step, and it needs pilot data (`/rl-lab`). |

## B. Likely peer and lecturer (viva) questions

| Question | Answer pointer |
|---|---|
| What is the vehicle routing problem? | Assign parcels to vehicles and order the stops to minimise cost while respecting capacity and time windows. |
| How does Clarke-Wright work? | Start with one route per customer, then merge routes in order of "savings" from sharing a trip, while capacity allows. |
| What is 2-opt? | Local search that reverses part of a route when that shortens it. |
| How does your genetic algorithm work? | Population of route orders, tournament selection, order crossover, swap/inversion mutation, elitism; fitness = cost plus penalties for late arrivals and overload. |
| Why GA as well as Clarke-Wright? | GA explores more of the search space and handles penalties flexibly; it is a standard method for routing with time windows (R9). We show its convergence curve. |
| Where does ML come in? | ETA/delay prediction (gradient boosting), zoning (k-means), demand forecast, and a Q-learning policy for urgent orders. |
| Reinforcement learning vs GA? | GA searches for a good plan now; RL learns a decision policy from rewards over many days (R10). |
| How did you evaluate the ETA model? | Held-out test set, MAE/RMSE/R-squared against a naive baseline, feature importance, no target leakage. |
| The ETA data is from India. Why use it? | It shows relationships between traffic, weather, distance and time. It is not Dubai ground truth; production needs Dubai data. |
| What is simulated and what is real? | Real: geography, road network, algorithms. Simulated or assumed: orders, traffic and weather events, costs, company figures. |
| How do you handle fairness? | A workload-fairness metric (coefficient of variation of route durations), and a human override. |
| What would you do with more time? | Real traffic and weather APIs, Dubai delivery data, driver-app pilot, RL dispatch, EV and locker network design. |

## C. If the demo fails
1. Say "let me show the recording" and play it (no apology, no debugging live).
2. Use the screenshots on slide 4.
3. Keep to the scripted numbers; they are the same.

## D. Slide 2 questions (owner: Yash)

| Question | Short answer |
|---|---|
| Is 53% a UAE number? | No. It is a worldwide figure from Statista (updated Feb 2024, R1). The page does not name the study, so we only use it as the global picture. |
| Why use the AED 42.2B figure when other reports differ? | Reports count different things. Ours is from the Gulf Today / WAM report (EZDubai with Euromonitor, R2), so we always name the source. |
| How often do deliveries fail? | Industry sources report about 8 to 20% fail on the first attempt globally (R3, low confidence, indicative only). Our model uses its own assumed rate (8%, +4 points in a sandstorm). |
| Are the Sheikh Zayed Road jams real data? | No. Corridor jams, sandstorms and rain are what-if scenarios with assumed slow-down factors. We did not measure Dubai congestion. |
| Why k-means for zones? How was k chosen? | It groups nearby orders into compact zones; k is picked automatically by the silhouette score (k = 3 to 10). The order nearest each zone centre is the micro-hub or locker candidate. |

## E. Integration and risk questions (owner: Karan's slide, prepared by Yash)

| Question | Short answer |
|---|---|
| What happens if the AI goes down mid-shift? | Drivers keep the last accepted plan already on their app; if there is none, dispatch uses the baseline plan, the same rule as today. Messages switch to templates. |
| Does re-routing really help? | On the simulated default day, a 13:00 Sheikh Zayed Road jam: deliveries at risk go from {{risk_before}} to {{risk_after}} after re-routing, with no extra SLA breaches. Simulated, assumed data. |
| Can the dispatcher overrule the AI? | Yes. Every suggestion is accept, edit or reject; rejections are logged for review. |
| How do you handle UAE data protection? | UAE PDPL (Federal Decree-Law 45/2021) has applied since 2 Jan 2022 (R19). We minimise personal data and use consent. Executive-regulation status is still unclear (R20), so we would confirm with legal counsel. No claims about fines. |
| What is the biggest risk? | Data quality and integration (risks 1 and 2 in the register). That is why phase 1 runs in advisory mode beside the dispatchers. |
| Will you need new systems? | No. Phase 1 reads file or API exports from the existing TMS/WMS. |
