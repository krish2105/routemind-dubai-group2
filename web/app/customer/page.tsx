"use client";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/nav/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Glass } from "@/components/ui/Glass";
import { Badge } from "@/components/ui/Badge";
import { KpiCard } from "@/components/ui/KpiCard";
import { AssumptionsButton } from "@/components/assumptions/AssumptionsDrawer";
import { PAGES } from "@/lib/pages";
import { buildProblem } from "@/lib/engine/problem";
import { POINT_POOL } from "@/lib/engine/points";
import { computeKpis, explainKpi, kpiAssumptions, pctChange } from "@/lib/engine/kpi";
import { APPROVAL_LABEL, REASONS, type Reason } from "@/lib/copilot/templates";
import { useScenario, withOverrides } from "@/store/useScenario";
import type { Plan, Problem } from "@/lib/types";

const page = PAGES.find((p) => p.href === "/customer")!;
const areaOf = new Map(POINT_POOL.map((p) => [p.id, p.name]));
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.round(m % 60)).padStart(2, "0")}`;
const REASON_LABEL: Record<Reason, string> = {
  traffic: "Traffic", szr_jam: "Sheikh Zayed Road jam", al_khail_jam: "Al Khail Road jam", sandstorm: "Sandstorm",
  rain: "Heavy rain", high_volume: "High order volume", vehicle_issue: "Vehicle issue",
};
const EVENT_REASON: Record<string, Reason> = { szr_jam: "szr_jam", al_khail_jam: "al_khail_jam", sandstorm: "sandstorm", rain: "rain", urgent_surge: "high_volume" };

interface RiskRow { orderId: string; area: string; window: string; arrival?: number; slack?: number; vehicleId?: string; why: string; late: boolean }

/** Late stops first (most late), then lowest slack under the buffer, then unserved. */
function riskRows(p: Problem, plan: Plan, buffer: number): RiskRow[] {
  const rows: RiskRow[] = [];
  for (const r of plan.routes) for (const s of r.stops) {
    if (!s.late && s.slack >= buffer) continue;
    const o = p.orders[s.orderIdx];
    rows.push({
      orderId: o.id, area: areaOf.get(o.pointId) ?? o.pointId, window: `${hhmm(o.windowStart)}-${hhmm(o.windowEnd)}`, arrival: s.arrival, slack: s.slack,
      vehicleId: r.vehicleId, late: s.late, why: s.late ? `late by ${Math.round(-s.slack)} min` : `only ${Math.round(s.slack)} min slack`,
    });
  }
  rows.sort((a, b) => (a.slack ?? 0) - (b.slack ?? 0));
  for (const id of plan.unserved) {
    const o = p.orders.find((x) => x.id === id)!;
    rows.push({ orderId: id, area: areaOf.get(o.pointId) ?? o.pointId, window: `${hhmm(o.windowStart)}-${hhmm(o.windowEnd)}`, why: "unserved (no vehicle)", late: true });
  }
  return rows;
}

type Drafts = { en?: string; ar?: string };

export default function CustomerPage() {
  const { scenario, orderOverrides, results, status, run } = useScenario();
  const [view, setView] = useState<"cw2opt" | "baseline">("cw2opt");
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState<Reason>("traffic");
  const [delayMin, setDelayMin] = useState(20);
  const [drafts, setDrafts] = useState<Drafts | null>(null);
  const [source, setSource] = useState<string>("");
  const [summary, setSummary] = useState<Drafts | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [approved, setApproved] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!results.baseline || !results.cw2opt) void run(["baseline", "cw2opt"]);
  }, [results.baseline, results.cw2opt, run]);

  const problem: Problem = useMemo(() => buildProblem(withOverrides(orderOverrides), scenario), [orderOverrides, scenario]);
  const buffer = kpiAssumptions(problem).risk_buffer_min;
  const bp = results.baseline?.plan;
  const ap = results.cw2opt?.plan;
  const plan = view === "cw2opt" ? ap : bp;

  const data = useMemo(() => {
    if (!bp || !ap) return null;
    const kb = computeKpis(problem, bp), ka = computeKpis(problem, ap);
    const adherence = (k: typeof kb) => (k.served ? ((k.served - (k.slaBreaches - (k.orders - k.served))) / k.served) * 100 : 0);
    return { kb, ka, adhB: adherence(kb), adhA: adherence(ka) };
  }, [problem, bp, ap]);
  const rows = useMemo(() => (plan ? riskRows(problem, plan, buffer).slice(0, 10) : []), [problem, plan, buffer]);
  const sel = rows.find((r) => r.orderId === selected) ?? null;

  useEffect(() => {
    const ev = scenario.events.map((e) => EVENT_REASON[e.type]).find(Boolean);
    if (ev) setReason(ev);
  }, [scenario.events]);

  function choose(r: RiskRow) {
    setSelected(r.orderId);
    setDelayMin(r.late && r.slack !== undefined ? Math.max(5, Math.round(-r.slack)) : 20);
    setDrafts(null); setApproved(false); setEditing(false); setError("");
  }

  async function call(body: unknown): Promise<{ drafts: Drafts; source: string } | null> {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/copilot", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await res.json();
      if (!res.ok) { setError(j.error ?? "Copilot error"); return null; }
      return j;
    } catch {
      setError("Copilot unreachable");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function draftDelay() {
    if (!sel || sel.arrival === undefined) return;
    const j = await call({ kind: "delay", lang: "both", input: { orderId: sel.orderId, area: sel.area, oldEta: hhmm(sel.arrival), newEta: hhmm(sel.arrival + delayMin), delayMin, reason } });
    if (j) { setDrafts(j.drafts); setSource(j.source); setApproved(false); setEditing(false); }
  }

  async function draftSummary() {
    if (!plan) return;
    const k = computeKpis(problem, plan);
    const events = [...new Set(scenario.events.map((e) => EVENT_REASON[e.type]).filter(Boolean))].slice(0, 5);
    const topRisks = riskRows(problem, plan, buffer).filter((r) => r.slack !== undefined).slice(0, 5).map((r) => ({ orderId: r.orderId, area: r.area, slackMin: Math.round(r.slack!) }));
    const j = await call({
      kind: "summary", lang: "both",
      input: {
        plan: view === "cw2opt" ? "AI plan (Clarke-Wright + 2-opt)" : "Baseline plan (nearest neighbour)", orders: k.orders, served: k.served, onTimePct: Math.round(k.onTimePct * 10) / 10,
        slaBreaches: k.slaBreaches, atRisk: k.atRisk, vehiclesUsed: k.vehiclesUsed, km: Math.round(k.km), co2Kg: Math.round(k.co2Kg), events, topRisks,
      },
    });
    if (j) setSummary(j.drafts);
  }

  const f = (n: number, d = 0) => n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });

  return (
    <AppShell>
      <PageHeader page={page} />
      <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <AssumptionsButton />
        <span aria-live="polite">{status === "running" ? "Optimising in a Web Worker…" : `Same ${problem.orders.length} seeded orders (seed ${scenario.seed}) for baseline and AI.`}</span>
      </div>

      {!data ? (
        <Glass className="h-64 animate-pulse p-6 text-slate-500">Loading simulated plans…</Glass>
      ) : (
        <div className="flex flex-col gap-5">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="On-time" unit="%" base={f(data.kb.onTimePct, 1)} ai={f(data.ka.onTimePct, 1)} deltaPct={pctChange(data.kb.onTimePct, data.ka.onTimePct)} lowerIsBetter={false} />
            <KpiCard label="Window adherence (served)" unit="%" base={f(data.adhB, 1)} ai={f(data.adhA, 1)} deltaPct={pctChange(data.adhB, data.adhA)} lowerIsBetter={false} />
            <KpiCard label="SLA breaches" base={f(data.kb.slaBreaches)} ai={f(data.ka.slaBreaches)} deltaPct={pctChange(data.kb.slaBreaches, data.ka.slaBreaches)} />
            <KpiCard label="At risk" base={f(data.kb.atRisk)} ai={f(data.ka.atRisk)} deltaPct={pctChange(data.kb.atRisk, data.ka.atRisk)} />
          </section>
          <p className="-mt-2 text-xs text-slate-500">{explainKpi("onTimePct")} {explainKpi("atRisk")} Expected failed first attempts: baseline {f(data.kb.expectedFailedAttempts, 1)}, AI {f(data.ka.expectedFailedAttempts, 1)} (assumed rates).</p>

          <div className="grid gap-5 lg:grid-cols-5">
            <Glass className="overflow-x-auto p-5 lg:col-span-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-fg">Top 10 at-risk orders</h2>
                <div className="glass flex gap-1 rounded-xl p-1" role="radiogroup" aria-label="Plan">
                  {(["cw2opt", "baseline"] as const).map((v) => (
                    <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => { setView(v); setSelected(null); setDrafts(null); }}
                      className={`rounded-lg px-3 py-1.5 text-sm ${view === v ? (v === "cw2opt" ? "bg-ai text-white" : "bg-base text-white") : "text-slate-600 hover:text-fg"}`}>
                      {v === "cw2opt" ? "AI plan" : "Baseline"}
                    </button>
                  ))}
                </div>
              </div>
              {rows.length === 0 ? (
                <p className="mt-4 text-sm text-ok">No late or at-risk orders in this plan.</p>
              ) : (
                <table className="num mt-3 w-full min-w-[520px] text-left text-sm text-slate-700">
                  <thead className="text-xs uppercase tracking-wider text-slate-500">
                    <tr><th className="py-1">Order</th><th>Area</th><th>Window</th><th>ETA</th><th>Reason</th><th></th></tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.orderId} className={`border-t border-slate-900/5 ${selected === r.orderId ? "bg-ai/5" : ""}`}>
                        <td className="py-1.5">{r.orderId}</td>
                        <td className="font-sans">{r.area}</td>
                        <td>{r.window}</td>
                        <td>{r.arrival !== undefined ? hhmm(r.arrival) : "n/a"}</td>
                        <td className={r.late ? "text-risk" : "text-base"}>{r.why}</td>
                        <td>{r.arrival !== undefined && (
                          <button type="button" onClick={() => choose(r)} className="rounded-lg border border-ai/40 px-2 py-0.5 text-xs text-ai hover:bg-ai/10">Draft message</button>
                        )}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Glass>

            <Glass className="p-5 lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-fg">GenAI ops copilot</h2>
                <Badge tone="risk">{APPROVAL_LABEL}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600">Drafts a customer delay message in English and Arabic from the order id, area, times and reason only. Nothing is sent; a dispatcher approves or edits.</p>
              {!sel ? (
                <p className="mt-4 text-sm text-slate-500">Pick an order in the list to draft a message.</p>
              ) : (
                <div className="mt-4 space-y-3 text-sm">
                  <div className="text-slate-700">Order <b className="num">{sel.orderId}</b>, {sel.area}, planned ETA <span className="num">{hhmm(sel.arrival!)}</span></div>
                  <label className="flex items-center gap-3 text-slate-700">
                    <span className="w-20">Reason</span>
                    <select value={reason} onChange={(e) => setReason(e.target.value as Reason)} className="flex-1 rounded-lg border border-slate-900/10 bg-white px-2 py-1">
                      {REASONS.map((r) => <option key={r} value={r}>{REASON_LABEL[r]}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-3 text-slate-700">
                    <span className="w-20">Delay</span>
                    <input type="range" min={5} max={120} step={5} value={delayMin} onChange={(e) => setDelayMin(Number(e.target.value))} className="flex-1 accent-[#0891b2]" aria-label="Delay in minutes" />
                    <span className="num w-16 text-right">{delayMin} min</span>
                  </label>
                  <button type="button" disabled={busy} onClick={draftDelay} className="rounded-lg bg-ai px-3 py-1.5 text-white disabled:opacity-50">{busy ? "Drafting…" : "Draft EN + AR message"}</button>
                </div>
              )}
              {error && <p className="mt-3 text-sm text-risk">{error}</p>}
              {drafts && (
                <div className="mt-4 space-y-3 rounded-xl border-2 border-risk/60 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Badge tone="risk">GenAI content</Badge>
                    <span>source: {source === "llm" ? "LLM" : "template fallback (no API key)"}</span>
                  </div>
                  {(["en", "ar"] as const).map((l) => drafts[l] && (
                    editing ? (
                      <textarea key={l} dir={l === "ar" ? "rtl" : "ltr"} lang={l} value={drafts[l]} onChange={(e) => setDrafts({ ...drafts, [l]: e.target.value })}
                        className="h-28 w-full rounded-lg border border-slate-900/10 bg-white p-2 text-sm text-fg" aria-label={l === "ar" ? "Arabic draft" : "English draft"} />
                    ) : (
                      <p key={l} dir={l === "ar" ? "rtl" : "ltr"} lang={l} className={`rounded-lg bg-paper p-3 text-sm leading-relaxed text-fg ${l === "ar" ? "text-right" : ""}`}>{drafts[l]}</p>
                    )
                  ))}
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => { setApproved(true); setEditing(false); }} className="rounded-lg bg-ok px-3 py-1.5 text-sm text-white">Human approve</button>
                    <button type="button" onClick={() => { setEditing(!editing); setApproved(false); }} className="rounded-lg border border-slate-900/10 px-3 py-1.5 text-sm text-slate-700">{editing ? "Done editing" : "Edit"}</button>
                    {approved && <span className="text-sm text-ok">Approved by dispatcher. Not sent (demo, no customer contact data).</span>}
                  </div>
                </div>
              )}
            </Glass>
          </div>

          <Glass className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-fg">Dispatcher shift summary</h2>
                <Badge tone="risk">{APPROVAL_LABEL}</Badge>
              </div>
              <button type="button" disabled={busy || !plan} onClick={draftSummary} className="rounded-lg bg-ai px-3 py-1.5 text-sm text-white disabled:opacity-50">Draft summary ({view === "cw2opt" ? "AI plan" : "baseline"})</button>
            </div>
            {summary && (
              <div className="mt-4 grid gap-3 rounded-xl border-2 border-risk/60 p-3 md:grid-cols-2">
                <pre className="whitespace-pre-wrap rounded-lg bg-paper p-3 font-sans text-sm leading-relaxed text-fg" lang="en">{summary.en}</pre>
                <pre dir="rtl" lang="ar" className="whitespace-pre-wrap rounded-lg bg-paper p-3 text-right font-sans text-sm leading-relaxed text-fg">{summary.ar}</pre>
              </div>
            )}
          </Glass>

          <p className="text-xs text-slate-500">
            Privacy: order ids are synthetic; the copilot accepts only order id, community, times, reason and aggregate KPIs (strict validation), and the server never logs or stores message text.
            All data is assumed and all results are simulated. Arabic wording should be checked by a native speaker before any real use.
          </p>
        </div>
      )}
    </AppShell>
  );
}
