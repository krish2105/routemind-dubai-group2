# Q&A Prep (everyone reads this)

Rule for answers: short, honest, one number if possible. If you do not know, say what you would check. Sources: `04_research_brief.md` (R#).

## A. The 10 most likely C-suite questions (owner: Harsh)

| # | Question | Short answer |
|---|---|---|
| 1 | Is your baseline realistic? | It is an assumed nearest-neighbour method that mimics manual morning planning. A stronger baseline would shrink the saving, which is why we compare against the 5 to 20% McKinsey range (R7) and say the result is simulated. |
| 2 | Are these savings real? | They are simulated on seeded, assumed data. They show the decision logic works. The 90-day pilot exists to measure real savings before scaling. |
| 3 | What does it cost and when does it pay back? | Assumed pilot AED {{pilot_cost}}; payback {{payback_months}} months at demo savings, {{payback_half}} months at half the savings. |
| 4 | What if the AI is wrong? | A dispatcher can override any route, and the manual plan is the fallback. We track on-time rate and breaches as go/no-go gates. |
| 5 | How does it connect to our systems? | Start with file or API exports from the TMS/WMS, add a driver app and traffic/weather feeds, use Makani for address accuracy (R13). Integrate step by step. |
| 6 | How do you protect customer data? | Minimise personal data, use consent, follow UAE PDPL (in force since 2 Jan 2022, R19); no personal data in the demo. We would confirm executive-regulation status with counsel. |
| 7 | Will drivers accept it? | Co-design with drivers, keep workload fair (we measure it), respect heat rules (R14), and keep a human override. |
| 8 | What is your edge over existing route tools? | One loop: ETA prediction, live re-routing on events, and customer messaging, built around Dubai conditions. |
| 9 | How does this cut carbon? | Fewer km means less fuel and CO2; an EV-share option shows more. UPS reports about 100,000 t of CO2 avoided a year with ORION (R4). Our CO2 factors are assumed. |
| 10 | What happens next if we approve? | A 90-day pilot at one hub with go/no-go gates on cost per parcel, on-time rate, driver adoption and zero privacy incidents; then scale. |

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
