"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/nav/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Glass } from "@/components/ui/Glass";
import { Badge } from "@/components/ui/Badge";
import { TOOLTIP_STYLE } from "@/components/charts";
import { PAGES } from "@/lib/pages";
import { buildProblem } from "@/lib/engine/problem";
import { clusterZones, K_MAX, K_MIN, zoneStats } from "@/lib/engine/kmeans";
import { useScenario, withOverrides } from "@/store/useScenario";
import { zoneHex } from "./ZoneMap";

/**
 * /zones: Zones & Last Mile (owner: Yash, Slide 2 / Q3, Q6).
 * k-means zones on the seeded orders of the shared scenario (read-only use of the useScenario store),
 * micro-hub / locker candidates (medoids), orders per zone, stops per km, and a locker what-if.
 * All orders are simulated; every input is an assumption from assumptions.json unless labelled otherwise.
 */
const page = PAGES.find((p) => p.href === "/zones")!;

const ZoneMap = dynamic(() => import("./ZoneMap"), {
  ssr: false,
  loading: () => <div className="h-[480px] animate-pulse rounded-2xl bg-paper-2" />,
});

/**
 * ASSUMPTION for the what-if (page-level, labelled in the UI): a parcel left in a locker does not fail
 * (the customer collects it), and each zone's locker is one stop for the van. Not a measured figure.
 */
const LOCKER_FAIL_PROB = 0;

export default function ZonesPage() {
  const { scenario, orderOverrides } = useScenario();
  const [auto, setAuto] = useState(true);
  const [kManual, setKManual] = useState(6);
  const [lockerPct, setLockerPct] = useState(20);
  const [sandstorm, setSandstorm] = useState(false);

  const a = useMemo(() => withOverrides(orderOverrides), [orderOverrides]);
  const problem = useMemo(() => buildProblem(a, { ...scenario, events: [] }), [a, scenario]);
  const orders = problem.orders;
  const zones = useMemo(() => clusterZones(orders, auto ? undefined : kManual, scenario.seed), [orders, auto, kManual, scenario.seed]);
  const stats = useMemo(() => zoneStats(orders, zones), [orders, zones]);
  const autoRun = useMemo(() => (auto ? zones : clusterZones(orders, undefined, scenario.seed)), [auto, zones, orders, scenario.seed]);

  // locker what-if (assumed inputs from assumptions.json)
  const p = a.failed_attempt.base_probability + (sandstorm ? a.failed_attempt.sandstorm_extra : 0);
  const n = orders.length;
  const share = lockerPct / 100;
  const failedNow = n * p;
  const lockerOrders = Math.round(n * share);
  const failedWith = (n - lockerOrders) * p + lockerOrders * LOCKER_FAIL_PROB;
  const lockerStops = share > 0 ? zones.k : 0;
  const stopsWith = n - lockerOrders + lockerStops;
  const cost = a.costs.failed_delivery_cost_aed;

  const totalTour = stats.reduce((s, z) => s + z.tourKm, 0);
  const cityStopsPerKm = totalTour ? n / totalTour : 0;
  const bars = stats.map((z) => ({ name: `Z${z.zone + 1}`, orders: z.orders, zone: z.zone }));

  return (
    <AppShell>
      <PageHeader page={page} />

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="min-w-0 space-y-5 xl:col-span-2">
          <Glass className="p-3 sm:p-4">
            <ZoneMap orders={orders} zones={zones} hub={problem.hub} lockers={share > 0} />
          </Glass>

          <div className="grid gap-4 sm:grid-cols-4">
            <Stat label="Zones (k)" value={String(zones.k)} note={zones.autoK ? "chosen by silhouette" : "set by you"} />
            <Stat label="Silhouette" value={(zones.silhouette ?? 0).toFixed(3)} note="-1 to 1, higher = cleaner zones" />
            <Stat label="Stops per km" value={cityStopsPerKm.toFixed(2)} note="across all zone tours" />
            <Stat label="Orders" value={String(n)} note={`seed ${scenario.seed}, simulated`} />
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          <Glass className="space-y-4 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Zoning</h2>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="accent-[var(--color-ai)]" />
              Auto k (best silhouette, k = {K_MIN} to {K_MAX})
            </label>
            <label className={`block text-sm text-slate-700 ${auto ? "opacity-50" : ""}`}>
              <span className="mb-1 flex justify-between"><span>Number of zones k</span><span className="num text-fg">{auto ? zones.k : kManual}</span></span>
              <input type="range" min={K_MIN} max={K_MAX} step={1} value={auto ? zones.k : kManual} disabled={auto}
                onChange={(e) => setKManual(Number(e.target.value))} className="w-full accent-[var(--color-ai)]" aria-label="Number of zones" />
            </label>
            <div>
              <div className="mb-1 text-xs text-slate-500">Silhouette by k (dot = current)</div>
              <div className="h-28 text-slate-500">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={autoRun.silhouetteByK ?? []} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                    <CartesianGrid stroke="currentColor" strokeOpacity={0.12} vertical={false} />
                    <XAxis dataKey="k" tick={{ fontSize: 10, fill: "currentColor" }} stroke="currentColor" strokeOpacity={0.3} />
                    <YAxis tick={{ fontSize: 10, fill: "currentColor" }} stroke="currentColor" strokeOpacity={0.3} domain={["auto", "auto"]} tickFormatter={(v: number) => v.toFixed(2)} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [Number(v).toFixed(3), "silhouette"]} labelFormatter={(k) => `k = ${k}`} />
                    <Line type="monotone" dataKey="silhouette" stroke="var(--color-ai)" strokeWidth={2} dot={{ r: 2 }} />
                    <ReferenceDot x={zones.k} y={zones.silhouette ?? 0} r={5} fill="var(--color-base)" stroke="none" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-1 text-xs text-slate-500">Orders sit around ~36 Dubai areas, so the score keeps rising with k; more zones also means more micro-hubs to run.</p>
            </div>
          </Glass>

          <Glass className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Locker what-if</h2>
              <Badge tone="base">ASSUMED</Badge>
            </div>
            <label className="block text-sm text-slate-700">
              <span className="mb-1 flex justify-between"><span>Orders sent to a zone locker</span><span className="num text-fg">{lockerPct}%</span></span>
              <input type="range" min={0} max={50} step={5} value={lockerPct} onChange={(e) => setLockerPct(Number(e.target.value))} className="w-full accent-[var(--color-ai)]" aria-label="Locker share" />
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={sandstorm} onChange={(e) => setSandstorm(e.target.checked)} className="accent-[var(--color-ai)]" />
              Sandstorm day (+{Math.round(a.failed_attempt.sandstorm_extra * 100)} pts failure)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <MiniCompare label="Expected failed attempts" before={failedNow} after={failedWith} d={1} />
              <MiniCompare label="Failed-attempt cost (AED)" before={failedNow * cost} after={failedWith * cost} d={0} />
              <MiniCompare label="Van stops" before={n} after={stopsWith} d={0} />
              <MiniCompare label="First-attempt success" before={(1 - p) * 100} after={n ? (1 - failedWith / n) * 100 : 0} d={1} unit="%" higherBetter />
            </div>
            <p className="text-xs text-slate-500">
              Inputs: failure chance {Math.round(p * 100)}% per home drop and AED {cost} per failed attempt (assumptions.json). Assumed: a locker parcel does not fail,
              and each zone has one locker at its micro-hub (one stop). Simulated what-if, not a forecast.
            </p>
          </Glass>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <Glass className="min-w-0 p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-500">Orders per zone</h2>
          <div className="h-60 text-slate-500">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="currentColor" strokeOpacity={0.12} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "currentColor" }} stroke="currentColor" strokeOpacity={0.3} />
                <YAxis tick={{ fontSize: 11, fill: "currentColor" }} stroke="currentColor" strokeOpacity={0.3} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: "rgba(100,116,139,0.08)" }} formatter={(v) => [v, "orders"]} />
                <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
                  {bars.map((b) => <Cell key={b.name} fill={zoneHex(b.zone)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Glass>

        <Glass className="min-w-0 overflow-x-auto p-5 lg:col-span-3">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-500">Zone table</h2>
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-slate-900/10 text-left text-xs uppercase tracking-wider text-slate-500">
                {["Zone", "Orders", "Parcels", "Urgent", "Avg km to centre", "Stops / km", "Micro-hub"].map((h, i) => <th key={h} className={`py-2 pr-3 font-medium ${i && i < 6 ? "text-right" : ""}`}>{h}</th>)}
              </tr>
            </thead>
            <tbody className="num">
              {stats.map((z) => (
                <tr key={z.zone} className="border-b border-slate-900/5">
                  <td className="py-1.5 pr-3 font-sans text-fg"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: zoneHex(z.zone) }} />Z{z.zone + 1}</td>
                  <td className="py-1.5 pr-3 text-right">{z.orders}</td>
                  <td className="py-1.5 pr-3 text-right">{z.parcels}</td>
                  <td className="py-1.5 pr-3 text-right">{(z.urgentShare * 100).toFixed(0)}%</td>
                  <td className="py-1.5 pr-3 text-right">{z.avgKmToCentroid.toFixed(1)}</td>
                  <td className="py-1.5 pr-3 text-right">{z.stopsPerKm.toFixed(2)}</td>
                  <td className="py-1.5 pr-3 font-sans text-xs text-slate-500">{z.hub.orderId}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-500">Stops per km = zone orders / nearest-neighbour tour from the micro-hub (road km = straight line × {a.fallback.haversine_detour_factor} detour, assumed). Micro-hub = the real order nearest the zone centre (medoid).</p>
        </Glass>
      </div>

      <Glass className="mt-5 border-ai/30 p-5">
        <div className="text-xs uppercase tracking-widest text-ai">What this means for operations</div>
        <p className="mt-2 text-fg">
          Zones give each driver a compact patch, and the zone centre is a natural place for a micro-hub or locker. Lockers turn many home drops into one stop and
          remove most failed attempts, so the same fleet covers more parcels. These are simulated what-ifs to test in the pilot, not measured savings.
        </p>
      </Glass>
    </AppShell>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Glass className="p-4">
      <div className="text-[11px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="num mt-1 text-2xl text-ai">{value}</div>
      <div className="text-xs text-slate-500">{note}</div>
    </Glass>
  );
}

function MiniCompare({ label, before, after, d, unit = "", higherBetter = false }: { label: string; before: number; after: number; d: number; unit?: string; higherBetter?: boolean }) {
  const better = higherBetter ? after > before + 1e-9 : after < before - 1e-9;
  return (
    <div className="rounded-xl border border-slate-900/10 bg-white/70 p-3">
      <div className="text-[11px] leading-tight text-slate-500">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="num text-sm text-base">{before.toFixed(d)}{unit}</span>
        <span className="text-xs text-slate-500" aria-hidden>→</span>
        <span className={`num text-lg ${better ? "text-ai" : "text-fg"}`}>{after.toFixed(d)}{unit}</span>
      </div>
    </div>
  );
}
