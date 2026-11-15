import type { Plan, Problem, Route, Vehicle } from "@/lib/types";
import { solveBaseline } from "./baseline";
import { mulberry32 } from "./rng";
import { evaluateRoute, travelMin } from "./schedule";
import { VEHICLE_FIXED_AED } from "./clarkeWright";
import { improveRoutes, type WorkRoute } from "./localSearch";

/**
 * GENETIC ALGORITHM. Owner: Atharva.
 *
 * Chromosome = "giant tour": one permutation of all order indices (no vehicles inside).
 * Decode (split): walk the tour; each order is appended to the vehicle route where it adds the least cost,
 *   on-time routes first; capacity and duty end are hard (see decode()).
 * Fitness (lower is better) = cost of every route scored with the shared evaluateRoute() + penalties (block below).
 * Operators: tournament selection, order crossover (OX), swap or inversion mutation, elitism (best 2 kept).
 * meta.convergence = best fitness per generation; non-increasing because the elite always survives.
 * warmStart: the given plan is decoded exactly as an incumbent and its tour seeds the population, so the result is
 *   never worse (by fitness) than the plan passed in. Deterministic: all randomness from mulberry32(seed).
 */

/* ---------- penalty / search weights (one place) ---------- */
const W = {
  /** search-only charge per vehicle used, same as Clarke-Wright so both are steered the same way */
  vehicleFixedAed: VEHICLE_FIXED_AED,
  /** extra AED per minute late, on top of the SLA penalty per late stop (from assumptions) */
  latePerMinAed: 2,
  overDutyAed: 1_000,
  overDutyPerMinAed: 20,
  overloadPerParcelAed: 10_000,
  unservedAed: 5_000,
};

export interface GAOptions {
  generations?: number;
  population?: number;
  warmStart?: Plan;
  seed?: number;
  mutationRate?: number;
  tournament?: number;
  elite?: number;
  /** run the shared local search on the GA's best plan at the end (default true) */
  polish?: boolean;
  /** safety time box (ms); the run stops early and says so in meta.note */
  timeLimitMs?: number;
}

interface Decoded { seqs: number[][]; unserved: number[]; fitness: number }

/** Fitness of one route = KPI cost terms + penalties. */
function routeFitness(p: Problem, v: Vehicle, r: Route): number {
  if (!r.stops.length) return 0;
  const c = p.assumptions.costs;
  let f = W.vehicleFixedAed + r.km * v.costPerKm + ((r.endMin - r.startMin) / 60) * c.driver_cost_per_hour_aed;
  for (const s of r.stops) if (s.late) f += c.sla_penalty_aed - s.slack * W.latePerMinAed;
  if (r.overDuty) f += W.overDutyAed + (r.endMin - v.shiftEnd) * W.overDutyPerMinAed;
  if (r.load > v.capacity) f += (r.load - v.capacity) * W.overloadPerParcelAed;
  return f;
}

function planFitness(p: Problem, vehicles: Vehicle[], seqs: number[][], unserved: number): number {
  let f = unserved * W.unservedAed;
  seqs.forEach((s, k) => { if (s.length) f += routeFitness(p, vehicles[k], evaluateRoute(p, vehicles[k], s)); });
  return f;
}

/**
 * Split a giant tour over the fleet. Orders are taken in tour order; each goes to the END of the vehicle route
 * where it adds the least cost (km + driver time + per-vehicle charge if the vehicle is still empty), preferring
 * routes where it is on time. Capacity and duty end are hard; "unserved" only if no vehicle can take it.
 * The chromosome therefore decides the order of every route and the priority between orders.
 */
function decode(p: Problem, tour: number[]): Decoded {
  const vs = p.vehicles;
  const costs = p.assumptions.costs;
  const seqs: number[][] = vs.map(() => []);
  const load = vs.map(() => 0);
  const t = vs.map((v) => v.shiftStart); // departure time from the current last node
  const node = vs.map(() => 0);
  const end = vs.map((v) => v.shiftStart); // back at hub
  const unserved: number[] = [];
  for (const o of tour) {
    const ord = p.orders[o];
    let bk = -1, bd = Infinity, bLate = true, bDep = 0, bEnd = 0;
    for (let k = 0; k < vs.length; k++) {
      const v = vs[k];
      if (load[k] + ord.weight > v.capacity) continue;
      const arrival = Math.max(t[k] + travelMin(p, node[k], o + 1, t[k], v.type), ord.windowStart);
      const dep = arrival + p.assumptions.vehicles[v.type].service_time_min;
      const back = dep + travelMin(p, o + 1, 0, dep, v.type);
      if (back > v.shiftEnd) continue;
      const late = arrival > ord.windowEnd;
      if (late && !bLate) continue;
      const dKm = p.km[node[k]][o + 1] + p.km[o + 1][0] - (seqs[k].length ? p.km[node[k]][0] : 0);
      const d = dKm * v.costPerKm + ((back - end[k]) / 60) * costs.driver_cost_per_hour_aed
        + (seqs[k].length ? 0 : W.vehicleFixedAed) + (late ? costs.sla_penalty_aed + (arrival - ord.windowEnd) * W.latePerMinAed : 0);
      if ((bLate && !late) || d < bd) { bd = d; bk = k; bLate = late; bDep = dep; bEnd = back; }
    }
    if (bk < 0) { unserved.push(o); continue; }
    seqs[bk].push(o); load[bk] += ord.weight; t[bk] = bDep; node[bk] = o + 1; end[bk] = bEnd;
  }
  return { seqs, unserved, fitness: planFitness(p, vs, seqs, unserved.length) };
}

/** Order crossover (OX): copy a slice from parent a, fill the rest in parent b's order. */
function ox(a: number[], b: number[], rnd: () => number): number[] {
  const n = a.length;
  let i = Math.floor(rnd() * n), j = Math.floor(rnd() * n);
  if (i > j) [i, j] = [j, i];
  const child = new Array<number>(n);
  const taken = new Set<number>();
  for (let x = i; x <= j; x++) { child[x] = a[x]; taken.add(a[x]); }
  let pos = (j + 1) % n;
  for (let x = 0; x < n; x++) {
    const g = b[(j + 1 + x) % n];
    if (taken.has(g)) continue;
    child[pos] = g;
    pos = (pos + 1) % n;
  }
  return child;
}

function mutate(t: number[], rnd: () => number): void {
  const n = t.length;
  if (n < 2) return;
  let i = Math.floor(rnd() * n), j = Math.floor(rnd() * n);
  if (rnd() < 0.5) { [t[i], t[j]] = [t[j], t[i]]; return; } // swap
  if (i > j) [i, j] = [j, i];
  while (i < j) { [t[i], t[j]] = [t[j], t[i]]; i++; j--; } // inversion
}

/** Heuristic seed: by window start, nearest-neighbour inside each start slot. */
function windowNearestTour(p: Problem): number[] {
  const left = new Set(p.orders.map((_, i) => i));
  const tour: number[] = [];
  let node = 0;
  while (left.size) {
    let minStart = Infinity;
    for (const i of left) minStart = Math.min(minStart, p.orders[i].windowStart);
    let best = -1, bd = Infinity;
    for (const i of left) {
      if (p.orders[i].windowStart !== minStart) continue;
      const d = p.km[node][i + 1];
      if (d < bd) { bd = d; best = i; }
    }
    tour.push(best); left.delete(best); node = best + 1;
  }
  return tour;
}

/** Concatenate a plan's routes into a giant tour (any order missing from the plan goes at the end). */
function tourOf(p: Problem, plan: Plan): number[] {
  const idx = new Map(p.orders.map((o, i) => [o.id, i]));
  const seen = new Set<number>();
  const tour: number[] = [];
  for (const r of plan.routes) for (const s of r.stops) {
    const i = idx.get(s.orderId);
    if (i !== undefined && !seen.has(i)) { seen.add(i); tour.push(i); }
  }
  p.orders.forEach((_, i) => { if (!seen.has(i)) tour.push(i); });
  return tour;
}

/** The warm-start plan, exactly as given, in decoded form (vehicle slots by id). */
function decodePlan(p: Problem, plan: Plan): Decoded {
  const idx = new Map(p.orders.map((o, i) => [o.id, i]));
  const slot = new Map(p.vehicles.map((v, k) => [v.id, k]));
  const seqs: number[][] = p.vehicles.map(() => []);
  const seen = new Set<number>();
  for (const r of plan.routes) {
    const k = slot.get(r.vehicleId);
    if (k === undefined) continue;
    for (const s of r.stops) {
      const i = idx.get(s.orderId);
      if (i !== undefined && !seen.has(i)) { seen.add(i); seqs[k].push(i); }
    }
  }
  const unserved = p.orders.map((_, i) => i).filter((i) => !seen.has(i));
  return { seqs, unserved, fitness: planFitness(p, p.vehicles, seqs, unserved.length) };
}

export function solveGA(p: Problem, opts: GAOptions = {}): Plan {
  const t0 = performance.now();
  const generations = opts.generations ?? 150;
  const popSize = Math.max(4, opts.population ?? 60);
  const elite = opts.elite ?? 2;
  const tk = opts.tournament ?? 3;
  const mRate = opts.mutationRate ?? 0.3;
  const timeLimit = opts.timeLimitMs ?? 60_000;
  const rnd = mulberry32(opts.seed ?? p.assumptions.seed);
  const n = p.orders.length;

  // initial population: heuristic seeds, their mutants, then random tours sorted by window start
  // (random order inside each 30-min slot: diverse, but not hopeless like a fully random tour)
  const seeds = [tourOf(p, opts.warmStart ?? solveBaseline(p)), windowNearestTour(p)];
  const tours: number[][] = [...seeds];
  while (tours.length < popSize) {
    if (tours.length < popSize / 2) {
      const t = [...seeds[tours.length % seeds.length]];
      for (let m = 0; m < 3; m++) mutate(t, rnd);
      tours.push(t);
    } else {
      const key = p.orders.map((o) => o.windowStart + rnd());
      tours.push(Array.from({ length: n }, (_, i) => i).sort((a, b) => key[a] - key[b]));
    }
  }
  let pop = tours.map((t) => ({ tour: t, d: decode(p, t) }));

  let best: Decoded = pop.reduce((a, b) => (b.d.fitness < a.fitness ? b.d : a), pop[0].d);
  if (opts.warmStart) {
    const inc = decodePlan(p, opts.warmStart);
    if (inc.fitness <= best.fitness) best = inc;
  }

  const convergence: number[] = [];
  const pickParent = () => {
    let w = pop[Math.floor(rnd() * pop.length)];
    for (let k = 1; k < tk; k++) {
      const c = pop[Math.floor(rnd() * pop.length)];
      if (c.d.fitness < w.d.fitness) w = c;
    }
    return w.tour;
  };

  let g = 0;
  for (; g < generations; g++) {
    if (performance.now() - t0 > timeLimit) break;
    pop.sort((a, b) => a.d.fitness - b.d.fitness);
    const next = pop.slice(0, elite);
    while (next.length < popSize) {
      const child = ox(pickParent(), pickParent(), rnd);
      if (rnd() < mRate) mutate(child, rnd);
      next.push({ tour: child, d: decode(p, child) });
    }
    pop = next;
    for (const ind of pop) if (ind.d.fitness < best.fitness) best = ind.d;
    convergence.push(best.fitness);
  }

  // memetic finish: polish the GA's best plan with the shared local search (2-opt, relocate, swap)
  const pool: WorkRoute[] = best.seqs.map((s, k) => ({ vehicle: p.vehicles[k], seq: [...s] }));
  const ls = opts.polish === false ? null : improveRoutes(p, pool, { neighbours: 25, vehicleFixedAed: W.vehicleFixedAed });
  const routes = pool.filter((r) => r.seq.length).map((r) => evaluateRoute(p, r.vehicle, r.seq));
  const stopped = g < generations ? ` (time box hit after ${g} generations)` : "";
  return {
    algorithm: "ga",
    routes,
    unserved: best.unserved.map((i) => p.orders[i].id),
    meta: {
      runMs: performance.now() - t0,
      stub: false,
      generations: g,
      convergence,
      note: `GA: population ${popSize}, ${g} generations, OX + swap/inversion, tournament ${tk}, elitism ${elite}${stopped}${ls ? `; local-search polish ${ls.moves} moves` : ""}`,
    },
  };
}
