"use client";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/nav/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Glass } from "@/components/ui/Glass";
import { Badge } from "@/components/ui/Badge";
import { PAGES } from "@/lib/pages";
import { assumptions } from "@/lib/assumptions";
import { hhmm } from "@/components/map/trips";
import { useScenario } from "@/store/useScenario";
import type { AlgorithmId, Kpis, Plan } from "@/lib/types";

const page = PAGES.find((p) => p.href === "/optimizer")!;

const ALGOS: { id: AlgorithmId; label: string; note: string }[] = [
  { id: "baseline", label: "Baseline", note: "Today's dispatcher rule: nearest order whose window opens soon" },
  { id: "cw2opt", label: "Clarke-Wright + 2-opt", note: "Savings construction, then 2-opt, relocate, swap, route elimination" },
  { id: "ga", label: "Genetic algorithm", note: "Order crossover, mutation, elitism (owner: Atharva)" },
];
const label = (id: AlgorithmId) => ALGOS.find((a) => a.id === id)!.label;

export default function OptimizerPage() {
  const { scenario, setScenario, orderOverrides, setOrderOverrides, results, orders, status, progress, run, reset, resultsFor, cancel, cancelled } = useScenario();
  const [algos, setAlgos] = useState<AlgorithmId[]>(["baseline", "cw2opt"]);
  const [view, setView] = useState<AlgorithmId>("cw2opt");
  const windowMin = orderOverrides.time_window_min ?? assumptions.orders.time_window_min;
  const urgent = orderOverrides.urgent_share ?? assumptions.orders.urgent_share;
  const stale = resultsFor !== undefined && resultsFor !== JSON.stringify([scenario, orderOverrides]);

  const ran = ALGOS.map((a) => a.id).filter((id) => results[id]);
  const shown = results[view] ?? results[ran[0]];
  const shownId = results[view] ? view : ran[0];

  const download = () => {
    const blob = new Blob([JSON.stringify({
      note: "RouteMind Dubai prototype. All data is SIMULATED / ASSUMED (fictional courier DubaiDash Express).",
      scenario, orderOverrides, generatedAt: new Date().toISOString(),
      results: Object.fromEntries(ran.map((id) => [id, results[id]])),
    }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `routemind-plan-seed${scenario.seed}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <PageHeader page={page} />

      <div className="grid gap-5 xl:grid-cols-3">
        <Glass className="min-w-0 space-y-5 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Order generator</h2>
          <Slider label="Orders" value={scenario.orderCount} min={50} max={400} step={10} onChange={(v) => setScenario({ orderCount: v })} />
          <label className="block text-sm text-slate-700">
            <span className="mb-1 flex justify-between"><span>Seed</span><span className="text-xs text-slate-500">same seed = same orders</span></span>
            <input type="number" value={scenario.seed} onChange={(e) => setScenario({ seed: Number(e.target.value) || 0 })}
              className="num w-full rounded-lg border border-slate-900/10 bg-white/70 px-3 py-2 text-fg" />
          </label>
          <Slider label="Time window (min, smaller = tighter)" value={windowMin} min={60} max={240} step={30} onChange={(v) => setOrderOverrides({ time_window_min: v })} />
          <Slider label="Urgent share" value={Math.round(urgent * 100)} min={0} max={40} step={5} suffix="%" onChange={(v) => setOrderOverrides({ urgent_share: v / 100 })} />
          <div className="grid grid-cols-2 gap-3">
            <Slider label="Vans" value={scenario.vans} min={0} max={20} step={1} onChange={(v) => setScenario({ vans: v })} />
            <Slider label="Bikes" value={scenario.bikes} min={0} max={16} step={1} onChange={(v) => setScenario({ bikes: v })} />
          </div>

          <h2 className="pt-2 text-sm font-semibold uppercase tracking-widest text-slate-500">Algorithms</h2>
          <div className="space-y-2">
            {ALGOS.map((a) => (
              <label key={a.id} className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                <input type="checkbox" className="mt-1 accent-[var(--color-ai)]" checked={algos.includes(a.id)}
                  onChange={(e) => setAlgos(e.target.checked ? [...algos, a.id] : algos.filter((x) => x !== a.id))} />
                <span><span className="font-medium text-fg">{a.label}</span><span className="block text-xs text-slate-500">{a.note}</span></span>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={status === "running" || !algos.length}
              onClick={() => void run(ALGOS.map((a) => a.id).filter((id) => algos.includes(id)))}
              className="rounded-xl bg-ai px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50">
              {status === "running" ? "Running…" : "Run"}
            </button>
            {status === "running" && (
              <button type="button" onClick={cancel}
                className="rounded-xl border border-risk/50 px-4 py-2.5 text-sm font-medium text-risk transition hover:bg-risk/10">Cancel</button>
            )}
            <button type="button" onClick={reset} className="rounded-xl border border-slate-900/15 px-4 py-2.5 text-sm text-fg hover:bg-slate-900/5">Reset to default day</button>
          </div>
          <p className="text-xs text-slate-500" aria-live="polite">
            {status === "running" && progress ? `Running ${label(progress.algorithm)} (${progress.index + 1}/${progress.total}) in a Web Worker…`
              : status === "error" ? "Engine error, see console."
              : cancelled ? "Cancelled. Previous results are kept; press Run to try again."
              : stale ? "Settings changed: press Run to update." : "All algorithms see the identical seeded orders."}
          </p>
        </Glass>

        <div className="min-w-0 space-y-5 xl:col-span-2">
          <Glass className="overflow-x-auto p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Comparison</h2>
              <button type="button" disabled={!ran.length} onClick={download}
                className="rounded-lg border border-slate-900/15 px-3 py-1.5 text-xs text-fg hover:bg-slate-900/5 disabled:opacity-40">Download plan JSON</button>
            </div>
            {ran.length ? <Comparison ids={ran} results={results} /> : <p className="text-sm text-slate-500">Press Run to solve the seeded orders.</p>}
          </Glass>

          {shown && shownId && (
            <Glass className="overflow-x-auto p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="mr-2 text-sm font-semibold uppercase tracking-widest text-slate-500">Routes</h2>
                {ran.map((id) => (
                  <button key={id} type="button" onClick={() => setView(id)}
                    className={`rounded-lg px-3 py-1 text-xs transition ${shownId === id ? "bg-ai text-white" : "text-slate-500 hover:text-fg"}`}>{label(id)}</button>
                ))}
                {shown.plan.meta.stub && <Badge tone="risk">STUB: {shown.plan.meta.note}</Badge>}
              </div>
              <RouteTable plan={shown.plan} orderCount={orders.length} />
            </Glass>
          )}

          <Glass className="p-5">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-widest text-slate-500">GA convergence</h2>
            <Convergence plan={results.ga?.plan} />
          </Glass>
        </div>
      </div>
    </AppShell>
  );
}

function Slider({ label, value, min, max, step, suffix = "", onChange }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (v: number) => void }) {
  return (
    <label className="block text-sm text-slate-700">
      <span className="mb-1 flex justify-between"><span>{label}</span><span className="num text-fg">{value}{suffix}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--color-ai)]" />
    </label>
  );
}

const ROWS: { key: keyof Kpis; label: string; d: number; unit?: string }[] = [
  { key: "km", label: "Distance", d: 0, unit: "km" },
  { key: "vehiclesUsed", label: "Vehicles used", d: 0 },
  { key: "costPerParcelAed", label: "Cost per parcel", d: 2, unit: "AED" },
  { key: "totalCostAed", label: "Total cost", d: 0, unit: "AED" },
  { key: "onTimePct", label: "On-time", d: 1, unit: "%" },
  { key: "slaBreaches", label: "SLA breaches", d: 0 },
  { key: "atRisk", label: "At risk (<15 min slack)", d: 0 },
  { key: "co2Kg", label: "CO2", d: 0, unit: "kg" },
  { key: "driveHours", label: "Drive time", d: 1, unit: "h" },
  { key: "workloadCv", label: "Workload spread (CV)", d: 2 },
];

function Comparison({ ids, results }: { ids: AlgorithmId[]; results: Partial<Record<AlgorithmId, { plan: Plan; kpis: Kpis }>> }) {
  return (
    <table className="w-full min-w-[520px] text-sm">
      <thead>
        <tr className="border-b border-slate-900/10 text-left text-xs uppercase tracking-wider text-slate-500">
          <th className="py-2 pr-3 font-medium">KPI</th>
          {ids.map((id) => <th key={id} className={`py-2 pr-3 text-right font-medium ${id === "baseline" ? "text-base" : "text-ai"}`}>{label(id)}{results[id]!.plan.meta.stub ? " (stub)" : ""}</th>)}
        </tr>
      </thead>
      <tbody className="num">
        {ROWS.map((r) => (
          <tr key={r.key} className="border-b border-slate-900/5">
            <td className="py-1.5 pr-3 font-sans text-slate-700">{r.label}{r.unit ? <span className="text-slate-500"> ({r.unit})</span> : null}</td>
            {ids.map((id) => <td key={id} className="py-1.5 pr-3 text-right text-fg">{results[id]!.kpis[r.key].toFixed(r.d)}</td>)}
          </tr>
        ))}
        <tr>
          <td className="py-1.5 pr-3 font-sans text-slate-700">Run time <span className="text-slate-500">(ms)</span></td>
          {ids.map((id) => <td key={id} className="py-1.5 pr-3 text-right text-fg">{results[id]!.plan.meta.runMs.toFixed(0)}</td>)}
        </tr>
      </tbody>
    </table>
  );
}

function RouteTable({ plan, orderCount }: { plan: Plan; orderCount: number }) {
  const caps = { V: assumptions.vehicles.van.capacity_parcels, B: assumptions.vehicles.bike.capacity_parcels };
  return (
    <>
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-slate-900/10 text-left text-xs uppercase tracking-wider text-slate-500">
            {["Vehicle", "Stops", "Load", "km", "Out", "Back", "Late", "Duty"].map((h, i) => <th key={h} className={`py-2 pr-3 font-medium ${i ? "text-right" : ""}`}>{h}</th>)}
          </tr>
        </thead>
        <tbody className="num">
          {plan.routes.map((r) => {
            const late = r.stops.filter((s) => s.late).length;
            const cap = caps[r.vehicleId[0] as "V" | "B"];
            return (
              <tr key={r.vehicleId} className="border-b border-slate-900/5">
                <td className="py-1.5 pr-3 font-sans text-fg">{r.vehicleId} <span className="text-xs text-slate-500">{r.vehicleId.startsWith("V") ? "van" : "bike"}</span></td>
                <td className="py-1.5 pr-3 text-right">{r.stops.length}</td>
                <td className="py-1.5 pr-3 text-right">{r.load}/{cap}</td>
                <td className="py-1.5 pr-3 text-right">{r.km.toFixed(1)}</td>
                <td className="py-1.5 pr-3 text-right">{hhmm(r.startMin)}</td>
                <td className="py-1.5 pr-3 text-right">{hhmm(r.endMin)}</td>
                <td className={`py-1.5 pr-3 text-right ${late ? "text-risk" : "text-ok"}`}>{late}</td>
                <td className={`py-1.5 pr-3 text-right font-sans text-xs ${r.overDuty ? "text-risk" : "text-slate-500"}`}>{r.overDuty ? "over" : "ok"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-slate-500">
        {plan.routes.length} vehicles, {plan.routes.reduce((s, r) => s + r.stops.length, 0)} of {orderCount} orders served
        {plan.unserved.length ? `, ${plan.unserved.length} unserved (${plan.unserved.slice(0, 8).join(", ")}${plan.unserved.length > 8 ? "…" : ""})` : ""}.
        {plan.meta.note && !plan.meta.stub ? ` ${plan.meta.note}.` : ""}
      </p>
    </>
  );
}

function Convergence({ plan }: { plan?: Plan }) {
  const data = useMemo(() => (plan?.meta.convergence ?? []).map((v, g) => ({ g, v })), [plan]);
  if (!plan) return <p className="text-sm text-slate-500">Tick &quot;Genetic algorithm&quot; and press Run to see best cost per generation.</p>;
  if (!data.length) return <p className="text-sm text-slate-500">No convergence data yet{plan.meta.stub ? ": the GA is still a stub (Atharva's PR adds it)" : ""}.</p>;
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.08} />
          <XAxis dataKey="g" tick={{ fontSize: 11, fill: "currentColor" }} stroke="currentColor" strokeOpacity={0.3} />
          <YAxis tick={{ fontSize: 11, fill: "currentColor" }} stroke="currentColor" strokeOpacity={0.3} width={56} domain={["auto", "auto"]} />
          <Tooltip formatter={(v) => [Number(v).toFixed(0), "best cost (AED)"]} labelFormatter={(g) => `generation ${g}`} />
          <Line type="monotone" dataKey="v" stroke="var(--color-ai)" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
