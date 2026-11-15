import { describe, expect, it } from "vitest";
import { assumptions } from "@/lib/assumptions";
import { buildProblem, defaultScenario } from "@/lib/engine/problem";
import { clusterZones, K_MAX, K_MIN, silhouetteScore, zoneStats } from "@/lib/engine/kmeans";
import type { Order } from "@/lib/types";

const orders = buildProblem(assumptions, defaultScenario(assumptions)).orders;

const mk = (id: string, lat: number, lng: number, urgent = false): Order => ({
  id, pointId: "x", lat, lng, weight: 1, windowStart: 540, windowEnd: 660, urgent, cod: false, serviceMin: 0,
});

describe("k-means zoning (owner: Yash)", () => {
  it("same seed gives the same assignment (deterministic)", () => {
    const a = clusterZones(orders, 6, 2611);
    const b = clusterZones(orders, 6, 2611);
    expect(a.assignment).toEqual(b.assignment);
    expect(a.centroids).toEqual(b.centroids);
    expect(a.hubs).toEqual(b.hubs);
  });

  it("every order is assigned exactly once to a valid zone, and all k zones are non-empty", () => {
    for (const k of [3, 6, 10]) {
      const z = clusterZones(orders, k);
      expect(z.k).toBe(k);
      expect(z.assignment).toHaveLength(orders.length);
      const sizes = new Array(k).fill(0);
      for (const c of z.assignment) {
        expect(Number.isInteger(c)).toBe(true);
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThan(k);
        sizes[c]++;
      }
      expect(sizes.every((s) => s > 0)).toBe(true);
      expect(sizes.reduce((s, v) => s + v, 0)).toBe(orders.length);
    }
  });

  it("silhouette is in [-1, 1]", () => {
    for (const k of [3, 5, 8]) {
      const s = clusterZones(orders, k).silhouette!;
      expect(s).toBeGreaterThanOrEqual(-1);
      expect(s).toBeLessThanOrEqual(1);
    }
  });

  it("auto-k returns k in 3..10 and picks the best silhouette it tried", () => {
    const z = clusterZones(orders);
    expect(z.autoK).toBe(true);
    expect(z.k).toBeGreaterThanOrEqual(K_MIN);
    expect(z.k).toBeLessThanOrEqual(K_MAX);
    expect(z.silhouetteByK).toHaveLength(K_MAX - K_MIN + 1);
    const best = Math.max(...z.silhouetteByK!.map((r) => r.silhouette));
    expect(z.silhouette).toBeCloseTo(best, 12);
  });

  it("each micro-hub is a real order inside its own zone (medoid nearest the centroid)", () => {
    const z = clusterZones(orders, 6);
    expect(z.hubs).toHaveLength(6);
    z.hubs.forEach((h, zone) => {
      expect(orders[h.orderIdx].id).toBe(h.orderId);
      expect(z.assignment[h.orderIdx]).toBe(zone);
    });
    expect(z.stopsPerKm.every((v) => v > 0 && Number.isFinite(v))).toBe(true);
  });

  it("separates two obvious, hand-built clusters perfectly", () => {
    const west = [mk("A1", 25.0, 55.0), mk("A2", 25.001, 55.001), mk("A3", 25.0, 55.002, true)];
    const east = [mk("B1", 25.3, 55.4), mk("B2", 25.301, 55.401), mk("B3", 25.302, 55.4)];
    const z = clusterZones([...west, ...east], 2, 7);
    expect(new Set(z.assignment.slice(0, 3)).size).toBe(1);
    expect(new Set(z.assignment.slice(3)).size).toBe(1);
    expect(z.assignment[0]).not.toBe(z.assignment[3]);
    expect(z.silhouette!).toBeGreaterThan(0.95);
    // the centroid of the west group is its mean (hand-checked)
    const w = z.centroids[z.assignment[0]];
    expect(w.lat).toBeCloseTo(25.000333, 5);
    expect(w.lng).toBeCloseTo(55.001, 5);
    const stats = zoneStats([...west, ...east], z);
    const ws = stats[z.assignment[0]];
    expect(ws.orders).toBe(3);
    expect(ws.parcels).toBe(3);
    expect(ws.urgentShare).toBeCloseTo(1 / 3, 10);
  });

  it("silhouette matches a hand calculation on a 1-D example", () => {
    // points 0, 1 (zone 0) and 10 (zone 1): s(0) = (10-1)/10, s(1) = (9-1)/9, s(10) = 0 (singleton)
    const n = 3;
    const x = [0, 1, 10];
    const dist = new Float64Array(n * n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) dist[i * n + j] = Math.abs(x[i] - x[j]);
    const s = silhouetteScore(dist, n, [0, 0, 1], 2);
    expect(s).toBeCloseTo((0.9 + 8 / 9 + 0) / 3, 12);
  });

  it("zoneStats covers every order once and urgent shares are in [0, 1]", () => {
    const z = clusterZones(orders, 7);
    const st = zoneStats(orders, z);
    expect(st.reduce((s, r) => s + r.orders, 0)).toBe(orders.length);
    for (const r of st) {
      expect(r.urgentShare).toBeGreaterThanOrEqual(0);
      expect(r.urgentShare).toBeLessThanOrEqual(1);
      expect(r.avgKmToCentroid).toBeGreaterThanOrEqual(0);
      expect(r.stopsPerKm).toBeCloseTo(z.stopsPerKm[r.zone], 10);
    }
  });

  it("empty input does not crash", () => {
    const z = clusterZones([], 4);
    expect(z.assignment).toEqual([]);
    expect(zoneStats([], z)).toEqual([]);
  });
});
