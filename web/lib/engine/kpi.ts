import type { Kpis, Plan, Problem, Route, VehicleType } from "@/lib/types";

/**
 * KPI engine (owner: Advait). THE single definition of every number shown on pages, slides and scripts.
 * Baseline and AI plans are scored by exactly the same function on the same Problem (same seeded orders).
 * All inputs are ASSUMED (data_seed/assumptions.json); all results are SIMULATED.
 * Formulas are listed in docs/06_assumptions_table.md ("KPI definitions").
 *
 * "Used" vehicle = a route with at least one stop. Unused vehicles do not dilute utilisation or fairness.
 */

/** Optional assumption blocks read by the KPI engine (extra keys in assumptions.json; types.ts stays unchanged). */
interface KpiAssumptions {
  /** minutes of slack below which an on-time stop counts as "at risk" */
  risk_buffer_min: number;
  /** extra failed-attempt probability when the stop is late (customer may no longer be home) */
  late_extra: number;
  /** extra failed-attempt probability for cash-on-delivery stops */
  cod_extra: number;
  /** extra failed-attempt probability for urgent / tight-window (60 min) orders */
  tight_window_extra: number;
  /** kg CO2 per litre of fuel, used only to show litres */
  co2_kg_per_litre: Record<VehicleType, number>;
}

export const KPI_DEFAULTS: KpiAssumptions = {
  risk_buffer_min: 15,
  late_extra: 0.05,
  cod_extra: 0.03,
  tight_window_extra: 0.02,
  co2_kg_per_litre: { van: 2.68, bike: 2.31 },
};

export function kpiAssumptions(p: Problem): KpiAssumptions {
  const raw = p.assumptions as unknown as {
    sla?: { risk_buffer_min?: number };
    failed_attempt?: { late_extra?: number; cod_extra?: number; tight_window_extra?: number };
    fuel?: { co2_kg_per_litre?: Partial<Record<VehicleType, number>> };
  };
  return {
    risk_buffer_min: raw.sla?.risk_buffer_min ?? KPI_DEFAULTS.risk_buffer_min,
    late_extra: raw.failed_attempt?.late_extra ?? KPI_DEFAULTS.late_extra,
    cod_extra: raw.failed_attempt?.cod_extra ?? KPI_DEFAULTS.cod_extra,
    tight_window_extra: raw.failed_attempt?.tight_window_extra ?? KPI_DEFAULTS.tight_window_extra,
    co2_kg_per_litre: { ...KPI_DEFAULTS.co2_kg_per_litre, ...(raw.fuel?.co2_kg_per_litre ?? {}) },
  };
}

/** CO2 factor (kg/km) for one vehicle type at a given EV share: fuel x (1 - ev) + electric x ev. */
export function co2PerKm(p: Problem, type: VehicleType, fuelFactor: number, evShare = p.evShare): number {
  const ev = p.assumptions.vehicles[type].co2_kg_per_km_electric;
  return fuelFactor * (1 - evShare) + ev * evShare;
}

/** Failed-first-attempt probability of one stop (capped at 1). */
export function failProbability(p: Problem, orderIdx: number, late: boolean): number {
  const a = p.assumptions.failed_attempt;
  const k = kpiAssumptions(p);
  const o = p.orders[orderIdx];
  const sandstorm = p.events.some((e) => e.type === "sandstorm");
  const tight = o.windowEnd - o.windowStart <= p.assumptions.orders.urgent_window_min;
  const prob = a.base_probability + (sandstorm ? a.sandstorm_extra : 0) + (late ? k.late_extra : 0) + (o.cod ? k.cod_extra : 0) + (tight ? k.tight_window_extra : 0);
  return Math.min(1, prob);
}

/** Population coefficient of variation (sd / mean). Equal values give 0. */
export function coefficientOfVariation(xs: number[]): number {
  if (!xs.length) return 0;
  const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
  if (!mean) return 0;
  const sd = Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length);
  return sd / mean;
}

const usedRoutes = (plan: Plan): Route[] => plan.routes.filter((r) => r.stops.length > 0);

/**
 * computeKpis(problem, plan). Definitions (identical for every algorithm):
 * - km                = sum of route km (hub -> stops -> hub)
 * - driveHours        = sum of route drive minutes / 60 (traffic and event multipliers included)
 * - vehiclesUsed      = routes with at least one stop
 * - totalCostAed      = km x vehicle AED/km + paid duty hours (route end - start) x driver AED/h
 *                       + expected failed attempts x failed-delivery AED + SLA breaches x SLA penalty AED
 * - costPerParcelAed  = totalCostAed / orders served
 * - capacityUtilPct   = parcels loaded / capacity of used vehicles
 * - shiftUtilPct      = route duty minutes / max duty minutes of used vehicles
 * - onTimePct         = stops arriving by window end / all orders (unserved = not on time)
 * - slaBreaches       = late stops + unserved orders
 * - atRisk            = late stops + on-time stops with slack under the risk buffer (assumed 15 min)
 * - expectedFailedAttempts = sum over stops of failProbability (base + sandstorm + late + COD + tight window)
 * - co2Kg             = sum of route km x (fuel factor x (1 - EV share) + electric factor x EV share)
 * - workloadCv        = coefficient of variation of route durations of used vehicles (lower = fairer)
 */
export function computeKpis(p: Problem, plan: Plan): Kpis {
  const a = p.assumptions;
  const k = kpiAssumptions(p);
  const vehicleById = new Map(p.vehicles.map((v) => [v.id, v]));
  let km = 0, driveMin = 0, dutyMin = 0, load = 0, capacity = 0, shiftMin = 0, co2 = 0, kmCost = 0;
  let served = 0, late = 0, atRisk = 0, expectedFailed = 0;
  const durations: number[] = [];
  for (const r of usedRoutes(plan)) {
    const v = vehicleById.get(r.vehicleId);
    if (!v) throw new Error(`computeKpis: unknown vehicle ${r.vehicleId}`);
    const dur = r.endMin - r.startMin;
    km += r.km;
    driveMin += r.driveMin;
    dutyMin += dur;
    durations.push(dur);
    load += r.load;
    capacity += v.capacity;
    shiftMin += v.shiftEnd - v.shiftStart;
    co2 += r.km * co2PerKm(p, v.type, v.co2PerKm);
    kmCost += r.km * v.costPerKm;
    for (const s of r.stops) {
      served++;
      if (s.late) late++;
      if (s.late || s.slack < k.risk_buffer_min) atRisk++;
      expectedFailed += failProbability(p, s.orderIdx, s.late);
    }
  }
  const breaches = late + plan.unserved.length;
  const driverCost = (dutyMin / 60) * a.costs.driver_cost_per_hour_aed;
  const total = kmCost + driverCost + expectedFailed * a.costs.failed_delivery_cost_aed + breaches * a.costs.sla_penalty_aed;
  return {
    orders: p.orders.length,
    served,
    vehiclesUsed: durations.length,
    km,
    driveHours: driveMin / 60,
    totalCostAed: total,
    costPerParcelAed: served ? total / served : 0,
    capacityUtilPct: capacity ? (load / capacity) * 100 : 0,
    shiftUtilPct: shiftMin ? (dutyMin / shiftMin) * 100 : 0,
    onTimePct: p.orders.length ? ((served - late) / p.orders.length) * 100 : 0,
    slaBreaches: breaches,
    atRisk,
    expectedFailedAttempts: expectedFailed,
    co2Kg: co2,
    workloadCv: coefficientOfVariation(durations),
  };
}

/** Cost split of totalCostAed (same formula as computeKpis), for charts and the hand check. */
export function costBreakdown(p: Problem, plan: Plan) {
  const a = p.assumptions;
  const kp = computeKpis(p, plan);
  const vehicleById = new Map(p.vehicles.map((v) => [v.id, v]));
  let kmCost = 0, dutyMin = 0;
  for (const r of usedRoutes(plan)) {
    kmCost += r.km * vehicleById.get(r.vehicleId)!.costPerKm;
    dutyMin += r.endMin - r.startMin;
  }
  return {
    kmCostAed: kmCost,
    driverCostAed: (dutyMin / 60) * a.costs.driver_cost_per_hour_aed,
    failedAttemptCostAed: kp.expectedFailedAttempts * a.costs.failed_delivery_cost_aed,
    slaPenaltyAed: kp.slaBreaches * a.costs.sla_penalty_aed,
    totalAed: kp.totalCostAed,
  };
}

export interface VehicleKpi {
  vehicleId: string;
  type: VehicleType;
  stops: number;
  km: number;
  dutyMin: number;
  capacityUtilPct: number;
  shiftUtilPct: number;
  co2Kg: number;
  fuelLitres: number;
  late: number;
}

/** Per-vehicle rows for the /fleet page (same factors as computeKpis). Unused vehicles get zero rows. */
export function vehicleKpis(p: Problem, plan: Plan): VehicleKpi[] {
  const k = kpiAssumptions(p);
  const byId = new Map(plan.routes.map((r) => [r.vehicleId, r]));
  return p.vehicles.map((v) => {
    const r = byId.get(v.id);
    const km = r?.km ?? 0;
    const dutyMin = r && r.stops.length ? r.endMin - r.startMin : 0;
    const fuelKm = km * (1 - p.evShare);
    return {
      vehicleId: v.id,
      type: v.type,
      stops: r?.stops.length ?? 0,
      km,
      dutyMin,
      capacityUtilPct: r ? (r.load / v.capacity) * 100 : 0,
      shiftUtilPct: (dutyMin / (v.shiftEnd - v.shiftStart)) * 100,
      co2Kg: km * co2PerKm(p, v.type, v.co2PerKm),
      fuelLitres: (fuelKm * v.co2PerKm) / k.co2_kg_per_litre[v.type],
      late: r?.stops.filter((s) => s.late).length ?? 0,
    };
  });
}

/** Litres of fuel burnt by the fuel (non-EV) share of the fleet. */
export function fuelLitres(p: Problem, plan: Plan): number {
  return vehicleKpis(p, plan).reduce((s, v) => s + v.fuelLitres, 0);
}

/** Solver run time in ms (measured by the algorithm, stored in plan.meta). */
export function runTimeMs(plan: Plan): number {
  return plan.meta.runMs;
}

/** Relative change in % from base to ai. Negative = AI lower. base 0 gives 0. */
export function pctChange(base: number, ai: number): number {
  return base ? ((ai - base) / base) * 100 : 0;
}

/** Reduction in % (positive = AI lower), the form used on slides ("-12% cost" is shown as 12). */
export function pctReduction(base: number, ai: number): number {
  return -pctChange(base, ai);
}

/** true when a lower value is the better outcome (for colouring deltas). */
export function lowerIsBetter(name: KpiName): boolean {
  return !["served", "onTimePct", "capacityUtilPct", "shiftUtilPct", "orders"].includes(name);
}

export type KpiName = keyof Kpis | "runMs" | "fuelLitres";

const EXPLAIN: Record<KpiName, string> = {
  orders: "Orders in the seeded scenario (same for baseline and AI).",
  served: "Orders placed on a route; the rest are unserved and count as SLA breaches.",
  vehiclesUsed: "Vans and bikes with at least one stop.",
  km: "Total road distance, hub to stops and back (simulated).",
  driveHours: "Hours spent driving, including assumed traffic and event slow-downs.",
  totalCostAed: "km cost + driver hours + expected failed-attempt cost + SLA penalties (all AED rates assumed).",
  costPerParcelAed: "Total AED cost divided by orders served.",
  capacityUtilPct: "Parcels loaded as a share of the capacity of vehicles used.",
  shiftUtilPct: "Duty minutes as a share of the maximum duty time of vehicles used.",
  onTimePct: "Share of all orders delivered inside their time window (unserved count as not on time).",
  slaBreaches: "Late deliveries plus unserved orders.",
  atRisk: "Late deliveries plus deliveries with less than 15 minutes of slack (assumed buffer).",
  expectedFailedAttempts: "Sum of assumed failure probabilities per stop (higher if late, COD, tight window or sandstorm).",
  co2Kg: "km x assumed kg CO2 per km for each vehicle type, blended by the EV share.",
  workloadCv: "Spread of route durations (standard deviation / mean). Lower = fairer workload between drivers.",
  runMs: "Time the solver took in the browser, in milliseconds.",
  fuelLitres: "Fuel burnt by the non-electric share: CO2 / assumed kg CO2 per litre.",
};

/** Plain-English one-liner for tooltips. */
export function explainKpi(name: KpiName): string {
  return EXPLAIN[name];
}
