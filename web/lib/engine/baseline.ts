import type { Plan, Problem } from "@/lib/types";
import { evaluateRoute } from "./schedule";

/**
 * BASELINE (assumed "how dispatchers plan today"): nearest-neighbour sequential fill.
 * Vans first, then bikes. Picks the nearest order among those whose window opens soon; never checks window END
 * (so lateness can happen). Respects capacity and duty hours.
 * Deterministic. Owner: Krishna.
 */
/** Orders whose window opens within this many minutes count as "open soon". Assumed dispatcher habit. */
const OPEN_SOON_MIN = 30;

export function solveBaseline(p: Problem): Plan {
  const t0 = performance.now();
  const unserved = new Set(p.orders.map((_, i) => i));
  const routes = [];
  for (const v of p.vehicles) {
    const seq: number[] = [];
    let load = 0;
    let node = 0;
    let clock = v.shiftStart;
    for (;;) {
      // candidates: unserved orders that fit the vehicle and whose window opens soon (no long waiting)
      let best = -1;
      let bestKm = Infinity;
      let earliest = -1;
      let earliestOpen = Infinity;
      for (const i of unserved) {
        const o = p.orders[i];
        if (load + o.weight > v.capacity) continue;
        if (o.windowStart < earliestOpen) { earliestOpen = o.windowStart; earliest = i; }
        if (o.windowStart > clock + OPEN_SOON_MIN) continue;
        const d = p.km[node][i + 1];
        if (d < bestKm) { bestKm = d; best = i; }
      }
      if (best < 0) best = earliest; // nothing open soon: take the earliest-opening window
      if (best < 0) break;
      const trial = evaluateRoute(p, v, [...seq, best]);
      if (trial.overDuty) break;
      seq.push(best);
      load += p.orders[best].weight;
      node = best + 1;
      clock = trial.stops[trial.stops.length - 1].departure;
      unserved.delete(best);
    }
    if (seq.length) routes.push(evaluateRoute(p, v, seq));
  }
  return {
    algorithm: "baseline",
    routes,
    unserved: [...unserved].map((i) => p.orders[i].id),
    meta: { runMs: performance.now() - t0 },
  };
}
