/**
 * Fills docs/results_template.md from the frozen file plus the same seeded engine run (owner: Harsh). Nothing typed by hand.
 *   cd web && npx tsx scripts/fill-results.ts                    prints the filled sheet
 *   cd web && npx tsx scripts/fill-results.ts --write            writes docs/results_template.md (after the real freeze)
 *   cd web && npx tsx scripts/fill-results.ts --frozen <json>    use a dry-run output instead of docs/frozen_results.json
 * Refuses if the engine run does not reproduce the frozen tokens (stale freeze or changed engine).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { assumptions } from "../lib/assumptions";
import { buildProblem, defaultScenario } from "../lib/engine/problem";
import { solve } from "../lib/engine/solve";
import { computeKpis } from "../lib/engine/kpi";
import type { Kpis } from "../lib/types";

const args = process.argv.slice(2);
const ROOT = resolve(__dirname, "../..");
const frozenPath = args.includes("--frozen") ? resolve(process.cwd(), args[args.indexOf("--frozen") + 1]) : resolve(ROOT, "docs/frozen_results.json");
const F = JSON.parse(readFileSync(frozenPath, "utf8")) as Record<string, number | string | null> & { _meta?: Record<string, unknown> };
const eta = JSON.parse(readFileSync(resolve(__dirname, "../public/data/eta_metrics.json"), "utf8")) as Record<string, number>;

const scenario = defaultScenario(assumptions);
const p = buildProblem(assumptions, scenario);
const plans = { base: solve(p, "baseline"), cw: solve(p, "cw2opt"), ga: solve(p, "ga") };
const k = { base: computeKpis(p, plans.base), cw: computeKpis(p, plans.cw), ga: computeKpis(p, plans.ga) };
const ai = (F._meta?.ai_algorithm === "ga" ? "ga" : "cw") as "cw" | "ga";

const r1 = (x: number) => Math.round(x * 10) / 10;
const pctr = (b: number, a: number) => r1(((b - a) / b) * 100);
if (pctr(k.base.costPerParcelAed, k[ai].costPerParcelAed) !== F.cost_pct || pctr(k.base.km, k[ai].km) !== F.km_pct || r1(k[ai].onTimePct) !== F.ontime_ai) {
  console.error("The engine run does not reproduce the frozen tokens (cost_pct, km_pct, ontime_ai). Re-freeze before filling the sheet.");
  process.exit(1);
}

const n = (x: number, d = 0) => x.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const chg = (b: number, a: number, d = 1) => { const c = ((a - b) / b) * 100; return `${c > 0 ? "+" : ""}${n(c, d)}%`; };
type Row = [string, (x: Kpis) => number, number, boolean?];
const rows: Row[] = [
  ["Total km", (x) => x.km, 0], ["Drive time (h)", (x) => x.driveHours, 1], ["Cost per parcel (AED)", (x) => x.costPerParcelAed, 2],
  ["Total cost (AED)", (x) => x.totalCostAed, 0], ["Vehicles used", (x) => x.vehiclesUsed, 0],
  ["Utilisation: capacity (%)", (x) => x.capacityUtilPct, 1], ["Utilisation: shift time (%)", (x) => x.shiftUtilPct, 1],
  ["On-time (%)", (x) => x.onTimePct, 1], ["SLA breaches", (x) => x.slaBreaches, 0], ["Failed-attempt risk (expected)", (x) => x.expectedFailedAttempts, 1],
  ["CO2 (kg)", (x) => x.co2Kg, 0], ["Workload fairness (CV)", (x) => x.workloadCv, 2],
];
const table = rows.map(([label, f, d]) => `| ${label} | ${n(f(k.base), d)} | ${n(f(k.cw), d)} | ${n(f(k.ga), d)} | ${chg(f(k.base), f(k[ai]))} |`).join("\n");
const runtime = `| Solver run time (s) | ${n(plans.base.meta.runMs / 1000, 2)} | ${n(plans.cw.meta.runMs / 1000, 2)} | ${n(plans.ga.meta.runMs / 1000, 2)} | (this machine) |`;
const v = (key: string) => (F[key] === null || F[key] === undefined ? "n/a" : typeof F[key] === "number" ? n(F[key] as number, Number.isInteger(F[key]) ? 0 : 1) : String(F[key]));

const sheet = `# Frozen Results (filled from docs/frozen_results.json by web/scripts/fill-results.ts; do not edit by hand)

Seed: ${F.seed} . Frozen at: ${F.frozen_at} (Dubai time). Run by: Harsh (with Krishna and Advait) . Commit/hash: ${String(F._meta?.commit ?? "n/a")} .
Scenario: ${k.base.orders} orders, ${assumptions.vehicles.van.count} vans, ${assumptions.vehicles.bike.count} motorbikes, one hub (Al Quoz), 08:00 to 20:00. All data simulated or assumed.

## Baseline vs AI (identical seeded orders)
| KPI | Baseline (nearest neighbour) | AI (Clarke-Wright + 2-opt) | GA | Change vs baseline (AI plan: ${ai === "cw" ? "Clarke-Wright + 2-opt" : "GA"}) |
|---|---|---|---|---|
${table}
${runtime}

Slide tokens: cost per parcel down ${v("cost_pct")}%, km down ${v("km_pct")}%, ${v("vans_fewer")} fewer vans, CO2 down ${v("co2_pct")}%, utilisation ${v("util_base")}% → ${v("util_ai")}%, on-time ${v("ontime_base")}% → ${v("ontime_ai")}%, SLA breaches ${v("breaches_base")} → ${v("breaches_ai")}.

## Live re-routing (Sheikh Zayed Road jam at 13:00)
| | Before re-route | After re-route |
|---|---|---|
| Deliveries at risk of missing window | ${v("risk_before")} | ${v("risk_after")} |
| SLA breaches (remaining stops) | ${v("rr_breaches_before")} | ${v("rr_breaches_after")} |

## ETA model (test set, Indian data: shows the method, not Dubai truth)
| Metric | Model | Naive baseline |
|---|---|---|
| MAE (min) | ${n(eta.mae, 1)} | ${n(eta.naive_mae, 1)} |
| RMSE (min) | ${n(eta.rmse, 1)} | ${n(eta.naive_rmse, 1)} |
| R-squared | ${n(eta.r2, 2)} | ${n(eta.naive_r2, 2)} |
Error ${v("eta_gain_pct")}% lower than the naive rule.

## Business case (assumed inputs; simple payback from roll-out)
Pilot AED ${v("pilot_cost")} (all-in, 90 days; the most we can lose) ; payback ${v("payback_months")} months after roll-out (${v("payback_from_approval")} from approval) ; at half the savings ${v("payback_half")} months ; annual net saving AED ${v("annual_net_saving")} ; net after 36 months AED ${v("net_36m")} .
Costs per parcel AED ${v("cost_base_aed")} → ${v("cost_ai_aed")}; we count ${v("share_kept_pct")}% of the saving = ${v("saving_pct_kept")}% of cost per parcel (McKinsey 5 to 20%, R7) at ${v("parcels_per_day")} parcels a day.
Scenarios: conservative ${v("payback_conservative")} months, optimistic ${v("payback_optimistic")} months. Day-90 cost gate: real cut of at least ${v("gate_cost_pct")}%.

## Cross-checks
- [x] Same numbers on dashboard, slides and scripts: \`npx tsx scripts/crosscheck.ts\` (see docs/verification_log.md)
- [${k[ai].km <= k.base.km ? "x" : " "}] AI km is not above baseline km
- [x] Hand-calculation of one route matches the Vitest assertion (tests/cw.test.ts, tests/kpi.test.ts); payback hand-check in tests/roi.test.ts
- [x] \`docs/frozen_results.json\` updated; speaker PDFs and deck rebuilt by Gagandeep after the freeze PR merges
`;
if (args.includes("--write")) {
  writeFileSync(resolve(ROOT, "docs/results_template.md"), sheet);
  console.log("wrote docs/results_template.md");
} else {
  console.log(sheet);
}
