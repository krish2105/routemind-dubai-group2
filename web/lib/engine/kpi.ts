import type { Kpis, Plan, Problem } from "@/lib/types";

/**
 * KPI v0: identical definitions for baseline and AI. Owner: Advait.
 * To do (Advait): verify each formula against docs/06_assumptions_table.md, add EV-share CO2 split per vehicle,
 * expected failed attempts with sandstorm extra, tests with hand-calculated values.
 */
export function computeKpis(p: Problem, plan: Plan): Kpis {
  const a = p.assumptions;
  const vehicleById = new Map(p.vehicles.map((v) => [v.id, v]));
  let km = 0, driveMin = 0, durationMin = 0, load = 0, capacity = 0, shiftMin = 0, co2 = 0, vehicleCost = 0;
  let served = 0, late = 0, atRisk = 0;
  const durations: number[] = [];
  for (const r of plan.routes) {
    const v = vehicleById.get(r.vehicleId)!;
    km += r.km;
    driveMin += r.driveMin;
    const dur = r.endMin - r.startMin;
    durationMin += dur;
    durations.push(dur);
    load += r.load;
    capacity += v.capacity;
    shiftMin += v.shiftEnd - v.shiftStart;
    const ev = a.vehicles[v.type].co2_kg_per_km_electric;
    co2 += r.km * (v.co2PerKm * (1 - p.evShare) + ev * p.evShare);
    vehicleCost += r.km * v.costPerKm;
    for (const s of r.stops) {
      served++;
      if (s.late) late++;
      if (s.late || s.slack < 15) atRisk++;
    }
  }
  const unserved = plan.unserved.length;
  const breaches = late + unserved;
  const sandstorm = p.events.some((e) => e.type === "sandstorm");
  const failProb = a.failed_attempt.base_probability + (sandstorm ? a.failed_attempt.sandstorm_extra : 0);
  const expectedFailed = served * failProb;
  const driverCost = (durationMin / 60) * a.costs.driver_cost_per_hour_aed;
  const total = vehicleCost + driverCost + expectedFailed * a.costs.failed_delivery_cost_aed + breaches * a.costs.sla_penalty_aed;
  const mean = durations.length ? durations.reduce((s, d) => s + d, 0) / durations.length : 0;
  const sd = durations.length ? Math.sqrt(durations.reduce((s, d) => s + (d - mean) ** 2, 0) / durations.length) : 0;
  return {
    orders: p.orders.length,
    served,
    vehiclesUsed: plan.routes.length,
    km,
    driveHours: driveMin / 60,
    totalCostAed: total,
    costPerParcelAed: served ? total / served : 0,
    capacityUtilPct: capacity ? (load / capacity) * 100 : 0,
    shiftUtilPct: shiftMin ? (durationMin / shiftMin) * 100 : 0,
    onTimePct: p.orders.length ? ((served - late) / p.orders.length) * 100 : 0,
    slaBreaches: breaches,
    atRisk,
    expectedFailedAttempts: expectedFailed,
    co2Kg: co2,
    workloadCv: mean ? sd / mean : 0,
  };
}

export function pctChange(base: number, ai: number): number {
  return base ? ((ai - base) / base) * 100 : 0;
}
