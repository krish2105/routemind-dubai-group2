/// <reference lib="webworker" />
import * as Comlink from "comlink";
import type { AlgorithmId, Assumptions, Kpis, Order, Plan, Point, Scenario } from "@/lib/types";
import { buildProblem } from "@/lib/engine/problem";
import { solve } from "@/lib/engine/solve";
import { computeKpis } from "@/lib/engine/kpi";

/**
 * Heavy compute lives here, never on the main thread. Owner: Krishna.
 * run()      : builds the seeded problem once and solves it with each requested algorithm (baseline and AI see identical orders).
 * onProgress : optional callback (Comlink.proxy) told which algorithm is running, so the UI can show progress.
 */
export interface RunOutput {
  hub: Point;
  orders: Order[];
  results: Partial<Record<AlgorithmId, { plan: Plan; kpis: Kpis }>>;
}

const api = {
  run(
    assumptions: Assumptions,
    scenario: Scenario,
    algorithms: AlgorithmId[],
    onProgress?: (msg: { algorithm: AlgorithmId; index: number; total: number }) => void,
  ): RunOutput {
    const problem = buildProblem(assumptions, scenario);
    const results: RunOutput["results"] = {};
    algorithms.forEach((id, index) => {
      onProgress?.({ algorithm: id, index, total: algorithms.length });
      const plan = solve(problem, id);
      results[id] = { plan, kpis: computeKpis(problem, plan) };
    });
    return { hub: problem.hub, orders: problem.orders, results };
  },
};

export type OptimizerApi = typeof api;
Comlink.expose(api);
