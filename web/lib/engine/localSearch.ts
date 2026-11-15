import type { Problem, Route, Vehicle } from "@/lib/types";
import { evaluateRoute } from "./schedule";

/**
 * Local search used after Clarke-Wright (and reusable by re-routing, owner Karan).
 * Moves: 2-opt inside a route, relocate one order between routes, swap two orders between routes.
 * Every candidate is scored with evaluateRoute() and the same cost terms as the KPI engine,
 * so baseline and AI are judged on identical rules. Relocate and swap only look at each order's
 * nearest neighbours (granular neighbourhood) to stay fast in the browser.
 * Deterministic: fixed scan order, first improvement, capped passes (no wall-clock budget).
 * Owner: Krishna.
 */

/** A working route: which vehicle drives which sequence of order indices. */
export interface WorkRoute {
  vehicle: Vehicle;
  seq: number[];
}

export interface SearchOptions {
  /** search-only charge per vehicle used (AED). Steers towards fewer vehicles; not added to KPI cost. */
  vehicleFixedAed?: number;
  /** nearest neighbours per order considered by relocate/swap */
  neighbours?: number;
  maxPasses?: number;
}

const OVER_DUTY_PENALTY = 1_000; // AED per route past its duty end (search only)
const OVER_DUTY_PER_MIN = 20; // AED per minute past duty end (search only)
const OVER_CAPACITY_PENALTY = 1_000_000; // capacity is a hard rule
const EPS = 1e-6;

/**
 * Cost of one route in AED with the KPI terms: vehicle km cost + driver time + SLA penalty per late stop.
 * The failed-attempt cost is the same for every plan (per served order), so it is left out.
 */
export function routeCost(p: Problem, r: Route, v: Vehicle, vehicleFixedAed = 0): number {
  if (r.stops.length === 0) return 0;
  const c = p.assumptions.costs;
  let cost = vehicleFixedAed + r.km * v.costPerKm + ((r.endMin - r.startMin) / 60) * c.driver_cost_per_hour_aed;
  for (const s of r.stops) if (s.late) cost += c.sla_penalty_aed;
  if (r.overDuty) cost += OVER_DUTY_PENALTY + (r.endMin - v.shiftEnd) * OVER_DUTY_PER_MIN;
  if (r.load > v.capacity) cost += OVER_CAPACITY_PENALTY;
  return cost;
}

export function seqCost(p: Problem, v: Vehicle, seq: number[], vehicleFixedAed = 0): number {
  return seq.length ? routeCost(p, evaluateRoute(p, v, seq), v, vehicleFixedAed) : 0;
}

/** k nearest other orders for every order (by road km), ties broken by index. */
export function nearestNeighbours(p: Problem, k: number): number[][] {
  const n = p.orders.length;
  return p.orders.map((_, i) => {
    const idx = Array.from({ length: n }, (_, j) => j).filter((j) => j !== i);
    idx.sort((a, b) => p.km[i + 1][a + 1] - p.km[i + 1][b + 1] || a - b);
    return idx.slice(0, k);
  });
}

class Search {
  costs: number[];
  loads: number[];
  where = new Map<number, number>(); // order -> route index
  constructor(public p: Problem, public routes: WorkRoute[], public fixed: number) {
    this.costs = routes.map((r) => this.cost(r.vehicle, r.seq));
    this.loads = routes.map((r) => r.seq.reduce((s, i) => s + p.orders[i].weight, 0));
    routes.forEach((r, k) => r.seq.forEach((o) => this.where.set(o, k)));
  }
  cost(v: Vehicle, seq: number[]) { return seqCost(this.p, v, seq, this.fixed); }
  total() { return this.costs.reduce((s, c) => s + c, 0); }
  set(k: number, seq: number[], cost: number) {
    this.routes[k].seq = seq;
    this.costs[k] = cost;
    this.loads[k] = seq.reduce((s, i) => s + this.p.orders[i].weight, 0);
    seq.forEach((o) => this.where.set(o, k));
  }

  /** 2-opt inside one route (segment reversal), first improvement, until no change. */
  twoOpt(k: number): boolean {
    const r = this.routes[k];
    let any = false;
    let improved = true;
    while (improved) {
      improved = false;
      const n = r.seq.length;
      for (let i = 0; i < n - 1 && !improved; i++) {
        for (let j = i + 1; j < n && !improved; j++) {
          const cand = [...r.seq.slice(0, i), ...r.seq.slice(i, j + 1).reverse(), ...r.seq.slice(j + 1)];
          const c = this.cost(r.vehicle, cand);
          if (c < this.costs[k] - EPS) { this.set(k, cand, c); improved = true; any = true; }
        }
      }
    }
    return any;
  }

  /** Relocate order o next to one of its neighbours (or into an empty vehicle). */
  relocate(o: number, nn: number[]): boolean {
    const a = this.where.get(o)!;
    const ra = this.routes[a];
    const i = ra.seq.indexOf(o);
    const without = [...ra.seq.slice(0, i), ...ra.seq.slice(i + 1)];
    const costA = this.cost(ra.vehicle, without);
    const w = this.p.orders[o].weight;
    // candidate (route, position) pairs: before/after each neighbour, plus the first empty vehicle of each kind
    const cands: [number, number][] = [];
    for (const q of nn) {
      const b = this.where.get(q)!;
      const base = b === a ? without : this.routes[b].seq;
      const j = base.indexOf(q);
      cands.push([b, j], [b, j + 1]);
    }
    const seenEmpty = new Set<string>();
    this.routes.forEach((r, b) => {
      if (r.seq.length) return;
      const key = `${r.vehicle.type}-${r.vehicle.shiftStart}`;
      if (seenEmpty.has(key)) return;
      seenEmpty.add(key);
      cands.push([b, 0]);
    });
    for (const [b, pos] of cands) {
      const rb = this.routes[b];
      if (b !== a && this.loads[b] + w > rb.vehicle.capacity) continue;
      const base = b === a ? without : rb.seq;
      const cand = [...base.slice(0, pos), o, ...base.slice(pos)];
      const cb = this.cost(rb.vehicle, cand);
      const delta = b === a ? cb - this.costs[a] : costA + cb - this.costs[a] - this.costs[b];
      if (delta < -EPS) {
        if (b === a) this.set(a, cand, cb);
        else { this.set(a, without, costA); this.set(b, cand, cb); }
        return true;
      }
    }
    return false;
  }

  /** Swap order o with a neighbour's route-mate next to that neighbour (classic granular swap). */
  swap(o: number, nn: number[]): boolean {
    const a = this.where.get(o)!;
    const ra = this.routes[a];
    const i = ra.seq.indexOf(o);
    const wo = this.p.orders[o].weight;
    for (const q of nn) {
      const b = this.where.get(q)!;
      if (b === a) continue;
      const rb = this.routes[b];
      const jq = rb.seq.indexOf(q);
      for (const j of [jq - 1, jq, jq + 1]) {
        if (j < 0 || j >= rb.seq.length) continue;
        const x = rb.seq[j];
        const wx = this.p.orders[x].weight;
        if (this.loads[a] - wo + wx > ra.vehicle.capacity || this.loads[b] - wx + wo > rb.vehicle.capacity) continue;
        const na = [...ra.seq]; na[i] = x;
        const nb = [...rb.seq]; nb[j] = o;
        const ca = this.cost(ra.vehicle, na);
        const cb = this.cost(rb.vehicle, nb);
        if (ca + cb < this.costs[a] + this.costs[b] - EPS) {
          this.set(a, na, ca); this.set(b, nb, cb);
          return true;
        }
      }
    }
    return false;
  }
}

/**
 * Route elimination: try to empty one route by inserting each of its orders at the cheapest position
 * in the other routes. Accepted only if the total cost (with the per-vehicle charge) goes down.
 */
function eliminate(s: Search, k: number): boolean {
  const victim = s.routes[k].seq;
  if (!victim.length) return false;
  const seqs = s.routes.map((r) => [...r.seq]);
  const costs = [...s.costs];
  const loads = [...s.loads];
  seqs[k] = []; costs[k] = 0; loads[k] = 0;
  for (const o of victim) {
    const w = s.p.orders[o].weight;
    let bR = -1, bPos = -1, bC = 0, bD = Infinity;
    for (let r = 0; r < seqs.length; r++) {
      if (r === k || !seqs[r].length) continue;
      if (loads[r] + w > s.routes[r].vehicle.capacity) continue;
      for (let pos = 0; pos <= seqs[r].length; pos++) {
        const cand = [...seqs[r].slice(0, pos), o, ...seqs[r].slice(pos)];
        const c = s.cost(s.routes[r].vehicle, cand);
        if (c - costs[r] < bD) { bD = c - costs[r]; bR = r; bPos = pos; bC = c; }
      }
    }
    if (bR < 0) return false;
    seqs[bR] = [...seqs[bR].slice(0, bPos), o, ...seqs[bR].slice(bPos)];
    costs[bR] = bC; loads[bR] += w;
  }
  if (costs.reduce((a, b) => a + b, 0) >= s.total() - EPS) return false;
  seqs.forEach((seq, r) => s.set(r, seq, costs[r]));
  return true;
}

export interface LocalSearchStats {
  passes: number;
  moves: number;
  startCost: number;
  endCost: number;
}

/**
 * Improve routes in place until a full pass finds no improving move, or maxPasses is reached.
 * A pass = 2-opt on every route, then relocate and swap for every order (in index order).
 * Empty routes in the list are idle vehicles that relocate may open.
 */
export function improveRoutes(p: Problem, routes: WorkRoute[], opts: SearchOptions = {}): LocalSearchStats {
  const s = new Search(p, routes, opts.vehicleFixedAed ?? 0);
  const nn = nearestNeighbours(p, opts.neighbours ?? 12);
  const startCost = s.total();
  const maxPasses = opts.maxPasses ?? 30;
  let passes = 0;
  let moves = 0;
  const served = () => [...s.where.keys()].sort((x, y) => x - y);
  while (passes < maxPasses) {
    passes++;
    let changed = false;
    // smallest routes first: can a whole vehicle be saved?
    const bySize = routes.map((r, k) => k).filter((k) => routes[k].seq.length).sort((x, y) => routes[x].seq.length - routes[y].seq.length || x - y);
    for (const k of bySize) if (eliminate(s, k)) { changed = true; moves++; }
    for (let k = 0; k < routes.length; k++) if (s.twoOpt(k)) { changed = true; moves++; }
    for (const o of served()) {
      if (s.relocate(o, nn[o])) { changed = true; moves++; continue; }
      if (s.swap(o, nn[o])) { changed = true; moves++; }
    }
    if (!changed) break;
  }
  return { passes, moves, startCost, endCost: s.total() };
}
