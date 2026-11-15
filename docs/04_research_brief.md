# Research Brief: Group 2, AI in Logistics & Route Optimization

Researched Sun 15 Nov 2026. Every fact below was found on the web page linked next to it. Facts are paraphrased, not copied.
**Rule for slides and scripts:** only use facts from this file (or add a new fact here first, with its URL). Never invent statistics.
Confidence: **High** = official or primary source. **Medium** = reputable news or consultancy page. **Low** = vendor blog or secondary summary (use as "indicative" only, or not at all).

## 1. The problem (slide 2)

| # | Fact | Source | Conf. | How to use |
|---|---|---|---|---|
| 1 | Last-mile share of total shipping cost rose from 41% (2018) to 53% (2023). Worldwide study, Statista Research Department, updated 14 Feb 2024. The page does not name the underlying study. | [Statista](https://statista.com/statistics/1434298/last-mile-share-of-total-shipping-costs) | Medium | Headline stat of slide 2. Say "worldwide". Cite as "Statista, Feb 2024". The original plan also named "Cascadia", which the page does not show, so leave that out unless someone can confirm it. |
| 2 | UAE e-commerce reached AED 42.2 billion (about US$11.5 billion) in 2025, up from AED 17.6 billion in 2020 (19% yearly growth). It is about 15.7% of retail sales and is forecast to pass 20% by 2030. | [Gulf Today, 28 Sep 2026](https://www.gulftoday.ae/business/2026/09/28/uae-e-commerce-market-size-reaches-dhs422-billion-in-2025), [WAM](https://www.wam.ae/en/article/c2h35yn-uae-e-commerce-market-size-reaches-aed422-billion) | Medium | Shows parcel volume is growing. Other reports give different totals because they count different things, so name the source. |
| 3 | Reports say roughly 8% to 20% of parcels fail on the first attempt globally, and a failed delivery costs about US$17 in the US. | [SmartRoutes summary](https://smartroutes.io/blogs/delivery-success-rates-key-stats-for-retail-and-ecommerce/) | Low | Indicative only. Say "industry sources report". Our model uses its own assumed AED failed-delivery cost, not this figure. |

## 2. Does AI routing really work? (slides 3, 5, 7, Q&A)

| # | Fact | Source | Conf. | How to use |
|---|---|---|---|---|
| 4 | UPS's ORION routing system saves about 100 million miles, 10 million gallons of fuel and 100,000 metric tons of CO2 a year. UPS expected $300 to 400 million of annual savings at full deployment. | [INFORMS Edelman case](https://www.informs.org/Impact/O.R.-Analytics-Success-Stories/UPS), [VentureBeat](https://venturebeat.com/business/ups-will-now-use-dynamic-routing-to-get-parcels-to-you-on-time) | Medium to High | Real-world proof that route optimisation pays. Use on slide 5 (CO2) as scale, and in Q&A. These are UPS-reported figures. |
| 5 | UPS reported 6 to 8 fewer miles driven per route after ORION. | [UPS release via 3BL, Mar 2015](https://app.3blmedia.com/news/ups-accelerates-use-routing-optimization-software-reduce-100-million-miles-driven) | Medium | Compare with our km saving per route. |
| 6 | UPS added dynamic (mid-route) re-routing to ORION. | [VentureBeat](https://venturebeat.com/business/ups-will-now-use-dynamic-routing-to-get-parcels-to-you-on-time) | Medium | Supports our live re-routing feature (Q2). |
| 7 | McKinsey: AI in distribution operations can cut logistics costs by roughly 5 to 20 percent. | [McKinsey](https://www.mckinsey.com/industries/industrials-and-electronics/our-insights/distribution-blog/harnessing-the-power-of-ai-in-distribution-operations) | High | Sanity range for our result. If our simulated saving is far above 20%, say it is optimistic because the baseline is simple. |
| 8 | A widely repeated figure says early AI adopters cut logistics costs about 15%. **[Fact-check 15 Nov, Yash: the Supply Chain Connect page attributes this to Cohen and Tang, "The Role of AI in Developing Resilient Supply Chains", not to McKinsey. Do not call it a McKinsey figure.]** | [Supply Chain Connect](https://www.supplychainconnect.com/supply-chain-technology/article/21282982/unleashing-the-power-of-ai-in-supply-chains) | Low | Optional "often cited" mention only. Prefer #7. |

## 3. Algorithms (Q3, slide 3)

| # | Fact | Source | Conf. |
|---|---|---|---|
| 9 | Vehicle routing with time windows is a well-studied problem; simulated annealing, tabu search and genetic algorithms are recognised metaheuristics for it. | [VRPTW review, JKSUS](https://jksus.org/?p=5002) | Medium |
| 10 | Survey of learning-based methods for vehicle routing: reinforcement learning (sequential decisions, learning by reward) and supervised learning. | [Learning to Solve VRPs: A Survey (arXiv 2205.02453)](https://ar5iv.labs.arxiv.org/html/2205.02453) | High (academic) |
| 11 | Survey of heuristics for the vehicle routing problem and recent advances. | [arXiv 2303.04147](https://arxiv.org/pdf/2303.04147) | High (academic) |
| 12 | Research combines reinforcement learning with genetic algorithms (EARLI) to speed up routing when similar problems repeat. | [Review summary](https://themoonlight.io/review/accelerating-vehicle-routing-via-ai-initialized-genetic-algorithms) | Low (summary) |

How to use: slide 3 says GA is a standard method for routing with time windows, and RL is the next step for urgent-order dispatch. Classical algorithms (Clarke-Wright, 2-opt) and GA are optimisation methods, and ETA, k-means, forecast and Q-learning are machine learning. Call the whole system "ML + optimisation".

## 4. Dubai context (slides 2, 5, 6)

| # | Fact | Source | Conf. | How to use |
|---|---|---|---|---|
| 13 | Makani is Dubai Municipality's address system (launched 2015): a unique 10-digit number that pinpoints the entrance of a building. | [Gulf News](https://gulfnews.com/living-in-uae/housing/makani-number-what-is-it-and-why-do-you-need-it-1.1606302505909), [Bayut](https://www.bayut.com/mybayut/heres-why-you-should-know-your-makani-number/) | Medium | Integration (slide 6): reduces failed deliveries caused by bad addresses. |
| 14 | UAE midday break: outdoor work in direct sun is banned 12:30 to 3:00 pm from 15 June to 15 September. Delivery riders cannot be forced to work in those hours. Dubai RTA set up 23 temporary rest areas in 2026. | [Khaleej Times](https://www.khaleejtimes.com/uae/delivery-drivers-cannot-be-forced-work-midday-break), [RTA, 22 Jun 2026](https://www.rta.ae/wps/portal/rta/ae/home/news-and-media/all-news/NewsDetails/23-temporary-rest-areas-to-protect-delivery-riders-from-heat-stress) | High | Responsible AI: schedules must respect heat rules and fair workload. |
| 15 | RTA aims for 25% of mobility journeys to be autonomous by 2030 (one Khaleej Times piece quotes 20%; check before using a number). | [Truck & Fleet ME](https://truckandfleetme.com/news/yango-rolls-out-robot-deliveries-at-sobha-hartland/), [Enterprise AM](https://enterpriseam.com/logistics/2025/09/30/rta-greenlights-framework-for-autonomous-trucking-in-dubai/) | Medium | Ecosystem: future partners (robots, drones). |
| 16 | RTA, DIEZ and talabat piloted delivery robots ("talabots") in Dubai Silicon Oasis. Yango and noon began robot deliveries in Dubai in Dec 2025. Robots serve short trips, roughly a 2 km radius. **[Fact-check 15 Nov, Yash: the 2 km radius is from the Truck & Fleet ME article on Yango + ROOTS at Sobha Hartland (started 24 Mar 2025), not the Khaleej Times noon article. The talabots link (Gulf Insider) did not load: certificate error.]** | [Gulf Insider](https://gulf-insider.fabianca.com/dubai-rta-launches-autonomous-food-delivery-talabots/), [Khaleej Times](https://www.khaleejtimes.com/kt-network/yango-group-and-noon-announce-strategic-partnership-to-scale-autonomous-robot-delivery-across-the-gcc) | Medium | Slide 6 ecosystem and slide 7 phase 3. |
| 17 | Dubai Green Mobility Strategy 2030; DEWA's EV Green Charger network passes 1,500 charging points; Dubai's RTA has a Commercial and Logistics Land Transport Strategy 2030 and a First and Last-Mile Strategy. **[Fact-check 15 Nov, Yash: the 1,500 points are in the Gulf News link (updated 2 Oct 2025); the strategies are in the Khaleej Times link.]** | [Gulf News](https://gulfnews.com/auto/news/dewa-dubai-taxi-ink-long-term-deal-for-ultra-fast-ev-charging-stations-1.500292327), [Khaleej Times](https://www.khaleejtimes.com/business-technology-review/dubais-last-mile-revolution-scaling-electric-delivery-for-a-growing-city) | Medium | Backs the EV-share slider (Q4). |
| 18 | Road2.0: 17 UAE companies (supported by talabat and Unilever) aim to cut their UAE road fleet emissions 30% by 2030 and 100% by 2040. | [Emirates Nature-WWF](https://www.emiratesnaturewwf.ae/press-release/8-17-uae-corporates-publish-declaration-to-electric-vehicle-ev-ecosystem-outlining-actions-required-to-scale-up-commercial-adoption-of-evs) | Medium | Q4, sustainability pressure from industry peers. |

## 5. Privacy and law (slide 6)

| # | Fact | Source | Conf. |
|---|---|---|---|
| 19 | UAE Federal Decree-Law No. 45 of 2021 (PDPL): issued 20 Sep 2021, published 26 Sep 2021, in effect since 2 Jan 2022. Regulator: UAE Data Office. Consent is the default basis for processing. DIFC and ADGM have their own regimes. | [CyberSigma](https://cybersigmacs.com/knowledge-center/uae-pdpl/), [ATB Legal](https://atblegal.com/regulatory-and-compliance/uae-data-protection/), [DLA Piper](https://www.dlapiperdataprotection.com/?t=law&c=AE) | Medium |
| 20 | **Open question:** sources disagree on whether the PDPL Executive Regulations have been issued. Do not claim fines or an enforcement date. | same as above | n/a |

Safe wording for the slide: "UAE PDPL (Federal Decree-Law 45/2021) applies; we minimise personal data and use consent; confirm executive-regulation status with counsel before go-live."

## 6. Not researched (so no statistics on slides)
- Congestion on Sheikh Zayed Road and Al Khail Road, sandstorm effects, Al Quoz hub layout: these are **scenario assumptions** in our simulation. Say "what-if scenario", not a measured fact.
- CO2 per km for vans and bikes, cost per km and driver cost: **assumed** in `06_assumptions_table.md`. If time allows, Advait replaces them with a cited source (for example a national conversion-factor table) and records the URL.
- Slide 56 and the course outline were not available to us.

## 7a. Fact-check status (Yash, 15 Nov 2026; full log in `docs/verification_log.md`)
Rule: a row marked **could not verify** must not appear on a slide until someone opens the link in a normal browser and confirms it.

| Row | Status | Note |
|---|---|---|
| 1 | verified (15 Nov 2026, Yash) | 41% (2018) to 53% (2023), worldwide, Statista Research Department, updated 14 Feb 2024; underlying study not named |
| 2 | verified (15 Nov 2026, Yash) | Gulf Today 28 Sep 2026 (credited to WAM): AED 42.2B 2025, AED 17.6B 2020, 19% CAGR, 15.7% of retail, >20% by 2030; report by EZDubai with Euromonitor. WAM link loaded without article text |
| 3 | verified as quoted (Low source) | SmartRoutes says 8 to 20% fail first attempt (links HBR); US $17.2 per parcel, no source given. Indicative only |
| 4 | partly verified | 100M miles, 10M gallons, 100,000 t CO2 confirmed via VentureBeat. INFORMS page blocks automated access (403); the US$300 to 400M figure **could not verify** |
| 5 | could not verify | 3BL link host no longer resolves; do not use "6 to 8 miles per route" |
| 6 | verified (15 Nov 2026, Yash) | VentureBeat: dynamic re-routing added to ORION |
| 7 | could not verify (automated) | McKinsey page timed out twice; open in a browser before slide 7 / Q&A use |
| 8 | verified with correction | 15% is Cohen and Tang (see row), not McKinsey |
| 9 | verified (15 Nov 2026, Yash) | JKSUS review names SA, tabu search, GA for VRPTW |
| 10 | verified (15 Nov 2026, Yash) | arXiv 2205.02453 "Learning to Solve Vehicle Routing Problems: A Survey": RL and supervised learning |
| 11 | verified (15 Nov 2026, Yash) | arXiv 2303.04147 "Heuristics for Vehicle Routing Problem: A Survey and Recent Advances" |
| 12 | not checked | Low-confidence summary site; not used on slides |
| 13 | verified (15 Nov 2026, Yash) | Gulf News: 10 digits, building entrance, Dubai Municipality, 2015 |
| 14 | verified (15 Nov 2026, Yash) | Khaleej Times: 12:30 to 15:00, 15 Jun to 15 Sep, riders cannot be compelled; RTA 22 Jun 2026: 23 rest areas |
| 15 | verified, keep the caveat | Enterprise AM: RTA 25% autonomous by 2030; Khaleej Times gives 20%; Truck & Fleet attributes 25% to the Public Transport Agency. Say "RTA targets a large share" or quote with source |
| 16 | partly verified | see row note (Yango radius source; talabots link failed) |
| 17 | verified with source note | see row note |
| 18 | verified (15 Nov 2026, Yash) | Emirates Nature-WWF: 17 companies, supported by talabat and Unilever, 30% by 2030, 100% by 2040 |
| 19 | verified (15 Nov 2026, Yash) | CyberSigma: issued 20 Sep 2021, published 26 Sep 2021, effective 2 Jan 2022, UAE Data Office, consent default |
| 20 | verified (still open) | Executive Regulations status unresolved; no fines or enforcement dates on slides |

Slides 2 and 6 use only rows 1, 2, 13, 14 and 19 (all verified).

## 7. Check list before presenting
- [ ] Every number on a slide is either in this file with a URL, or labelled "assumed" or "simulated".
- [ ] 53% is called "worldwide" and sourced to Statista.
- [ ] UPS figures are called "UPS-reported".
- [ ] No claim about PDPL fines.
