import { describe, expect, it } from "vitest";
import { assumptions } from "@/lib/assumptions";
import {
  GRID_AXES, HORIZON_MONTHS, TORNADO_PARAMS, assumedRanges, breakEvenSaving, computeRoi, formatAed, formatPayback, parseRange,
  paybackFromApproval, pilotExposure, roi, roiInputs, scenarios, sensitivityGrid, tornado, tornadoRanges, withParam, type RoiInputs,
} from "@/lib/roi";

/** Hand-checkable inputs (round numbers, not the frozen run). */
const HAND: RoiInputs = {
  costBase: 20, costAi: 15, kmCostBase: 4, kmCostAi: 3,
  pilotInvestment: 420_000, monthlyRunningCost: 38_000, parcelsPerDay: 1_500, workingDaysPerYear: 330,
  adoptionHaircut: 0.6, savingFactor: 1, costPerKmFactor: 1,
};
const inf = (x: number | null) => (x === null ? Infinity : x);

describe("ROI model (owner: Harsh, docs/10_roi_model.md)", () => {
  it("matches a hand calculation", () => {
    // saving per parcel = (20 - 15) x 0.6 = 3.00 AED; 330 / 12 = 27.5 days a month
    // monthly saving = 3 x 1,500 x 27.5 = 123,750; net = 123,750 - 38,000 = 85,750
    // payback = 420,000 / 85,750 = 4.8980 months; annual net = 1,029,000
    // net after 12 months = -420,000 + 12 x 85,750 = 609,000; after 36 = 2,667,000
    const r = computeRoi(HAND);
    expect(r.savingPerParcel).toBeCloseTo(3, 10);
    expect(r.monthlySaving).toBeCloseTo(123_750, 6);
    expect(r.netMonthly).toBeCloseTo(85_750, 6);
    expect(r.paybackMonths!).toBeCloseTo(4.898, 3);
    expect(r.annualNet).toBeCloseTo(1_029_000, 6);
    expect(r.net12).toBeCloseTo(609_000, 6);
    expect(r.net36).toBeCloseTo(2_667_000, 6);
    expect(r.cumulative).toHaveLength(HORIZON_MONTHS + 1);
    expect(r.cumulative[0]).toBe(-420_000);
    expect(r.cumulative[36]).toBeCloseTo(r.net36, 6);
    expect(r.breakEvenMonth).toBe(5);
    expect(r.cumulative[4]).toBeLessThan(0);
    expect(r.cumulative[5]).toBeGreaterThanOrEqual(0);
    expect(r.simulatedSavingPct).toBeCloseTo(25, 10);
    expect(r.effectiveSavingPct).toBeCloseTo(15, 10);
    expect(r.benchmark).toBe("within");
    expect(r.roi36Pct!).toBeCloseTo((2_667_000 / 420_000) * 100, 6);
  });

  it("keeps the v0 call roi(assumptions, base, ai, factor) on the assumptions.json values", () => {
    const b = assumptions.business_case;
    const r = roi(assumptions, 17.79, 13.62, 0.5);
    const perParcel = (17.79 - 13.62) * b.adoption_haircut * 0.5;
    const net = perParcel * b.parcels_per_day * (b.working_days_per_year / 12) - b.monthly_running_cost_aed;
    expect(r.netMonthly).toBeCloseTo(net, 6);
    expect(r.paybackMonths!).toBeCloseTo(b.pilot_investment_aed / net, 6);
  });

  it("gives no payback when AI is not cheaper, or when the saving does not cover running costs", () => {
    for (const costAi of [20, 21]) {
      const r = computeRoi({ ...HAND, costAi });
      expect(r.savingPerParcel).toBeLessThanOrEqual(0);
      expect(r.paybackMonths).toBeNull();
      expect(r.breakEvenMonth).toBeNull();
      expect(r.cumulative[36]).toBeLessThan(r.cumulative[0]);
      expect(formatPayback(r.paybackMonths)).toBe("no payback");
    }
    // saving exists but is smaller than the running cost: 0.5 x 0.6 x 1,500 x 27.5 = 12,375 < 38,000
    const thin = computeRoi({ ...HAND, costAi: 19.5 });
    expect(thin.savingPerParcel).toBeGreaterThan(0);
    expect(thin.netMonthly).toBeLessThan(0);
    expect(thin.paybackMonths).toBeNull();
    // zero volume never divides by zero
    expect(computeRoi({ ...HAND, parcelsPerDay: 0 }).paybackMonths).toBeNull();
  });

  it("pays back faster when more of the saving is kept (monotonic in adoption)", () => {
    const pb = GRID_AXES.adoptionHaircut.map((h) => inf(computeRoi(withParam(HAND, "adoptionHaircut", h)).paybackMonths));
    for (let k = 1; k < pb.length; k++) expect(pb[k]).toBeLessThan(pb[k - 1]);
  });

  it("halving the saving factor never shortens payback (payback_half >= payback)", () => {
    const full = computeRoi(HAND).paybackMonths!;
    const half = computeRoi({ ...HAND, savingFactor: 0.5 }).paybackMonths!;
    // 1.5 x 1,500 x 27.5 = 61,875 - 38,000 = 23,875; 420,000 / 23,875 = 17.59 months
    expect(half).toBeCloseTo(17.592, 3);
    expect(half).toBeGreaterThan(full);
  });

  it("orders the scenarios conservative <= base <= optimistic", () => {
    const s = scenarios(HAND, assumptions);
    expect(s.map((x) => x.id)).toEqual(["conservative", "base", "optimistic"]);
    const [c, b, o] = s.map((x) => x.result);
    expect(inf(c.paybackMonths)).toBeGreaterThanOrEqual(inf(b.paybackMonths));
    expect(inf(b.paybackMonths)).toBeGreaterThanOrEqual(inf(o.paybackMonths));
    expect(c.net36).toBeLessThanOrEqual(b.net36);
    expect(b.net36).toBeLessThanOrEqual(o.net36);
    // base scenario = the inputs unchanged; the ends of the adoption range come from assumptions.json (0.4 to 0.8)
    expect(b.paybackMonths).toBe(computeRoi(HAND).paybackMonths);
    expect(s[0].overrides.adoptionHaircut).toBe(0.4);
    expect(s[2].overrides.adoptionHaircut).toBe(0.8);
  });

  it("builds the sensitivity grid cell by cell from the same formula", () => {
    const g = sensitivityGrid(HAND, { param: "adoptionHaircut", values: GRID_AXES.adoptionHaircut }, { param: "parcelsPerDay", values: GRID_AXES.parcelsPerDay });
    expect(g.cells).toHaveLength(GRID_AXES.adoptionHaircut.length);
    g.cells.forEach((row) => expect(row).toHaveLength(GRID_AXES.parcelsPerDay.length));
    const [r, c] = [2, 1]; // 0.6 adoption, 1,500 parcels = the inputs themselves
    expect(g.cells[r][c]).toBe(computeRoi(HAND).paybackMonths);
    // more parcels per day always helps (left to right) when there is a payback
    for (const row of g.cells) for (let k = 1; k < row.length; k++) expect(inf(row[k])).toBeLessThanOrEqual(inf(row[k - 1]));
  });

  it("scales only the km part of each cost with the cost-per-km factor", () => {
    expect(computeRoi({ ...HAND, costPerKmFactor: 1 }).simulatedSavingPerParcel).toBeCloseTo(5, 10);
    // km part: 4 vs 3 AED; at 1.3x the gap grows by 0.3 x (4 - 3) = 0.3 AED
    const dear = computeRoi({ ...HAND, costPerKmFactor: 1.3 });
    expect(dear.costBaseAdj).toBeCloseTo(21.2, 10);
    expect(dear.simulatedSavingPerParcel).toBeCloseTo(5.3, 10);
    // without a km split the factor has no effect
    expect(computeRoi({ ...HAND, kmCostBase: undefined, kmCostAi: undefined, costPerKmFactor: 1.3 }).simulatedSavingPerParcel).toBeCloseTo(5, 10);
  });

  it("inverts payback for the cost gate: the break-even saving gives exactly the target payback", () => {
    const be = breakEvenSaving(HAND, 24);
    // net needed = 420,000 / 24 = 17,500; monthly saving = 55,500; per parcel = 55,500 / 41,250 = 1.3455 AED
    expect(be.savingPerParcel).toBeCloseTo(1.34545, 4);
    expect(be.pctOfBaseCost).toBeCloseTo(6.7273, 3);
    expect(be.shareOfSimulated!).toBeCloseTo(0.26909, 4);
    // feed that saving back in as the full (unhaircut) saving: payback must be 24 months
    const check = computeRoi({ ...HAND, costAi: HAND.costBase - be.savingPerParcel, adoptionHaircut: 1 });
    expect(check.paybackMonths!).toBeCloseTo(24, 8);
  });

  it("reads assumed ranges from assumptions.json and ranks the tornado by payback swing", () => {
    const ranges = assumedRanges(assumptions);
    expect(ranges.adoptionHaircut).toEqual([0.4, 0.8]);
    expect(ranges.pilotInvestment).toEqual([300_000, 600_000]);
    expect(ranges.parcelsPerDay).toEqual([1_000, 3_000]);
    expect(ranges.costPerKmFactor[0]).toBeCloseTo(0.6 / 0.85, 10);
    const t = tornado(HAND, ranges);
    expect(t).toHaveLength(Object.keys(ranges).length);
    for (let k = 1; k < t.length; k++) expect(t[k].swing).toBeLessThanOrEqual(t[k - 1].swing);
    const pilot = t.find((x) => x.param === "pilotInvestment")!;
    expect(pilot.paybackAtLow!).toBeCloseTo(300_000 / 85_750, 8);
    expect(pilot.paybackAtHigh!).toBeCloseTo(600_000 / 85_750, 8);
  });

  it("parses ranges and formats money and months", () => {
    expect(parseRange("300,000 to 600,000")).toEqual([300_000, 600_000]);
    expect(parseRange("0.4 to 0.8")).toEqual([0.4, 0.8]);
    expect(parseRange("n/a")).toBeNull();
    expect(formatPayback(6.44)).toBe("6.4 months");
    expect(formatPayback(0.5)).toBe("under 1 month");
    expect(formatPayback(53.1)).toBe("beyond 36 months");
    expect(formatAed(420_000)).toBe("AED 420,000");
    expect(formatAed(-420_000, true)).toBe("-AED 420k");
    expect(formatAed(2_667_000, true)).toBe("AED 2.7M");
  });

  it("caps the exposure at the all-in pilot budget (same basis as payback), and counts payback from approval", () => {
    expect(pilotExposure(HAND)).toBe(420_000);
    expect(computeRoi(HAND).cumulative[0]).toBe(-pilotExposure(HAND));
    expect(paybackFromApproval(computeRoi(HAND))!).toBeCloseTo(4.898 + 3, 3);
    expect(paybackFromApproval({ paybackMonths: null })).toBeNull();
  });

  it("keeps the saving-factor stress test out of the tornado (it would double-count adoption)", () => {
    const r = tornadoRanges(assumptions);
    expect(Object.keys(r).sort()).toEqual([...TORNADO_PARAMS].sort());
    expect(r.savingFactor).toBeUndefined();
  });

  it("uses the assumptions.json business case when building inputs", () => {
    const i = roiInputs(assumptions, 17.79, 13.62);
    expect(i.pilotInvestment).toBe(assumptions.business_case.pilot_investment_aed);
    expect(i.adoptionHaircut).toBe(assumptions.business_case.adoption_haircut);
    expect(i.savingFactor).toBe(1);
    expect(i.costPerKmFactor).toBe(1);
  });
});
