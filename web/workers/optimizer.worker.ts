/// <reference lib="webworker" />
import * as Comlink from "comlink";
import type { AlgorithmId, Assumptions, Kpis, Plan, Scenario } from "@/lib/types";
import { buildProblem } from "@/lib/engine/problem";
import { solve } from "@/lib/engine/solve";
import { computeKpis } from "@/lib/engine/kpi";

/** Heavy compute lives here, never on the main thread. Owner: Krishna. */
const api = {
  run(assumptions: Assumptions, scenario: Scenario, algorithms: AlgorithmId[]): Partial<Record<AlgorithmId, { plan: Plan; kpis: Kpis }>> {
    const problem = buildProblem(assumptions, scenario);
    const out: Partial<Record<AlgorithmId, { plan: Plan; kpis: Kpis }>> = {};
    for (const id of algorithms) {
      const plan = solve(problem, id);
      out[id] = { plan, kpis: computeKpis(problem, plan) };
    }
    return out;
  },
};

export type OptimizerApi = typeof api;
Comlink.expose(api);
