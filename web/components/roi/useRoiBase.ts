"use client";
import { useEffect, useMemo } from "react";
import { assumptions } from "@/lib/assumptions";
import { FROZEN } from "@/lib/frozen";
import { buildProblem, defaultScenario } from "@/lib/engine/problem";
import { costBreakdown } from "@/lib/engine/kpi";
import { useScenario, withOverrides } from "@/store/useScenario";

/**
 * Where the business case gets its two simulated costs per parcel (owner: Harsh).
 * 1. After the freeze: docs/frozen_results.json (copied to public/data) holds cost_base_aed / cost_ai_aed and their km parts,
 *    so the page shows exactly the Slide 7 numbers and needs no solver.
 * 2. Before the freeze: a live engine run (baseline vs Clarke-Wright + 2-opt) in the Web Worker, labelled "not frozen".
 */
export interface RoiBase {
  source: "frozen" | "live";
  costBase: number;
  costAi: number;
  kmCostBase?: number;
  kmCostAi?: number;
  /** AI plan behind the cost (cw2opt or ga) */
  algorithm: string;
  frozenAt: string | null;
  /** Slide 7 tokens (null before the freeze) */
  frozenPayback: number | null;
  frozenPaybackHalf: number | null;
  /** simulated operating results used by the gates (frozen when available, else live) */
  onTimeBase: number | null;
  onTimeAi: number | null;
  kmPct: number | null;
  costPct: number | null;
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const meta = (FROZEN as unknown as { _meta?: { ai_algorithm?: string } })._meta;

/** Frozen base, or null when the freeze has not written the ROI inputs yet. */
export function frozenBase(): RoiBase | null {
  const costBase = num(FROZEN.cost_base_aed), costAi = num(FROZEN.cost_ai_aed);
  if (costBase === null || costAi === null) return null;
  return {
    source: "frozen",
    costBase,
    costAi,
    kmCostBase: num(FROZEN.km_cost_base_aed) ?? undefined,
    kmCostAi: num(FROZEN.km_cost_ai_aed) ?? undefined,
    algorithm: meta?.ai_algorithm ?? "cw2opt",
    frozenAt: typeof FROZEN.frozen_at === "string" ? FROZEN.frozen_at : null,
    frozenPayback: num(FROZEN.payback_months),
    frozenPaybackHalf: num(FROZEN.payback_half),
    onTimeBase: num(FROZEN.ontime_base),
    onTimeAi: num(FROZEN.ontime_ai),
    kmPct: num(FROZEN.km_pct),
    costPct: num(FROZEN.cost_pct),
  };
}

export function useRoiBase() {
  const frozen = useMemo(frozenBase, []);
  const { scenario, orderOverrides, results, status, error, run, reset } = useScenario();
  const isDefault = JSON.stringify(scenario) === JSON.stringify(defaultScenario(assumptions)) && Object.keys(orderOverrides).length === 0;
  const bp = results.baseline, ap = results.cw2opt;

  useEffect(() => {
    if (frozen || status !== "idle") return; // no retry loop after an error
    if (!bp || !ap) void run(["baseline", "cw2opt"]);
  }, [frozen, bp, ap, status, run]);

  const live = useMemo<RoiBase | null>(() => {
    if (frozen || !bp || !ap) return null;
    const problem = buildProblem(withOverrides(orderOverrides), scenario);
    const cb = costBreakdown(problem, bp.plan), ca = costBreakdown(problem, ap.plan);
    const kb = bp.kpis, ka = ap.kpis;
    if (!kb.served || !ka.served) return null;
    return {
      source: "live",
      costBase: kb.costPerParcelAed,
      costAi: ka.costPerParcelAed,
      kmCostBase: cb.kmCostAed / kb.served,
      kmCostAi: ca.kmCostAed / ka.served,
      algorithm: "cw2opt",
      frozenAt: null,
      frozenPayback: null,
      frozenPaybackHalf: null,
      onTimeBase: kb.onTimePct,
      onTimeAi: ka.onTimePct,
      kmPct: kb.km ? ((kb.km - ka.km) / kb.km) * 100 : null,
      costPct: kb.costPerParcelAed ? ((kb.costPerParcelAed - ka.costPerParcelAed) / kb.costPerParcelAed) * 100 : null,
    };
  }, [frozen, bp, ap, orderOverrides, scenario]);

  const resetToDefaultDay = () => {
    reset();
    void useScenario.getState().run(["baseline", "cw2opt"]);
  };

  return { base: frozen ?? live, status, error, isDefault: frozen ? true : isDefault, resetToDefaultDay };
}
