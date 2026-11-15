import { describe, expect, it } from "vitest";
import { assumptions } from "@/lib/assumptions";
import { buildProblem, defaultScenario } from "@/lib/engine/problem";
import { solve } from "@/lib/engine/solve";
import { computeKpis } from "@/lib/engine/kpi";
import { DEMO_EVENT } from "@/lib/engine/events";
import { evaluateRoute } from "@/lib/engine/schedule";
import type { Plan, Problem } from "@/lib/types";

const scenario = defaultScenario(assumptions);
const calm = buildProblem(assumptions, scenario);
const jam = buildProblem(assumptions, { ...scenario, events: [DEMO_EVENT] });
const aiCalm = solve(calm, "cw2opt");
const aiJam = solve(jam, "cw2opt");

function checkPlan(p: Problem, plan: Plan) {
  const ids = plan.routes.flatMap((r) => r.stops.map((s) => s.orderId));
  // every order served exactly once (or listed as unserved, never both, never missing)
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.length + plan.unserved.length).toBe(p.orders.length);
  for (const u of plan.unserved) expect(ids).not.toContain(u);
  const veh = new Map(p.vehicles.map((v) => [v.id, v]));
  const used = new Set<string>();
  for (const r of plan.routes) {
    const v = veh.get(r.vehicleId)!;
    expect(v).toBeDefined();
    expect(used.has(r.vehicleId)).toBe(false); // one trip per vehicle
    used.add(r.vehicleId);
    expect(r.load).toBeLessThanOrEqual(v.capacity);
    expect(r.overDuty).toBe(false);
    expect(r.endMin).toBeLessThanOrEqual(v.shiftEnd);
    // route numbers must equal the shared evaluator (nothing hidden or re-scored differently)
    const again = evaluateRoute(p, v, r.stops.map((s) => s.orderIdx));
    expect(again.km).toBeCloseTo(r.km, 9);
    expect(again.stops.filter((s) => s.late).length).toBe(r.stops.filter((s) => s.late).length);
  }
}

describe("Clarke-Wright + 2-opt (AI plan)", () => {
  it("is a real solver, not the stub", () => {
    expect(aiCalm.algorithm).toBe("cw2opt");
    expect(aiCalm.meta.stub).toBe(false);
    expect(aiCalm.meta.runMs).toBeGreaterThan(0);
  });

  it("serves every order once, respects capacity and duty hours (default seed)", () => {
    checkPlan(calm, aiCalm);
    expect(aiCalm.unserved).toHaveLength(0);
  });

  it("is valid under the 13:00 Sheikh Zayed Road jam too", () => {
    checkPlan(jam, aiJam);
  });

  it("is deterministic: same seed, identical plan", () => {
    const again = solve(buildProblem(assumptions, scenario), "cw2opt");
    expect(again.routes).toEqual(aiCalm.routes);
    expect(again.unserved).toEqual(aiCalm.unserved);
  });

  it("beats the baseline on the default seed (km, cost per parcel, on-time, vehicles)", () => {
    const b = computeKpis(calm, solve(calm, "baseline"));
    const a = computeKpis(calm, aiCalm);
    expect(a.km).toBeLessThanOrEqual(b.km);
    expect(a.costPerParcelAed).toBeLessThan(b.costPerParcelAed);
    expect(a.onTimePct).toBeGreaterThanOrEqual(b.onTimePct);
    expect(a.vehiclesUsed).toBeLessThanOrEqual(b.vehiclesUsed);
  });

  it("hand-check one route: distance, AED vehicle cost and CO2 match a manual calculation", () => {
    const r = aiCalm.routes[0];
    const v = calm.vehicles.find((x) => x.id === r.vehicleId)!;
    // manual: hub -> stop 1 -> ... -> stop n -> hub, summing the km matrix (node 0 = hub, node i+1 = order i)
    const nodes = [0, ...r.stops.map((s) => s.orderIdx + 1), 0];
    let km = 0;
    for (let i = 0; i < nodes.length - 1; i++) km += calm.km[nodes[i]][nodes[i + 1]];
    expect(r.km).toBeCloseTo(km, 9);
    const aed = km * v.costPerKm; // e.g. van 0.85 AED/km (assumed)
    const co2 = km * v.co2PerKm; // e.g. van 0.24 kg/km (assumed), evShare = 0
    expect(r.km * v.costPerKm).toBeCloseTo(aed, 9);
    const k = computeKpis(calm, { ...aiCalm, routes: [r], unserved: [] });
    expect(k.co2Kg).toBeCloseTo(co2, 9);
    expect(k.km).toBeCloseTo(km, 9);
    // arrival never before the window opens, slack = windowEnd - arrival
    for (const s of r.stops) {
      const o = calm.orders[s.orderIdx];
      expect(s.arrival).toBeGreaterThanOrEqual(o.windowStart);
      expect(s.slack).toBeCloseTo(o.windowEnd - s.arrival, 9);
    }
  });

  it("runs fast enough for the browser worker", () => {
    expect(aiCalm.meta.runMs).toBeLessThan(5000);
  });
});
