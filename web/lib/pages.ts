/** Page registry: drives the side navigation, the landing grid and the ownership table. Keep in sync with docs/03_team_split.md. */
export type Owner = "Krishna" | "Gagandeep" | "Yash" | "Atharva" | "Advait" | "Karan" | "Harsh";

export interface PageInfo {
  href: string;
  title: string;
  short: string;
  owner: Owner;
  slide: number;
  tier: 2 | 3;
  question: string;
  /** one-line "what this means for operations" note shown on the page */
  meaning: string;
  todo: string[];
}

export const PAGES: PageInfo[] = [
  { href: "/command", title: "Command Center", short: "Command", owner: "Krishna", slide: 4, tier: 2, question: "Q1, Q4",
    meaning: "One screen shows whether the AI plan beats today's plan on the same orders.",
    todo: ["Baseline vs AI KPI cards with deltas", "Light Dubai map (MapLibre Positron style + deck.gl) with animated routes", "Scenario selector (seed, orders, fleet mix)"] },
  { href: "/optimizer", title: "Route Optimizer", short: "Optimizer", owner: "Krishna", slide: 4, tier: 2, question: "Q1, Q3",
    meaning: "Dispatchers can compare algorithms and see why one route plan is cheaper.",
    todo: ["Order generator controls", "Algorithm picker: Baseline, Clarke-Wright+2-opt, GA", "Per-vehicle route table", "GA convergence chart (from Yash)"] },
  { href: "/rerouting", title: "Live Re-routing", short: "Re-routing", owner: "Yash", slide: 4, tier: 2, question: "Q2",
    meaning: "When a jam or storm hits, the plan updates in seconds instead of the day being lost.",
    todo: ["Time slider", "Inject Sheikh Zayed jam, sandstorm, rain, urgent surge", "Before/after ETAs and SLA-at-risk list"] },
  { href: "/eta", title: "ETA & Delay Model", short: "ETA", owner: "Atharva", slide: 3, tier: 2, question: "Q2, Q7",
    meaning: "Better ETAs mean fewer broken promises and fewer failed first attempts.",
    todo: ["MAE, RMSE, R-squared vs naive", "Feature importance", "What-if ETA form", "India-data caveat visible"] },
  { href: "/problem", title: "The Problem & Market", short: "Problem", owner: "Yash", slide: 2, tier: 3, question: "Q1, Q6",
    meaning: "Last mile is the biggest slice of shipping cost, and Dubai adds heat, traffic and access problems.",
    todo: ["Statista 41% to 53% chart (worldwide)", "UAE e-commerce context", "Dubai pain points"] },
  { href: "/zones", title: "Zones & Last Mile", short: "Zones", owner: "Yash", slide: 2, tier: 3, question: "Q3, Q6",
    meaning: "Zones, micro-hubs and lockers cut the number of failed and long-distance drops.",
    todo: ["k-means clusters on the map", "Micro-hub and locker candidates", "Stops per km, first-attempt view"] },
  { href: "/fleet", title: "Fleet & Sustainability", short: "Fleet", owner: "Advait", slide: 5, tier: 3, question: "Q4",
    meaning: "Fewer kilometres means less fuel, less CO2 and fairer workloads for drivers.",
    todo: ["Utilisation per vehicle", "Workload fairness", "CO2 and EV-share slider"] },
  { href: "/customer", title: "Customer & SLA", short: "Customer", owner: "Advait", slide: 5, tier: 3, question: "Q7",
    meaning: "On-time rate and breaches are our proxies for customer satisfaction.",
    todo: ["On-time %, breaches", "Copilot: English and Arabic delay messages", "Dispatcher shift summary"] },
  { href: "/integration", title: "Integration & Risk", short: "Integration", owner: "Yash", slide: 6, tier: 3, question: "Q5",
    meaning: "AI only pays off if it plugs into existing systems with a safe fallback.",
    todo: ["Architecture view (TMS/WMS, driver app, APIs, Makani)", "Risk to fallback table", "Human-override flow"] },
  { href: "/business-case", title: "Business Case & Pilot", short: "Business case", owner: "Harsh", slide: 7, tier: 3, question: "Slide 7",
    meaning: "A 90-day pilot with go/no-go gates limits the risk of the investment.",
    todo: ["ROI calculator", "Sensitivity grid", "90-day roadmap and gates"] },
  { href: "/rl-lab", title: "RL Dispatch Lab", short: "RL lab", owner: "Harsh", slide: 7, tier: 3, question: "Q3",
    meaning: "A learned dispatch policy is a next step; here is one learning curve.",
    todo: ["Learning curve", "Policy vs greedy"] },
];
