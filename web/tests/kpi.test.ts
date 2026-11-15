import { describe, expect, it } from "vitest";
import { assumptions } from "@/lib/assumptions";
import { buildProblem, defaultScenario } from "@/lib/engine/problem";
import { solve } from "@/lib/engine/solve";
import {
  coefficientOfVariation, computeKpis, costBreakdown, explainKpi, failProbability, KPI_DEFAULTS, kpiAssumptions,
  pctChange, pctReduction, vehicleKpis, type KpiName,
} from "@/lib/engine/kpi";
import type { Order, Plan, Problem, Route } from "@/lib/types";
import { assumptionRows } from "@/components/assumptions/rows";

/**
 * Hand-checked mini problem (all values ASSUMED, from assumptions.json):
 * one van (0.85 AED/km, 0.24 kg CO2/km, 45 parcels, duty 08:00 to 17:00 = 540 min), three orders.
 *   A: window 08:00-10:00, not COD  -> on time, slack 60 min
 *   B: window 09:00-11:00, COD      -> on time, slack 10 min (at risk: < 15 min buffer)
 *   C: unserved                     -> SLA breach
 * Route: 20 km, 40 min driving, 08:00 to 10:00 (120 min duty), 3 parcels.
 */
const order = (id: string, windowStart: number, cod: boolean): Order => ({
  id, pointId: "p", lat: 25.1, lng: 55.2, weight: id === "A" ? 1 : 2, windowStart, windowEnd: windowStart + 120, urgent: false, cod, serviceMin: 4,
});
const mini = (evShare = 0, events: Problem["events"] = []): Problem => ({
  hub: { id: "hub", name: "Al Quoz hub", lat: 25.13, lng: 55.23, corridors: [] },
  orders: [order("A", 480, false), order("B", 540, true), order("C", 600, false)],
  vehicles: [{ id: "V01", type: "van", capacity: 45, costPerKm: 0.85, co2PerKm: 0.24, shiftStart: 480, shiftEnd: 1020 }],
  km: [[0]],
  assumptions,
  events,
  evShare,
});
const route: Route = {
  vehicleId: "V01",
  stops: [
    { orderIdx: 0, orderId: "A", arrival: 540, departure: 544, late: false, slack: 60 },
    { orderIdx: 1, orderId: "B", arrival: 650, departure: 654, late: false, slack: 10 },
  ],
  km: 20, driveMin: 40, startMin: 480, endMin: 600, load: 3, overDuty: false,
};
const plan: Plan = { algorithm: "baseline", routes: [route], unserved: ["C"], meta: { runMs: 7 } };

describe("KPI engine: hand-checked route", () => {
  const k = computeKpis(mini(), plan);

  it("distance, drive time and vehicles", () => {
    expect(k.km).toBe(20);
    expect(k.driveHours).toBeCloseTo(40 / 60, 9);
    expect(k.vehiclesUsed).toBe(1);
    expect(k.served).toBe(2);
    expect(k.orders).toBe(3);
  });

  it("AED cost = km cost + driver hours + failed attempts + SLA penalty", () => {
    const kmCost = 20 * 0.85; // 17.00
    const driver = 2 * 28; // 2 h duty x 28 AED/h = 56.00
    const failed = (0.08 + (0.08 + 0.03)) * 12; // A base 8%, B base + COD 3% = 0.19 x 12 = 2.28
    const sla = 1 * 15; // C unserved = 15.00
    const total = kmCost + driver + failed + sla; // 90.28
    expect(total).toBeCloseTo(90.28, 9);
    expect(k.totalCostAed).toBeCloseTo(total, 9);
    expect(k.costPerParcelAed).toBeCloseTo(total / 2, 9);
    expect(k.expectedFailedAttempts).toBeCloseTo(0.19, 9);
    const split = costBreakdown(mini(), plan);
    expect(split.kmCostAed + split.driverCostAed + split.failedAttemptCostAed + split.slaPenaltyAed).toBeCloseTo(split.totalAed, 9);
  });

  it("utilisation, on-time, breaches, at-risk", () => {
    expect(k.capacityUtilPct).toBeCloseTo((3 / 45) * 100, 9);
    expect(k.shiftUtilPct).toBeCloseTo((120 / 540) * 100, 9);
    expect(k.onTimePct).toBeCloseTo((2 / 3) * 100, 9);
    expect(k.slaBreaches).toBe(1);
    expect(k.atRisk).toBe(1);
  });

  it("CO2 = km x kg/km, blended by EV share", () => {
    expect(k.co2Kg).toBeCloseTo(20 * 0.24, 9); // 4.8 kg
    const half = computeKpis(mini(0.5), plan);
    expect(half.co2Kg).toBeCloseTo(20 * (0.24 * 0.5 + 0.07 * 0.5), 9); // 3.1 kg
    const v = vehicleKpis(mini(0.5), plan)[0];
    expect(v.co2Kg).toBeCloseTo(half.co2Kg, 9);
    expect(v.fuelLitres).toBeCloseTo((10 * 0.24) / 2.68, 9);
  });

  it("a single route has CV 0; sandstorm raises failed attempts", () => {
    expect(k.workloadCv).toBe(0);
    const storm = computeKpis(mini(0, [{ id: "s", type: "sandstorm", startMin: 480, endMin: 1200 }]), plan);
    expect(storm.expectedFailedAttempts).toBeCloseTo(0.19 + 2 * 0.04, 9);
  });

  it("empty routes do not count as used vehicles", () => {
    const empty: Route = { ...route, vehicleId: "V01", stops: [], km: 0, driveMin: 0, endMin: 480, load: 0 };
    const p2: Problem = { ...mini(), vehicles: [...mini().vehicles, { ...mini().vehicles[0], id: "V02" }] };
    const k2 = computeKpis(p2, { ...plan, routes: [route, { ...empty, vehicleId: "V02" }] });
    expect(k2.vehiclesUsed).toBe(1);
    expect(k2.capacityUtilPct).toBeCloseTo(k.capacityUtilPct, 9);
  });

  it("late and tight-window stops get the assumed extra failure risk", () => {
    const p = mini();
    expect(failProbability(p, 0, true)).toBeCloseTo(0.08 + 0.05, 9);
    const tight: Problem = { ...p, orders: [{ ...p.orders[0], windowEnd: p.orders[0].windowStart + 60 }, ...p.orders.slice(1)] };
    expect(failProbability(tight, 0, false)).toBeCloseTo(0.08 + 0.02, 9);
  });
});

describe("KPI engine: helpers", () => {
  it("CV of equal routes is 0 and of [1, 3] is 0.5", () => {
    expect(coefficientOfVariation([90, 90, 90])).toBe(0);
    expect(coefficientOfVariation([1, 3])).toBeCloseTo(0.5, 9);
    expect(coefficientOfVariation([])).toBe(0);
  });

  it("pctChange sign: AI lower is negative, reduction positive", () => {
    expect(pctChange(100, 80)).toBeCloseTo(-20, 9);
    expect(pctChange(100, 120)).toBeCloseTo(20, 9);
    expect(pctReduction(100, 80)).toBeCloseTo(20, 9);
    expect(pctChange(0, 5)).toBe(0);
  });

  it("every KPI has a tooltip", () => {
    const names: KpiName[] = [...(Object.keys(computeKpis(mini(), plan)) as KpiName[]), "runMs", "fuelLitres"];
    for (const n of names) expect(explainKpi(n).length).toBeGreaterThan(10);
  });

  it("assumptions.json holds the KPI inputs the engine uses", () => {
    expect(kpiAssumptions(mini())).toEqual(KPI_DEFAULTS);
  });

  it("every assumption has a status, reason, range and a real value (drawer rows)", () => {
    const rows = assumptionRows(assumptions);
    expect(rows.length).toBeGreaterThan(40);
    for (const r of rows) {
      expect(r.value).not.toBe("n/a");
      expect(r.reason.length).toBeGreaterThan(5);
      expect(r.range.length).toBeGreaterThan(0);
      expect(["assumed", "design choice"]).toContain(r.status);
    }
  });
});

describe("KPI engine: seeded demo (seed 2611)", () => {
  const scenario = defaultScenario(assumptions);

  it("same seed gives identical KPIs for baseline and AI", () => {
    for (const alg of ["baseline", "cw2opt"] as const) {
      const k1 = computeKpis(buildProblem(assumptions, scenario), solve(buildProblem(assumptions, scenario), alg));
      const k2 = computeKpis(buildProblem(assumptions, scenario), solve(buildProblem(assumptions, scenario), alg));
      expect(k1).toEqual(k2);
    }
  });

  it("baseline and AI are scored by the same definitions on the same orders", () => {
    const p = buildProblem(assumptions, scenario);
    for (const alg of ["baseline", "cw2opt"] as const) {
      const pl = solve(p, alg);
      const k = computeKpis(p, pl);
      expect(k.orders).toBe(300);
      expect(k.served + pl.unserved.length).toBe(300);
      expect(k.costPerParcelAed).toBeCloseTo(costBreakdown(p, pl).totalAed / k.served, 9);
      const rows = vehicleKpis(p, pl);
      expect(rows.reduce((s, r) => s + r.km, 0)).toBeCloseTo(k.km, 6);
      expect(rows.reduce((s, r) => s + r.co2Kg, 0)).toBeCloseTo(k.co2Kg, 6);
      expect(k.atRisk).toBeGreaterThanOrEqual(k.slaBreaches - pl.unserved.length);
    }
  });
});
