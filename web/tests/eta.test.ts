import { afterAll, describe, expect, it } from "vitest";
import raw from "@/public/data/eta_model.json";
import fixtures from "./fixtures/eta_samples.json";
import { evalTrees, predictEta, setEtaModel, type EtaModel } from "@/lib/models/eta";

const m = raw as unknown as EtaModel;

describe("ETA model (TypeScript tree evaluation)", () => {
  afterAll(() => setEtaModel(null));

  it("matches the Python (LightGBM) predictions within 1e-3 on 20 saved test rows", () => {
    expect(fixtures.features).toEqual(m.features);
    expect(fixtures.rows).toHaveLength(20);
    for (const row of fixtures.rows) expect(Math.abs(evalTrees(m, row.x) - row.pred)).toBeLessThan(1e-3);
  });

  it("uses the stub (flagged) before the model is loaded, the model after", () => {
    const input = { distanceKm: 12, hour: 18, rain: false, sandstorm: true, vehicle: "van" as const };
    expect(predictEta(input).stub).toBe(true);
    setEtaModel(m);
    const p = predictEta(input);
    expect(p.stub).toBe(false);
    expect(p.minutes).toBeGreaterThan(0);
    expect(p.delayRiskPct).toBeGreaterThanOrEqual(0);
    expect(p.delayRiskPct).toBeLessThanOrEqual(100);
    // contributions add up to the prediction
    expect(p.contributions.reduce((s, c) => s + c.minutes, 0)).toBeCloseTo(p.minutes, 6);
  });

  it("delay risk rises when the promised slot is tighter", () => {
    setEtaModel(m);
    const base = { distanceKm: 10, hour: 12, rain: false, sandstorm: false, vehicle: "bike" as const };
    expect(predictEta({ ...base, promiseMin: 60 }).delayRiskPct).toBeGreaterThan(predictEta({ ...base, promiseMin: 180 }).delayRiskPct);
  });
});
