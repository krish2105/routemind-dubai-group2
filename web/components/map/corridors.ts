import type { EventType, TrafficEvent } from "@/lib/types";

/**
 * APPROXIMATE road corridors for drawing traffic events on the map (owner: Krishna).
 * Hand-placed points along the roads for display only; the engine does not use these lines
 * (it applies event multipliers by area tag, see lib/engine/points.ts).
 */
export const CORRIDOR_PATHS: Partial<Record<EventType, [number, number][]>> = {
  // Sheikh Zayed Road, Jebel Ali -> Trade Centre (lng, lat)
  szr_jam: [
    [55.065, 25.01], [55.118, 25.045], [55.14, 25.072], [55.17, 25.095], [55.2, 25.118],
    [55.222, 25.138], [55.236, 25.156], [55.25, 25.178], [55.26, 25.191], [55.27, 25.201],
    [55.279, 25.212], [55.287, 25.226], [55.293, 25.233],
  ],
  // Al Khail Road, Dubai Hills -> Ras Al Khor
  al_khail_jam: [
    [55.24, 25.1], [55.262, 25.13], [55.285, 25.152], [55.305, 25.168], [55.325, 25.18], [55.345, 25.19],
  ],
};

/** Events active at minute t (inside their start/end window). */
export function activeEvents(events: TrafficEvent[], t: number): TrafficEvent[] {
  return events.filter((e) => t >= e.startMin && t < e.endMin);
}
