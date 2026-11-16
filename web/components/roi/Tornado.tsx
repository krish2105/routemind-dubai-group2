"use client";
import { useMemo } from "react";
import { PARAM_LABEL, computeRoi, tornado, type RoiInputs, type RoiParam } from "@/lib/roi";
import { aed, int, months, pct } from "./fmt";

const AXIS_MAX = 36; // months; longer paybacks and "never" are drawn as a capped bar
const FMT: Record<RoiParam, (v: number) => string> = {
  adoptionHaircut: (v) => pct(v * 100),
  parcelsPerDay: int,
  savingFactor: (v) => pct(v * 100),
  costPerKmFactor: (v) => pct(v * 100),
  monthlyRunningCost: aed,
  pilotInvestment: aed,
  workingDaysPerYear: (v) => `${int(v)} days`,
};

/**
 * What moves payback most (owner: Harsh). One input at a time across its assumed range; the rest stay at your what-if.
 * Plain divs (clearer than a chart library for a handful of bars). Teal = the faster end, slate = the slower end.
 */
export function Tornado({ inputs, ranges }: { inputs: RoiInputs; ranges: Partial<Record<RoiParam, [number, number]>> }) {
  const rows = useMemo(() => tornado(inputs, ranges), [inputs, ranges]);
  const base = computeRoi(inputs).paybackMonths;
  const x = (m: number | null) => (m === null ? 100 : Math.min(100, (m / AXIS_MAX) * 100));
  return (
    <div className="min-w-0">
      <ul className="space-y-3">
        {rows.map((r) => {
          const fast = Math.min(x(r.paybackAtLow), x(r.paybackAtHigh));
          const slow = Math.max(x(r.paybackAtLow), x(r.paybackAtHigh));
          const mid = x(base);
          const capped = slow >= 100;
          return (
            <li key={r.param}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
                <span className="text-slate-700">{PARAM_LABEL[r.param]}</span>
                <span className="num text-slate-500">{FMT[r.param](r.low)} → {FMT[r.param](r.high)}</span>
              </div>
              <div className="relative h-4 rounded-full bg-slate-900/5" role="img"
                aria-label={`${PARAM_LABEL[r.param]}: payback ${months(r.paybackAtLow)} at ${FMT[r.param](r.low)}, ${months(r.paybackAtHigh)} at ${FMT[r.param](r.high)}`}>
                <div className="absolute inset-y-0 rounded-l-full bg-ai/60" style={{ left: `${fast}%`, width: `${Math.max(0, Math.min(mid, slow) - fast)}%` }} />
                <div className={`absolute inset-y-0 bg-slate-400/60 ${capped ? "" : "rounded-r-full"}`} style={{ left: `${Math.max(mid, fast)}%`, width: `${Math.max(0, slow - Math.max(mid, fast))}%` }} />
                <div className="absolute inset-y-[-3px] w-0.5 bg-fg" style={{ left: `${mid}%` }} aria-hidden />
              </div>
              <div className="num mt-0.5 flex justify-between text-[11px] text-slate-500">
                <span>{months(Math.min(r.paybackAtLow ?? Infinity, r.paybackAtHigh ?? Infinity))} mo</span>
                <span className={capped ? "text-risk" : ""}>{capped ? (r.paybackAtLow === null || r.paybackAtHigh === null ? "never" : "> 36 mo") : `${months(Math.max(r.paybackAtLow ?? 0, r.paybackAtHigh ?? 0))} mo`}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[11px] text-slate-500">Bar = payback range in months (0 to 36) when one input moves across its assumed range. Black tick = your what-if ({months(base)} mo). The stress test is left out: it sits on top of the share kept.</p>
    </div>
  );
}
