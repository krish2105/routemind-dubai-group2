import { describe, expect, it } from "vitest";
import { assumptions } from "@/lib/assumptions";
import { buildProblem, defaultScenario } from "@/lib/engine/problem";
import { solve } from "@/lib/engine/solve";
import { reroute, withLiveEvents } from "@/lib/engine/reroute";
import { DEMO_EVENT, eventInfo, EVENT_TYPES, makeEvent, mergeEvents, toMin } from "@/lib/engine/events";
import { legMultiplier } from "@/lib/engine/schedule";
import type { Plan } from "@/lib/types";

const scenario = defaultScenario(assumptions);
const calm = buildProblem(assumptions, scenario);
const jam = buildProblem(assumptions, { ...scenario, events: [DEMO_EVENT] });
const plan = solve(calm, "cw2opt"); // the AI plan made in the morning, before anyone knew about the jam
const NOW = 13 * 60;
// the exact call scripts/freeze.ts makes for the slide numbers
const demo = reroute(jam, plan, NOW, [DEMO_EVENT]);

const servedIds = (p: Plan) => p.routes.flatMap((r) => r.stops.map((s) => s.orderId));

describe("events (assumed what-ifs)", () => {
  it("DEMO_EVENT is the Sheikh Zayed Road jam at 13:00 for 120 min", () => {
    expect(DEMO_EVENT).toEqual({ id: "szr_jam-780", type: "szr_jam", startMin: 780, endMin: 900 });
  });

  it("makeEvent accepts HH:MM or minutes and gives the same id", () => {
    expect(makeEvent("rain", "10:30", 60)).toEqual(makeEvent("rain", 630, 60));
    expect(toMin("08:05")).toBe(485);
  });

  it("multipliers come from assumptions.json; bikes feel 60% of the slow-down", () => {
    const s = eventInfo("sandstorm");
    expect(s.multiplier).toBe(assumptions.event_multipliers.sandstorm_citywide);
    expect(s.bikeMultiplier).toBeCloseTo(1 + (s.multiplier - 1) * assumptions.fallback.bike_traffic_sensitivity, 12);
    expect(eventInfo("urgent_surge").extraOrders).toBe(assumptions.orders.urgent_surge_orders);
    for (const t of EVENT_TYPES) expect(eventInfo(t).label.length).toBeGreaterThan(3);
  });

  it("the jam slows a corridor leg only while it is active (hand-checked factor)", () => {
    const szr = jam.orders.findIndex((o) => o.pointId === "marina") + 1; // Dubai Marina is on the SZR corridor
    const hour13 = assumptions.traffic_hour_multipliers["13"];
    expect(legMultiplier(jam, 0, szr, 800, "van")).toBeCloseTo(hour13 * assumptions.event_multipliers.sheikh_zayed_road_jam, 12);
    expect(legMultiplier(jam, 0, szr, 700, "van")).toBeCloseTo(assumptions.traffic_hour_multipliers["11"], 12);
  });

  it("mergeEvents drops duplicates by id", () => {
    expect(mergeEvents([DEMO_EVENT], [DEMO_EVENT, makeEvent("rain", "12:00")])).toHaveLength(2);
  });
});

describe("reroute (live re-routing)", () => {
  it("every order is served exactly once or listed unserved (nothing dropped silently)", () => {
    for (const p of [demo.before, demo.after]) {
      const ids = servedIds(p);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.length + p.unserved.length).toBe(demo.problem.orders.length);
    }
  });

  it("frozen stops keep their vehicle and exact times", () => {
    expect(demo.frozenStops).toBeGreaterThan(0);
    const orig = new Map(plan.routes.flatMap((r) => r.stops.map((s) => [s.orderId, { v: r.vehicleId, a: s.arrival, d: s.departure }] as const)));
    let checked = 0;
    for (const r of demo.after.routes) for (const s of r.stops) {
      const o = orig.get(s.orderId)!;
      if (o && o.a <= NOW) {
        expect(r.vehicleId).toBe(o.v);
        expect(s.arrival).toBe(o.a);
        expect(s.departure).toBe(o.d);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("capacity is respected and no extra route goes over duty", () => {
    const cap = new Map(demo.problem.vehicles.map((v) => [v.id, v.capacity]));
    for (const r of demo.after.routes) expect(r.load).toBeLessThanOrEqual(cap.get(r.vehicleId)!);
    const over = (p: Plan) => p.routes.filter((r) => r.overDuty).length;
    expect(over(demo.after)).toBeLessThanOrEqual(over(demo.before));
  });

  it("is deterministic", () => {
    const again = reroute(jam, plan, NOW, [DEMO_EVENT]);
    expect(again.after.routes).toEqual(demo.after.routes);
    expect(again.atRiskAfter).toBe(demo.atRiskAfter);
  });

  it("under the 13:00 SZR jam on the default seed: fewer at-risk deliveries and no more breaches", () => {
    expect(demo.atRiskBefore).toBeGreaterThan(0);
    expect(demo.atRiskAfter).toBeLessThanOrEqual(demo.atRiskBefore);
    expect(demo.breachesAfter).toBeLessThanOrEqual(demo.breachesBefore);
    expect(demo.after.meta.stub).toBe(false);
  });

  it("before = the morning plan re-timed (same stop order per vehicle)", () => {
    for (const r of plan.routes) {
      const b = demo.before.routes.find((x) => x.vehicleId === r.vehicleId)!;
      expect(b.stops.map((s) => s.orderId)).toEqual(r.stops.map((s) => s.orderId));
    }
  });

  it("urgent surge: new urgent orders are inserted, never dropped", () => {
    const surge = makeEvent("urgent_surge", NOW, 60);
    const r = reroute(calm, plan, NOW, [surge], { surgeCount: 10 });
    expect(r.newOrders).toHaveLength(10);
    expect(r.before.unserved).toEqual(expect.arrayContaining(r.newOrders));
    const placed = new Set(servedIds(r.after));
    for (const id of r.newOrders) expect(placed.has(id) || r.after.unserved.includes(id)).toBe(true);
    expect(r.newOrders.filter((id) => placed.has(id)).length).toBeGreaterThan(0);
    expect(r.atRiskAfter).toBeLessThanOrEqual(r.atRiskBefore);
    const u = r.problem.orders.find((o) => o.id === r.newOrders[0])!;
    expect(u.urgent).toBe(true);
    expect(u.windowStart).toBe(NOW);
    expect(u.windowEnd).toBe(NOW + assumptions.orders.urgent_window_min);
  });

  it("events that started earlier only act from now on (past legs are history)", () => {
    const { problem } = withLiveEvents(calm, 14 * 60, [DEMO_EVENT]);
    expect(problem.events[0].startMin).toBe(14 * 60);
    expect(withLiveEvents(calm, 16 * 60, [DEMO_EVENT]).problem.events).toHaveLength(0);
  });

  it("before the day starts nothing is frozen; after the day ends nothing changes", () => {
    const early = reroute(calm, plan, 7 * 60, [DEMO_EVENT]);
    expect(early.frozenStops).toBe(0);
    const late = reroute(calm, plan, 23 * 60, [makeEvent("rain", "23:00", 60)]);
    expect(late.remainingStops).toBe(0);
    expect(late.changedVehicles).toEqual([]);
  });
});
