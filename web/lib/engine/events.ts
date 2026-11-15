import type { Assumptions, Corridor, EventType, TrafficEvent } from "@/lib/types";
import { assumptions as defaultAssumptions } from "@/lib/assumptions";

/**
 * What-if events for live re-routing (owner: Karan's area, built by Yash after Karan left).
 * All slow-down factors are ASSUMED (assumptions.json "event_multipliers"), not measured traffic data.
 * How an event changes travel time lives in schedule.ts (legMultiplier): corridor jams only slow legs that start or end
 * on that corridor, sandstorm and rain slow every leg, and bikes feel any slow-down at `bike_traffic_sensitivity` strength.
 * An urgent-order surge adds new urgent orders at the event start (see reroute.ts / problem.ts).
 * Time unit: minutes after midnight (13:00 = 780).
 */

export const EVENT_LABELS: Record<EventType, string> = {
  szr_jam: "Sheikh Zayed Road jam",
  al_khail_jam: "Al Khail Road jam",
  sandstorm: "Sandstorm (citywide)",
  rain: "Heavy rain (citywide)",
  urgent_surge: "Urgent-order surge",
};

export interface EventInfo {
  type: EventType;
  label: string;
  short: string;
  icon: string;
  /** "corridor" = only legs touching the corridor; "citywide" = every leg; "orders" = adds urgent orders */
  scope: "corridor" | "citywide" | "orders";
  corridor?: Corridor;
  /** van travel-time factor while the event is active (1 for the surge) */
  multiplier: number;
  /** what a bike feels: 1 + (m - 1) x bike sensitivity */
  bikeMultiplier: number;
  /** urgent orders added (surge only) */
  extraOrders?: number;
  /** default duration in minutes for the UI buttons */
  defaultDurationMin: number;
  note: string;
}

/** Event catalogue for the UI, values read from the assumptions (all ASSUMED). */
export function eventInfo(type: EventType, a: Assumptions = defaultAssumptions): EventInfo {
  const em = a.event_multipliers;
  const bike = (m: number) => 1 + (m - 1) * a.fallback.bike_traffic_sensitivity;
  switch (type) {
    case "szr_jam":
      return { type, label: EVENT_LABELS[type], short: "SZR jam", icon: "🛣", scope: "corridor", corridor: "szr", multiplier: em.sheikh_zayed_road_jam,
        bikeMultiplier: bike(em.sheikh_zayed_road_jam), defaultDurationMin: 120, note: "Legs starting or ending on Sheikh Zayed Road areas slow down" };
    case "al_khail_jam":
      return { type, label: EVENT_LABELS[type], short: "Al Khail jam", icon: "🛣", scope: "corridor", corridor: "alkhail", multiplier: em.al_khail_road_jam,
        bikeMultiplier: bike(em.al_khail_road_jam), defaultDurationMin: 120, note: "Legs starting or ending on Al Khail Road areas slow down" };
    case "sandstorm":
      return { type, label: EVENT_LABELS[type], short: "Sandstorm", icon: "🌪", scope: "citywide", multiplier: em.sandstorm_citywide,
        bikeMultiplier: bike(em.sandstorm_citywide), defaultDurationMin: 240,
        note: `Every leg slower; failed-attempt chance +${Math.round(a.failed_attempt.sandstorm_extra * 100)} pts (assumed)` };
    case "rain":
      return { type, label: EVENT_LABELS[type], short: "Heavy rain", icon: "🌧", scope: "citywide", multiplier: em.heavy_rain_citywide,
        bikeMultiplier: bike(em.heavy_rain_citywide), defaultDurationMin: 180, note: "Every leg slower" };
    case "urgent_surge":
      return { type, label: EVENT_LABELS[type], short: "Urgent surge", icon: "⚡", scope: "orders", multiplier: 1, bikeMultiplier: 1,
        extraOrders: a.orders.urgent_surge_orders, defaultDurationMin: a.orders.urgent_window_min,
        note: `${a.orders.urgent_surge_orders} new urgent orders, each due within ${a.orders.urgent_window_min} min` };
  }
}

export const EVENT_TYPES: EventType[] = ["szr_jam", "al_khail_jam", "sandstorm", "rain", "urgent_surge"];

/** "HH:MM" or minutes after midnight -> minutes after midnight. */
export function toMin(t: string | number): number {
  if (typeof t === "number") return t;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

/**
 * Make an event. `start` is "HH:MM" or minutes after midnight. The corridor of a jam is part of its type
 * (szr_jam / al_khail_jam). Same inputs => same id (used to dedupe events).
 */
export function makeEvent(type: EventType, start: string | number, durationMin = 120): TrafficEvent {
  const startMin = toMin(start);
  return { id: `${type}-${startMin}`, type, startMin, endMin: startMin + Math.max(0, durationMin) };
}

/** True if the event is active at minute t. */
export function isActive(e: TrafficEvent, t: number): boolean {
  return t >= e.startMin && t < e.endMin;
}

/** Merge event lists, dropping duplicates by id (first wins). Keeps the order. */
export function mergeEvents(...lists: TrafficEvent[][]): TrafficEvent[] {
  const seen = new Set<string>();
  const out: TrafficEvent[] = [];
  for (const l of lists) for (const e of l) if (!seen.has(e.id)) { seen.add(e.id); out.push(e); }
  return out;
}

/** The demo moment on slide 4: Sheikh Zayed Road jam at 13:00 for 2 hours. */
export const DEMO_EVENT: TrafficEvent = makeEvent("szr_jam", "13:00", 120);
