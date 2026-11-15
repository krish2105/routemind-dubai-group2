"use client";
import { useEffect } from "react";
import { AppShell } from "@/components/nav/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { OwnerTodo } from "@/components/ui/OwnerTodo";
import { PAGES } from "@/lib/pages";
import { pctChange } from "@/lib/engine/kpi";
import { useScenario } from "@/store/useScenario";

const page = PAGES.find((p) => p.href === "/command")!;

export default function CommandCenter() {
  const { results, status, run } = useScenario();
  useEffect(() => { void run(["baseline", "cw2opt"]); }, [run]);
  const b = results.baseline?.kpis;
  const a = results.cw2opt?.kpis;
  const stub = results.cw2opt?.plan.meta.stub;
  const f = (n?: number, d = 1) => (n === undefined ? undefined : n.toFixed(d));
  const d = (x?: number, y?: number) => (x === undefined || y === undefined ? null : pctChange(x, y));
  return (
    <AppShell>
      <PageHeader page={page} />
      <p className="mb-4 text-sm text-slate-500">{status === "running" ? "Running in a Web Worker…" : "Same seeded orders for both plans."}</p>
      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Cost per parcel" unit="AED" base={f(b?.costPerParcelAed, 2)} ai={f(a?.costPerParcelAed, 2)} deltaPct={d(b?.costPerParcelAed, a?.costPerParcelAed)} stub={stub} />
        <KpiCard label="Distance" unit="km" base={f(b?.km, 0)} ai={f(a?.km, 0)} deltaPct={d(b?.km, a?.km)} stub={stub} />
        <KpiCard label="Vehicles used" base={f(b?.vehiclesUsed, 0)} ai={f(a?.vehiclesUsed, 0)} deltaPct={d(b?.vehiclesUsed, a?.vehiclesUsed)} stub={stub} />
        <KpiCard label="On-time" unit="%" base={f(b?.onTimePct)} ai={f(a?.onTimePct)} deltaPct={d(b?.onTimePct, a?.onTimePct)} lowerIsBetter={false} stub={stub} />
      </section>
      <OwnerTodo page={page} />
    </AppShell>
  );
}
