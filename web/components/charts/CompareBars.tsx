"use client";
import { motion } from "framer-motion";
import { ChartEmpty, StubTag } from "./ChartFrame";

/**
 * CompareBars (owner: Yash). Baseline (amber) vs AI (teal) for a list of KPIs with different units.
 * Each KPI is one row with two bars scaled to the larger of the two values, plus the % change.
 *
 * Props
 *   items   CompareItem[]  one row per KPI. Required (empty array shows the empty state).
 *     label          string   e.g. "Distance"
 *     base           number   baseline value
 *     ai             number   AI value
 *     unit           string   optional, e.g. "km", "%", "AED"
 *     decimals       number   optional, default 0
 *     lowerIsBetter  boolean  optional, default true (cost, km, CO2). false for on-time %, utilisation.
 *   baseLabel  string   default "Baseline"
 *   aiLabel    string   default "AI"
 *   stub       boolean  red STUB tag when the AI side comes from a stub algorithm.
 *
 * Usage: <CompareBars items={[{ label: "Distance", base: kb.km, ai: ka.km, unit: "km" }]} />
 * Numbers must come from the engine (computeKpis) or docs/frozen_results.json, never typed by hand.
 */
export interface CompareItem {
  label: string;
  base: number;
  ai: number;
  unit?: string;
  decimals?: number;
  lowerIsBetter?: boolean;
}

export interface CompareBarsProps {
  items: CompareItem[];
  baseLabel?: string;
  aiLabel?: string;
  stub?: boolean;
  emptyText?: string;
}

const fmt = (v: number, d = 0) => v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export function CompareBars({ items, baseLabel = "Baseline", aiLabel = "AI", stub, emptyText = "Run the optimiser to compare baseline and AI." }: CompareBarsProps) {
  if (!items.length) return <ChartEmpty>{emptyText}</ChartEmpty>;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-base" />{baseLabel}</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-ai" />{aiLabel}</span>
        {stub && <StubTag />}
      </div>
      <ul className="space-y-3.5">
        {items.map((it, i) => {
          const max = Math.max(Math.abs(it.base), Math.abs(it.ai), 1e-9);
          const change = it.base ? ((it.ai - it.base) / Math.abs(it.base)) * 100 : 0;
          const lower = it.lowerIsBetter ?? true;
          const good = Math.abs(change) < 0.05 ? null : lower ? change < 0 : change > 0;
          return (
            <li key={it.label}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="text-slate-700">{it.label}{it.unit ? <span className="text-slate-500"> ({it.unit})</span> : null}</span>
                <span className={`num text-xs ${good === null ? "text-slate-500" : good ? "text-ok" : "text-risk"}`}>{change > 0 ? "+" : ""}{change.toFixed(1)}%</span>
              </div>
              {([["base", it.base], ["ai", it.ai]] as const).map(([k, v]) => (
                <div key={k} className="mb-1 flex items-center gap-2">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-900/5">
                    <motion.div
                      className={`h-full rounded-full ${k === "base" ? "bg-base" : "bg-ai"}`}
                      initial={{ width: 0 }} animate={{ width: `${(Math.abs(v) / max) * 100}%` }}
                      transition={{ duration: 0.7, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <span className={`num w-20 text-right text-xs ${k === "base" ? "text-base" : "text-ai"}`}>{fmt(v, it.decimals)}</span>
                </div>
              ))}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
