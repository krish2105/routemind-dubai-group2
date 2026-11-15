import { describe, expect, it } from "vitest";
import { assumptions } from "@/lib/assumptions";
import { buildProblem, defaultScenario } from "@/lib/engine/problem";
import { solve } from "@/lib/engine/solve";
import { computeKpis } from "@/lib/engine/kpi";
import { DEMO_EVENT } from "@/lib/engine/events";

const scenario = defaultScenario(assumptions);

describe("engine contracts (scaffold tests; owners add more)", () => {
  it("same seed gives identical problems and KPIs", () => {
    const k1 = computeKpis(buildProblem(assumptions, scenario), solve(buildProblem(assumptions, scenario), "baseline"));
    const k2 = computeKpis(buildProblem(assumptions, scenario), solve(buildProblem(assumptions, scenario), "baseline"));
    expect(k1).toEqual(k2);
  });

  it("baseline serves each order at most once and respects capacity", () => {
    const p = buildProblem(assumptions, scenario);
    const plan = solve(p, "baseline");
    const ids = plan.routes.flatMap((r) => r.stops.map((s) => s.orderId));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length + plan.unserved.length).toBe(p.orders.length);
    const cap = new Map(p.vehicles.map((v) => [v.id, v.capacity]));
    for (const r of plan.routes) expect(r.load).toBeLessThanOrEqual(cap.get(r.vehicleId)!);
  });

  it("order count matches the scenario and windows are inside operating hours", () => {
    const p = buildProblem(assumptions, scenario);
    expect(p.orders.length).toBe(300);
    for (const o of p.orders) {
      expect(o.windowStart).toBeGreaterThanOrEqual(8 * 60);
      expect(o.windowEnd).toBeLessThanOrEqual(20 * 60);
    }
  });

  it("a jam event makes the same plan slower (events change travel time)", () => {
    const calm = buildProblem(assumptions, scenario);
    const jam = buildProblem(assumptions, { ...scenario, events: [DEMO_EVENT] });
    const plan = solve(calm, "baseline");
    const kCalm = computeKpis(calm, plan);
    const kJam = computeKpis(jam, solve(jam, "baseline"));
    expect(kJam.driveHours).toBeGreaterThanOrEqual(kCalm.driveHours * 0.9);
  });

  it("stub algorithms are flagged so the UI never shows fake AI results silently", () => {
    const p = buildProblem(assumptions, scenario);
    // Remove this test's expectation when cw2opt is implemented (Krishna).
    const plan = solve(p, "cw2opt");
    if (plan.meta.stub) expect(plan.meta.note).toContain("STUB");
  });
});
