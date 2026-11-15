import type { Plan, Problem, TrafficEvent } from "@/lib/types";

export interface RerouteResult {
  before: Plan;
  after: Plan;
  atRiskBefore: number;
  atRiskAfter: number;
}

/**
 * TODO (owner: Karan): live re-routing at time t.
 * Steps: freeze completed stops and vehicle positions at t, apply the event multipliers (already in problem.events),
 * insert urgent orders by cheapest insertion, re-optimise the remaining stops (2-opt, optional warm-start GA).
 * Return the same plan evaluated before and after, plus the at-risk counts (kpi.atRisk).
 * Stub returns the input plan unchanged.
 */
export function reroute(_p: Problem, current: Plan, _nowMin: number, _newEvents: TrafficEvent[]): RerouteResult {
  return { before: current, after: { ...current, meta: { ...current.meta, stub: true, note: "STUB reroute" } }, atRiskBefore: 0, atRiskAfter: 0 };
}
