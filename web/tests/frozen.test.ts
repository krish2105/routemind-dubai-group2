import { describe, expect, it } from "vitest";
import frozen from "@/public/data/frozen_results.json";
import { assumptions } from "@/lib/assumptions";
import { buildProblem, defaultScenario } from "@/lib/engine/problem";
import { solve } from "@/lib/engine/solve";
import { computeKpis } from "@/lib/engine/kpi";
import { reroute } from "@/lib/engine/reroute";
import { DEMO_EVENT } from "@/lib/engine/events";

/**
 * Guard after the freeze (owner: Harsh): the seeded engine must still produce the frozen slide numbers.
 * If an engine change merges after the freeze, CI fails here instead of the slides silently disagreeing with the demo.
 * Skips until the file is frozen. GA is not re-run (slow; the freeze already recorded it is not the cheaper plan).
 */
const F = frozen as unknown as Record<string, number | null> & { _meta?: { ai_algorithm?: string } };
const r1 = (x: number) => Math.round(x * 10) / 10;
const pct = (b: number, a: number) => r1(((b - a) / b) * 100);

describe("frozen numbers still match the engine", () => {
  it.skipIf(typeof F.cost_pct !== "number" || F._meta?.ai_algorithm !== "cw2opt")("baseline vs Clarke-Wright + 2-opt and the 13:00 re-route reproduce every operations token", () => {
    const scenario = defaultScenario(assumptions);
    const p = buildProblem(assumptions, scenario);
    const base = solve(p, "baseline"), ai = solve(p, "cw2opt");
    const kb = computeKpis(p, base), ka = computeKpis(p, ai);
    const vans = (plan: typeof base) => plan.routes.filter((r) => r.stops.length && p.vehicles.find((v) => v.id === r.vehicleId)?.type === "van").length;
    expect(pct(kb.costPerParcelAed, ka.costPerParcelAed)).toBe(F.cost_pct);
    expect(pct(kb.km, ka.km)).toBe(F.km_pct);
    expect(pct(kb.co2Kg, ka.co2Kg)).toBe(F.co2_pct);
    expect(vans(base) - vans(ai)).toBe(F.vans_fewer);
    expect(r1(kb.capacityUtilPct)).toBe(F.util_base);
    expect(r1(ka.capacityUtilPct)).toBe(F.util_ai);
    expect(r1(kb.onTimePct)).toBe(F.ontime_base);
    expect(r1(ka.onTimePct)).toBe(F.ontime_ai);
    expect(kb.slaBreaches).toBe(F.breaches_base);
    expect(ka.slaBreaches).toBe(F.breaches_ai);
    expect(Math.round(kb.costPerParcelAed * 100) / 100).toBe(F.cost_base_aed);
    expect(Math.round(ka.costPerParcelAed * 100) / 100).toBe(F.cost_ai_aed);
    const rr = reroute(buildProblem(assumptions, { ...scenario, events: [DEMO_EVENT] }), ai, 13 * 60, [DEMO_EVENT]);
    expect(rr.atRiskBefore).toBe(F.risk_before);
    expect(rr.atRiskAfter).toBe(F.risk_after);
    expect(rr.breachesBefore).toBe(F.rr_breaches_before);
    expect(rr.breachesAfter).toBe(F.rr_breaches_after);
  });
});
