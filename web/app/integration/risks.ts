/**
 * Risk register shown on /integration. Mirror of docs/09_risk_register.md (keep both in sync).
 * Likelihood and impact are our judgement for the fictional DubaiDash Express (assumed). R# = row in docs/04_research_brief.md.
 */
export type Level = "L" | "M" | "H";
export type Theme = "Business model" | "Tech investment" | "Ecosystem integration" | "Operational risk";

export interface Risk {
  n: number;
  risk: string;
  l: Level;
  i: Level;
  mitigation: string;
  fallback: string;
  owner: string;
  theme: Theme;
}

export const RISKS: Risk[] = [
  { n: 1, risk: "Poor data quality (bad addresses, missing windows)", l: "H", i: "H", mitigation: "Makani address validation where available (R13); data checks before optimising", fallback: "Dispatcher confirms flagged stops; manual plan for those stops", owner: "Data lead", theme: "Operational risk" },
  { n: 2, risk: "Legacy TMS/WMS cannot integrate quickly", l: "M", i: "H", mitigation: "Start with file or API exports; integrate in phases", fallback: "Run RouteMind beside dispatchers as an advisory tool", owner: "IT lead", theme: "Ecosystem integration" },
  { n: 3, risk: "Driver adoption and trust", l: "M", i: "H", mitigation: "Co-design with drivers; explain ETAs; fair workload metric", fallback: "Manual route always available; driver feedback loop", owner: "Ops manager", theme: "Operational risk" },
  { n: 4, risk: "Privacy and legal (UAE PDPL, R19)", l: "M", i: "H", mitigation: "Data minimisation and consent; confirm executive-regulation status with legal counsel", fallback: "Pause the feature; revert to anonymised IDs", owner: "Legal / DPO", theme: "Operational risk" },
  { n: 5, risk: "Bad ETA in unusual weather", l: "M", i: "M", mitigation: "Monitor ETA error; sandstorm and rain scenarios in testing", fallback: "Historical average ETA; human override", owner: "ML lead", theme: "Tech investment" },
  { n: 6, risk: "Heat and labour rules (midday break, R14)", l: "M", i: "H", mitigation: "Scheduler respects rest windows; fairness metric", fallback: "Manual re-plan; rest-area stops", owner: "Ops manager", theme: "Operational risk" },
  { n: 7, risk: "Over-promised savings (simulation vs real)", l: "H", i: "M", mitigation: "Pilot with go/no-go gates; adoption haircut in ROI", fallback: "Stop at gate 1 if cost per parcel does not improve", owner: "Programme sponsor", theme: "Business model" },
  { n: 8, risk: "Traffic, weather or LLM API outage", l: "M", i: "L", mitigation: "Cached travel-time matrix; template messages", fallback: "Static multipliers; last accepted plan", owner: "IT lead", theme: "Tech investment" },
  { n: 9, risk: "Partner dependency (robots, lockers, EV, R16, R17)", l: "M", i: "M", mitigation: "Several partners; only in phase 3", fallback: "Vans and bikes stay the base network", owner: "Partnerships lead", theme: "Ecosystem integration" },
  { n: 10, risk: "Model drift after go-live", l: "M", i: "M", mitigation: "Weekly accuracy check; retrain; alert when error rises", fallback: "Freeze model version; wider window buffers", owner: "ML lead", theme: "Tech investment" },
  { n: 11, risk: "Over-optimisation vs fairness", l: "M", i: "H", mitigation: "Workload spread as a KPI; caps on stops and duty hours", fallback: "Dispatcher rebalances routes by hand", owner: "Ops manager", theme: "Operational risk" },
  { n: 12, risk: "Vendor lock-in (maps, cloud, routing APIs)", l: "M", i: "M", mitigation: "Open formats, open-source engine, exportable data", fallback: "Haversine fallback while switching provider", owner: "IT lead", theme: "Tech investment" },
  { n: 13, risk: "Pilot cost overrun", l: "M", i: "M", mitigation: "Fixed-scope 90-day pilot; monthly budget review", fallback: "Stop or re-scope at the gate", owner: "Programme sponsor", theme: "Business model" },
  { n: 14, risk: "Regulatory change (autonomy, data, labour; R15, R19)", l: "L", i: "M", mitigation: "Track RTA and federal updates; legal review per phase", fallback: "Disable the affected feature; keep core routing", owner: "Legal / DPO", theme: "Ecosystem integration" },
  { n: 15, risk: "Cyber attack on dispatch or driver app", l: "L", i: "H", mitigation: "Role-based access, audit log, no personal data in the engine", fallback: "Last accepted plan and paper manifests", owner: "IT lead", theme: "Operational risk" },
];
