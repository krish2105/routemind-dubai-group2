import type { Order, Plan, Point } from "@/lib/types";

/** Map data helpers (owner: Krishna). Pure functions, no React. Time unit: minutes after midnight. */

export interface Trip {
  vehicleId: string;
  path: [number, number][];
  timestamps: number[];
}

/**
 * One animated trip per route: hub -> stops -> hub. The vehicle sits at each stop from arrival to departure
 * (waiting for a window counts as time at the stop). Legs are straight lines between stops (illustrative;
 * road km come from haversine x detour factor, see assumptions).
 */
export function planToTrips(plan: Plan, orders: Order[], hub: Point): Trip[] {
  return plan.routes.map((r) => {
    const path: [number, number][] = [[hub.lng, hub.lat]];
    const timestamps: number[] = [r.startMin];
    for (const s of r.stops) {
      const o = orders[s.orderIdx];
      path.push([o.lng, o.lat], [o.lng, o.lat]);
      timestamps.push(s.arrival, s.departure);
    }
    path.push([hub.lng, hub.lat]);
    timestamps.push(r.endMin);
    return { vehicleId: r.vehicleId, path, timestamps };
  });
}

export type Risk = "late" | "tight" | "ok" | "unserved";

export interface OrderDot {
  id: string;
  position: [number, number];
  risk: Risk;
  vehicleId?: string;
  windowStart: number;
  windowEnd: number;
  arrival?: number;
  urgent: boolean;
}

/** Orders coloured by SLA risk in a plan: late, tight (under 15 min slack), ok, or unserved. */
export function orderDots(plan: Plan | undefined, orders: Order[]): OrderDot[] {
  const byIdx = new Map<number, { vehicleId: string; arrival: number; late: boolean; slack: number }>();
  plan?.routes.forEach((r) => r.stops.forEach((s) => byIdx.set(s.orderIdx, { vehicleId: r.vehicleId, arrival: s.arrival, late: s.late, slack: s.slack })));
  return orders.map((o, i) => {
    const s = byIdx.get(i);
    const risk: Risk = !s ? "unserved" : s.late ? "late" : s.slack < 15 ? "tight" : "ok";
    return { id: o.id, position: [o.lng, o.lat], risk, vehicleId: s?.vehicleId, windowStart: o.windowStart, windowEnd: o.windowEnd, arrival: s?.arrival, urgent: o.urgent };
  });
}

export const hhmm = (min: number) => {
  const m = Math.max(0, Math.round(min));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
