"use client";
import { HORIZON_MONTHS, PAYBACK_TARGET_MONTHS, type ScenarioResult } from "@/lib/roi";
import { Glass } from "@/components/ui/Glass";
import { aedShort, int, months, pct } from "./fmt";

/**
 * Three scenario cards (owner: Harsh). Pinned to the assumed defaults (not to the sliders), so "base" always means
 * assumptions.json. Clicking a card loads its adoption and volume into the sliders (aria-pressed shows which one).
 * No amber here: amber is reserved for the baseline (today's planning).
 */
export function ScenarioCards({ items, active, onPick }: { items: ScenarioResult[]; active: string | null; onPick: (s: ScenarioResult) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((s) => {
        const r = s.result;
        const pb = r.paybackMonths;
        const slow = pb === null || pb > PAYBACK_TARGET_MONTHS;
        const beyond = pb === null || pb > HORIZON_MONTHS;
        const on = active === s.id;
        return (
          <button key={s.id} type="button" aria-pressed={on} onClick={() => onPick(s)}
            className={`text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ai)] ${on ? "rounded-2xl ring-2 ring-ai" : ""}`}>
            <Glass className="h-full p-5 hover:border-ai/30">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{s.label}</span>
                <span className="text-[11px] text-slate-500">{s.note}</span>
              </div>
              <div className={`num mt-3 text-3xl font-semibold ${slow ? "text-risk" : "text-ai"}`}>
                {beyond ? (pb === null ? "never" : `> ${HORIZON_MONTHS}`) : months(pb)}<span className="ml-1 text-sm font-normal text-slate-500">{beyond && pb === null ? "" : "months"}</span>
              </div>
              <div className="text-xs text-slate-500">payback after roll-out</div>
              <dl className="num mt-4 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <dt className="text-slate-500">Saving kept</dt><dd className="text-right text-fg">{pct(r.inputs.adoptionHaircut * 100)}</dd>
                <dt className="text-slate-500">Parcels / day</dt><dd className="text-right text-fg">{int(r.inputs.parcelsPerDay)}</dd>
                <dt className="text-slate-500">Net / month</dt><dd className="text-right text-fg">{aedShort(r.netMonthly)}</dd>
                <dt className="text-slate-500">36-month net</dt><dd className={`text-right ${r.net36 < 0 ? "text-risk" : "text-fg"}`}>{aedShort(r.net36)}</dd>
              </dl>
              {s.id === "conservative" && (
                <p className="mt-3 text-[11px] leading-snug text-slate-600">This is the case the Day-90 cost gate exists to catch: if the pilot lands here, we stop before scaling.</p>
              )}
            </Glass>
          </button>
        );
      })}
    </div>
  );
}
