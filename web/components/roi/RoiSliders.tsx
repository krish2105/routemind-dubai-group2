"use client";
import { useId } from "react";
import type { RoiInputs } from "@/lib/roi";
import { aed, int, pct } from "./fmt";

/** The what-if inputs the board can move. Everything else stays at assumptions.json. */
export type WhatIf = Pick<RoiInputs, "adoptionHaircut" | "parcelsPerDay" | "savingFactor" | "costPerKmFactor" | "pilotInvestment" | "monthlyRunningCost">;
export type WhatKey = keyof WhatIf;

export interface SliderSpec {
  key: WhatKey;
  label: string;
  min: number;
  max: number;
  step: number;
  show: (v: number) => string;
  /** spoken value for screen readers */
  say: (v: number) => string;
  hint: string;
}

export function sliderSpecs(ranges: { pilot: [number, number]; running: [number, number]; parcels: [number, number] }): SliderSpec[] {
  return [
    { key: "adoptionHaircut", label: "Share of simulated saving we count", min: 0.4, max: 1, step: 0.05, show: (v) => pct(v * 100),
      say: (v) => `${Math.round(v * 100)} percent of the simulated saving`, hint: "assumed 60%; 100% = simulation fully realised" },
    { key: "parcelsPerDay", label: "Parcels per day (after roll-out)", min: ranges.parcels[0], max: ranges.parcels[1], step: 100, show: int,
      say: (v) => `${int(v)} parcels a day`, hint: "assumed 1,500 for the scaled network" },
    { key: "savingFactor", label: "Stress test on the saving", min: 0.5, max: 1, step: 0.05, show: (v) => pct(v * 100),
      say: (v) => `${Math.round(v * 100)} percent of the counted saving`, hint: "50% = the half-savings case on Slide 7" },
    { key: "costPerKmFactor", label: "Cost per km vs assumed", min: 0.7, max: 1.4, step: 0.05, show: (v) => pct(v * 100),
      say: (v) => `cost per kilometre at ${Math.round(v * 100)} percent of the assumption`, hint: "fuel and upkeep what-if; moves only the km part of cost" },
    { key: "pilotInvestment", label: "Pilot investment", min: ranges.pilot[0], max: ranges.pilot[1], step: 10_000, show: aed,
      say: (v) => `${int(v)} dirhams`, hint: "assumed AED 420,000: build, integration, training" },
    { key: "monthlyRunningCost", label: "Running cost per month", min: ranges.running[0], max: ranges.running[1], step: 1_000, show: aed,
      say: (v) => `${int(v)} dirhams a month`, hint: "assumed AED 38,000: cloud, APIs, support" },
  ];
}

export function RoiSliders({ specs, value, defaults, onChange, disabled = [] }: {
  specs: SliderSpec[]; value: WhatIf; defaults: WhatIf; onChange: (key: WhatKey, v: number) => void; disabled?: WhatKey[];
}) {
  const base = useId();
  return (
    <form className="grid gap-4" onSubmit={(e) => e.preventDefault()} aria-label="ROI what-if inputs">
      {specs.map((s) => {
        const id = `${base}-${s.key}`;
        const v = value[s.key];
        const changed = Math.abs(v - defaults[s.key]) > 1e-9;
        const off = disabled.includes(s.key);
        return (
          <div key={s.key} className={off ? "opacity-50" : ""}>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={id} className="text-xs font-medium uppercase tracking-widest text-slate-500">{s.label}</label>
              <span className={`num text-sm ${changed ? "text-ai" : "text-fg"}`}>{s.show(v)}</span>
            </div>
            <input
              id={id}
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={v}
              disabled={off}
              aria-valuetext={s.say(v)}
              onChange={(e) => onChange(s.key, Number(e.target.value))}
              className="mt-1.5 w-full accent-[var(--color-ai)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ai)]"
            />
            <p className="text-[11px] text-slate-500">{off ? "needs the km cost split (after the freeze)" : s.hint} <span className="text-slate-500">· assumed</span></p>
          </div>
        );
      })}
    </form>
  );
}
