import type { Plan, Problem } from "@/lib/types";
import { solveBaseline } from "./baseline";

/**
 * TODO (owner: Krishna): Clarke-Wright savings + 2-opt (+ relocate/swap between routes).
 * Use evaluateRoute() from ./schedule to score routes. Respect capacity, duty hours and time windows
 * (count violations, do not hide them). Deterministic.
 * Until implemented this returns the baseline plan flagged as stub, so the UI never shows fake "AI" numbers silently.
 */
export function solveCW2opt(p: Problem): Plan {
  const plan = solveBaseline(p);
  return { ...plan, algorithm: "cw2opt", meta: { ...plan.meta, stub: true, note: "STUB: returns baseline until implemented" } };
}
