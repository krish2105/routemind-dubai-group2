import type { Point } from "@/lib/types";

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Road-km matrix between nodes. Fallback: haversine x detour factor (labelled in the UI). */
export function buildKmMatrix(nodes: Pick<Point, "lat" | "lng">[], detour: number): number[][] {
  return nodes.map((a) => nodes.map((b) => haversineKm(a, b) * detour));
}
