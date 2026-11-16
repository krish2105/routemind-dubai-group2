"use client";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/nav/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Glass } from "@/components/ui/Glass";
import { PAGES } from "@/lib/pages";
import { assumptions } from "@/lib/assumptions";
import {
  BENCHMARK_PCT, HORIZON_MONTHS, PAYBACK_TARGET_MONTHS, assumedRanges, breakEvenSaving, computeRoi, paybackFromApproval,
  pilotExposure, roiInputs, scenarios, tornadoRanges, type RoiInputs, type ScenarioResult,
} from "@/lib/roi";
import { useRoiBase } from "@/components/roi/useRoiBase";
import { Chip, CountUp, LiveText, Section, StatTile } from "@/components/roi/parts";
import { RoiSliders, sliderSpecs, type WhatIf, type WhatKey } from "@/components/roi/RoiSliders";
import { CashChart } from "@/components/roi/CashChart";
import { SensitivityGrid } from "@/components/roi/SensitivityGrid";
import { Tornado } from "@/components/roi/Tornado";
import { ScenarioCards } from "@/components/roi/ScenarioCards";
import { PilotRoadmap } from "@/components/roi/PilotRoadmap";
import { aed, aedShort, months, pct } from "@/components/roi/fmt";

const page = PAGES.find((p) => p.href === "/business-case")!;
const B = assumptions.business_case;
const RANGES = assumedRanges(assumptions);
const DEFAULTS: WhatIf = {
  adoptionHaircut: B.adoption_haircut,
  parcelsPerDay: B.parcels_per_day,
  savingFactor: 1,
  costPerKmFactor: 1,
  pilotInvestment: B.pilot_investment_aed,
  monthlyRunningCost: B.monthly_running_cost_aed,
};
const SPECS = sliderSpecs({ pilot: RANGES.pilotInvestment, running: RANGES.monthlyRunningCost, parcels: RANGES.parcelsPerDay });
const same = (a: WhatIf, b: WhatIf) => (Object.keys(a) as WhatKey[]).every((k) => Math.abs(a[k] - b[k]) < 1e-9);
const ALGO: Record<string, string> = { cw2opt: "Clarke-Wright + 2-opt", ga: "genetic algorithm" };

export default function BusinessCasePage() {
  const { base, status, error, isDefault, resetToDefaultDay } = useRoiBase();
  const [what, setWhat] = useState<WhatIf>(DEFAULTS);
  const atDefaults = same(what, DEFAULTS);

  const view = useMemo(() => {
    if (!base) return null;
    const baseInputs: RoiInputs = roiInputs(assumptions, base.costBase, base.costAi, { kmCostBase: base.kmCostBase, kmCostAi: base.kmCostAi });
    const inputs: RoiInputs = { ...baseInputs, ...what };
    const cur = computeRoi(inputs);
    const ref = computeRoi(baseInputs); // the Slide 7 base case
    const half = computeRoi({ ...baseInputs, savingFactor: 0.5 });
    const sc = scenarios(baseInputs, assumptions); // pinned to the assumed defaults, not to the sliders
    const gate = breakEvenSaving(baseInputs, PAYBACK_TARGET_MONTHS);
    return { baseInputs, inputs, cur, ref, half, sc, gate };
  }, [base, what]);

  const set = (k: WhatKey, v: number) => setWhat((w) => ({ ...w, [k]: v }));
  const pick = (s: ScenarioResult) => setWhat({ ...DEFAULTS, ...s.overrides });
  const activeScenario = view?.sc.find((s) => same(what, { ...DEFAULTS, ...s.overrides }))?.id ?? null;
  const noKm = !base?.kmCostBase && !base?.kmCostAi;
  const matchesSlide = base?.source === "frozen" && atDefaults && base.frozenPayback !== null && view?.cur.paybackMonths !== null
    && Math.abs((view?.cur.paybackMonths ?? 0) - base.frozenPayback) < 0.05;

  return (
    <AppShell>
      <PageHeader page={page} />

      {/* provenance line */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-600" aria-live="polite">
        {base?.source === "frozen" && <Chip tone="ai">frozen numbers · docs/frozen_results.json</Chip>}
        {base?.source === "live" && <Chip tone="risk">live engine run · not frozen yet</Chip>}
        {!base && <span>{status === "error" ? `Engine run failed: ${error}` : "Running baseline and AI on the seeded day in a Web Worker…"}</span>}
        {base && (
          <span>
            Costs per parcel simulated on seed {assumptions.seed} (300 orders): baseline <span className="num text-base">AED {base.costBase.toFixed(2)}</span>, AI ({ALGO[base.algorithm] ?? base.algorithm}) <span className="num text-ai">AED {base.costAi.toFixed(2)}</span>. Every business input is assumed.
          </span>
        )}
        {base?.source === "live" && !isDefault && (
          <button type="button" onClick={resetToDefaultDay} className="rounded-full border border-ai/40 px-2.5 py-0.5 text-xs text-ai hover:bg-ai/10">Use the default seeded day</button>
        )}
      </div>

      {/* 01 THE ANSWER */}
      <Section n={1} title="The answer" kicker={`Simple payback after roll-out, counting ${pct(B.adoption_haircut * 100)} of the simulated saving (assumed).`}>
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
          <Glass className="relative overflow-hidden p-5">
            <div className="text-xs uppercase tracking-widest text-slate-500">Payback {atDefaults ? "(base case)" : "(your what-if)"}</div>
            <div className="mt-2 flex items-baseline gap-2">
              {view ? (
                view.cur.paybackMonths === null ? (
                  <span className="text-5xl font-semibold text-risk">No payback</span>
                ) : view.cur.paybackMonths > HORIZON_MONTHS ? (
                  <span className="num text-5xl font-semibold text-risk">&gt; {HORIZON_MONTHS}</span>
                ) : (
                  <CountUp value={view.cur.paybackMonths} className={`text-6xl font-semibold tracking-tight ${view.cur.paybackMonths > PAYBACK_TARGET_MONTHS ? "text-risk" : "text-ai"}`} />
                )
              ) : (
                <span className="num h-14 w-40 rounded-lg bg-slate-900/5 motion-safe:animate-pulse" aria-hidden />
              )}
              <span className="text-lg text-slate-500">months</span>
            </div>
            {view && <LiveText text={`Payback ${view.cur.paybackMonths === null ? "never" : `${months(view.cur.paybackMonths)} months`} after roll-out at these settings.`} />}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {view && <Chip>at half the savings: {months(view.half.paybackMonths)} mo</Chip>}
              {view && <Chip>from approval: {months(paybackFromApproval(view.ref))} mo</Chip>}
              {matchesSlide && <Chip tone="ai">matches Slide 7</Chip>}
              {!atDefaults && <Chip tone="ai">what-if</Chip>}
            </div>
            <p className="mt-3 text-xs text-slate-500">Clock starts at roll-out ({B.parcels_per_day.toLocaleString("en-US")} parcels a day from month 1), no ramp-up, no discounting, no tax. The pilot itself does not pay back: it buys the evidence.</p>
          </Glass>

          <StatTile label="Investment (assumed)" value={view ? aed(view.inputs.pilotInvestment) : "…"}
            caption={view ? <>90-day pilot build, integration, training · plus <span className="num">{aed(view.inputs.monthlyRunningCost)}</span> a month to run</> : undefined}>
            {view && (
              <div className="mt-3 border-t border-slate-900/5 pt-3 text-xs text-slate-600">
                Most you can lose if the Day-90 gate says stop: <span className="num font-medium text-fg">{aed(pilotExposure(view.inputs))}</span>
              </div>
            )}
          </StatTile>

          <Glass className="flex flex-col justify-between border-ai/40 p-5">
            <div>
              <div className="text-xs uppercase tracking-widest text-ai">The ask</div>
              <p className="mt-2 text-lg font-semibold leading-snug text-fg">Approve a 90-day pilot at one hub and name a sponsor.</p>
              <p className="mt-1 text-sm text-slate-600">Scale only if all five Day-90 gates pass, including a real cost cut of at least <span className="num font-medium text-ai">{view ? pct(view.gate.pctOfBaseCost, 1) : "…"}</span>.</p>
            </div>
            <a href="#pilot" className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-ai px-3 py-1.5 text-sm font-medium text-white hover:bg-ai-deep">See the pilot and gates ↓</a>
          </Glass>
        </div>
      </Section>

      {/* 02 TEST THE ASSUMPTIONS */}
      <Section n={2} title="Test the assumptions" kicker="Move any assumed input; payback, cash and the grid below update at once.">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <Glass className="p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">ROI calculator</h3>
              <button type="button" onClick={() => setWhat(DEFAULTS)} disabled={atDefaults}
                className="rounded-full border border-slate-900/10 px-2.5 py-0.5 text-xs text-slate-600 hover:border-ai/40 hover:text-ai disabled:opacity-40">Reset to base case</button>
            </div>
            <RoiSliders specs={SPECS} value={what} defaults={DEFAULTS} onChange={set} disabled={noKm ? ["costPerKmFactor"] : []} />
          </Glass>
          <Glass className="min-w-0 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Cumulative net cash, 36 months</h3>
            {view ? (
              <CashChart current={view.cur} conservative={view.sc[0].result} optimistic={view.sc[2].result} />
            ) : (
              <div className="mt-3 h-[300px] rounded-xl bg-slate-900/5 motion-safe:animate-pulse" aria-hidden />
            )}
            {view && (
              <dl className="num mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><dt className="text-[11px] uppercase tracking-wider text-slate-500">Net / month</dt><dd className="text-fg">{aedShort(view.cur.netMonthly)}</dd></div>
                <div><dt className="text-[11px] uppercase tracking-wider text-slate-500">Net / year</dt><dd className="text-fg">{aedShort(view.cur.annualNet)}</dd></div>
                <div><dt className="text-[11px] uppercase tracking-wider text-slate-500">After 36 months</dt><dd className={view.cur.net36 < 0 ? "text-risk" : "text-fg"}>{aedShort(view.cur.net36)}</dd></div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-slate-500">Saving counted</dt>
                  <dd className="text-fg">{pct(view.cur.effectiveSavingPct, 1)} <span className="text-xs text-slate-500">of cost/parcel</span></dd>
                </div>
              </dl>
            )}
          </Glass>
        </div>
      </Section>

      {/* 03 HOW ROBUST */}
      <Section n={3} title="How robust is it?" kicker="Three scenarios, a two-way grid and the drivers that move payback most.">
        {view ? <ScenarioCards items={view.sc} active={activeScenario} onPick={pick} /> : <div className="h-48 rounded-2xl bg-slate-900/5 motion-safe:animate-pulse" aria-hidden />}
        <p className="mt-2 text-xs text-slate-500">Scenarios move only adoption (share kept, ends of the assumed range) and volume (±500 parcels a day); costs stay as assumed. Click a card to load it into the calculator.</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Glass className="min-w-0 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Sensitivity grid</h3>
            {view ? <div className="mt-3"><SensitivityGrid inputs={view.inputs} disableKm={noKm} /></div> : <div className="mt-3 h-64 rounded-xl bg-slate-900/5" aria-hidden />}
          </Glass>
          <Glass className="min-w-0 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">What moves payback most</h3>
            {view ? <div className="mt-3"><Tornado inputs={view.inputs} ranges={tornadoRanges(assumptions)} /></div> : <div className="mt-3 h-64 rounded-xl bg-slate-900/5" aria-hidden />}
          </Glass>
        </div>
      </Section>

      {/* 04 PILOT AND THE ASK */}
      <Section n={4} id="pilot" title="The 90-day pilot and the decision" kicker="Pilot, then a go/no-go gate, then scale. The board risks the pilot, not the roll-out.">
        <PilotRoadmap
          pilot={view?.inputs.pilotInvestment ?? B.pilot_investment_aed}
          exposure={pilotExposure(view?.inputs ?? { pilotInvestment: B.pilot_investment_aed, monthlyRunningCost: B.monthly_running_cost_aed })}
          gates={{
            costGatePct: view?.gate.pctOfBaseCost ?? null,
            costShareOfSimulated: view?.gate.shareOfSimulated ?? null,
            simCostPct: base?.costPct ?? null,
            simKmPct: base?.kmPct ?? null,
            onTimeBase: base?.onTimeBase ?? null,
            onTimeAi: base?.onTimeAi ?? null,
            parcelsPerDay: B.parcels_per_day,
          }}
        />
      </Section>

      {/* method and benchmark */}
      <Glass className="mb-6 p-5 text-sm text-slate-600">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">How the numbers are built</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Saving per parcel = (baseline − AI cost per parcel) × share kept × stress test. Monthly saving = saving × parcels a day × {B.working_days_per_year} / 12 days. Payback = pilot investment ÷ (monthly saving − running cost). Code: <code className="text-xs">web/lib/roi.ts</code>, tests: <code className="text-xs">web/tests/roi.test.ts</code>.</li>
          {view && (
            <li>Sanity check: the simulated cut is {pct(view.ref.simulatedSavingPct, 1)} because our baseline (nearest neighbour) is simple. We count {pct(B.adoption_haircut * 100)}, so {pct(view.ref.effectiveSavingPct, 1)} of cost per parcel, which is {view.ref.benchmark === "within" ? "inside" : view.ref.benchmark} the {BENCHMARK_PCT[0]} to {BENCHMARK_PCT[1]}% range McKinsey reports for AI in distribution (research brief R7).</li>
          )}
          <li>Costs per parcel cover km, driver hours, expected failed attempts and SLA penalties on one simulated day at one hub (kpi.ts). The {B.parcels_per_day.toLocaleString("en-US")} parcels a day is an assumed network volume after roll-out; scale-up cost beyond the running cost is not modelled.</li>
          <li>Ranges for the sliders, grid and tornado come from the provenance block of assumptions.json; the 70% acceptance target is an assumed policy value.</li>
        </ul>
      </Glass>

      <Glass className="mb-4 p-5">
        <p className="text-sm text-slate-600">
          <span className="font-medium text-ai">What this means for operations:</span> the decision today is small and capped: a 90-day pilot at one hub. Dispatchers
          keep control throughout, and the network changes only if the pilot shows a real cost cut of at least {view ? pct(view.gate.pctOfBaseCost, 1) : "the gate value"} with on-time
          and km moving the right way. If it does not, we stop and the loss is capped at {aed(pilotExposure(view?.inputs ?? { pilotInvestment: B.pilot_investment_aed, monthlyRunningCost: B.monthly_running_cost_aed }))}.
        </p>
      </Glass>
      <p className="text-xs text-slate-500">DubaiDash Express is fictional. All business inputs are assumed (Assumptions button above); all costs per parcel are simulated by the engine. Nothing here is a forecast.</p>
    </AppShell>
  );
}
