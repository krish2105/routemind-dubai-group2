"use client";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/nav/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Glass } from "@/components/ui/Glass";
import { Badge } from "@/components/ui/Badge";
import { KpiCard } from "@/components/ui/KpiCard";
import { AssumptionsButton } from "@/components/assumptions/AssumptionsDrawer";
import { PAGES } from "@/lib/pages";
import { buildProblem } from "@/lib/engine/problem";
import { computeKpis, explainKpi, fuelLitres, pctChange, vehicleKpis } from "@/lib/engine/kpi";
import { useScenario, withOverrides } from "@/store/useScenario";
import type { Plan, Problem } from "@/lib/types";

const page = PAGES.find((p) => p.href === "/fleet")!;
const BASE = "#d97706"; // --color-base (amber = baseline)
const AI = "#0891b2"; // --color-ai (teal = AI)
const GRID = "#e2e8f0";

/** Route durations (hours) of used vehicles, bucketed per hour, baseline vs AI. */
function durationHistogram(base: Plan, ai: Plan) {
  const hours = (p: Plan) => p.routes.filter((r) => r.stops.length).map((r) => (r.endMin - r.startMin) / 60);
  const b = hours(base), a = hours(ai);
  const max = Math.ceil(Math.max(1, ...b, ...a));
  return Array.from({ length: max }, (_, i) => ({
    bucket: `${i}-${i + 1} h`,
    baseline: b.filter((h) => h >= i && h < i + 1).length,
    ai: a.filter((h) => h >= i && h < i + 1).length,
  }));
}

export default function FleetPage() {
  const { scenario, orderOverrides, results, status, run } = useScenario();
  const [evPct, setEvPct] = useState(Math.round(scenario.evShare * 100));

  useEffect(() => {
    if (!results.baseline || !results.cw2opt) void run(["baseline", "cw2opt"]);
  }, [results.baseline, results.cw2opt, run]);

  // Same seeded problem the worker solved (cheap to rebuild; only KPIs are re-scored here, no solving).
  const problem: Problem = useMemo(() => buildProblem(withOverrides(orderOverrides), scenario), [orderOverrides, scenario]);
  const atEv = useMemo(() => ({ ...problem, evShare: evPct / 100 }), [problem, evPct]);
  const bp = results.baseline?.plan;
  const ap = results.cw2opt?.plan;

  const view = useMemo(() => {
    if (!bp || !ap) return null;
    const kb = computeKpis(atEv, bp), ka = computeKpis(atEv, ap);
    const vb = vehicleKpis(atEv, bp), va = vehicleKpis(atEv, ap);
    const util = vb.map((v, i) => ({ id: v.vehicleId, baseline: +v.capacityUtilPct.toFixed(1), ai: +va[i].capacityUtilPct.toFixed(1) }));
    return { kb, ka, util, hist: durationHistogram(bp, ap), fuelB: fuelLitres(atEv, bp), fuelA: fuelLitres(atEv, ap), vb, va };
  }, [atEv, bp, ap]);

  const f = (n: number, d = 0) => n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });

  return (
    <AppShell>
      <PageHeader page={page} />
      <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <AssumptionsButton />
        <span aria-live="polite">
          {status === "running" ? "Optimising in a Web Worker…" : `Baseline vs AI (Clarke-Wright + 2-opt) on the same ${problem.orders.length} seeded orders (seed ${scenario.seed}).`}
        </span>
        {ap?.meta.stub && <Badge tone="risk">AI plan is a stub</Badge>}
      </div>

      {!view ? (
        <Glass className="h-64 animate-pulse p-6 text-slate-500">Loading simulated plans…</Glass>
      ) : (
        <div className="flex flex-col gap-5">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Distance" unit="km" base={f(view.kb.km)} ai={f(view.ka.km)} deltaPct={pctChange(view.kb.km, view.ka.km)} />
            <KpiCard label="Fuel (non-EV share)" unit="L" base={f(view.fuelB)} ai={f(view.fuelA)} deltaPct={pctChange(view.fuelB, view.fuelA)} />
            <KpiCard label="CO2" unit="kg" base={f(view.kb.co2Kg)} ai={f(view.ka.co2Kg)} deltaPct={pctChange(view.kb.co2Kg, view.ka.co2Kg)} />
            <KpiCard label="Vehicles used" base={f(view.kb.vehiclesUsed)} ai={f(view.ka.vehiclesUsed)} deltaPct={pctChange(view.kb.vehiclesUsed, view.ka.vehiclesUsed)} />
            <KpiCard label="Capacity utilisation" unit="%" base={f(view.kb.capacityUtilPct, 1)} ai={f(view.ka.capacityUtilPct, 1)} deltaPct={pctChange(view.kb.capacityUtilPct, view.ka.capacityUtilPct)} lowerIsBetter={false} />
            <KpiCard label="Shift utilisation" unit="%" base={f(view.kb.shiftUtilPct, 1)} ai={f(view.ka.shiftUtilPct, 1)} deltaPct={pctChange(view.kb.shiftUtilPct, view.ka.shiftUtilPct)} lowerIsBetter={false} />
            <KpiCard label="Workload CV (fairness)" base={f(view.kb.workloadCv, 2)} ai={f(view.ka.workloadCv, 2)} deltaPct={pctChange(view.kb.workloadCv, view.ka.workloadCv)} />
            <KpiCard label="Drive time" unit="h" base={f(view.kb.driveHours, 1)} ai={f(view.ka.driveHours, 1)} deltaPct={pctChange(view.kb.driveHours, view.ka.driveHours)} />
          </section>

          <Glass className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-fg">EV-share what-if</h2>
                <p className="text-sm text-slate-600">Share of each fleet type that is electric. CO2 = km x (fuel factor x (1 - EV) + electric factor x EV). <Badge tone="base">assumed factors</Badge></p>
              </div>
              <div className="num text-right text-sm text-slate-700">
                Baseline <span className="text-base">{f(view.kb.co2Kg)} kg</span> · AI <span className="text-ai">{f(view.ka.co2Kg)} kg</span>
              </div>
            </div>
            <label className="mt-4 flex items-center gap-4 text-sm text-slate-700">
              <span className="w-24">EV share</span>
              <input type="range" min={0} max={100} step={5} value={evPct} onChange={(e) => setEvPct(Number(e.target.value))} className="w-full accent-[#0891b2]" aria-label="EV share in percent" />
              <span className="num w-12 text-right">{evPct}%</span>
            </label>
            <p className="mt-2 text-xs text-slate-500">Van 0.24 → 0.07 kg/km, bike 0.09 → 0.02 kg/km (assumed, grid mix). Routes are not re-optimised for EV range or charging.</p>
          </Glass>

          <div className="grid gap-5 lg:grid-cols-2">
            <Glass className="p-5">
              <h2 className="text-lg font-semibold text-fg">Capacity utilisation per vehicle</h2>
              <p className="text-sm text-slate-600">{explainKpi("capacityUtilPct")} 0% = vehicle stays at the hub.</p>
              <div className="mt-3 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={view.util} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="id" tick={{ fontSize: 11, fill: "#475569" }} interval={0} angle={-45} textAnchor="end" height={44} />
                    <YAxis unit="%" tick={{ fontSize: 11, fill: "#475569" }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#0b1b2e" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="baseline" name="Baseline" fill={BASE} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="ai" name="AI" fill={AI} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Glass>
            <Glass className="p-5">
              <h2 className="text-lg font-semibold text-fg">Workload fairness: route durations</h2>
              <p className="text-sm text-slate-600">{explainKpi("workloadCv")} Baseline CV <span className="num text-base">{f(view.kb.workloadCv, 2)}</span>, AI CV <span className="num text-ai">{f(view.ka.workloadCv, 2)}</span>.</p>
              <div className="mt-3 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={view.hist} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: "#475569" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#475569" }} label={{ value: "drivers", angle: -90, position: "insideLeft", offset: 24, fontSize: 11, fill: "#475569" }} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#0b1b2e" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="baseline" name="Baseline" fill={BASE} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="ai" name="AI" fill={AI} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Glass>
          </div>

          <Glass className="overflow-x-auto p-5">
            <h2 className="text-lg font-semibold text-fg">Per-vehicle detail (AI plan)</h2>
            <table className="num mt-3 w-full min-w-[560px] text-left text-sm text-slate-700">
              <thead className="text-xs uppercase tracking-wider text-slate-500">
                <tr><th className="py-1">Vehicle</th><th>Stops</th><th>km</th><th>Duty h</th><th>Load %</th><th>CO2 kg</th><th>Late</th><th className="text-base">Baseline km</th></tr>
              </thead>
              <tbody>
                {view.va.map((v, i) => (
                  <tr key={v.vehicleId} className="border-t border-slate-900/5">
                    <td className="py-1">{v.vehicleId} <span className="text-xs text-slate-500">{v.type}</span></td>
                    <td>{v.stops}</td><td>{f(v.km, 1)}</td><td>{f(v.dutyMin / 60, 1)}</td><td>{f(v.capacityUtilPct)}</td><td>{f(v.co2Kg, 1)}</td>
                    <td className={v.late ? "text-risk" : ""}>{v.late}</td><td className="text-base">{f(view.vb[i].km, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Glass>

          <Glass className="border-base/30 p-5">
            <h2 className="text-lg font-semibold text-fg">Heat rule (responsible AI)</h2>
            <p className="mt-1 text-sm text-slate-700">
              UAE midday break: outdoor work in direct sun is banned 12:30 to 3:00 pm from 15 June to 15 September, and delivery riders cannot be forced to work in those hours (research brief R14; Dubai RTA set up 23 temporary rest areas in 2026).
              This November demo does not apply the rule. A summer roll-out must block motorbike stops 12:30 to 15:00 and rebalance them to vans or later windows, and keep the fairness CV low so no rider absorbs the extra load.
            </p>
          </Glass>

          <p className="text-xs text-slate-500">All fleet data is assumed (DubaiDash Express is fictional); all results are simulated by the KPI engine (web/lib/engine/kpi.ts).</p>
        </div>
      )}
    </AppShell>
  );
}
