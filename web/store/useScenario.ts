"use client";
import { create } from "zustand";
import * as Comlink from "comlink";
import { assumptions } from "@/lib/assumptions";
import { defaultScenario } from "@/lib/engine/problem";
import type { AlgorithmId, Kpis, Order, Plan, Point, Scenario, TrafficEvent } from "@/lib/types";
import type { OptimizerApi } from "@/workers/optimizer.worker";

/**
 * Shared scenario store (owner: Krishna). PUBLIC API, keep stable for teammates:
 *   const { scenario, results, orders, hub, status, progress, run, setScenario, toggleEvent, reset } = useScenario();
 *   - scenario            : seed, orderCount, vans, bikes, events, evShare (defaults from assumptions.json, seed 2611)
 *   - results[algorithm]  : { plan, kpis } for "baseline" | "cw2opt" | "ga" after run()
 *   - orders, hub         : the seeded orders and hub of the LAST run (for maps and tables)
 *   - status              : "idle" | "running" | "error"; progress: which algorithm is running
 *   - run(algorithms?)    : solves in the Web Worker (default ["baseline", "cw2opt"]); results are replaced
 *                           when the scenario changed since the last run, otherwise merged
 *   - setScenario(partial), toggleEvent(event), reset()
 *   - orderOverrides      : optional { time_window_min, urgent_share } used by the /optimizer order generator;
 *                           setOrderOverrides(partial); cleared by reset()
 * Baseline and AI always use the identical seeded orders.
 */
export interface OrderOverrides { time_window_min?: number; urgent_share?: number }

/** Assumptions with the order-generator overrides applied (all values stay ASSUMED). */
export function withOverrides(o: OrderOverrides) {
  return { ...assumptions, orders: { ...assumptions.orders, ...o } };
}

type Results = Partial<Record<AlgorithmId, { plan: Plan; kpis: Kpis }>>;

interface State {
  scenario: Scenario;
  results: Results;
  orders: Order[];
  hub: Point | null;
  status: "idle" | "running" | "error";
  progress?: { algorithm: AlgorithmId; index: number; total: number };
  error?: string;
  /** JSON of the scenario used for `results` (to know when results are stale) */
  resultsFor?: string;
  orderOverrides: OrderOverrides;
  setOrderOverrides: (o: OrderOverrides) => void;
  setScenario: (s: Partial<Scenario>) => void;
  toggleEvent: (e: TrafficEvent) => void;
  reset: () => void;
  run: (algorithms?: AlgorithmId[]) => Promise<void>;
}

let remote: Comlink.Remote<OptimizerApi> | null = null;
function getRemote() {
  if (!remote) {
    const worker = new Worker(new URL("../workers/optimizer.worker.ts", import.meta.url), { type: "module" });
    remote = Comlink.wrap<OptimizerApi>(worker);
  }
  return remote;
}

let runId = 0;

export const useScenario = create<State>((set, get) => ({
  scenario: defaultScenario(assumptions),
  results: {},
  orders: [],
  hub: null,
  status: "idle",
  orderOverrides: {},
  setOrderOverrides: (o) => set({ orderOverrides: { ...get().orderOverrides, ...o } }),
  setScenario: (s) => set({ scenario: { ...get().scenario, ...s } }),
  toggleEvent: (e) => {
    const cur = get().scenario.events;
    const has = cur.some((x) => x.id === e.id);
    set({ scenario: { ...get().scenario, events: has ? cur.filter((x) => x.id !== e.id) : [...cur, e] } });
  },
  reset: () => set({ scenario: defaultScenario(assumptions), orderOverrides: {}, results: {}, resultsFor: undefined }),
  run: async (algorithms = ["baseline", "cw2opt"]) => {
    const id = ++runId;
    const scenario = get().scenario;
    const a = withOverrides(get().orderOverrides);
    const key = JSON.stringify([scenario, get().orderOverrides]);
    set({ status: "running", error: undefined, progress: undefined });
    try {
      const out = await getRemote().run(a, scenario, algorithms, Comlink.proxy((progress: { algorithm: AlgorithmId; index: number; total: number }) => {
        if (id === runId) set({ progress });
      }));
      if (id !== runId) return; // a newer run started; drop this one
      const merged = get().resultsFor === key ? { ...get().results, ...out.results } : out.results;
      set({ results: merged, orders: out.orders, hub: out.hub, resultsFor: key, status: "idle", progress: undefined });
    } catch (err) {
      if (id === runId) set({ status: "error", error: String(err) });
    }
  },
}));
