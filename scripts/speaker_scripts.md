# Speaker Scripts (Group 2, RouteMind Dubai)

Format for the PDF builder (`tools/build_speaker_pdfs.py`):
- `## SLIDE n | Speaker | seconds | Slide title` starts a slide block.
- `> text` lines are delivery notes (not spoken, not counted).
- `[CUE: ...]` is a demo or slide action (not spoken; counted as 3 seconds).
- `[PAUSE]` is a 5 second pause.
- `{{token}}` is replaced from `docs/frozen_results.json`. Unfilled tokens show as red `[token]` in the PDF.
- Speaking pace used for timing: 135 words per minute.

Total target: 9:15 of speaking, leaving 45 seconds for handovers inside the 10 minutes.

## SLIDE 1 | Gagandeep | 60 | Last-mile is half the bill. RouteMind Dubai fixes it with one AI loop.
> Delivery: smile, slow start, look at the audience. Hand over by name to Yash.
Good morning everyone. [PAUSE] Imagine you order a parcel in Dubai at nine in the morning, promised by two in the afternoon. By noon, a jam on Sheikh Zayed Road or a sandstorm has changed everything, and nobody tells you.
Last-mile delivery is the most expensive part of the journey. Statista reports it at about 53 per cent of total shipping cost, worldwide.
Our answer is RouteMind Dubai. It is one AI loop that predicts delays, plans the routes, re-plans live, and informs the customer.
On a simulated courier day, it cuts cost per parcel by {{cost_pct}} per cent and needs {{vans_fewer}} fewer vans. Today we ask you to approve a 90-day pilot. We will show you why.
Over to Yash for the problem.

## SLIDE 2 | Yash | 75 | Costs are rising in a fast-growing, hard-to-deliver market
> Delivery: say "worldwide" when you quote Statista. Do not call the UAE figure a forecast. Point at the chart, then at the four boxes.
Thank you, Gagandeep. Let me start with why this matters.
Worldwide, Statista reports that the last mile grew from about 41 per cent of total shipping cost to about 53 per cent. So more than half of the delivery bill is spent on that final trip to the door.
In the UAE, the volume behind that bill keeps growing. Online shopping reached about 42 billion dirhams in 2025, roughly 16 per cent of all retail. Every extra order is one more small drop.
Dubai then adds its own problems. Traffic on Sheikh Zayed Road and Al Khail changes hour by hour. Heat, rain and sandstorms slow down vans and riders, and in summer riders cannot be made to work in the midday heat. And in towers and gated communities the right door is hard to find, so first attempts fail and the van has to come back.
Yet most dispatchers still plan the routes once in the morning and hardly change them. That gap is where AI helps.
Atharva will show you how our system works.

## SLIDE 3 | Atharva | 75 | One AI loop: predict, cluster, optimise, re-route, inform
> Delivery: point to each of the five boxes as you name them. Slow down on the two ETA numbers. Say the India caveat clearly.
Thanks Yash. So how does RouteMind actually work? It is one loop with five steps.
Step one, predict. A gradient boosting model learns how long a delivery takes from distance, time of day, traffic and weather. On deliveries it never saw, its average error is {{eta_mae}} minutes. A simple rule based only on distance misses by {{eta_naive_mae}} minutes.
Step two, cluster. k-means groups the parcels into delivery zones, which tells us where micro-hubs and lockers make sense.
Step three, optimise. Clarke-Wright savings builds the first routes and 2-opt cleans them up. A genetic algorithm then breeds and mutates route orders and keeps the best ones.
Step four, re-route. When a jam or a storm hits, the plan is updated live.
Step five, inform. A GenAI copilot tells customers about delays, in English and Arabic.
Next on our list is reinforcement learning for urgent orders.
One honest point: the ETA model learned from Indian delivery data. It proves the method, not Dubai numbers.
Krishna will now show it live.

## SLIDE 4 | Krishna | 120 | Live demo: same orders, shorter routes, and a jam handled in one click
> Delivery: click while you talk. Live link: web-rws7.vercel.app. If anything freezes, say "let me show the recording" and play deliverables/demo_90s.mp4. Never debug live.
Thanks Atharva. [CUE: open Command Center] This is one simulated working day at DubaiDash: 300 orders, 12 vans, 8 motorbikes and one hub in Al Quoz. Everything here is simulated or assumed, and the old plan and the AI plan get exactly the same orders.
Amber is today's way of planning: send the driver to the nearest order that is ready. Teal is RouteMind. [CUE: press Play] Watch the vans leave the hub. The teal routes are tighter. Across the day the AI drives {{km_pct}} per cent fewer kilometres, cuts cost per parcel by {{cost_pct}} per cent, and needs {{vans_fewer}} fewer vans. On-time goes from {{ontime_base}} to {{ontime_ai}} per cent.
[CUE: open Route Optimizer, press Run] Here a dispatcher can compare methods side by side. Clarke-Wright and 2-opt build the plan in under a second, and the table shows every van, its load and when it is back.
[CUE: open Live Re-routing, add the 1 pm jam] Now the real test. At 1 pm Sheikh Zayed Road jams. [PAUSE] Before re-routing, {{risk_before}} deliveries are at risk of missing their window. [CUE: click Re-route] After one click: {{risk_after}}.
Three honest points. The results are simulated, our baseline is simple, and a dispatcher can always override the AI. We also used AI tools to help build this dashboard, and that is circled on the slide.
Advait will now show what this means for the business.

## SLIDE 5 | Advait | 75 | Better utilisation, less CO2, and fewer broken promises
> Delivery: slow down on the numbers. Say "proxy" when you talk about customer satisfaction. Point at the red circle when you mention the copilot.
Thanks Krishna. So what changes on the ground, for the fleet and for our customers?
First, the fleet. Capacity utilisation goes from {{util_base}} to {{util_ai}} per cent, because the same parcels fit into fewer, fuller vans. Fewer kilometres also means {{co2_pct}} per cent less CO2, using assumed emission factors. For scale, UPS reports about 100,000 tonnes of CO2 avoided each year with its ORION routing.
Second, customers. On-time delivery rises from {{ontime_base}} to {{ontime_ai}} per cent, and SLA breaches drop from {{breaches_base}} to {{breaches_ai}}. These are proxies for satisfaction; we did not survey anyone.
Third, drivers. We track workload fairness, so the AI does not overload a few people, and summer plans must keep the midday break for riders.
[CUE: point to the red circle] Finally, the copilot drafts delay messages in English and Arabic. It is AI-drafted, and a dispatcher approves it before anything is sent.
Yash will now cover the risks.

## SLIDE 6 | Yash | 75 | Integration is the hard part, so we plan for it
> Delivery: calm and practical. For PDPL say "we would confirm the details with legal counsel". Do not mention fines. Point at the four boxes at the bottom for the boardroom themes.
Thanks Advait. An AI plan only helps if it fits the way the business already runs, so let me cover integration and risk.
On integration, nothing is replaced on day one. RouteMind reads file or API exports from the transport and warehouse systems, adds traffic and weather feeds, and sends the stops to a driver app. Unclear addresses cause many failed drops, so we use Makani, Dubai's ten-digit entrance code, where we have it.
On risk, every risk in this table has a fallback. The dispatcher can accept, edit or reject any route, and if the AI goes down, drivers simply keep the last accepted plan.
For workers, the scheduler respects the UAE midday break from 15 June to 15 September. For privacy, we keep personal data to a minimum and follow the UAE data protection law, in force since January 2022. We would confirm the details with legal counsel.
For the business, zone lockers and paid slots open new revenue, and robots and EV charging can plug in later.
Harsh will present the plan and the business case.

## SLIDE 7 | Harsh | 75 | A capped pilot tests the payback before we scale
> Delivery: slow and calm on the three numbers. Point at the roadmap on the CUE, at the gate tile on "gate". End with the ask, hold eye contact through the pause, then the closing line.
Thanks Yash. Here is how we prove it, at low risk.
One decision today: a 90-day pilot at one hub, {{pilot_cost}} dirhams, all-in.
[CUE: point to the roadmap] We connect the data, run RouteMind in shadow mode beside our dispatchers, then live on one zone.
Counting only {{share_kept_pct}} per cent of the simulated saving, payback is about {{payback_months}} months after roll-out. At half the saving it is {{payback_half}} months. Too slow, so we gate the money.
On day 90 we scale only if real cost per parcel is down at least {{gate_cost_pct}} per cent, service is better, dispatchers use the routes, and there are no safety or privacy incidents. If not, we stop, and the pilot is all we lose.
So please approve the pilot, name a sponsor, and keep the first of March for the gate review. [PAUSE]
Next time Sheikh Zayed Road jams at noon, our van has already re-routed, and the customer heard it from us first. Thank you.
