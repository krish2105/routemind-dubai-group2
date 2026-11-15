import type { EventType, TrafficEvent } from "@/lib/types";

/** Preset events for the demo. Owner: Karan (add tests, add labels/icons data for the UI). */
export const EVENT_LABELS: Record<EventType, string> = {
  szr_jam: "Sheikh Zayed Road jam",
  al_khail_jam: "Al Khail Road jam",
  sandstorm: "Sandstorm (citywide)",
  rain: "Heavy rain (citywide)",
  urgent_surge: "Urgent-order surge",
};

export function makeEvent(type: EventType, startHHMM: string, durationMin = 120): TrafficEvent {
  const [h, m] = startHHMM.split(":").map(Number);
  const startMin = h * 60 + m;
  return { id: `${type}-${startMin}`, type, startMin, endMin: startMin + durationMin };
}

/** The demo moment on slide 4: Sheikh Zayed Road jam at 13:00 for 2 hours. */
export const DEMO_EVENT: TrafficEvent = makeEvent("szr_jam", "13:00", 120);
