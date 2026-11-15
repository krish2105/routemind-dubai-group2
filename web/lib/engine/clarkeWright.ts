import type { Plan, Problem, Vehicle, VehicleType } from "@/lib/types";
import { evaluateRoute } from "./schedule";
import { improveRoutes, seqCost, type SearchOptions, type WorkRoute } from "./localSearch";

/**
 * AI PLAN: Clarke-Wright savings construction + local search (2-opt, relocate, swap).
 * Owner: Krishna.
 *
 * 1. Savings, per vehicle class. Start with one route per order. For every pair (i, j) the saving of serving them
 *    on one trip is s(i,j) = d(hub,i) + d(hub,j) - d(i,j). Pairs are merged in order of saving (end of one route
 *    to the start of another) only if the merged route fits a real vehicle of that class: capacity, duty hours
 *    and NO late stops (checked with evaluateRoute on the class's 08:00 and 11:00 shift templates).
 *    Vans are built first (big capacity); routes that fit a bike are later given to a bike if one is free and cheaper.
 * 2. Assignment. Each route goes to the cheapest free real vehicle that can run it (cost = same rules as KPIs).
 *    Routes left over when the fleet is full are dissolved and their orders inserted at the cheapest position
 *    in existing routes (lateness allowed here but counted, capacity never broken).
 * 3. Local search on the whole plan (see localSearch.ts).
 * Every order is served if any vehicle can take it; anything impossible is listed in `unserved`, never hidden.
 * Deterministic: no randomness, fixed tie-breaks by index.
 */

interface Template { type: VehicleType; capacity: number; vehicle: Vehicle }

function templates(p: Problem, type: VehicleType): Template[] {
  const seen = new Set<number>();
  const out: Template[] = [];
  for (const v of p.vehicles) {
    if (v.type !== type || seen.has(v.shiftStart)) continue;
    seen.add(v.shiftStart);
    out.push({ type, capacity: v.capacity, vehicle: v });
  }
  return out;
}

/** A route is "clean" on a vehicle if it fits capacity, ends inside duty and has no late stop. */
function cleanOn(p: Problem, v: Vehicle, seq: number[]): boolean {
  const r = evaluateRoute(p, v, seq);
  return r.load <= v.capacity && !r.overDuty && r.stops.every((s) => !s.late);
}

/** Clarke-Wright (parallel savings) for one vehicle class over the given order indices. */
function savingsRoutes(p: Problem, orderIdxs: number[], tpls: Template[]): number[][] {
  if (!tpls.length) return orderIdxs.map((i) => [i]);
  const cap = Math.max(...tpls.map((t) => t.capacity));
  const fits = (seq: number[]) => tpls.some((t) => cleanOn(p, t.vehicle, seq));

  const routeOf = new Map<number, number>(); // order -> route id
  const routes = new Map<number, number[]>();
  const loads = new Map<number, number>();
  orderIdxs.forEach((o, k) => { routeOf.set(o, k); routes.set(k, [o]); loads.set(k, p.orders[o].weight); });

  const savings: { i: number; j: number; s: number }[] = [];
  for (let a = 0; a < orderIdxs.length; a++) {
    for (let b = a + 1; b < orderIdxs.length; b++) {
      const i = orderIdxs[a], j = orderIdxs[b];
      const s = p.km[0][i + 1] + p.km[0][j + 1] - p.km[i + 1][j + 1];
      if (s > 0) savings.push({ i, j, s });
    }
  }
  savings.sort((x, y) => y.s - x.s || x.i - y.i || x.j - y.j);

  for (const { i, j } of savings) {
    const ri = routeOf.get(i)!, rj = routeOf.get(j)!;
    if (ri === rj) continue;
    if (loads.get(ri)! + loads.get(rj)! > cap) continue;
    const A = routes.get(ri)!, B = routes.get(rj)!;
    // try both joins where i and j are route ends: ...i + j...  or  ...j + i...
    const options: number[][] = [];
    if (A[A.length - 1] === i && B[0] === j) options.push([...A, ...B]);
    if (B[B.length - 1] === j && A[0] === i) options.push([...B, ...A]);
    for (const merged of options) {
      if (!fits(merged)) continue;
      routes.set(ri, merged);
      routes.delete(rj);
      loads.set(ri, loads.get(ri)! + loads.get(rj)!);
      for (const o of B) routeOf.set(o, ri);
      for (const o of A) routeOf.set(o, ri);
      break;
    }
  }
  return [...routes.values()];
}

/**
 * Search-only charge per vehicle used (AED): an ASSUMED daily fixed cost of putting one more vehicle and driver
 * on the road (the KPI engine only charges driver time actually on route, so without this the search would
 * happily spread work over many short trips). Not added to any KPI.
 */
export const VEHICLE_FIXED_AED = 150;

/**
 * Route-level savings: join whole routes (A then B) when the joined trip still fits a vehicle cleanly and the
 * cost (including the per-vehicle charge) goes down. Repeats the best join until none helps.
 */
function mergeRoutes(p: Problem, routes: number[][], tpls: Template[], fixed: number): number[][] {
  const best = (seq: number[]) => {
    let c = Infinity;
    for (const t of tpls) if (cleanOn(p, t.vehicle, seq)) c = Math.min(c, seqCost(p, t.vehicle, seq, fixed));
    return c;
  };
  let rs = routes.map((seq) => ({ seq, cost: best(seq) }));
  for (;;) {
    let bi = -1, bj = -1, bSeq: number[] = [], bCost = 0, bDelta = -1e-6;
    for (let i = 0; i < rs.length; i++) {
      for (let j = 0; j < rs.length; j++) {
        if (i === j) continue;
        const seq = [...rs[i].seq, ...rs[j].seq];
        const c = best(seq);
        if (!Number.isFinite(c)) continue;
        const d = c - rs[i].cost - rs[j].cost;
        if (d < bDelta) { bDelta = d; bi = i; bj = j; bSeq = seq; bCost = c; }
      }
    }
    if (bi < 0) break;
    const next = rs.filter((_, k) => k !== bi && k !== bj);
    next.push({ seq: bSeq, cost: bCost });
    rs = next;
  }
  return rs.map((r) => r.seq);
}

export function solveCW2opt(p: Problem, opts: SearchOptions = {}): Plan {
  const t0 = performance.now();
  const all = p.orders.map((_, i) => i);
  const vanT = templates(p, "van");
  const bikeT = templates(p, "bike");

  // 1. savings per class: vans take everything (largest capacity); bike-sized routes can go to bikes in step 2
  const fixed = opts.vehicleFixedAed ?? VEHICLE_FIXED_AED;
  const savings = savingsRoutes(p, all, vanT.length ? vanT : bikeT);
  let built = mergeRoutes(p, savings, [...vanT, ...bikeT], fixed);

  // 2. assign: biggest routes first, each to the cheapest free vehicle that runs it cleanly
  built = built.sort((a, b) => b.length - a.length || a[0] - b[0]);
  const free = [...p.vehicles];
  const work: WorkRoute[] = [];
  const leftovers: number[] = [];
  for (const seq of built) {
    let best = -1;
    let bestCost = Infinity;
    free.forEach((v, k) => {
      if (!cleanOn(p, v, seq)) return;
      const c = seqCost(p, v, seq);
      if (c < bestCost) { bestCost = c; best = k; }
    });
    if (best < 0) { leftovers.push(...seq); continue; }
    work.push({ vehicle: free[best], seq });
    free.splice(best, 1);
  }

  // leftovers: cheapest insertion into any route (lateness allowed and counted; capacity hard)
  const unserved: number[] = [];
  for (const o of leftovers.sort((a, b) => a - b)) {
    let bestR = -1, bestPos = -1, bestDelta = Infinity;
    work.forEach((r, k) => {
      const load = r.seq.reduce((s, i) => s + p.orders[i].weight, 0);
      if (load + p.orders[o].weight > r.vehicle.capacity) return;
      const before = seqCost(p, r.vehicle, r.seq);
      for (let pos = 0; pos <= r.seq.length; pos++) {
        const cand = [...r.seq.slice(0, pos), o, ...r.seq.slice(pos)];
        const d = seqCost(p, r.vehicle, cand) - before;
        if (d < bestDelta) { bestDelta = d; bestR = k; bestPos = pos; }
      }
    });
    // still-free vehicle as a last resort
    if (bestR < 0 && free.length) { work.push({ vehicle: free.shift()!, seq: [o] }); continue; }
    if (bestR < 0) { unserved.push(o); continue; }
    const r = work[bestR];
    r.seq = [...r.seq.slice(0, bestPos), o, ...r.seq.slice(bestPos)];
  }

  // 3. local search (free vehicles join as empty routes so relocate can open them if that is cheaper)
  const pool: WorkRoute[] = [...work, ...free.map((v) => ({ vehicle: v, seq: [] as number[] }))];
  const stats = improveRoutes(p, pool, { neighbours: 25, ...opts, vehicleFixedAed: fixed });

  const order = new Map(p.vehicles.map((v, i) => [v.id, i]));
  const routes = pool
    .filter((r) => r.seq.length)
    .sort((a, b) => order.get(a.vehicle.id)! - order.get(b.vehicle.id)!)
    .map((r) => evaluateRoute(p, r.vehicle, r.seq));

  return {
    algorithm: "cw2opt",
    routes,
    unserved: unserved.map((i) => p.orders[i].id),
    meta: {
      runMs: performance.now() - t0,
      stub: false,
      note: `Clarke-Wright savings + 2-opt/relocate/swap: ${savings.length} savings routes merged to ${built.length}, ${stats.moves} improving moves in ${stats.passes} passes`,
    },
  };
}
