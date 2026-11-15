/**
 * Freeze the final numbers (owner: Harsh, run with Krishna, Monday 17:00 to 18:00 Dubai time).
 *   npm run freeze                 writes ../docs/frozen_results.json and public/data/frozen_results.json
 *   npm run freeze -- --dry-run    prints the numbers, writes nothing
 *   npm run freeze -- --allow-stub allow stub algorithms (dry runs only, never for the final freeze)
 *
 * AI plan = the cheaper (total cost) of cw2opt and ga. Refuses to freeze if the chosen plan or the re-routing is still a stub.
 * ETA metrics come from public/data/eta_metrics.json (Atharva exports it from the notebook): { "mae": 0, "naive_mae": 0 }
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { assumptions } from "../lib/assumptions";
import { buildProblem, defaultScenario } from "../lib/engine/problem";
import { solve } from "../lib/engine/solve";
import { computeKpis } from "../lib/engine/kpi";
import { reroute } from "../lib/engine/reroute";
import { DEMO_EVENT } from "../lib/engine/events";
import { roi } from "../lib/roi";

const args = process.argv.slice(2);
const dry = args.includes("--dry-run");
const allowStub = args.includes("--allow-stub");
const r1 = (x: number) => Math.round(x * 10) / 10;
const pct = (base: number, ai: number) => r1(((base - ai) / base) * 100);

const scenario = defaultScenario(assumptions);
const problem = buildProblem(assumptions, scenario);

const basePlan = solve(problem, "baseline");
const cw = solve(problem, "cw2opt");
const ga = solve(problem, "ga");
const baseK = computeKpis(problem, basePlan);
const candidates = [cw, ga].map((plan) => ({ plan, k: computeKpis(problem, plan) }));
candidates.sort((a, b) => a.k.totalCostAed - b.k.totalCostAed);
const best = candidates[0];

const problems: string[] = [];
if (best.plan.meta.stub && !allowStub) problems.push("AI plan is still a stub (implement cw2opt and ga first)");
if (best.plan.unserved.length > 0) problems.push(`AI plan leaves ${best.plan.unserved.length} orders unserved`);
if (best.k.costPerParcelAed >= baseK.costPerParcelAed) problems.push("AI cost per parcel is not below baseline: report honestly, do not hide");

// live re-routing at 13:00 with the Sheikh Zayed Road jam
const jamProblem = buildProblem(assumptions, { ...scenario, events: [DEMO_EVENT] });
const rr = reroute(jamProblem, best.plan, 13 * 60, [DEMO_EVENT]);
if (rr.after.meta.stub && !allowStub) problems.push("reroute() is still a stub (Karan)");

// ETA metrics (Atharva)
const etaPath = resolve(__dirname, "../public/data/eta_metrics.json");
const eta = existsSync(etaPath) ? (JSON.parse(readFileSync(etaPath, "utf8")) as { mae: number; naive_mae: number }) : null;
if (!eta) problems.push("public/data/eta_metrics.json missing (Atharva exports it from the notebook)");

// business case (Harsh): pilot cost and payback from the ROI model
const full = roi(assumptions, baseK.costPerParcelAed, best.k.costPerParcelAed, 1);
const half = roi(assumptions, baseK.costPerParcelAed, best.k.costPerParcelAed, 0.5);

const frozen = {
  _comment: "Written by web/scripts/freeze.ts. Do not edit by hand.",
  frozen_at: new Date().toISOString(),
  seed: scenario.seed,
  cost_pct: pct(baseK.costPerParcelAed, best.k.costPerParcelAed),
  km_pct: pct(baseK.km, best.k.km),
  vans_fewer: baseK.vehiclesUsed - best.k.vehiclesUsed,
  risk_before: rr.atRiskBefore,
  risk_after: rr.atRiskAfter,
  util_base: r1(baseK.capacityUtilPct),
  util_ai: r1(best.k.capacityUtilPct),
  co2_pct: pct(baseK.co2Kg, best.k.co2Kg),
  ontime_base: r1(baseK.onTimePct),
  ontime_ai: r1(best.k.onTimePct),
  breaches_base: baseK.slaBreaches,
  breaches_ai: best.k.slaBreaches,
  eta_mae: eta ? r1(eta.mae) : null,
  eta_naive_mae: eta ? r1(eta.naive_mae) : null,
  pilot_cost: assumptions.business_case.pilot_investment_aed,
  payback_months: full.paybackMonths === null ? null : r1(full.paybackMonths),
  payback_half: half.paybackMonths === null ? null : r1(half.paybackMonths),
  _meta: { ai_algorithm: best.plan.algorithm, baseline_total_cost: Math.round(baseK.totalCostAed), ai_total_cost: Math.round(best.k.totalCostAed), orders: baseK.orders },
};

console.log(JSON.stringify(frozen, null, 2));
if (problems.length) {
  console.error("\nPROBLEMS:\n- " + problems.join("\n- "));
  if (!allowStub) { console.error("\nNothing written."); process.exit(1); }
}
if (!dry && !allowStub) {
  const json = JSON.stringify(frozen, null, 2) + "\n";
  writeFileSync(resolve(__dirname, "../../docs/frozen_results.json"), json);
  writeFileSync(resolve(__dirname, "../public/data/frozen_results.json"), json);
  console.log("\nWrote docs/frozen_results.json and web/public/data/frozen_results.json. Now rebuild speaker PDFs and the deck.");
}
