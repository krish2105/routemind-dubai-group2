"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Glass } from "@/components/ui/Glass";
import type { RerouteItem } from "@/lib/engine/reroute";

/** UI parts for /rerouting (Karan's area, built by Yash). */

export const hhmm = (min?: number) => {
  if (min === undefined) return "—";
  const m = Math.max(0, Math.round(min));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

export const STEPS = [
  "Freezing completed stops and vehicle positions",
  "Applying event slow-downs to remaining legs",
  "Inserting urgent and unplaced orders (cheapest insertion)",
  "Re-optimising remaining stops (2-opt + relocate)",
  "Comparing before and after",
];

/** Step-by-step progress animation shown while the worker re-routes. */
export function ProgressSteps({ step, running }: { step: number; running: boolean }) {
  return (
    <AnimatePresence>
      {running && (
        <motion.ol initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-1.5 overflow-hidden text-sm" aria-live="polite">
          {STEPS.map((s, i) => (
            <li key={s} className={`flex items-center gap-2 ${i < step ? "text-ok" : i === step ? "text-fg" : "text-slate-500"}`}>
              <span className="flex h-4 w-4 items-center justify-center">
                {i < step ? "✓" : i === step ? <motion.span className="h-2.5 w-2.5 rounded-full bg-ai" animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} /> : "·"}
              </span>
              {s}
            </li>
          ))}
          <li className="pt-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-900/5">
              <motion.div className="h-full rounded-full bg-ai" animate={{ width: `${Math.min(100, (step / STEPS.length) * 100)}%` }} transition={{ duration: 0.3 }} />
            </div>
          </li>
        </motion.ol>
      )}
    </AnimatePresence>
  );
}

/** Before (amber) vs after (teal) card for one number. */
export function BeforeAfter({ label, before, after, d = 0, unit = "", lowerIsBetter = true, note }: {
  label: string; before?: number; after?: number; d?: number; unit?: string; lowerIsBetter?: boolean; note?: string;
}) {
  const has = before !== undefined && after !== undefined;
  const delta = has ? after! - before! : 0;
  const good = !has || Math.abs(delta) < 1e-9 ? null : lowerIsBetter ? delta < 0 : delta > 0;
  return (
    <Glass className="p-4">
      <div className="text-[11px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase text-base">Before</div>
          <div className="num text-xl text-base">{has ? before!.toFixed(d) : "—"}<span className="ml-0.5 text-xs text-slate-500">{unit}</span></div>
        </div>
        <div className="text-slate-500" aria-hidden>→</div>
        <div className="text-right">
          <div className="text-[10px] uppercase text-ai">After</div>
          <motion.div key={String(after)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="num text-2xl text-ai">
            {has ? after!.toFixed(d) : "—"}<span className="ml-0.5 text-xs text-slate-500">{unit}</span>
          </motion.div>
        </div>
      </div>
      <div className={`num mt-1.5 text-xs ${good === null ? "text-slate-500" : good ? "text-ok" : "text-risk"}`}>
        {has ? `${delta > 0 ? "+" : ""}${delta.toFixed(d)}${unit}` : note ?? "press Re-optimise"}
      </div>
    </Glass>
  );
}

function RiskChip({ late, risk }: { late: boolean; risk: boolean }) {
  if (late) return <span className="rounded-full border border-risk/40 bg-risk/10 px-2 py-0.5 text-[11px] text-risk">late</span>;
  if (risk) return <span className="rounded-full border border-base/40 bg-base/10 px-2 py-0.5 text-[11px] text-base">tight</span>;
  return <span className="rounded-full border border-ok/40 bg-ok/10 px-2 py-0.5 text-[11px] text-ok">on time</span>;
}

/** SLA-at-risk list: remaining orders at risk before or after re-routing. */
export function AtRiskList({ items, max = 14 }: { items: RerouteItem[]; max?: number }) {
  const rows = items.filter((i) => i.riskBefore || i.riskAfter);
  if (!rows.length) return <p className="text-sm text-slate-500">No remaining delivery is at risk.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-sm">
        <thead>
          <tr className="border-b border-slate-900/10 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="py-2 pr-3 font-medium">Order</th>
            <th className="py-2 pr-3 font-medium">Customer zone</th>
            <th className="py-2 pr-3 text-right font-medium">Window end</th>
            <th className="py-2 pr-3 text-right font-medium">Old ETA</th>
            <th className="py-2 pr-3 text-right font-medium">New ETA</th>
            <th className="py-2 pr-3 font-medium">Before → after</th>
          </tr>
        </thead>
        <tbody className="num">
          {rows.slice(0, max).map((r) => (
            <tr key={r.orderId} className="border-b border-slate-900/5">
              <td className="py-1.5 pr-3 font-sans text-fg">
                {r.orderId}
                {r.urgent && <span className="ml-1.5 text-[10px] font-medium uppercase text-risk">urgent</span>}
                {r.isNew && <span className="ml-1.5 text-[10px] font-medium uppercase text-ai">new</span>}
              </td>
              <td className="py-1.5 pr-3 font-sans text-slate-700">{r.area}</td>
              <td className="py-1.5 pr-3 text-right">{hhmm(r.windowEnd)}</td>
              <td className="py-1.5 pr-3 text-right text-base">{r.etaBefore === undefined ? "no vehicle" : `${hhmm(r.etaBefore)} ${r.vehicleBefore}`}</td>
              <td className="py-1.5 pr-3 text-right text-ai">{r.etaAfter === undefined ? "no vehicle" : `${hhmm(r.etaAfter)} ${r.vehicleAfter}`}</td>
              <td className="py-1.5 pr-3 font-sans"><span className="inline-flex items-center gap-1.5"><RiskChip late={r.lateBefore} risk={r.riskBefore} /><span className="text-slate-500">→</span><RiskChip late={r.lateAfter} risk={r.riskAfter} /></span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > max && <p className="mt-2 text-xs text-slate-500">Showing {max} of {rows.length} orders at risk before or after (sorted by window end).</p>}
    </div>
  );
}
