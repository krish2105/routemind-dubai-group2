"use client";
import { create } from "zustand";
import * as Comlink from "comlink";
import { assumptions } from "@/lib/assumptions";
import { defaultScenario } from "@/lib/engine/problem";
import type { AlgorithmId, Kpis, Plan, Scenario, TrafficEvent } from "@/lib/types";
import type { OptimizerApi } from "@/workers/optimizer.worker";

type Results = Partial<Record<AlgorithmId, { plan: Plan; kpis: Kpis }>>;

interface State {
  scenario: Scenario;
  results: Results;
  status: "idle" | "running" | "error";
  error?: string;
  setScenario: (s: Partial<Scenario>) => void;
  toggleEvent: (e: TrafficEvent) => void;
  run: (algorithms?: AlgorithmId[]) => Promise<void>;
}

let worker: Worker | null = null;
let remote: Comlink.Remote<OptimizerApi> | null = null;
function getRemote() {
  if (!remote) {
    worker = new Worker(new URL("../workers/optimizer.worker.ts", import.meta.url), { type: "module" });
    remote = Comlink.wrap<OptimizerApi>(worker);
  }
  return remote;
}

export const useScenario = create<State>((set, get) => ({
  scenario: defaultScenario(assumptions),
  results: {},
  status: "idle",
  setScenario: (s) => set({ scenario: { ...get().scenario, ...s } }),
  toggleEvent: (e) => {
    const cur = get().scenario.events;
    const has = cur.some((x) => x.id === e.id);
    set({ scenario: { ...get().scenario, events: has ? cur.filter((x) => x.id !== e.id) : [...cur, e] } });
  },
  run: async (algorithms = ["baseline", "cw2opt"]) => {
    set({ status: "running", error: undefined });
    try {
      const results = await getRemote().run(assumptions, get().scenario, algorithms);
      set({ results: { ...get().results, ...results }, status: "idle" });
    } catch (err) {
      set({ status: "error", error: String(err) });
    }
  },
}));
