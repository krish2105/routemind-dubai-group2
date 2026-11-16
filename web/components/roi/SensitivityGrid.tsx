"use client";
import { useMemo, useState } from "react";
import { GRID_AXES, PAYBACK_TARGET_MONTHS, sensitivityGrid, type RoiInputs } from "@/lib/roi";
import { int, months, pct } from "./fmt";

type RowParam = "adoptionHaircut" | "savingFactor" | "costPerKmFactor";
const ROW_OPTIONS: { param: RowParam; label: string; short: string }[] = [
  { param: "adoptionHaircut", label: "Share of saving kept", short: "Kept" },
  { param: "savingFactor", label: "Stress test", short: "Stress" },
  { param: "costPerKmFactor", label: "Cost per km", short: "AED/km" },
];
/** Values outside the documented assumed range are shown, but marked (e.g. 100 % kept = simulation fully realised). */
const OUTSIDE: Partial<Record<RowParam, (v: number) => boolean>> = { adoptionHaircut: (v) => v > 0.8 + 1e-9 };

function tint(m: number | null): string {
  if (m === null || m > PAYBACK_TARGET_MONTHS) return "bg-risk/15 text-risk";
  if (m <= 6) return "bg-ai/25 text-fg";
  if (m <= 12) return "bg-ai/15 text-fg";
  return "bg-ai/5 text-fg";
}

/**
 * Two-way sensitivity of payback (owner: Harsh): rows = one driver, columns = parcels per day.
 * Red + "!" = payback beyond the 24-month target or never (colour is not the only signal). Ring = the current what-if.
 */
export function SensitivityGrid({ inputs, disableKm = false }: { inputs: RoiInputs; disableKm?: boolean }) {
  const [rowParam, setRowParam] = useState<RowParam>("adoptionHaircut");
  const grid = useMemo(() => sensitivityGrid(inputs, { param: rowParam, values: GRID_AXES[rowParam] }, { param: "parcelsPerDay", values: GRID_AXES.parcelsPerDay }),
    [inputs, rowParam]);
  const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
  const opt = ROW_OPTIONS.find((o) => o.param === rowParam)!;
  return (
    <div className="min-w-0">
      <div role="radiogroup" aria-label="Row variable" className="mb-3 inline-flex max-w-full flex-wrap rounded-full border border-slate-900/10 bg-white/70 p-0.5 text-xs">
        {ROW_OPTIONS.map((o) => {
          const off = o.param === "costPerKmFactor" && disableKm;
          return (
            <button key={o.param} type="button" role="radio" aria-checked={rowParam === o.param} disabled={off} onClick={() => setRowParam(o.param)}
              className={`rounded-full px-3 py-1 transition ${rowParam === o.param ? "bg-ai text-white" : "text-slate-500 hover:text-fg"} disabled:opacity-40`}>
              <span className="sm:hidden">{o.short}</span><span className="hidden sm:inline">{o.label}</span>
            </button>
          );
        })}
      </div>
      <div className="overflow-x-auto">
        <table className="num w-full min-w-[420px] border-separate border-spacing-1 text-center text-sm">
          <caption className="mb-1 text-left text-xs text-slate-500">Payback in months after roll-out. Rows: {opt.label.toLowerCase()}; columns: parcels per day.</caption>
          <thead>
            <tr>
              <th scope="col" className="text-left text-[11px] font-medium uppercase tracking-wider text-slate-500">{opt.short} ↓ · parcels/day →</th>
              {grid.cols.values.map((c) => (
                <th key={c} scope="col" className={`text-[11px] font-medium ${near(c, inputs.parcelsPerDay) ? "text-ai" : "text-slate-500"}`}>{int(c)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rows.values.map((r, ri) => {
              const outside = OUTSIDE[rowParam]?.(r);
              return (
                <tr key={r}>
                  <th scope="row" className={`text-left text-[11px] font-medium ${near(r, inputs[rowParam]) ? "text-ai" : "text-slate-500"}`}>
                    {pct(r * 100)}{outside && <span className="ml-1 text-slate-500" title="outside the assumed range">*</span>}
                  </th>
                  {grid.cells[ri].map((m, ci) => {
                    const current = near(r, inputs[rowParam]) && near(grid.cols.values[ci], inputs.parcelsPerDay);
                    const bad = m === null || m > PAYBACK_TARGET_MONTHS;
                    return (
                      <td key={ci} className={`rounded-md px-1.5 py-2 ${tint(m)} ${current ? "ring-2 ring-ai" : ""} ${outside ? "opacity-70" : ""}`}
                        aria-label={`${pct(r * 100)} ${opt.label.toLowerCase()}, ${int(grid.cols.values[ci])} parcels a day: ${m === null ? "no payback" : `${months(m)} months`}`}>
                        {months(m)}{bad && <span aria-hidden className="ml-0.5 font-semibold">!</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-ai/25" />≤ 6 mo</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-ai/15" />≤ 12</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-ai/5 ring-1 ring-slate-900/10" />≤ 24</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-risk/15" />! over 24 months or never</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm ring-2 ring-ai" />your what-if</span>
        {rowParam === "adoptionHaircut" && <span>* 100% = simulation fully realised (outside the assumed 40 to 80%)</span>}
      </div>
    </div>
  );
}
