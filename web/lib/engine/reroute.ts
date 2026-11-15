import type { Kpis, Order, Plan, Problem, Route, Stop, TrafficEvent, Vehicle } from "@/lib/types";
import { buildKmMatrix } from "./geo";
import { generateOrders } from "./problem";
import { travelMin } from "./schedule";
import { computeKpis } from "./kpi";
import { mergeEvents } from "./events";
import { VEHICLE_FIXED_AED } from "./clarkeWright";
import { POINT_POOL } from "./points";

/**
 * LIVE RE-ROUTING at time `nowMin` (Karan's area, built by Yash after Karan left the group).
 *
 * 1. Freeze the past. For every route of the current plan, stops already reached at `nowMin` keep their exact
 *    times. A vehicle that is driving to its next stop (or waiting there for the window) is committed to that stop.
 *    The vehicle's position is its last frozen stop (or the hub if it has not left yet). Idle vehicles wait at the hub.
 * 2. Apply events. New events are merged with the problem's events (duplicates by id dropped). Everything before
 *    `nowMin` is history, so events only act on legs that depart at or after `nowMin` (an event that started earlier
 *    is applied from now on). Multipliers are the ASSUMED values in assumptions.json (see events.ts).
 * 3. Urgent orders. An urgent_surge event adds new urgent orders (window opens at max(event start, now)). They, and any
 *    order the current plan left unserved, are inserted at the cheapest feasible position (capacity is a hard rule).
 * 4. Re-optimise the remaining stops: 2-opt inside each route and relocate between routes (first improvement,
 *    fixed scan order, capped passes). Idle vehicles may be opened, at the same search-only fixed charge as the
 *    optimiser (VEHICLE_FIXED_AED). The search weighs lateness at 2x the SLA penalty and adds a small penalty for stops with under
 *    15 minutes of slack, so it also reduces "at risk" deliveries; these search-only weights never enter any KPI.
 * 5. Return `before` (the current plan re-evaluated under the events, nothing changed) and `after`.
 *
 * "At risk" here = remaining deliveries (not yet frozen) that are late or have under 15 minutes of slack, plus orders
 * with no vehicle (an unserved order is always at risk). Frozen stops cannot change, so they are not counted.
 * Never drops an order silently: anything that cannot be placed is listed in `after.unserved`.
 * Deterministic (no randomness). The GA warm start (solveGA) is not used yet; local search only.
 * Approximation (documented): a vehicle that is already driving back to the hub can be called back; we place it at its
 * last stop at `nowMin`.
 */

/** Search-only AED charge per remaining stop with under 15 minutes of slack (steers towards fewer at-risk stops). */
export const TIGHT_SLACK_PENALTY_AED = 6;
/**
 * Search-only weight on lateness: a late remaining stop costs 2x the SLA penalty inside the search. Tuned on the default
 * seed so that no tested event (SZR jam, sandstorm, rain, surge) ends with more breaches than before. KPIs still use 1x.
 */
export const LATE_SEARCH_FACTOR = 2;
const TIGHT_SLACK_MIN = 15;
const OVER_DUTY_PENALTY = 1_000;
const OVER_DUTY_PER_MIN = 20;
const EPS = 1e-6;

export interface RerouteOptions {
  /** urgent orders added by an urgent_surge event (default assumptions.orders.urgent_surge_orders) */
  surgeCount?: number;
  /** local-search passes (default 8) */
  maxPasses?: number;
}

export interface RerouteItem {
  orderId: string;
  orderIdx: number;
  /** area name of the order (from points.ts) */
  area: string;
  urgent: boolean;
  /** true for orders added by the surge */
  isNew: boolean;
  windowStart: number;
  windowEnd: number;
  vehicleBefore?: string;
  vehicleAfter?: string;
  etaBefore?: number;
  etaAfter?: number;
  riskBefore: boolean;
  riskAfter: boolean;
  lateBefore: boolean;
  lateAfter: boolean;
}

export interface RerouteResult {
  before: Plan;
  after: Plan;
  atRiskBefore: number;
  atRiskAfter: number;
  /** late remaining stops + unserved orders */
  breachesBefore: number;
  breachesAfter: number;
  kpisBefore: Kpis;
  kpisAfter: Kpis;
  /** the problem with events and any new urgent orders (use it to evaluate or draw both plans) */
  problem: Problem;
  nowMin: number;
  frozenStops: number;
  remainingStops: number;
  newOrders: string[];
  /** vehicles whose remaining stop sequence changed */
  changedVehicles: string[];
  /** orders that moved to another vehicle or were newly placed */
  movedOrders: string[];
  /** every remaining (not frozen) order with before/after details, for the SLA-at-risk list */
  items: RerouteItem[];
  stats: { passes: number; moves: number; inserted: number; runMs: number };
}

interface VState {
  vehicle: Vehicle;
  startMin: number;
  prefix: Stop[];
  prefixKm: number;
  prefixDrive: number;
  prefixLoad: number;
  /** node and departure time of the position the vehicle continues from */
  anchorNode: number;
  anchorTime: number;
  /** earliest time a NEW leg can start (max of anchor departure and now) */
  readyAt: number;
  seq: number[];
  idle: boolean;
}

/** Problem with merged events (clipped to start at `nowMin`) and, for a surge, the new urgent orders appended. */
export function withLiveEvents(p: Problem, nowMin: number, newEvents: TrafficEvent[], opts: RerouteOptions = {}): { problem: Problem; newOrderIdx: number[] } {
  const a = p.assumptions;
  const merged = mergeEvents(p.events, newEvents);
  const clipped = merged
    .filter((e) => e.endMin > nowMin)
    .map((e) => (e.startMin < nowMin ? { ...e, startMin: nowMin } : e));
  const surgeAlready = p.orders.some((o) => o.id.startsWith("U"));
  const surges = newEvents.filter((e) => e.type === "urgent_surge");
  let orders = p.orders;
  let km = p.km;
  const newOrderIdx: number[] = [];
  if (surges.length && !surgeAlready) {
    const count = Math.max(0, Math.round(opts.surgeCount ?? a.orders.urgent_surge_orders));
    const extra: Order[] = [];
    surges.forEach((e, k) => {
      const start = Math.max(e.startMin, nowMin);
      generateOrders(a, a.seed + 7 + k, count).forEach((o) => {
        extra.push({ ...o, id: `U${String(extra.length + 1).padStart(3, "0")}`, urgent: true, windowStart: start, windowEnd: start + a.orders.urgent_window_min });
      });
    });
    orders = [...p.orders, ...extra];
    extra.forEach((_, i) => newOrderIdx.push(p.orders.length + i));
    km = buildKmMatrix([p.hub, ...orders], a.fallback.haversine_detour_factor);
  }
  return { problem: { ...p, orders, km, events: clipped }, newOrderIdx };
}

/** Build the live state of each vehicle at `nowMin` from the current plan. */
function liveStates(P: Problem, current: Plan, nowMin: number): VState[] {
  const routeOf = new Map(current.routes.map((r) => [r.vehicleId, r]));
  return P.vehicles.map((v) => {
    const r = routeOf.get(v.id);
    if (!r || !r.stops.length) {
      const t = Math.max(v.shiftStart, nowMin);
      return { vehicle: v, startMin: t, prefix: [], prefixKm: 0, prefixDrive: 0, prefixLoad: 0, anchorNode: 0, anchorTime: t, readyAt: t, seq: [], idle: true };
    }
    const stops = r.stops;
    let f = stops.filter((s) => s.arrival <= nowMin).length;
    // stops are in time order, so the first f stops are the reached ones; commit to the stop being driven to (or waited at)
    const prevDep = f === 0 ? r.startMin : stops[f - 1].departure;
    if (f < stops.length && prevDep < nowMin) f++;
    const prefix = stops.slice(0, f);
    let km = 0, drive = 0, load = 0, node = 0, t = r.startMin;
    for (const s of prefix) {
      const next = s.orderIdx + 1;
      km += P.km[node][next];
      drive += travelMin(P, node, next, t, v.type);
      load += P.orders[s.orderIdx].weight;
      node = next;
      t = s.departure;
    }
    const anchorTime = f === 0 ? r.startMin : prefix[f - 1].departure;
    return {
      vehicle: v, startMin: r.startMin, prefix, prefixKm: km, prefixDrive: drive, prefixLoad: load,
      anchorNode: node, anchorTime, readyAt: Math.max(anchorTime, nowMin), seq: stops.slice(f).map((s) => s.orderIdx), idle: false,
    };
  });
}

/** Evaluate one vehicle: frozen prefix + remaining sequence (same timing rules as schedule.evaluateRoute). */
function buildRoute(P: Problem, s: VState, seq: number[]): Route {
  const v = s.vehicle;
  const service = P.assumptions.vehicles[v.type].service_time_min;
  let t = seq.length ? s.readyAt : s.anchorTime;
  let node = s.anchorNode;
  let km = s.prefixKm;
  let drive = s.prefixDrive;
  let load = s.prefixLoad;
  const stops: Stop[] = [...s.prefix];
  for (const idx of seq) {
    const o = P.orders[idx];
    const next = idx + 1;
    const tm = travelMin(P, node, next, t, v.type);
    km += P.km[node][next];
    drive += tm;
    let arrival = t + tm;
    if (arrival < o.windowStart) arrival = o.windowStart;
    const departure = arrival + service;
    stops.push({ orderIdx: idx, orderId: o.id, arrival, departure, late: arrival > o.windowEnd, slack: o.windowEnd - arrival });
    load += o.weight;
    t = departure;
    node = next;
  }
  if (node !== 0) {
    const back = travelMin(P, node, 0, t, v.type);
    km += P.km[node][0];
    drive += back;
    t += back;
  }
  return { vehicleId: v.id, stops, km, driveMin: drive, startMin: s.startMin, endMin: stops.length ? t : s.startMin, load, overDuty: stops.length > 0 && t > v.shiftEnd };
}

/** Search cost (AED): KPI cost terms + search-only penalties. Prefix costs are identical across candidates. */
function cost(P: Problem, s: VState, seq: number[]): number {
  if (!seq.length && !s.prefix.length) return 0;
  const r = buildRoute(P, s, seq);
  const c = P.assumptions.costs;
  const v = s.vehicle;
  let total = r.km * v.costPerKm + ((r.endMin - r.startMin) / 60) * c.driver_cost_per_hour_aed;
  if (s.idle && seq.length) total += VEHICLE_FIXED_AED;
  for (let i = s.prefix.length; i < r.stops.length; i++) {
    const st = r.stops[i];
    if (st.late) total += c.sla_penalty_aed * LATE_SEARCH_FACTOR;
    else if (st.slack < TIGHT_SLACK_MIN) total += TIGHT_SLACK_PENALTY_AED;
  }
  if (r.overDuty) total += OVER_DUTY_PENALTY + (r.endMin - v.shiftEnd) * OVER_DUTY_PER_MIN;
  if (r.load > v.capacity) total += 1_000_000;
  return total;
}

function toPlan(P: Problem, states: VState[], algorithm: Plan["algorithm"], unserved: number[], note: string, runMs: number): Plan {
  const routes = states.map((s) => buildRoute(P, s, s.seq)).filter((r) => r.stops.length);
  return { algorithm, routes, unserved: unserved.map((i) => P.orders[i].id), meta: { runMs, stub: false, note } };
}

function riskCount(plan: Plan, frozen: Set<string>): { atRisk: number; breaches: number } {
  let atRisk = plan.unserved.length;
  let breaches = plan.unserved.length;
  for (const r of plan.routes) for (const s of r.stops) {
    if (frozen.has(s.orderId)) continue;
    if (s.late) { atRisk++; breaches++; } else if (s.slack < TIGHT_SLACK_MIN) atRisk++;
  }
  return { atRisk, breaches };
}

export function reroute(p: Problem, current: Plan, nowMin: number, newEvents: TrafficEvent[], opts: RerouteOptions = {}): RerouteResult {
  const t0 = performance.now();
  const { problem: P, newOrderIdx } = withLiveEvents(p, nowMin, newEvents, opts);
  const idxById = new Map(P.orders.map((o, i) => [o.id, i]));

  // BEFORE: same sequences, re-timed under the events; new orders and old unserved orders have no vehicle
  const base = liveStates(P, current, nowMin);
  const frozen = new Set(base.flatMap((s) => s.prefix.map((st) => st.orderId)));
  const pending = [
    ...current.unserved.map((id) => idxById.get(id)).filter((i): i is number => i !== undefined),
    ...newOrderIdx,
  ];
  const before = toPlan(P, base, current.algorithm, pending, `Current plan re-timed at ${hhmm(nowMin)} under the events (no changes)`, 0);

  // AFTER: copy, insert pending orders, then local search on the remaining stops
  const st: VState[] = base.map((s) => ({ ...s, seq: [...s.seq] }));
  const costs = st.map((s) => cost(P, s, s.seq));
  const loads = st.map((s) => s.prefixLoad + s.seq.reduce((a, i) => a + P.orders[i].weight, 0));
  const unserved: number[] = [];
  let inserted = 0;
  const order = [...pending].sort((x, y) => P.orders[x].windowEnd - P.orders[y].windowEnd || x - y);
  for (const o of order) {
    const w = P.orders[o].weight;
    let bk = -1, bpos = -1, bd = Infinity, bc = 0;
    st.forEach((s, k) => {
      if (loads[k] + w > s.vehicle.capacity) return;
      for (let pos = 0; pos <= s.seq.length; pos++) {
        const cand = [...s.seq.slice(0, pos), o, ...s.seq.slice(pos)];
        const c = cost(P, s, cand);
        if (c - costs[k] < bd - EPS) { bd = c - costs[k]; bk = k; bpos = pos; bc = c; }
      }
    });
    if (bk < 0) { unserved.push(o); continue; }
    st[bk].seq.splice(bpos, 0, o);
    costs[bk] = bc;
    loads[bk] += w;
    inserted++;
  }

  const maxPasses = opts.maxPasses ?? 8;
  let passes = 0, moves = 0;
  while (passes < maxPasses) {
    passes++;
    let changed = false;
    // 2-opt inside each route (remaining part only)
    st.forEach((s, k) => {
      let improved = true;
      while (improved) {
        improved = false;
        const n = s.seq.length;
        for (let i = 0; i < n - 1 && !improved; i++) {
          for (let j = i + 1; j < n && !improved; j++) {
            const cand = [...s.seq.slice(0, i), ...s.seq.slice(i, j + 1).reverse(), ...s.seq.slice(j + 1)];
            const c = cost(P, s, cand);
            if (c < costs[k] - EPS) { s.seq = cand; costs[k] = c; improved = true; changed = true; moves++; }
          }
        }
      }
    });
    // relocate each remaining order to its best position anywhere (fixed order: by order index)
    const all = st.flatMap((s, k) => s.seq.map((o) => [o, k] as const)).sort((x, y) => x[0] - y[0]);
    for (const [o] of all) {
      const a = st.findIndex((s) => s.seq.includes(o));
      const sa = st[a];
      const i = sa.seq.indexOf(o);
      const without = [...sa.seq.slice(0, i), ...sa.seq.slice(i + 1)];
      const costA = cost(P, sa, without);
      const w = P.orders[o].weight;
      let bk = -1, bseq: number[] = [], bnew = 0, bd = -EPS;
      st.forEach((s, k) => {
        if (k !== a && loads[k] + w > s.vehicle.capacity) return;
        const baseSeq = k === a ? without : s.seq;
        for (let pos = 0; pos <= baseSeq.length; pos++) {
          if (k === a && pos === i) continue;
          const cand = [...baseSeq.slice(0, pos), o, ...baseSeq.slice(pos)];
          const c = cost(P, s, cand);
          const d = k === a ? c - costs[a] : costA + c - costs[a] - costs[k];
          if (d < bd) { bd = d; bk = k; bseq = cand; bnew = c; }
        }
      });
      if (bk < 0) continue;
      if (bk === a) { sa.seq = bseq; costs[a] = bnew; }
      else {
        sa.seq = without; costs[a] = costA; loads[a] -= w;
        st[bk].seq = bseq; costs[bk] = bnew; loads[bk] += w;
      }
      changed = true;
      moves++;
    }
    if (!changed) break;
  }

  const runMs = performance.now() - t0;
  const after = toPlan(P, st, current.algorithm, unserved,
    `Re-routed at ${hhmm(nowMin)}: ${inserted} orders inserted, ${moves} improving moves in ${passes} passes (2-opt + relocate)`, runMs);
  before.meta.runMs = 0;

  const rb = riskCount(before, frozen);
  const ra = riskCount(after, frozen);

  // per-order details for the remaining orders
  const info = (plan: Plan) => {
    const m = new Map<string, { v: string; s: Stop }>();
    plan.routes.forEach((r) => r.stops.forEach((s) => m.set(s.orderId, { v: r.vehicleId, s })));
    return m;
  };
  const ib = info(before), ia = info(after);
  const remainingIds = new Set<string>([
    ...base.flatMap((s) => s.seq.map((i) => P.orders[i].id)),
    ...pending.map((i) => P.orders[i].id),
  ]);
  const newIds = new Set(newOrderIdx.map((i) => P.orders[i].id));
  const items: RerouteItem[] = [...remainingIds].map((id) => {
    const idx = idxById.get(id)!;
    const o = P.orders[idx];
    const b = ib.get(id), a = ia.get(id);
    const risky = (x?: { s: Stop }) => !x || x.s.late || x.s.slack < TIGHT_SLACK_MIN;
    return {
      orderId: id, orderIdx: idx, area: areaName(o.pointId), urgent: o.urgent, isNew: newIds.has(id),
      windowStart: o.windowStart, windowEnd: o.windowEnd,
      vehicleBefore: b?.v, vehicleAfter: a?.v, etaBefore: b?.s.arrival, etaAfter: a?.s.arrival,
      riskBefore: risky(b), riskAfter: risky(a), lateBefore: !b || b.s.late, lateAfter: !a || a.s.late,
    };
  }).sort((x, y) => x.windowEnd - y.windowEnd || x.orderIdx - y.orderIdx);

  const changedVehicles = st.filter((s, k) => s.seq.join(",") !== base[k].seq.join(",")).map((s) => s.vehicle.id);
  const movedOrders = items.filter((it) => it.vehicleAfter !== it.vehicleBefore).map((it) => it.orderId);

  return {
    before, after,
    atRiskBefore: rb.atRisk, atRiskAfter: ra.atRisk,
    breachesBefore: rb.breaches, breachesAfter: ra.breaches,
    kpisBefore: computeKpis(P, before), kpisAfter: computeKpis(P, after),
    problem: P, nowMin,
    frozenStops: frozen.size,
    remainingStops: remainingIds.size,
    newOrders: [...newIds],
    changedVehicles, movedOrders, items,
    stats: { passes, moves, inserted, runMs },
  };
}

const hhmm = (min: number) => {
  const m = Math.max(0, Math.round(min));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

const AREA = new Map(POINT_POOL.map((pt) => [pt.id, pt.name] as const));
const areaName = (pointId: string) => AREA.get(pointId) ?? pointId;
