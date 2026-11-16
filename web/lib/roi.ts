import type { Assumptions } from "@/lib/types";

/**
 * ROI model (owner: Harsh). Formulas: docs/10_roi_model.md. Used by /business-case, web/scripts/freeze.ts and Slide 7.
 *
 * Every input is ASSUMED (data_seed/assumptions.json "business_case", labelled in the Assumptions drawer) except the two
 * costs per parcel, which are SIMULATED by the engine on the seeded day (baseline vs AI, same orders).
 *
 *   saving per parcel   = (cost_base - cost_ai) x adoption haircut x saving factor
 *   monthly saving      = saving per parcel x parcels per day x (working days per year / 12)
 *   net monthly benefit = monthly saving - monthly running cost
 *   annual net saving   = net monthly benefit x 12
 *   payback (months)    = pilot investment / net monthly benefit   (null = "no payback" when the benefit is <= 0)
 *   cumulative cash     = -pilot investment + net monthly benefit x month   (month 0 .. 36)
 *
 * Simple payback on purpose (what a board reads first): full network volume from month 1, no ramp-up, no discounting,
 * no tax. The page and slide say so. The optional cost-per-km factor scales only the km part of each cost per parcel
 * (fuel and upkeep price what-if); it needs the km cost split from the engine (kpi.ts costBreakdown).
 */

/** Months shown in the cumulative cash chart and used for the 36-month net. */
export const HORIZON_MONTHS = 36;
/** docs/10: sensitivity cells above this payback are flagged red (also the payback target behind the cost gate). */
export const PAYBACK_TARGET_MONTHS = 24;
/** Length of the pilot before roll-out (90 days). Payback is counted from roll-out, so add this for "from approval". */
export const PILOT_MONTHS = 3;
/** McKinsey: AI in distribution can cut logistics costs by roughly 5 to 20 % (research brief R7). Sanity range only. */
export const BENCHMARK_PCT: readonly [number, number] = [5, 20];

export interface RoiInputs {
  /** AED per parcel, baseline plan (simulated) */
  costBase: number;
  /** AED per parcel, AI plan (simulated) */
  costAi: number;
  /** AED per parcel that comes from km (part of costBase). Needed only for the cost-per-km factor. */
  kmCostBase?: number;
  /** AED per parcel that comes from km (part of costAi). */
  kmCostAi?: number;
  pilotInvestment: number;
  monthlyRunningCost: number;
  parcelsPerDay: number;
  workingDaysPerYear: number;
  /** share of the simulated saving assumed to survive in real operations (0.6 = 40 % haircut) */
  adoptionHaircut: number;
  /** stress test on top of the haircut: 1 = full, 0.5 = half the savings (docs/10 "payback_half") */
  savingFactor: number;
  /** multiplies the assumed AED per km of every vehicle (1 = as assumed) */
  costPerKmFactor: number;
}

/** Inputs a what-if can move (sliders, sensitivity grid, tornado, scenarios). */
export type RoiParam =
  | "adoptionHaircut" | "parcelsPerDay" | "savingFactor" | "costPerKmFactor"
  | "monthlyRunningCost" | "pilotInvestment" | "workingDaysPerYear";

export const PARAM_LABEL: Record<RoiParam, string> = {
  adoptionHaircut: "Share of simulated saving kept",
  parcelsPerDay: "Parcels per day",
  savingFactor: "Saving factor (stress test)",
  costPerKmFactor: "Cost per km (vs assumed)",
  monthlyRunningCost: "Monthly running cost",
  pilotInvestment: "Pilot investment",
  workingDaysPerYear: "Working days per year",
};

export type Benchmark = "below" | "within" | "above";

export interface RoiResult {
  inputs: RoiInputs;
  /** cost per parcel after the cost-per-km factor (AED) */
  costBaseAdj: number;
  costAiAdj: number;
  /** simulated saving before any haircut (AED per parcel and % of baseline cost) */
  simulatedSavingPerParcel: number;
  simulatedSavingPct: number;
  /** saving after haircut and saving factor (AED per parcel and % of baseline cost) */
  savingPerParcel: number;
  effectiveSavingPct: number;
  /** where the effective saving sits against the 5 to 20 % benchmark (R7) */
  benchmark: Benchmark;
  monthlySaving: number;
  /** net monthly benefit (kept under the v0 name) */
  netMonthly: number;
  annualNet: number;
  /** null = not paid back (net monthly benefit <= 0) */
  paybackMonths: number | null;
  /** cumulative net cash after 12 and 36 months, pilot investment included */
  net12: number;
  net36: number;
  /** cumulative net cash at month 0..HORIZON_MONTHS (index = month) */
  cumulative: number[];
  /** first whole month with cumulative cash >= 0 inside the horizon, else null */
  breakEvenMonth: number | null;
  /** net36 / pilot investment, in % (null if the pilot costs nothing) */
  roi36Pct: number | null;
}

const finite = (x: number | undefined, fallback = 0) => (typeof x === "number" && Number.isFinite(x) ? x : fallback);

/** Monthly operating days (330 days a year -> 27.5 a month). */
export function daysPerMonth(i: Pick<RoiInputs, "workingDaysPerYear">): number {
  return Math.max(0, finite(i.workingDaysPerYear)) / 12;
}

/** Cost per parcel after scaling only its km part by the cost-per-km factor. */
function adjustCost(cost: number, kmCost: number | undefined, factor: number): number {
  return cost + (finite(factor, 1) - 1) * finite(kmCost);
}

export function computeRoi(inputs: RoiInputs, horizon = HORIZON_MONTHS): RoiResult {
  const i = inputs;
  const costBaseAdj = adjustCost(finite(i.costBase), i.kmCostBase, i.costPerKmFactor);
  const costAiAdj = adjustCost(finite(i.costAi), i.kmCostAi, i.costPerKmFactor);
  const simulatedSavingPerParcel = costBaseAdj - costAiAdj;
  const savingPerParcel = simulatedSavingPerParcel * finite(i.adoptionHaircut) * finite(i.savingFactor, 1);
  const parcels = Math.max(0, finite(i.parcelsPerDay));
  const monthlySaving = savingPerParcel * parcels * daysPerMonth(i);
  const pilot = Math.max(0, finite(i.pilotInvestment));
  const netMonthly = monthlySaving - finite(i.monthlyRunningCost);
  const paybackMonths = netMonthly > 0 ? pilot / netMonthly : null;
  const cumulative = Array.from({ length: horizon + 1 }, (_, m) => -pilot + netMonthly * m);
  const breakEvenMonth = paybackMonths !== null && paybackMonths <= horizon ? Math.max(0, Math.ceil(paybackMonths - 1e-9)) : null;
  const pct = (x: number) => (costBaseAdj > 0 ? (x / costBaseAdj) * 100 : 0);
  const effectiveSavingPct = pct(savingPerParcel);
  const net36 = -pilot + netMonthly * 36;
  return {
    inputs,
    costBaseAdj,
    costAiAdj,
    simulatedSavingPerParcel,
    simulatedSavingPct: pct(simulatedSavingPerParcel),
    savingPerParcel,
    effectiveSavingPct,
    benchmark: effectiveSavingPct < BENCHMARK_PCT[0] ? "below" : effectiveSavingPct > BENCHMARK_PCT[1] ? "above" : "within",
    monthlySaving,
    netMonthly,
    annualNet: netMonthly * 12,
    paybackMonths,
    net12: -pilot + netMonthly * 12,
    net36,
    cumulative,
    breakEvenMonth,
    roi36Pct: pilot > 0 ? (net36 / pilot) * 100 : null,
  };
}

/** Inputs from assumptions.json plus the simulated costs per parcel (and, optionally, their km parts). */
export function roiInputs(
  a: Assumptions, costBase: number, costAi: number,
  extra: Partial<Pick<RoiInputs, "kmCostBase" | "kmCostAi" | "savingFactor" | "costPerKmFactor">> = {},
): RoiInputs {
  const b = a.business_case;
  return {
    costBase,
    costAi,
    kmCostBase: extra.kmCostBase,
    kmCostAi: extra.kmCostAi,
    pilotInvestment: b.pilot_investment_aed,
    monthlyRunningCost: b.monthly_running_cost_aed,
    parcelsPerDay: b.parcels_per_day,
    workingDaysPerYear: b.working_days_per_year,
    adoptionHaircut: b.adoption_haircut,
    savingFactor: extra.savingFactor ?? 1,
    costPerKmFactor: extra.costPerKmFactor ?? 1,
  };
}

/** v0 signature kept for callers: roi(assumptions, costBase, costAi, savingFactor). */
export function roi(a: Assumptions, costBase: number, costAi: number, savingFactor = 1): RoiResult {
  return computeRoi(roiInputs(a, costBase, costAi, { savingFactor }));
}

export const withParam = (inputs: RoiInputs, param: RoiParam, value: number): RoiInputs => ({ ...inputs, [param]: value });

/**
 * Most the company can lose if it stops at the Day-90 gate: the pilot build plus running cost during the pilot.
 * (Pilot-zone savings during those 90 days are ignored on purpose: they are small and unproven.)
 */
export function pilotExposure(i: Pick<RoiInputs, "pilotInvestment" | "monthlyRunningCost">): number {
  return Math.max(0, finite(i.pilotInvestment)) + PILOT_MONTHS * Math.max(0, finite(i.monthlyRunningCost));
}

/** Payback counted from the approval date: 90-day pilot + payback after roll-out (null = no payback). */
export function paybackFromApproval(r: Pick<RoiResult, "paybackMonths">): number | null {
  return r.paybackMonths === null ? null : r.paybackMonths + PILOT_MONTHS;
}

/* ---------------- assumed ranges (read from the provenance block of assumptions.json) ---------------- */

const PROVENANCE_KEY: Partial<Record<RoiParam, string>> = {
  adoptionHaircut: "business_case.adoption_haircut",
  parcelsPerDay: "business_case.parcels_per_day",
  monthlyRunningCost: "business_case.monthly_running_cost_aed",
  pilotInvestment: "business_case.pilot_investment_aed",
  workingDaysPerYear: "business_case.working_days_per_year",
};

/** "300,000 to 600,000" -> [300000, 600000]; null if the text has no "a to b" range. */
export function parseRange(text: string | undefined): [number, number] | null {
  const m = text?.match(/(-?[\d.,]+)\s*to\s*(-?[\d.,]+)/);
  if (!m) return null;
  const lo = Number(m[1].replace(/,/g, "")), hi = Number(m[2].replace(/,/g, ""));
  return Number.isFinite(lo) && Number.isFinite(hi) ? [Math.min(lo, hi), Math.max(lo, hi)] : null;
}

/**
 * Plausible range of each what-if input. Business-case ranges come from assumptions.json (provenance);
 * saving factor 0.5 to 1.0 is the docs/10 stress test; the cost-per-km factor uses the van AED/km range
 * divided by the assumed van AED/km (0.6 to 1.2 vs 0.85). Missing ranges fall back to +/-25 %.
 */
export function assumedRanges(a: Assumptions): Record<RoiParam, [number, number]> {
  const prov = (a as unknown as { provenance?: Record<string, { range?: string }> }).provenance ?? {};
  const b = a.business_case;
  const base: Record<RoiParam, number> = {
    adoptionHaircut: b.adoption_haircut, parcelsPerDay: b.parcels_per_day, monthlyRunningCost: b.monthly_running_cost_aed,
    pilotInvestment: b.pilot_investment_aed, workingDaysPerYear: b.working_days_per_year, savingFactor: 1, costPerKmFactor: 1,
  };
  const out = {} as Record<RoiParam, [number, number]>;
  for (const p of Object.keys(base) as RoiParam[]) {
    const key = PROVENANCE_KEY[p];
    out[p] = (key && parseRange(prov[key]?.range)) || [base[p] * 0.75, base[p] * 1.25];
  }
  out.savingFactor = [0.5, 1];
  const van = parseRange(prov["vehicles.van.cost_per_km_aed"]?.range);
  const vanCost = a.vehicles.van.cost_per_km_aed;
  out.costPerKmFactor = van && vanCost > 0 ? [van[0] / vanCost, van[1] / vanCost] : [0.75, 1.25];
  return out;
}

/* ---------------- scenarios ---------------- */

export type ScenarioId = "conservative" | "base" | "optimistic";

export interface ScenarioDef {
  id: ScenarioId;
  label: string;
  /** one-line definition shown on the card */
  note: string;
  overrides: Partial<Pick<RoiInputs, "adoptionHaircut" | "parcelsPerDay">>;
}

/** Volume step for the scenarios: +/-500 parcels a day (the docs/10 sensitivity columns 1,000 / 1,500 / 2,000). */
export const SCENARIO_VOLUME_STEP = 500;

/**
 * Three scenarios that move only the two least certain drivers, adoption and volume, one step each way:
 * adoption to the ends of its assumed range (0.4 / 0.8), volume -/+500 parcels a day. Costs stay as assumed.
 */
export function scenarioDefs(a: Assumptions): ScenarioDef[] {
  const [adLo, adHi] = assumedRanges(a).adoptionHaircut;
  const b = a.business_case;
  return [
    { id: "conservative", label: "Conservative", note: "low adoption, lower volume", overrides: { adoptionHaircut: adLo, parcelsPerDay: b.parcels_per_day - SCENARIO_VOLUME_STEP } },
    { id: "base", label: "Base", note: "assumptions.json defaults", overrides: {} },
    { id: "optimistic", label: "Optimistic", note: "high adoption, higher volume", overrides: { adoptionHaircut: adHi, parcelsPerDay: b.parcels_per_day + SCENARIO_VOLUME_STEP } },
  ];
}

export interface ScenarioResult extends ScenarioDef { result: RoiResult }

export function scenarios(inputs: RoiInputs, a: Assumptions): ScenarioResult[] {
  return scenarioDefs(a).map((d) => ({ ...d, result: computeRoi({ ...inputs, ...d.overrides }) }));
}

/* ---------------- sensitivity ---------------- */

export interface Axis { param: RoiParam; values: number[] }
export interface SensitivityGrid {
  rows: Axis;
  cols: Axis;
  /** payback months per cell, cells[row][col]; null = no payback */
  cells: (number | null)[][];
}

/** Two-way sensitivity of payback: every other input stays as given. */
export function sensitivityGrid(inputs: RoiInputs, rows: Axis, cols: Axis): SensitivityGrid {
  return {
    rows,
    cols,
    cells: rows.values.map((rv) => cols.values.map((cv) => computeRoi(withParam(withParam(inputs, rows.param, rv), cols.param, cv)).paybackMonths)),
  };
}

/** Standard axes for the page grid. Adoption 40 to 100 % (100 % = simulation fully realised). */
export const GRID_AXES: Record<"adoptionHaircut" | "savingFactor" | "costPerKmFactor" | "parcelsPerDay", number[]> = {
  adoptionHaircut: [0.4, 0.5, 0.6, 0.7, 0.8, 1.0],
  savingFactor: [0.5, 0.75, 1.0],
  costPerKmFactor: [0.7, 0.85, 1.0, 1.15, 1.3, 1.4],
  parcelsPerDay: [1000, 1500, 2000, 2500, 3000],
};

/**
 * Inputs shown in the tornado: only real assumptions with a documented range. The saving factor is a stress-test overlay
 * on top of the share kept (it would double-count adoption), so it is shown separately as "payback at half the savings".
 */
export const TORNADO_PARAMS: RoiParam[] = ["parcelsPerDay", "adoptionHaircut", "pilotInvestment", "monthlyRunningCost", "costPerKmFactor", "workingDaysPerYear"];

export function tornadoRanges(a: Assumptions): Partial<Record<RoiParam, [number, number]>> {
  const all = assumedRanges(a);
  return Object.fromEntries(TORNADO_PARAMS.map((p) => [p, all[p]]));
}

export interface TornadoRow {
  param: RoiParam;
  low: number;
  high: number;
  paybackAtLow: number | null;
  paybackAtHigh: number | null;
  /** spread of payback across the range (months); Infinity when one end has no payback */
  swing: number;
}

/** One-at-a-time sensitivity: payback at each end of every input's assumed range, biggest swing first. */
export function tornado(inputs: RoiInputs, ranges: Partial<Record<RoiParam, [number, number]>>): TornadoRow[] {
  const rows: TornadoRow[] = [];
  for (const [param, range] of Object.entries(ranges) as [RoiParam, [number, number]][]) {
    if (!range) continue;
    const [low, high] = range;
    const pl = computeRoi(withParam(inputs, param, low)).paybackMonths;
    const ph = computeRoi(withParam(inputs, param, high)).paybackMonths;
    const swing = pl === null || ph === null ? Infinity : Math.abs(pl - ph);
    rows.push({ param, low, high, paybackAtLow: pl, paybackAtHigh: ph, swing });
  }
  return rows.sort((x, y) => (y.swing === x.swing ? x.param.localeCompare(y.param) : y.swing - x.swing));
}

/* ---------------- go/no-go gate on cost ---------------- */

export interface BreakEven {
  targetMonths: number;
  /** real saving per parcel (AED) the pilot must show for payback within targetMonths */
  savingPerParcel: number;
  /** the same as % of the baseline cost per parcel: the cost gate for Day 90 */
  pctOfBaseCost: number;
  /** that saving as a share of the simulated saving (0.32 = only 32 % of the simulated saving is needed) */
  shareOfSimulated: number | null;
}

/**
 * Real (measured) saving per parcel needed so that payback = targetMonths at the assumed volume and running cost.
 * Inverts the payback formula: net = pilot / target; monthly saving = net + running; per parcel = monthly / (parcels x days).
 */
export function breakEvenSaving(inputs: RoiInputs, targetMonths = PAYBACK_TARGET_MONTHS): BreakEven {
  const base = computeRoi(inputs);
  const parcelsMonth = Math.max(0, finite(inputs.parcelsPerDay)) * daysPerMonth(inputs);
  const net = Math.max(0, finite(inputs.pilotInvestment)) / targetMonths;
  const savingPerParcel = parcelsMonth > 0 ? (net + finite(inputs.monthlyRunningCost)) / parcelsMonth : Infinity;
  return {
    targetMonths,
    savingPerParcel,
    pctOfBaseCost: base.costBaseAdj > 0 ? (savingPerParcel / base.costBaseAdj) * 100 : Infinity,
    shareOfSimulated: base.simulatedSavingPerParcel > 0 ? savingPerParcel / base.simulatedSavingPerParcel : null,
  };
}

/* ---------------- formatting (pages and slide use the same rules) ---------------- */

/** "6.4 months", "under 1 month", "beyond 36 months" (decimals there are noise) or "no payback". */
export function formatPayback(m: number | null, digits = 1): string {
  if (m === null || !Number.isFinite(m)) return "no payback";
  if (m < 1) return "under 1 month";
  if (m > HORIZON_MONTHS) return `beyond ${HORIZON_MONTHS} months`;
  return `${m.toFixed(digits)} months`;
}

/** AED with thousands separators, or compact (AED 782k, AED 1.2M) for tight spaces. */
export function formatAed(x: number, compact = false): string {
  const sign = x < 0 ? "-" : "";
  const v = Math.abs(x);
  if (compact && v >= 999_500) return `${sign}AED ${(v / 1_000_000).toFixed(v >= 9_995_000 ? 0 : 1)}M`;
  if (compact && v >= 1_000) return `${sign}AED ${Math.round(v / 1_000)}k`;
  return `${sign}AED ${Math.round(v).toLocaleString("en-US")}`;
}
