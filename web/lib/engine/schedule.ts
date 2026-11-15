import type { Problem, Route, Stop, TrafficEvent, Vehicle } from "@/lib/types";
import { POINT_POOL } from "./points";

const corridorOf = new Map(POINT_POOL.map((p) => [p.id, p.corridors] as const));
const HOUR_KEYS = Array.from({ length: 48 }, (_, h) => String(h).padStart(2, "0"));

/** Per-problem cache of each node's corridors (pure speed-up: results are identical to computing them per leg). */
const nodeCorridorCache = new WeakMap<Problem, readonly string[][]>();
function nodeCorridors(p: Problem): readonly string[][] {
  let c = nodeCorridorCache.get(p);
  if (!c) {
    c = [[...p.hub.corridors], ...p.orders.map((o) => [...(corridorOf.get(o.pointId) ?? [])])];
    nodeCorridorCache.set(p, c);
  }
  return c;
}

/** Traffic multiplier for one leg departing at minute t. Events only apply inside their time window. */
export function legMultiplier(p: Problem, fromNode: number, toNode: number, t: number, type: Vehicle["type"]): number {
  const a = p.assumptions;
  const hour = HOUR_KEYS[Math.floor(t / 60)] ?? String(Math.floor(t / 60)).padStart(2, "0");
  let m = a.traffic_hour_multipliers[hour] ?? 1;
  let corridors: Set<string> | null = null;
  for (const e of p.events) {
    if (t < e.startMin || t >= e.endMin) continue;
    if (!corridors) {
      const nc = nodeCorridors(p);
      corridors = new Set([...nc[fromNode], ...nc[toNode]]);
    }
    m *= eventFactor(p, e, corridors);
  }
  return type === "bike" ? 1 + (m - 1) * a.fallback.bike_traffic_sensitivity : m;
}

function eventFactor(p: Problem, e: TrafficEvent, corridors: Set<string>): number {
  const em = p.assumptions.event_multipliers;
  switch (e.type) {
    case "szr_jam": return corridors.has("szr") ? em.sheikh_zayed_road_jam : 1;
    case "al_khail_jam": return corridors.has("alkhail") ? em.al_khail_road_jam : 1;
    case "sandstorm": return em.sandstorm_citywide;
    case "rain": return em.heavy_rain_citywide;
    default: return 1;
  }
}

export function travelMin(p: Problem, from: number, to: number, depart: number, type: Vehicle["type"]): number {
  const free = (p.km[from][to] / p.assumptions.fallback.average_speed_kmh_free_flow) * 60;
  return free * legMultiplier(p, from, to, depart, type);
}

/**
 * THE shared evaluator. Every algorithm must use this to score a route so that
 * baseline and AI are compared on exactly the same rules.
 * orderIdxs = sequence of indices into problem.orders (hub start and end implied).
 */
export function evaluateRoute(p: Problem, vehicle: Vehicle, orderIdxs: number[]): Route {
  const service = p.assumptions.vehicles[vehicle.type].service_time_min;
  let t = vehicle.shiftStart;
  let node = 0;
  let km = 0;
  let drive = 0;
  let load = 0;
  const stops: Stop[] = [];
  for (const idx of orderIdxs) {
    const o = p.orders[idx];
    const nextNode = idx + 1;
    const tm = travelMin(p, node, nextNode, t, vehicle.type);
    km += p.km[node][nextNode];
    drive += tm;
    let arrival = t + tm;
    if (arrival < o.windowStart) arrival = o.windowStart; // wait for window to open
    const departure = arrival + service;
    stops.push({ orderIdx: idx, orderId: o.id, arrival, departure, late: arrival > o.windowEnd, slack: o.windowEnd - arrival });
    load += o.weight;
    t = departure;
    node = nextNode;
  }
  if (orderIdxs.length) {
    const back = travelMin(p, node, 0, t, vehicle.type);
    km += p.km[node][0];
    drive += back;
    t += back;
  }
  return {
    vehicleId: vehicle.id,
    stops,
    km,
    driveMin: drive,
    startMin: vehicle.shiftStart,
    endMin: t,
    load,
    overDuty: t > vehicle.shiftEnd,
  };
}
