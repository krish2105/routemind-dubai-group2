import type { Order } from "@/lib/types";

export interface ZoneResult {
  k: number;
  /** zone index for each order */
  assignment: number[];
  centroids: { lat: number; lng: number }[];
  silhouette?: number;
}

/**
 * TODO (owner: Yash): seeded k-means on order coordinates, choose k by silhouette/elbow,
 * return medoid-based micro-hub / locker candidates. Stub puts everything in one zone.
 */
export function clusterZones(orders: Order[], _k = 6, _seed = 2611): ZoneResult {
  const lat = orders.reduce((s, o) => s + o.lat, 0) / Math.max(orders.length, 1);
  const lng = orders.reduce((s, o) => s + o.lng, 0) / Math.max(orders.length, 1);
  return { k: 1, assignment: orders.map(() => 0), centroids: [{ lat, lng }] };
}
