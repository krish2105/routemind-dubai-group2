"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AppShell } from "@/components/nav/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Glass } from "@/components/ui/Glass";
import { TimeScrubber, usePlayback } from "@/components/map/TimeScrubber";
import { PAGES } from "@/lib/pages";
import { pctChange } from "@/lib/engine/kpi";
import { DEMO_EVENT, EVENT_LABELS, makeEvent } from "@/lib/engine/events";
import { useScenario } from "@/store/useScenario";
import type { TrafficEvent } from "@/lib/types";

const RouteMap = dynamic(() => import("@/components/map/RouteMap"), {
  ssr: false,
  loading: () => <div className="h-[520px] animate-pulse rounded-2xl bg-paper-2" />,
});

const page = PAGES.find((p) => p.href === "/command")!;

/** Scenario presets for the demo (event times are assumed). */
const PRESETS: { id: string; label: string; events: TrafficEvent[] }[] = [
  { id: "normal", label: "Normal day", events: [] },
  { id: "szr", label: "SZR jam 13:00", events: [DEMO_EVENT] },
  { id: "rain", label: "Heavy rain", events: [makeEvent("rain", "08:00", 720)] },
  { id: "sandstorm", label: "Sandstorm 12:00", events: [makeEvent("sandstorm", "12:00", 240)] },
];

type Show = "baseline" | "ai" | "both";

export default function CommandCenter() {
  const { results, orders, hub, status, progress, run, setScenario } = useScenario();
  const [preset, setPreset] = useState("normal");
  const [show, setShow] = useState<Show>("both");
  const playback = usePlayback(20);

  useEffect(() => {
    setScenario({ events: PRESETS.find((p) => p.id === preset)!.events });
    void run(["baseline", "cw2opt"]);
  }, [preset, setScenario, run]);

  const bp = results.baseline?.plan;
  const ap = results.cw2opt?.plan;
  const b = results.baseline?.kpis;
  const a = results.cw2opt?.kpis;
  const stub = ap?.meta.stub;
  const f = (n?: number, d = 1) => (n === undefined ? undefined : n.toFixed(d));
  const d = (x?: number, y?: number) => (x === undefined || y === undefined ? null : pctChange(x, y));
  const ev = PRESETS.find((p) => p.id === preset)!.events[0];

  return (
    <AppShell>
      <PageHeader page={page} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented label="Scenario" value={preset} onChange={setPreset} options={PRESETS.map((p) => ({ value: p.id, label: p.label }))} />
        <Segmented label="Show" value={show} onChange={(v) => setShow(v as Show)}
          options={[{ value: "baseline", label: "Baseline" }, { value: "ai", label: "AI" }, { value: "both", label: "Both" }]} />
        <span className="text-sm text-slate-500" aria-live="polite">
          {status === "running"
            ? `Optimising in a Web Worker${progress ? ` (${progress.algorithm === "cw2opt" ? "AI" : "baseline"} ${progress.index + 1}/${progress.total})` : ""}…`
            : status === "error" ? "Engine error, see console" : `Same ${orders.length || 300} seeded orders (seed 2611) for both plans.`}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <RouteMap orders={orders} hub={hub} baseline={bp} ai={ap} show={show} time={playback.time} riskFrom={show === "baseline" ? bp : ap} />
          <TimeScrubber {...playback} marker={ev ? { at: ev.startMin, label: EVENT_LABELS[ev.type].split(" (")[0] } : undefined} />
          <Legend />
        </div>
        <section className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <KpiCard label="Cost per parcel" unit="AED" base={f(b?.costPerParcelAed, 2)} ai={f(a?.costPerParcelAed, 2)} deltaPct={d(b?.costPerParcelAed, a?.costPerParcelAed)} stub={stub} />
          <KpiCard label="Distance" unit="km" base={f(b?.km, 0)} ai={f(a?.km, 0)} deltaPct={d(b?.km, a?.km)} stub={stub} />
          <KpiCard label="Vehicles used" base={f(b?.vehiclesUsed, 0)} ai={f(a?.vehiclesUsed, 0)} deltaPct={d(b?.vehiclesUsed, a?.vehiclesUsed)} stub={stub} />
          <KpiCard label="On-time" unit="%" base={f(b?.onTimePct)} ai={f(a?.onTimePct)} deltaPct={d(b?.onTimePct, a?.onTimePct)} lowerIsBetter={false} stub={stub} />
          <KpiCard label="SLA breaches" base={f(b?.slaBreaches, 0)} ai={f(a?.slaBreaches, 0)} deltaPct={d(b?.slaBreaches, a?.slaBreaches)} stub={stub} />
          <KpiCard label="CO2" unit="kg" base={f(b?.co2Kg, 0)} ai={f(a?.co2Kg, 0)} deltaPct={d(b?.co2Kg, a?.co2Kg)} stub={stub} />
        </section>
      </div>

      <Glass className="mt-6 p-5 text-sm text-slate-700">
        <span className="font-medium text-fg">How to read this:</span> amber = today&apos;s dispatcher rule (nearest order first),
        teal = RouteMind AI (Clarke-Wright savings + 2-opt). Dots are orders coloured by SLA risk in the {show === "baseline" ? "baseline" : "AI"} plan.
        Pick &quot;SZR jam 13:00&quot; and press Play to see the jam moment; the full re-plan is on the Re-routing page.
        {ap?.meta.note && <span className="mt-2 block text-xs text-slate-500">Engine: {ap.meta.note}; {ap.meta.runMs.toFixed(0)} ms.</span>}
      </Glass>
    </AppShell>
  );
}

function Segmented({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="glass flex items-center gap-1 rounded-xl p-1" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${value === o.value ? "bg-ai text-white" : "text-slate-500 hover:text-fg"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Legend() {
  const item = (cls: string, text: string) => (
    <span className="inline-flex items-center gap-1.5"><span className={`inline-block h-2.5 w-2.5 rounded-full ${cls}`} />{text}</span>
  );
  return (
    <div className="flex flex-wrap gap-4 px-1 text-xs text-slate-500">
      {item("bg-base", "Baseline route")}{item("bg-ai", "AI route")}{item("bg-ok", "On time")}{item("bg-base", "Under 15 min slack")}{item("bg-risk", "Late")}
      {item("bg-fg", "Hub, Al Quoz")}
    </div>
  );
}
