/// <reference lib="webworker" />
import * as Comlink from "comlink";
import type { Assumptions, Kpis, Order, Plan, Point, Scenario, TrafficEvent } from "@/lib/types";
import { buildProblem } from "@/lib/engine/problem";
import { solve } from "@/lib/engine/solve";
import { computeKpis } from "@/lib/engine/kpi";
import { reroute, type RerouteResult } from "@/lib/engine/reroute";

/**
 * Web Worker for /rerouting (owner: Karan's area, built by Yash). Heavy compute never runs on the main thread.
 * morning(): the AI plan (Clarke-Wright + 2-opt) for the calm seeded day, cached per scenario.
 * live():    re-routes that plan at `nowMin` under the injected events.
 */
export interface MorningOutput { hub: Point; orders: Order[]; plan: Plan; kpis: Kpis }
export type LiveOutput = Omit<RerouteResult, "problem"> & { orders: Order[]; hub: Point };

let cache: { key: string; problem: ReturnType<typeof buildProblem>; plan: Plan } | null = null;

function morningPlan(a: Assumptions, scenario: Scenario) {
  const calm: Scenario = { ...scenario, events: [] };
  const key = JSON.stringify([a.version, a.orders, calm]);
  if (!cache || cache.key !== key) {
    const problem = buildProblem(a, calm);
    cache = { key, problem, plan: solve(problem, "cw2opt") };
  }
  return cache;
}

const api = {
  morning(a: Assumptions, scenario: Scenario): MorningOutput {
    const { problem, plan } = morningPlan(a, scenario);
    return { hub: problem.hub, orders: problem.orders, plan, kpis: computeKpis(problem, plan) };
  },
  live(a: Assumptions, scenario: Scenario, nowMin: number, events: TrafficEvent[], surgeCount: number): LiveOutput {
    const { problem, plan } = morningPlan(a, scenario);
    const r = reroute(problem, plan, nowMin, events, { surgeCount });
    const { problem: P, ...rest } = r;
    return { ...rest, orders: P.orders, hub: P.hub };
  },
};

export type RerouteApi = typeof api;
Comlink.expose(api);
