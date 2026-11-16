/**
 * Freeze the final numbers (owner: Harsh, run with Krishna and Advait, Monday 17:00 to 18:00 Dubai time).
 *   npm run freeze -- --dry-run    prints the numbers and every check, writes nothing
 *   npm run freeze                 writes ../docs/frozen_results.json and public/data/frozen_results.json (identical bytes)
 *   npm run freeze -- --allow-stub allow stub algorithms (dry runs only, never for the final freeze)
 *
 * AI plan = the cheaper (total cost) of cw2opt and ga; the freeze refuses unless that is cw2opt, because /command, /fleet and
 * /customer show cw2opt. It also refuses on: stub algorithms, unserved orders, AI not cheaper, any slide claim whose direction
 * would be false ("fewer km", "lift utilisation" ...), any required token null, missing ETA metrics.
 * ETA metrics come from public/data/eta_metrics.json (Atharva exports it from the notebook).
 *
 * ROI tokens are computed from the ROUNDED costs per parcel that are frozen (2 decimals), so anyone with a calculator,
 * the /business-case page and Slide 7 get the same payback. cost_pct stays on unrounded engine costs (it is the headline the
 * live demo also shows); the check below keeps the two within 0.1 point.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { assumptions } from "../lib/assumptions";
import { buildProblem, defaultScenario } from "../lib/engine/problem";
import { solve } from "../lib/engine/solve";
import { computeKpis, costBreakdown } from "../lib/engine/kpi";
import { reroute } from "../lib/engine/reroute";
import { DEMO_EVENT } from "../lib/engine/events";
import { PAYBACK_TARGET_MONTHS, breakEvenSaving, computeRoi, paybackFromApproval, pilotExposure, roiInputs, scenarios } from "../lib/roi";
import type { Kpis, Plan, Problem } from "../lib/types";

const args = process.argv.slice(2);
const dry = args.includes("--dry-run");
const allowStub = args.includes("--allow-stub");
const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;
const k1000 = (x: number) => Math.round(x / 1000) * 1000;
const pct = (base: number, ai: number) => r1(((base - ai) / base) * 100);
const r1n = (x: number | null) => (x === null ? null : r1(x));

const scenario = defaultScenario(assumptions);
const problem = buildProblem(assumptions, scenario);

const basePlan = solve(problem, "baseline");
const cw = solve(problem, "cw2opt");
const ga = solve(problem, "ga");
const baseK = computeKpis(problem, basePlan);
const candidates = [cw, ga].map((plan) => ({ plan, k: computeKpis(problem, plan) }));
candidates.sort((a, b) => a.k.totalCostAed - b.k.totalCostAed);
const best = candidates[0];
const gaK = candidates.find((c) => c.plan.algorithm === "ga")!.k;

const problems: string[] = [];
if (best.plan.meta.stub && !allowStub) problems.push("AI plan is still a stub (implement cw2opt and ga first)");
if (best.plan.unserved.length > 0) problems.push(`AI plan leaves ${best.plan.unserved.length} orders unserved`);
if (best.k.costPerParcelAed >= baseK.costPerParcelAed) problems.push("AI cost per parcel is not below baseline: report honestly, do not hide");
if (best.plan.algorithm !== "cw2opt") problems.push(`cheapest AI plan is ${best.plan.algorithm}, but the dashboard pages show cw2opt: align with Krishna before freezing`);

/** Vans actually used (slides say "fewer vans": count by vehicle type, not all vehicles). */
function vansUsed(p: Problem, plan: Plan): number {
  const type = new Map(p.vehicles.map((v) => [v.id, v.type]));
  return plan.routes.filter((r) => r.stops.length > 0 && type.get(r.vehicleId) === "van").length;
}

// live re-routing at 13:00 with the Sheikh Zayed Road jam
const jamProblem = buildProblem(assumptions, { ...scenario, events: [DEMO_EVENT] });
const rr = reroute(jamProblem, best.plan, 13 * 60, [DEMO_EVENT]);
if (rr.after.meta.stub && !allowStub) problems.push("reroute() is still a stub");

// ETA metrics (Atharva)
const etaPath = resolve(__dirname, "../public/data/eta_metrics.json");
const eta = existsSync(etaPath) ? (JSON.parse(readFileSync(etaPath, "utf8")) as { mae: number; naive_mae: number }) : null;
if (!eta) problems.push("public/data/eta_metrics.json missing (Atharva exports it from the notebook)");

// business case (Harsh): from the frozen 2-decimal costs per parcel, so page, slide and a calculator agree
const perParcel = (k: Kpis, plan: Plan) => costBreakdown(problem, plan).kmCostAed / k.served;
const costBase = r2(baseK.costPerParcelAed), costAi = r2(best.k.costPerParcelAed);
const kmBase = r2(perParcel(baseK, basePlan)), kmAi = r2(perParcel(best.k, best.plan));
const inputs = roiInputs(assumptions, costBase, costAi, { kmCostBase: kmBase, kmCostAi: kmAi });
const full = computeRoi(inputs);
const half = computeRoi({ ...inputs, savingFactor: 0.5 });
const [cons, , opt] = scenarios(inputs, assumptions).map((s) => s.result);
const gate = breakEvenSaving(inputs, PAYBACK_TARGET_MONTHS);

const costPct = pct(baseK.costPerParcelAed, best.k.costPerParcelAed);
if (Math.abs(costPct - ((costBase - costAi) / costBase) * 100) > 0.1) problems.push("cost_pct and the rounded costs per parcel differ by more than 0.1 point");

/** Dubai local time with its offset (the template asks for Dubai time). */
function dubaiNow(): string {
  return new Date(Date.now() + 4 * 3600_000).toISOString().replace(/\.\d+Z$/, "+04:00");
}
function commit(): string {
  try {
    const sha = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    const dirty = execSync("git status --porcelain", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() ? "+dirty" : "";
    return sha + dirty;
  } catch { return "unknown"; }
}

const frozen = {
  _comment: "Written by web/scripts/freeze.ts. Do not edit by hand. All company data assumed; all results simulated (seed below).",
  frozen_at: dubaiNow(),
  seed: scenario.seed,
  // operations (slides 1, 4, 5): baseline vs AI on identical seeded orders
  cost_pct: costPct,
  km_pct: pct(baseK.km, best.k.km),
  vans_fewer: vansUsed(problem, basePlan) - vansUsed(problem, best.plan),
  risk_before: rr.atRiskBefore,
  risk_after: rr.atRiskAfter,
  rr_breaches_before: rr.breachesBefore,
  rr_breaches_after: rr.breachesAfter,
  util_base: r1(baseK.capacityUtilPct),
  util_ai: r1(best.k.capacityUtilPct),
  co2_pct: pct(baseK.co2Kg, best.k.co2Kg),
  ontime_base: r1(baseK.onTimePct),
  ontime_ai: r1(best.k.onTimePct),
  breaches_base: baseK.slaBreaches,
  breaches_ai: best.k.slaBreaches,
  // ETA model (slide 3)
  eta_mae: eta ? r1(eta.mae) : null,
  eta_naive_mae: eta ? r1(eta.naive_mae) : null,
  eta_gain_pct: eta ? r1((1 - eta.mae / eta.naive_mae) * 100) : null,
  // business case (slide 7); money basis: the pilot cost is the all-in 90-day budget
  pilot_cost: assumptions.business_case.pilot_investment_aed,
  pilot_exposure: pilotExposure(inputs),
  cost_base_aed: costBase,
  cost_ai_aed: costAi,
  km_cost_base_aed: kmBase,
  km_cost_ai_aed: kmAi,
  share_kept_pct: Math.round(inputs.adoptionHaircut * 100),
  saving_pct_kept: r1(full.effectiveSavingPct),
  parcels_per_day: inputs.parcelsPerDay,
  payback_months: r1n(full.paybackMonths),
  payback_half: r1n(half.paybackMonths),
  payback_from_approval: r1n(paybackFromApproval(full)),
  payback_conservative: r1n(cons.paybackMonths),
  payback_optimistic: r1n(opt.paybackMonths),
  annual_net_saving: k1000(full.annualNet),
  net_36m: k1000(full.net36),
  gate_cost_pct: r1(gate.pctOfBaseCost),
  _meta: {
    commit: commit(),
    assumptions_version: assumptions.version,
    ai_algorithm: best.plan.algorithm,
    orders: baseK.orders,
    baseline_total_cost: Math.round(baseK.totalCostAed),
    ai_total_cost: Math.round(best.k.totalCostAed),
    ga_total_cost: Math.round(gaK.totalCostAed),
    ga_generations: ga.meta.generations ?? null,
    run_ms: { baseline: Math.round(basePlan.meta.runMs), cw2opt: Math.round(cw.meta.runMs), ga: Math.round(ga.meta.runMs) },
    vehicles_used: { baseline: baseK.vehiclesUsed, ai: best.k.vehiclesUsed },
    roi_note: "payback = pilot_cost / (saving kept x parcels/day x 330/12 - running cost); costs per parcel rounded to 2 dp; payback from roll-out",
  },
};

// direction checks: every claim the slides make in words must be true in the numbers
const f = frozen;
const claims: [boolean, string][] = [
  [f.km_pct > 0, "km_pct must be > 0 (slides say fewer km)"],
  [f.co2_pct > 0, "co2_pct must be > 0 (slides say less CO2)"],
  [f.vans_fewer >= 0, "vans_fewer must be >= 0 (slides say fewer vans)"],
  [f.risk_after <= f.risk_before, "risk_after must be <= risk_before (re-routing helps)"],
  [f.rr_breaches_after <= f.rr_breaches_before, "re-routing must not add SLA breaches (Q&A says no extra breaches)"],
  [f.breaches_ai <= f.breaches_base, "breaches_ai must be <= breaches_base"],
  [f.ontime_ai >= f.ontime_base, "ontime_ai must be >= ontime_base"],
  [f.util_ai >= f.util_base, "util_ai must be >= util_base (slides say lift utilisation)"],
  [eta === null || eta.mae < eta.naive_mae, "ETA model must beat the naive rule"],
];
for (const [ok, msg] of claims) if (!ok) problems.push(`direction check failed: ${msg}`);

// no token may be null in the final freeze
const nulls = Object.entries(frozen).filter(([k, v]) => !k.startsWith("_") && (v === null || v === undefined)).map(([k]) => k);
if (nulls.length) problems.push(`null tokens: ${nulls.join(", ")}`);

console.log(JSON.stringify(frozen, null, 2));
console.log(`\nchecks: ${claims.filter(([ok]) => ok).length}/${claims.length} direction claims hold; ${nulls.length} null tokens; AI plan ${best.plan.algorithm} (GA total ${Math.round(gaK.totalCostAed)} AED vs CW ${Math.round(candidates.find((c) => c.plan.algorithm === "cw2opt")!.k.totalCostAed)} AED)`);
if (problems.length) {
  console.error("\nPROBLEMS:\n- " + problems.join("\n- "));
  if (!allowStub) { console.error("\nNothing written."); process.exit(1); }
}
if (!dry && !allowStub) {
  const json = JSON.stringify(frozen, null, 2) + "\n";
  const docs = resolve(__dirname, "../../docs/frozen_results.json");
  const web = resolve(__dirname, "../public/data/frozen_results.json");
  writeFileSync(docs, json);
  writeFileSync(web, json);
  if (readFileSync(docs, "utf8") !== readFileSync(web, "utf8")) { console.error("the two frozen copies differ after writing"); process.exit(1); }
  console.log("\nWrote docs/frozen_results.json and web/public/data/frozen_results.json (identical). Now: cross-check, rebuild speaker PDFs and the deck.");
} else {
  console.log("\nDry run: nothing written.");
}
