"use client";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { AppShell } from "@/components/nav/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Glass } from "@/components/ui/Glass";
import { Badge } from "@/components/ui/Badge";
import { KpiCard } from "@/components/ui/KpiCard";
import { PAGES } from "@/lib/pages";
import { assumptions } from "@/lib/assumptions";
import { loadEta, predictEta, trafficFromHour, type Traffic, type ZoneType } from "@/lib/models/eta";
import metrics from "@/public/data/eta_metrics.json";

const page = PAGES.find((p) => p.href === "/eta")!;

const NAMES: Record<string, string> = {
  distance_km: "Distance", hour: "Time of day", weekday: "Weekday", traffic: "Traffic", weather: "Weather",
  vehicle: "Vehicle", area: "Zone type", category: "Product category", Agent_Age: "Courier age", Agent_Rating: "Courier rating",
};
const pct = (model: number, naive: number) => ((model - naive) / naive) * 100;
const axis = { tick: { fontSize: 11, fill: "currentColor" }, stroke: "currentColor", strokeOpacity: 0.3 };

export default function EtaPage() {
  const better = metrics.naive_mae - metrics.mae;
  return (
    <AppShell>
      <PageHeader page={page} />

      <Glass className="mb-6 border-l-4 border-l-base p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="base">Data caveat</Badge>
          <span className="text-sm font-medium text-fg">Trained on Indian delivery data, not Dubai.</span>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          {metrics.dataset_note} {metrics.n_train.toLocaleString()} training and {metrics.n_test.toLocaleString()} test deliveries;
          {" "}{metrics.split}. A DubaiDash pilot must retrain on its own delivery logs before any ETA is shown to customers.
        </p>
      </Glass>

      <section className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="MAE (mean absolute error)" base={metrics.naive_mae.toFixed(1)} ai={metrics.mae.toFixed(1)} unit="min" deltaPct={pct(metrics.mae, metrics.naive_mae)} />
        <KpiCard label="RMSE" base={metrics.naive_rmse.toFixed(1)} ai={metrics.rmse.toFixed(1)} unit="min" deltaPct={pct(metrics.rmse, metrics.naive_rmse)} />
        <KpiCard label="R-squared (higher is better)" base={metrics.naive_r2.toFixed(2)} ai={metrics.r2.toFixed(2)} lowerIsBetter={false} />
      </section>
      <p className="mt-3 text-sm text-slate-600">
        <span className="text-base">Baseline</span> = naive rule (median delivery time per 2 km of distance).{" "}
        <span className="text-ai">AI</span> = gradient-boosted trees (LightGBM, {metrics.trees} trees). On the same held-out test set the model is{" "}
        <span className="num text-ai">{better.toFixed(1)} min</span> more accurate per delivery than the naive rule.
      </p>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Glass className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">What drives the prediction</h2>
          <p className="mt-1 text-xs text-slate-500">Share of the model&apos;s total gain per input.</p>
          <div className="mt-3 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={metrics.feature_importance.map((f) => ({ name: NAMES[f.name] ?? f.name, v: f.value * 100 }))} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                <CartesianGrid stroke="currentColor" strokeOpacity={0.08} horizontal={false} />
                <XAxis type="number" {...axis} unit="%" />
                <YAxis type="category" dataKey="name" {...axis} width={112} />
                <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, "share of gain"]} />
                <Bar dataKey="v" fill="var(--color-ai)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-500">Product category and courier rating rank high in this dataset; that is a property of the Indian data, not a finding about Dubai.</p>
        </Glass>

        <Glass className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Predicted vs actual (test set)</h2>
          <p className="mt-1 text-xs text-slate-500">{metrics.pred_vs_actual.length} random test deliveries. On the amber line the prediction is perfect.</p>
          <div className="mt-3 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 4, right: 16, bottom: 16, left: 4 }}>
                <CartesianGrid stroke="currentColor" strokeOpacity={0.08} />
                <XAxis type="number" dataKey="actual" name="actual" unit=" min" domain={[0, 280]} {...axis} label={{ value: "actual minutes", position: "insideBottom", offset: -8, fontSize: 11, fill: "currentColor" }} />
                <YAxis type="number" dataKey="predicted" name="predicted" unit=" min" domain={[0, 280]} {...axis} width={64} />
                <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 280, y: 280 }]} stroke="var(--color-base)" strokeDasharray="4 4" />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={metrics.pred_vs_actual} fill="var(--color-ai)" fillOpacity={0.55} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Glass>
      </section>

      <WhatIf />

      <Glass className="mt-8 p-5">
        <p className="text-sm text-slate-600">
          <span className="font-medium text-ai">What this means for operations:</span> an ETA model that is {better.toFixed(0)} minutes
          closer than a distance rule lets dispatchers promise honest slots and flag orders likely to miss their window before the van
          leaves. In RouteMind it feeds the customer ETA messages and live re-routing. Method shown on Indian data; retrain on Dubai data in the pilot.
        </p>
      </Glass>
    </AppShell>
  );
}

const ZONES: { id: ZoneType; label: string }[] = [
  { id: "Metropolitian", label: "Metropolitan" },
  { id: "Urban", label: "Urban" },
  { id: "Semi-Urban", label: "Semi-urban" },
  { id: "Other", label: "Outskirts" },
];

function WhatIf() {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [distanceKm, setDistance] = useState(12);
  const [hour, setHour] = useState(18);
  const [traffic, setTraffic] = useState<Traffic | "auto">("auto");
  const [weather, setWeather] = useState<"clear" | "rain" | "sandstorm">("clear");
  const [vehicle, setVehicle] = useState<"van" | "bike">("van");
  const [zone, setZone] = useState<ZoneType>("Metropolitian");
  const [promiseMin, setPromise] = useState(assumptions.orders.time_window_min);

  useEffect(() => { loadEta().then(() => setReady(true), () => setFailed(true)); }, []);

  const p = useMemo(
    () => predictEta({ distanceKm, hour, rain: weather === "rain", sandstorm: weather === "sandstorm", vehicle, zone, promiseMin, traffic: traffic === "auto" ? undefined : traffic }),
    [ready, distanceKm, hour, traffic, weather, vehicle, zone, promiseMin],
  );
  const risk = p.delayRiskPct >= 50 ? "text-risk" : p.delayRiskPct >= 20 ? "text-base" : "text-ok";
  const field = "mt-1 w-full rounded-lg border border-slate-900/10 bg-white px-3 py-2 text-sm text-fg";
  const label = "text-xs font-medium uppercase tracking-widest text-slate-500";

  return (
    <Glass className="mt-8 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">What-if ETA</h2>
        {p.stub && <Badge tone="risk">{failed ? "model failed to load: rule-of-thumb stub" : "loading model…"}</Badge>}
        {!p.stub && <Badge tone="ai">model runs in your browser</Badge>}
      </div>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          <label className="sm:col-span-2">
            <span className={label}>Distance <span className="num text-fg">{distanceKm} km</span></span>
            <input type="range" min={1} max={30} step={0.5} value={distanceKm} onChange={(e) => setDistance(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-ai)]" />
          </label>
          <label className="sm:col-span-2">
            <span className={label}>Departure hour <span className="num text-fg">{String(Math.floor(hour)).padStart(2, "0")}:00</span></span>
            <input type="range" min={8} max={20} step={1} value={hour} onChange={(e) => setHour(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-ai)]" />
          </label>
          <label>
            <span className={label}>Traffic</span>
            <select className={field} value={traffic} onChange={(e) => setTraffic(e.target.value as Traffic | "auto")}>
              <option value="auto">Auto: {trafficFromHour(hour)}</option>
              {(["Low", "Medium", "High", "Jam"] as const).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>
            <span className={label}>Weather</span>
            <select className={field} value={weather} onChange={(e) => setWeather(e.target.value as typeof weather)}>
              <option value="clear">Clear</option>
              <option value="rain">Heavy rain</option>
              <option value="sandstorm">Sandstorm</option>
            </select>
          </label>
          <label>
            <span className={label}>Vehicle</span>
            <select className={field} value={vehicle} onChange={(e) => setVehicle(e.target.value as "van" | "bike")}>
              <option value="van">Van</option>
              <option value="bike">Motorbike</option>
            </select>
          </label>
          <label>
            <span className={label}>Zone type</span>
            <select className={field} value={zone} onChange={(e) => setZone(e.target.value as ZoneType)}>
              {ZONES.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className={label}>Promised slot <span className="num text-fg">{promiseMin} min</span></span>
            <input type="range" min={30} max={240} step={15} value={promiseMin} onChange={(e) => setPromise(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-ai)]" />
          </label>
        </form>

        <div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-900/10 bg-paper/70 p-4">
              <div className={label}>Predicted ETA</div>
              <div className="num mt-1 text-4xl text-ai">{p.minutes.toFixed(0)}<span className="ml-1 text-base text-slate-500">min</span></div>
            </div>
            <div className="rounded-xl border border-slate-900/10 bg-paper/70 p-4">
              <div className={label}>Delay risk</div>
              <div className={`num mt-1 text-4xl ${risk}`}>{p.delayRiskPct.toFixed(0)}<span className="ml-1 text-base text-slate-500">%</span></div>
              <div className="mt-1 text-xs text-slate-500">chance of missing the {promiseMin}-min slot</div>
            </div>
          </div>
          <h3 className="mt-5 text-xs font-medium uppercase tracking-widest text-slate-500">How the ETA is built (minutes)</h3>
          <ul className="mt-2 space-y-1.5">
            {p.contributions.map((c) => (
              <li key={c.feature} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-600">{c.feature}</span>
                <span className={`num ${c.feature.startsWith("distance") ? "text-fg" : c.minutes > 0.5 ? "text-risk" : c.minutes < -0.5 ? "text-ok" : "text-slate-500"}`}>
                  {c.feature.startsWith("distance") ? "" : c.minutes >= 0 ? "+" : ""}{c.minutes.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Each line is the change versus a calm reference (11:00, low traffic, clear, motorbike, metropolitan). Delay risk uses the
            model&apos;s test error spread (RMSE about {metrics.rmse.toFixed(0)} min). Traffic-by-hour mapping and the {assumptions.orders.time_window_min}-min slot are assumed.
            Absolute times reflect the Indian training data.
          </p>
        </div>
      </div>
    </Glass>
  );
}
