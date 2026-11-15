"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as Comlink from "comlink";
import { AppShell } from "@/components/nav/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Glass } from "@/components/ui/Glass";
import { Badge } from "@/components/ui/Badge";
import { AtRiskList, BeforeAfter, hhmm, ProgressSteps, STEPS } from "@/components/rerouting/parts";
import type { LiveOutput, MorningOutput, RerouteApi } from "@/components/rerouting/reroute.worker";
import { PAGES } from "@/lib/pages";
import { eventInfo, EVENT_TYPES, makeEvent } from "@/lib/engine/events";
import { useScenario, withOverrides } from "@/store/useScenario";
import type { EventType, TrafficEvent } from "@/lib/types";

/**
 * /rerouting: Live Re-routing (Karan's area, built by Yash; demo moment of slide 4).
 * Morning AI plan (Clarke-Wright + 2-opt) on the seeded day, then at the chosen time the dispatcher injects events,
 * presses Re-optimise, compares before/after and accepts or rejects the suggestion. Compute runs in a Web Worker.
 * All data simulated; event slow-downs are assumed (assumptions.json).
 */
const page = PAGES.find((p) => p.href === "/rerouting")!;

const RouteMap = dynamic(() => import("@/components/map/RouteMap"), {
  ssr: false,
  loading: () => <div className="h-[440px] animate-pulse rounded-2xl bg-paper-2" />,
});

let remote: Comlink.Remote<RerouteApi> | null = null;
function worker() {
  if (!remote) remote = Comlink.wrap<RerouteApi>(new Worker(new URL("../../components/rerouting/reroute.worker.ts", import.meta.url), { type: "module" }));
  return remote;
}

const DAY_START = 8 * 60;
const DAY_END = 20 * 60;
const MIN_ANIM_MS = 1400; // keep the progress animation visible long enough to follow in the demo
type Decision = { at: number; choice: "accepted" | "rejected"; summary: string };

export default function ReroutingPage() {
  const { scenario, orderOverrides } = useScenario();
  const a = useMemo(() => withOverrides(orderOverrides), [orderOverrides]);
  const [now, setNow] = useState(13 * 60);
  const [events, setEvents] = useState<TrafficEvent[]>([makeEvent("szr_jam", 13 * 60, 120)]);
  const [surgeCount, setSurgeCount] = useState(a.orders.urgent_surge_orders);
  const [morning, setMorning] = useState<MorningOutput | null>(null);
  const [res, setRes] = useState<LiveOutput | null>(null);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [pending, setPending] = useState(false);
  const [show, setShow] = useState<"baseline" | "ai" | "both">("both");
  const runId = useRef(0);

  useEffect(() => {
    let alive = true;
    worker().morning(a, scenario).then((m) => { if (alive) setMorning(m); }).catch((e) => setError(String(e)));
    return () => { alive = false; };
  }, [a, scenario]);

  const inputsKey = JSON.stringify([now, events, surgeCount, scenario, orderOverrides]);
  const [resKey, setResKey] = useState<string | null>(null);
  const stale = res !== null && resKey !== inputsKey;

  const addEvent = (type: EventType) => {
    const info = eventInfo(type, a);
    setEvents((cur) => [...cur.filter((e) => e.type !== type), makeEvent(type, now, info.defaultDurationMin)]);
  };
  const removeEvent = (id: string) => setEvents((cur) => cur.filter((e) => e.id !== id));

  const reoptimise = useCallback(async () => {
    const id = ++runId.current;
    setRunning(true); setError(null); setStep(0); setPending(false);
    const t0 = performance.now();
    const ticker = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), MIN_ANIM_MS / STEPS.length);
    try {
      const out = await worker().live(a, scenario, now, events, surgeCount);
      const wait = MIN_ANIM_MS - (performance.now() - t0);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      if (id !== runId.current) return;
      setStep(STEPS.length);
      setRes(out); setResKey(inputsKey); setPending(true);
    } catch (e) {
      if (id === runId.current) setError(String(e));
    } finally {
      clearInterval(ticker);
      if (id === runId.current) setRunning(false);
    }
  }, [a, scenario, now, events, surgeCount, inputsKey]);

  const decide = (choice: Decision["choice"]) => {
    if (!res) return;
    setDecisions((d) => [{ at: res.nowMin, choice, summary: `at-risk ${res.atRiskBefore} → ${res.atRiskAfter}, ${res.changedVehicles.length} routes changed` }, ...d].slice(0, 6));
    setPending(false);
  };

  const kb = res?.kpisBefore, ka = res?.kpisAfter;
  const changedRows = useMemo(() => {
    if (!res) return [];
    return res.changedVehicles.map((v) => {
      const b = res.before.routes.find((r) => r.vehicleId === v);
      const af = res.after.routes.find((r) => r.vehicleId === v);
      const rem = (r?: typeof b) => (r ? r.stops.filter((s) => s.arrival > res.nowMin).length : 0);
      return { v, before: rem(b), after: rem(af), endB: b?.endMin, endA: af?.endMin, kmB: b?.km ?? 0, kmA: af?.km ?? 0 };
    });
  }, [res]);

  return (
    <AppShell>
      <PageHeader page={page} />

      <div className="grid gap-5 xl:grid-cols-3">
        {/* controls */}
        <Glass className="min-w-0 space-y-5 p-5">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">1 · Time of day</h2>
            <div className="mt-2 flex items-center gap-3">
              <div className="num w-16 text-2xl text-fg">{hhmm(now)}</div>
              <input type="range" min={DAY_START} max={DAY_END} step={15} value={now} onChange={(e) => setNow(Number(e.target.value))}
                className="flex-1 accent-[var(--color-ai)]" aria-label="Re-route time" />
            </div>
            <p className="mt-1 text-xs text-slate-500">Stops reached before this time are frozen; vehicles continue from where they are.</p>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">2 · Inject an event at {hhmm(now)}</h2>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {EVENT_TYPES.map((t) => {
                const info = eventInfo(t, a);
                const on = events.some((e) => e.type === t);
                return (
                  <button key={t} type="button" onClick={() => addEvent(t)} title={info.note}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition ${on ? "border-ai/50 bg-ai/10 text-fg" : "border-slate-900/10 bg-white/70 text-slate-700 hover:border-ai/40"}`}>
                    <span className="mr-1" aria-hidden>{info.icon}</span>{info.short}
                    <span className="block text-[11px] text-slate-500">{info.scope === "orders" ? `+${surgeCount} urgent orders` : `×${info.multiplier} vans, ×${info.bikeMultiplier.toFixed(2)} bikes`}</span>
                  </button>
                );
              })}
            </div>
            <label className="mt-3 block text-sm text-slate-700">
              <span className="mb-1 flex justify-between"><span>Urgent surge size</span><span className="num text-fg">{surgeCount}</span></span>
              <input type="range" min={5} max={40} step={5} value={surgeCount} onChange={(e) => setSurgeCount(Number(e.target.value))} className="w-full accent-[var(--color-ai)]" aria-label="Urgent surge size" />
            </label>
            <ul className="mt-3 space-y-1.5">
              {events.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-900/10 bg-white/70 px-3 py-1.5 text-sm">
                  <span className="text-fg">{eventInfo(e.type, a).label} <span className="num text-xs text-slate-500">{hhmm(e.startMin)}–{hhmm(e.endMin)}</span></span>
                  <button type="button" onClick={() => removeEvent(e.id)} className="text-xs text-slate-500 hover:text-risk" aria-label={`Remove ${e.type}`}>remove</button>
                </li>
              ))}
              {!events.length && <li className="text-xs text-slate-500">No event: re-routing still re-checks the plan.</li>}
            </ul>
            <p className="mt-2 text-[11px] text-slate-500">Slow-down factors are assumed (assumptions.json), not measured traffic.</p>
          </div>

          <div className="space-y-3">
            <button type="button" onClick={() => void reoptimise()} disabled={running || !morning}
              className="w-full rounded-xl bg-ai px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50">
              {running ? "Re-optimising…" : !morning ? "Planning the morning routes…" : "3 · Re-optimise"}
            </button>
            <ProgressSteps step={step} running={running} />
            {stale && !running && <p className="text-xs text-base">Inputs changed since the last run: press Re-optimise.</p>}
            {error && <p className="text-xs text-risk">Engine error: {error}</p>}
            {morning && (
              <p className="text-xs text-slate-500">
                Morning AI plan: {morning.plan.routes.length} vehicles, {morning.kpis.served} of {morning.orders.length} orders, seed {scenario.seed}. Simulated.
              </p>
            )}
          </div>
        </Glass>

        {/* results */}
        <div className="min-w-0 space-y-5 xl:col-span-2">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <BeforeAfter label="Deliveries at risk" before={res?.atRiskBefore} after={res?.atRiskAfter} note="late or < 15 min slack" />
            <BeforeAfter label="SLA breaches" before={res?.breachesBefore} after={res?.breachesAfter} />
            <BeforeAfter label="Total km (day)" before={kb?.km} after={ka?.km} d={0} unit=" km" />
            <BeforeAfter label="Day cost" before={kb?.totalCostAed} after={ka?.totalCostAed} d={0} unit=" AED" />
          </div>

          {res && (
            <Glass className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-widest text-slate-500">Suggested plan at {hhmm(res.nowMin)}</div>
                  <p className="mt-1 text-sm text-slate-700">
                    {res.frozenStops} stops frozen, {res.remainingStops} re-planned, {res.changedVehicles.length} routes changed, {res.movedOrders.length} orders moved
                    {res.newOrders.length ? `, ${res.newOrders.length} new urgent orders` : ""}{res.after.unserved.length ? <span className="text-risk">, {res.after.unserved.length} could not be placed</span> : ", every order placed"}.
                    <span className="text-slate-500"> Solved in {res.stats.runMs.toFixed(0)} ms.</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" disabled={!pending} onClick={() => decide("accepted")} className="rounded-xl bg-ai px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40">Accept</button>
                  <button type="button" disabled={!pending} onClick={() => decide("rejected")} className="rounded-xl border border-slate-900/15 px-4 py-2 text-sm text-fg transition hover:bg-slate-900/5 disabled:opacity-40">Reject, keep current</button>
                </div>
              </div>
              {decisions.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-slate-900/10 pt-3 text-xs">
                  {decisions.map((d, i) => (
                    <li key={i} className={d.choice === "accepted" ? "text-ok" : "text-base"}>
                      {hhmm(d.at)} · Dispatcher {d.choice} ({d.summary}){d.choice === "accepted" ? ": new stops sent to the driver app (simulated)" : ": drivers keep the current plan; case logged for review"}
                    </li>
                  ))}
                </ul>
              )}
            </Glass>
          )}

          <Glass className="p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Routes: before (amber) vs after (teal)</h2>
              <div className="flex gap-1 rounded-xl border border-slate-900/10 bg-white/70 p-1 text-xs">
                {([["baseline", "Before"], ["ai", "After"], ["both", "Both"]] as const).map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setShow(v)} className={`rounded-lg px-3 py-1 transition ${show === v ? "bg-ai text-white" : "text-slate-500 hover:text-fg"}`}>{l}</button>
                ))}
              </div>
            </div>
            <RouteMap orders={res?.orders ?? morning?.orders ?? []} hub={res?.hub ?? morning?.hub ?? null}
              baseline={res?.before ?? morning?.plan} ai={res?.after} show={res ? show : "baseline"} time={now} riskFrom={res?.after ?? morning?.plan} height={440} events={events} />
          </Glass>

          <div className="grid gap-5 lg:grid-cols-5">
            <Glass className="min-w-0 p-5 lg:col-span-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">SLA-at-risk list</h2>
                <Badge tone="risk">at risk = late or &lt; 15 min slack</Badge>
              </div>
              {res ? <AtRiskList items={res.items} /> : <p className="text-sm text-slate-500">Inject an event and press Re-optimise.</p>}
            </Glass>
            <Glass className="min-w-0 overflow-x-auto p-5 lg:col-span-2">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-500">Changed routes</h2>
              {res && changedRows.length ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-900/10 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="py-2 pr-2 font-medium">Vehicle</th><th className="py-2 pr-2 text-right font-medium">Stops left</th><th className="py-2 pr-2 text-right font-medium">Back at hub</th>
                    </tr>
                  </thead>
                  <tbody className="num">
                    {changedRows.map((r) => (
                      <tr key={r.v} className="border-b border-slate-900/5">
                        <td className="py-1.5 pr-2 font-sans text-fg">{r.v}</td>
                        <td className="py-1.5 pr-2 text-right"><span className="text-base">{r.before}</span> → <span className="text-ai">{r.after}</span></td>
                        <td className="py-1.5 pr-2 text-right"><span className="text-base">{hhmm(r.endB)}</span> → <span className="text-ai">{hhmm(r.endA)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-sm text-slate-500">{res ? "No route needed to change." : "Changed routes appear here."}</p>}
            </Glass>
          </div>
        </div>
      </div>

      <Glass className="mt-5 border-ai/30 p-5">
        <div className="text-xs uppercase tracking-widest text-ai">What this means for operations</div>
        <p className="mt-2 text-fg">
          When a jam, storm or urgent surge hits, the dispatcher gets a new plan for the rest of the day in about a second instead of losing the afternoon.
          Completed stops stay as they are, the dispatcher accepts or rejects the suggestion, and every order stays visible. Results are simulated on assumed data.
        </p>
      </Glass>
    </AppShell>
  );
}
