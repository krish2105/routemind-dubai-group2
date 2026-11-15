"use client";
import { motion } from "framer-motion";
import { Glass } from "./Glass";

interface Props {
  label: string;
  base?: string;
  ai?: string;
  /** percent change AI vs baseline; negative is good for cost-like metrics */
  deltaPct?: number | null;
  lowerIsBetter?: boolean;
  unit?: string;
  stub?: boolean;
}

export function KpiCard({ label, base, ai, deltaPct, lowerIsBetter = true, unit, stub }: Props) {
  const good = deltaPct == null || Math.abs(deltaPct) < 0.05 ? null : lowerIsBetter ? deltaPct < 0 : deltaPct > 0;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Glass className="p-4">
        <div className="text-xs uppercase tracking-widest text-slate-500">{label}</div>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase text-base/80">Baseline</div>
            <div className="num text-2xl text-base">{base ?? "—"}<span className="ml-1 text-xs text-slate-500">{unit}</span></div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase text-ai/80">AI {stub ? "(stub)" : ""}</div>
            <div className="num text-2xl text-ai">{ai ?? "—"}<span className="ml-1 text-xs text-slate-500">{unit}</span></div>
          </div>
        </div>
        {deltaPct != null && (
          <div className={`num mt-3 text-sm ${good === null ? "text-slate-500" : good ? "text-ok" : "text-risk"}`}>
            {deltaPct > 0 ? "+" : ""}{deltaPct.toFixed(1)}% vs baseline
          </div>
        )}
      </Glass>
    </motion.div>
  );
}
