import type { Order } from "@/lib/types";
import { assumptions } from "@/lib/assumptions";
import { haversineKm } from "./geo";
import { mulberry32 } from "./rng";

/**
 * Delivery zoning with k-means (owner: Yash). Machine-learning step "cluster" of the RouteMind loop.
 *
 * - Coordinates are projected to a flat km grid around the orders' mean latitude (equirectangular).
 *   At city scale (Dubai is ~60 km across) this matches haversine km to well under 1%, and it lets
 *   Lloyd's algorithm take real means. Reported distances (medoids, intra-zone, tours) use haversine km.
 * - Seeded k-means++ initialisation (mulberry32 from rng.ts), Lloyd iterations until no order changes
 *   zone or 50 iterations. Empty zones are re-seeded with the order farthest from its centroid.
 * - k is chosen automatically (k = 3..10, best mean silhouette) when the caller does not pass one.
 * - For each zone the medoid order (the real order closest to the centroid) is the micro-hub / locker
 *   candidate, and a stops-per-km estimate comes from a nearest-neighbour tour through the zone.
 * Deterministic: same orders + same k + same seed => identical result.
 * All orders are simulated (fictional DubaiDash Express).
 */

export interface MicroHub {
  zone: number;
  /** index into the orders array */
  orderIdx: number;
  orderId: string;
  lat: number;
  lng: number;
}

export interface ZoneResult {
  k: number;
  /** zone index for each order */
  assignment: number[];
  centroids: { lat: number; lng: number }[];
  /** mean silhouette of this clustering, in [-1, 1] (higher = better separated zones) */
  silhouette?: number;
  /** one medoid order per zone: micro-hub / locker candidate */
  hubs: MicroHub[];
  /** estimated stops per road km inside each zone (nearest-neighbour tour, road km = haversine x detour) */
  stopsPerKm: number[];
  /** Lloyd iterations used */
  iterations: number;
  /** silhouette for every k tried (only when k was chosen automatically) */
  silhouetteByK?: { k: number; silhouette: number }[];
  /** true when k was chosen automatically */
  autoK: boolean;
}

export interface ZoneStat {
  zone: number;
  orders: number;
  parcels: number;
  /** share of urgent orders in the zone, 0..1 */
  urgentShare: number;
  /** mean haversine km from each order to its zone centroid */
  avgKmToCentroid: number;
  /** mean haversine km between pairs of orders in the zone */
  avgIntraKm: number;
  /** nearest-neighbour tour length from the micro-hub through all zone orders (road km) */
  tourKm: number;
  stopsPerKm: number;
  hub: MicroHub;
}

export const K_MIN = 3;
export const K_MAX = 10;
const MAX_ITER = 50;

type XY = [number, number];

/** Flat km projection around a reference latitude. */
function projector(orders: Pick<Order, "lat" | "lng">[]) {
  const lat0 = orders.reduce((s, o) => s + o.lat, 0) / Math.max(orders.length, 1);
  const kmLat = 111.195; // km per degree latitude (R = 6371 km)
  const kmLng = kmLat * Math.cos((lat0 * Math.PI) / 180);
  return {
    toXY: (o: { lat: number; lng: number }): XY => [o.lng * kmLng, o.lat * kmLat],
    toLatLng: ([x, y]: XY) => ({ lat: y / kmLat, lng: x / kmLng }),
  };
}

const d2 = (a: XY, b: XY) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

/** k-means++ seeding: first centre uniform, then each next centre with probability proportional to D^2. */
function seedCentres(pts: XY[], k: number, rnd: () => number): XY[] {
  const centres: XY[] = [pts[Math.floor(rnd() * pts.length)]];
  const best = pts.map((p) => d2(p, centres[0]));
  while (centres.length < k) {
    const total = best.reduce((s, v) => s + v, 0);
    let pick = 0;
    if (total > 0) {
      let r = rnd() * total;
      for (let i = 0; i < pts.length; i++) {
        r -= best[i];
        if (r <= 0) { pick = i; break; }
        pick = i;
      }
    } else {
      pick = Math.floor(rnd() * pts.length);
    }
    const c = pts[pick];
    centres.push(c);
    for (let i = 0; i < pts.length; i++) best[i] = Math.min(best[i], d2(pts[i], c));
  }
  return centres.map((c) => [c[0], c[1]] as XY);
}

/** Lloyd iterations. Returns assignment, centres and iterations used. */
function lloyd(pts: XY[], k: number, seed: number) {
  const rnd = mulberry32(seed);
  let centres = seedCentres(pts, k, rnd);
  const assign = new Array<number>(pts.length).fill(-1);
  let iter = 0;
  for (; iter < MAX_ITER; iter++) {
    let changed = 0;
    for (let i = 0; i < pts.length; i++) {
      let bc = 0, bd = Infinity;
      for (let c = 0; c < k; c++) {
        const d = d2(pts[i], centres[c]);
        if (d < bd) { bd = d; bc = c; } // strict < keeps the lowest index on ties (deterministic)
      }
      if (assign[i] !== bc) { assign[i] = bc; changed++; }
    }
    // new centres = means; an empty zone takes the order farthest from its own centre
    const sum = Array.from({ length: k }, () => [0, 0, 0]);
    pts.forEach((p, i) => { const s = sum[assign[i]]; s[0] += p[0]; s[1] += p[1]; s[2]++; });
    const next: XY[] = sum.map((s, c) => (s[2] ? [s[0] / s[2], s[1] / s[2]] : centres[c]));
    for (let c = 0; c < k; c++) {
      if (sum[c][2]) continue;
      let far = -1, fd = -1;
      pts.forEach((p, i) => {
        if (sum[assign[i]][2] <= 1) return; // never empty another zone
        const d = d2(p, next[assign[i]]);
        if (d > fd) { fd = d; far = i; }
      });
      if (far >= 0) {
        sum[assign[far]][2]--;
        assign[far] = c;
        sum[c][2] = 1;
        next[c] = [pts[far][0], pts[far][1]];
        changed++;
      }
    }
    centres = next;
    if (changed === 0) break;
  }
  return { assign, centres, iterations: Math.min(iter + 1, MAX_ITER) };
}

/** Mean silhouette score. dist = precomputed pairwise Euclidean km. Singletons score 0 (standard convention). */
export function silhouetteScore(dist: Float64Array, n: number, assign: number[], k: number): number {
  if (n < 2 || k < 2) return 0;
  const sizes = new Array<number>(k).fill(0);
  assign.forEach((c) => sizes[c]++);
  let total = 0;
  const sums = new Float64Array(k);
  for (let i = 0; i < n; i++) {
    sums.fill(0);
    for (let j = 0; j < n; j++) if (j !== i) sums[assign[j]] += dist[i * n + j];
    const own = assign[i];
    if (sizes[own] <= 1) continue; // s(i) = 0
    const a = sums[own] / (sizes[own] - 1);
    let b = Infinity;
    for (let c = 0; c < k; c++) if (c !== own && sizes[c] > 0) b = Math.min(b, sums[c] / sizes[c]);
    if (!Number.isFinite(b)) continue;
    const m = Math.max(a, b);
    total += m > 0 ? (b - a) / m : 0;
  }
  return total / n;
}

function pairwise(pts: XY[]): Float64Array {
  const n = pts.length;
  const dist = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = Math.sqrt(d2(pts[i], pts[j]));
      dist[i * n + j] = d;
      dist[j * n + i] = d;
    }
  }
  return dist;
}

/** Nearest-neighbour tour (start at `start`, visit all, no return) in road km. */
function nnTourKm(orders: Order[], idxs: number[], start: number, detour: number): number {
  if (idxs.length <= 1) return 0;
  const left = new Set(idxs);
  left.delete(start);
  let cur = start;
  let km = 0;
  while (left.size) {
    let best = -1, bd = Infinity;
    for (const j of left) {
      const d = haversineKm(orders[cur], orders[j]);
      if (d < bd || (d === bd && j < best)) { bd = d; best = j; }
    }
    km += bd * detour;
    left.delete(best);
    cur = best;
  }
  return km;
}

function finish(orders: Order[], assign: number[], centresXY: XY[], toLatLng: (p: XY) => { lat: number; lng: number }) {
  const k = centresXY.length;
  const detour = assumptions.fallback.haversine_detour_factor;
  const centroids = centresXY.map(toLatLng);
  const members: number[][] = Array.from({ length: k }, () => []);
  assign.forEach((c, i) => members[c].push(i));
  const hubs: MicroHub[] = members.map((idxs, zone) => {
    let best = idxs[0] ?? 0, bd = Infinity;
    for (const i of idxs) {
      const d = haversineKm(orders[i], centroids[zone]);
      if (d < bd) { bd = d; best = i; }
    }
    const o = orders[best];
    return { zone, orderIdx: best, orderId: o?.id ?? "", lat: o?.lat ?? centroids[zone].lat, lng: o?.lng ?? centroids[zone].lng };
  });
  const tours = members.map((idxs, z) => nnTourKm(orders, idxs, hubs[z].orderIdx, detour));
  // stops per km: zone stops / tour km (a zone with one stop has no tour; report 0, not infinity)
  const stopsPerKm = members.map((idxs, z) => (tours[z] > 0 ? idxs.length / tours[z] : 0));
  return { centroids, hubs, stopsPerKm };
}

/**
 * Cluster orders into delivery zones.
 * @param orders  seeded orders (problem.orders)
 * @param k       number of zones; omit (or pass undefined) to choose k in 3..10 by silhouette
 * @param seed    k-means++ seed (default 2611, the project seed)
 */
export function clusterZones(orders: Order[], k?: number, seed = 2611): ZoneResult {
  const n = orders.length;
  if (n === 0) return { k: 0, assignment: [], centroids: [], silhouette: 0, hubs: [], stopsPerKm: [], iterations: 0, autoK: k === undefined };
  const { toXY, toLatLng } = projector(orders);
  const pts = orders.map(toXY);
  const dist = pairwise(pts);
  const maxK = Math.min(K_MAX, n);

  const runK = (kk: number) => {
    const r = lloyd(pts, kk, seed);
    return { ...r, k: kk, silhouette: silhouetteScore(dist, n, r.assign, kk) };
  };

  let chosen: ReturnType<typeof runK>;
  let byK: { k: number; silhouette: number }[] | undefined;
  if (k === undefined) {
    byK = [];
    let best: ReturnType<typeof runK> | null = null;
    for (let kk = Math.min(K_MIN, maxK); kk <= maxK; kk++) {
      const r = runK(kk);
      byK.push({ k: kk, silhouette: r.silhouette });
      if (!best || r.silhouette > best.silhouette + 1e-12) best = r; // ties keep the smaller k
    }
    chosen = best!;
  } else {
    chosen = runK(Math.max(1, Math.min(Math.round(k), n)));
  }

  const extra = finish(orders, chosen.assign, chosen.centres, toLatLng);
  return {
    k: chosen.k,
    assignment: chosen.assign,
    centroids: extra.centroids,
    silhouette: chosen.silhouette,
    hubs: extra.hubs,
    stopsPerKm: extra.stopsPerKm,
    iterations: chosen.iterations,
    silhouetteByK: byK,
    autoK: k === undefined,
  };
}

/** Per-zone statistics for tables and charts: orders, parcels, urgent share, spread, tour and stops per km. */
export function zoneStats(orders: Order[], zones: ZoneResult): ZoneStat[] {
  const detour = assumptions.fallback.haversine_detour_factor;
  return zones.centroids.map((c, zone) => {
    const idxs = zones.assignment.flatMap((z, i) => (z === zone ? [i] : []));
    const n = idxs.length;
    let pairSum = 0, pairs = 0;
    for (let a = 0; a < n; a++) {
      for (let b = a + 1; b < n; b++) { pairSum += haversineKm(orders[idxs[a]], orders[idxs[b]]); pairs++; }
    }
    const hub = zones.hubs[zone];
    const tourKm = nnTourKm(orders, idxs, hub.orderIdx, detour);
    return {
      zone,
      orders: n,
      parcels: idxs.reduce((s, i) => s + orders[i].weight, 0),
      urgentShare: n ? idxs.filter((i) => orders[i].urgent).length / n : 0,
      avgKmToCentroid: n ? idxs.reduce((s, i) => s + haversineKm(orders[i], c), 0) / n : 0,
      avgIntraKm: pairs ? pairSum / pairs : 0,
      tourKm,
      stopsPerKm: tourKm > 0 ? n / tourKm : 0,
      hub,
    };
  });
}
