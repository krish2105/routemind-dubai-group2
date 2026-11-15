import type { Assumptions } from "@/lib/types";

/**
 * ROI model v0 (formulas in docs/10_roi_model.md). Owner: Harsh.
 * Inputs from assumptions + the frozen cost per parcel of baseline and AI.
 */
export interface RoiResult {
  monthlySaving: number;
  netMonthly: number;
  annualNet: number;
  paybackMonths: number | null;
}

export function roi(a: Assumptions, costBase: number, costAi: number, savingFactor = 1): RoiResult {
  const b = a.business_case;
  const savingPerParcel = (costBase - costAi) * b.adoption_haircut * savingFactor;
  const monthlySaving = savingPerParcel * b.parcels_per_day * (b.working_days_per_year / 12);
  const netMonthly = monthlySaving - b.monthly_running_cost_aed;
  return {
    monthlySaving,
    netMonthly,
    annualNet: netMonthly * 12,
    paybackMonths: netMonthly > 0 ? b.pilot_investment_aed / netMonthly : null,
  };
}
