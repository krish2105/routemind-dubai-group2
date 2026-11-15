import { describe, expect, it } from "vitest";
import { assumptions } from "@/lib/assumptions";
import { buildProblem, defaultScenario } from "@/lib/engine/problem";
import { solve } from "@/lib/engine/solve";
import { solveGA } from "@/lib/engine/ga";
import { computeKpis } from "@/lib/engine/kpi";
import { evaluateRoute } from "@/lib/engine/schedule";

const p = buildProblem(assumptions, defaultScenario(assumptions));
const ga = solve(p, "ga");
const base = solve(p, "baseline");

describe("Genetic algorithm", { timeout: 60_000 }, () => {
  it("is real, not the stub, and fills convergence", () => {
    expect(ga.algorithm).toBe("ga");
    expect(ga.meta.stub).toBe(false);
    expect(ga.meta.generations).toBe(150);
    expect(ga.meta.convergence).toHaveLength(150);
  });

  it("serves every order exactly once, respects capacity and duty", () => {
    const ids = ga.routes.flatMap((r) => r.stops.map((s) => s.orderId));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ga.unserved).toHaveLength(0);
    expect(ids.length).toBe(p.orders.length);
    const veh = new Map(p.vehicles.map((v) => [v.id, v]));
    expect(new Set(ga.routes.map((r) => r.vehicleId)).size).toBe(ga.routes.length);
    for (const r of ga.routes) {
      const v = veh.get(r.vehicleId)!;
      expect(r.load).toBeLessThanOrEqual(v.capacity);
      expect(r.overDuty).toBe(false);
      expect(evaluateRoute(p, v, r.stops.map((s) => s.orderIdx)).km).toBeCloseTo(r.km, 9);
    }
  });

  it("convergence never goes up (elitism)", () => {
    const c = ga.meta.convergence!;
    for (let i = 1; i < c.length; i++) expect(c[i]).toBeLessThanOrEqual(c[i - 1]);
    expect(c[c.length - 1]).toBeLessThan(c[0]);
  });

  it("same seed gives the same plan", () => {
    const a = solveGA(p, { generations: 15 });
    const b = solveGA(p, { generations: 15 });
    expect(b.meta.convergence).toEqual(a.meta.convergence);
    expect(b.routes.map((r) => r.stops.map((s) => s.orderId))).toEqual(a.routes.map((r) => r.stops.map((s) => s.orderId)));
  });

  it("costs no more than the baseline on the default seed", () => {
    expect(computeKpis(p, ga).totalCostAed).toBeLessThanOrEqual(computeKpis(p, base).totalCostAed);
  });

  it("warm start is never worse than the plan passed in", () => {
    const warm = solve(p, "cw2opt");
    const out = solveGA(p, { generations: 10, warmStart: warm });
    expect(out.unserved).toHaveLength(0);
    expect(computeKpis(p, out).totalCostAed).toBeLessThanOrEqual(computeKpis(p, warm).totalCostAed + 1e-6);
  });
});
