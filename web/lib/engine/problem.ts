import type { Assumptions, Order, Problem, Scenario, Vehicle } from "@/lib/types";
import { buildKmMatrix } from "./geo";
import { mulberry32, pick } from "./rng";
import { HUB, POINT_POOL } from "./points";

const hhmm = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};

export function defaultScenario(a: Assumptions): Scenario {
  return {
    seed: a.seed,
    orderCount: a.orders.count,
    vans: a.vehicles.van.count,
    bikes: a.vehicles.bike.count,
    events: [],
    evShare: 0,
  };
}

export function generateOrders(a: Assumptions, seed: number, count: number): Order[] {
  const rnd = mulberry32(seed);
  const opStart = 8 * 60 + 30;
  const opEnd = 20 * 60;
  const orders: Order[] = [];
  for (let i = 0; i < count; i++) {
    const pt = pick(rnd, POINT_POOL);
    const urgent = rnd() < a.orders.urgent_share;
    const len = urgent ? a.orders.urgent_window_min : a.orders.time_window_min;
    const lastStart = opEnd - len;
    const slots = Math.floor((lastStart - opStart) / 30);
    const windowStart = opStart + Math.floor(rnd() * (slots + 1)) * 30;
    const r = rnd();
    orders.push({
      id: `O${String(i + 1).padStart(3, "0")}`,
      pointId: pt.id,
      lat: pt.lat + (rnd() - 0.5) * 0.012,
      lng: pt.lng + (rnd() - 0.5) * 0.012,
      weight: r < 0.6 ? 1 : r < 0.9 ? 2 : 3,
      windowStart,
      windowEnd: windowStart + len,
      urgent,
      cod: rnd() < a.orders.cod_share,
      serviceMin: 0, // set per vehicle type at evaluation time
    });
  }
  return orders;
}

export function buildVehicles(a: Assumptions, vans: number, bikes: number): Vehicle[] {
  const early = hhmm("08:00");
  const late = hhmm("11:00");
  const make = (type: "van" | "bike", n: number): Vehicle[] =>
    Array.from({ length: n }, (_, i) => {
      const v = a.vehicles[type];
      const start = i < Math.ceil(n / 2) ? early : late;
      return {
        id: `${type === "van" ? "V" : "B"}${String(i + 1).padStart(2, "0")}`,
        type,
        capacity: v.capacity_parcels,
        costPerKm: v.cost_per_km_aed,
        co2PerKm: v.co2_kg_per_km,
        shiftStart: start,
        shiftEnd: start + v.max_duty_min,
      };
    });
  return [...make("van", vans), ...make("bike", bikes)];
}

/** Build the full problem from a scenario. Same scenario => identical problem. */
export function buildProblem(a: Assumptions, s: Scenario): Problem {
  let orders = generateOrders(a, s.seed, s.orderCount);
  const surge = s.events.find((e) => e.type === "urgent_surge");
  if (surge) {
    // extra urgent orders appear at the event start time; ids continue after the base orders
    const extra = generateOrders(a, s.seed + 7, a.orders.urgent_surge_orders).map((o, i) => {
      const start = Math.max(surge.startMin, 9 * 60);
      return { ...o, id: `U${String(i + 1).padStart(3, "0")}`, urgent: true, windowStart: start, windowEnd: start + a.orders.urgent_window_min };
    });
    orders = [...orders, ...extra];
  }
  const nodes = [HUB, ...orders];
  const km = buildKmMatrix(nodes, a.fallback.haversine_detour_factor);
  return {
    hub: HUB,
    orders,
    vehicles: buildVehicles(a, s.vans, s.bikes),
    km,
    assumptions: a,
    events: s.events,
    evShare: s.evShare,
  };
}
