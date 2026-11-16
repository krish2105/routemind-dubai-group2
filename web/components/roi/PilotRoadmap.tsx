import { Glass } from "@/components/ui/Glass";
import { aed, pct } from "./fmt";

/**
 * 90-day pilot, go/no-go gates and the ask (owner: Harsh). Static content: renders at once, no solver needed.
 * The same phases, gates and ask are on Slide 7 (deck/slides/s7_harsh.js) and in the Slide 7 script.
 * Thresholds: the cost gate is computed by the ROI model (breakEvenSaving); the acceptance target is an assumed policy value.
 */
export const PILOT_STEPS = [
  { days: "Days 0 to 30", title: "Connect", text: "Read TMS/WMS exports, Makani addresses, traffic and weather feeds. Measure today's cost, km and on-time in one pilot zone and one control zone." },
  { days: "Days 31 to 60", title: "Shadow", text: "RouteMind plans every morning beside the dispatchers. No customer impact: compare plans, tune, train." },
  { days: "Days 61 to 90", title: "Live on one zone", text: "Dispatchers run AI routes with live re-routing and copilot messages; any route can be overridden. The control zone keeps today's planning." },
] as const;

export interface GateNumbers {
  /** real cost-per-parcel cut needed for a 24-month payback (ROI model) */
  costGatePct: number | null;
  costShareOfSimulated: number | null;
  simCostPct: number | null;
  simKmPct: number | null;
  onTimeBase: number | null;
  onTimeAi: number | null;
  /** assumed network volume behind the payback */
  parcelsPerDay: number;
}

export function gateRows(g: GateNumbers) {
  const n = (v: number | null, d = 1) => (v === null ? "…" : pct(v, d));
  return [
    { gate: "Cost per parcel", rule: `down at least ${n(g.costGatePct)}`, why: `the real cut that still pays back within 24 months at ${g.parcelsPerDay.toLocaleString("en-US")} parcels a day (recomputed with the volume seen in the pilot)${g.costShareOfSimulated === null ? "" : ` (${pct(g.costShareOfSimulated * 100)} of the simulated cut)`}`, sim: `simulated: down ${n(g.simCostPct)}`, kind: "model" },
    { gate: "km per parcel", rule: "down vs the control zone", why: "fewer km is where the cost and CO2 saving comes from", sim: `simulated: down ${n(g.simKmPct)}`, kind: "direction" },
    { gate: "On-time rate", rule: "up vs the control zone", why: "customers must not pay for the saving", sim: `simulated: ${n(g.onTimeBase)} → ${n(g.onTimeAi)}`, kind: "direction" },
    { gate: "Dispatcher acceptance", rule: "at least 70% of AI routes used", why: "adoption is the biggest risk; overrides are logged and reviewed", sim: "proposed target, sponsor confirms on Day 0", kind: "assumed" },
    { gate: "Safety and privacy", rule: "zero incidents", why: "heat rule respected (R14), personal data minimised (UAE PDPL, R19)", sim: "hard stop", kind: "hard" },
  ] as const;
}

export function PilotRoadmap({ gates, pilot, exposure }: { gates: GateNumbers; pilot: number; exposure: number }) {
  const rows = gateRows(gates);
  return (
    <div className="grid gap-5">
      {/* rollout strip: Pilot -> gate -> Scale -> Optimise */}
      <ol className="grid gap-3 lg:grid-cols-[2.2fr_auto_1fr_1fr]" aria-label="Three-phase rollout">
        <li>
          <Glass className="h-full p-4">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-ai">Phase 1 · 90-day pilot · one hub (Al Quoz)</div>
            <ol className="mt-3 grid gap-3 sm:grid-cols-3">
              {PILOT_STEPS.map((s, i) => (
                <li key={s.title} className="rounded-xl border border-slate-900/10 bg-white/60 p-3">
                  <div className="num text-[11px] text-slate-500">{s.days}</div>
                  <div className="mt-0.5 font-semibold text-fg"><span className="num mr-1 text-ai">{i + 1}</span>{s.title}</div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{s.text}</p>
                </li>
              ))}
            </ol>
          </Glass>
        </li>
        <li className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-ai/50 px-3 py-4 text-center">
            <span className="text-lg text-ai" aria-hidden>◆</span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-fg">Day-90<br />gate</span>
            <span className="text-[11px] text-slate-500">go · fix · stop</span>
          </div>
        </li>
        <li>
          <Glass className="h-full p-4">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Phase 2 · Scale</div>
            <p className="mt-2 text-sm text-slate-700">Only after a GO: all zones at Al Quoz, then other hubs. The payback clock starts here.</p>
          </Glass>
        </li>
        <li>
          <Glass className="h-full p-4">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Phase 3 · Optimise</div>
            <p className="mt-2 text-sm text-slate-700">RL dispatch for urgent orders, parcel lockers and EV planning (slides 3, 5, 6).</p>
          </Glass>
        </li>
      </ol>

      {/* gates */}
      <Glass className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Go/no-go gates at Day 90 (all five must pass to scale)</h3>
        <ul className="mt-3 space-y-3 md:hidden">
          {rows.map((r) => (
            <li key={r.gate} className="rounded-xl border border-slate-900/10 bg-white/60 p-3 text-sm">
              <div className="font-medium text-fg"><span aria-hidden className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full border-2 border-ai align-middle" />{r.gate}</div>
              <div className="num mt-1 text-ai">{r.rule}</div>
              <div className="mt-1 text-xs text-slate-600">{r.why}</div>
              <div className="num mt-1 text-[11px] text-slate-500">{r.sim}</div>
            </li>
          ))}
        </ul>
        <table className="mt-3 hidden w-full text-left text-sm md:table">
          <thead className="text-[11px] uppercase tracking-wider text-slate-500">
            <tr><th className="py-1 pr-3 font-medium">Gate</th><th className="pr-3 font-medium">Pass if</th><th className="pr-3 font-medium">Why this threshold</th><th className="font-medium">Reference</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.gate} className="border-t border-slate-900/5 align-top">
                <td className="py-2 pr-3 font-medium text-fg"><span aria-hidden className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full border-2 border-ai align-middle" />{r.gate}</td>
                <td className="num pr-3 text-ai">{r.rule}</td>
                <td className="pr-3 text-slate-600">{r.why}</td>
                <td className="num text-xs text-slate-500">{r.sim}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-slate-500">Measured in the pilot zone against the control zone over the same weeks (removes season and Ramadan effects). Hollow markers = targets, not results.</p>
      </Glass>

      {/* the ask */}
      <Glass className="border-ai/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-ai">The decision we ask for today</h3>
            <ol className="mt-3 space-y-1.5 text-sm text-slate-700">
              <li><span className="num mr-2 text-ai">1</span><strong className="text-fg">Approve the 90-day pilot</strong> at one hub: <span className="num">{aed(pilot)}</span> all-in (build, integration, training, running; assumed).</li>
              <li><span className="num mr-2 text-ai">2</span><strong className="text-fg">Name an executive sponsor</strong>: we suggest the COO, who owns dispatch.</li>
              <li><span className="num mr-2 text-ai">3</span><strong className="text-fg">Open the data</strong>: TMS/WMS exports and one pilot zone plus one control zone.</li>
              <li><span className="num mr-2 text-ai">4</span><strong className="text-fg">Book the gate review</strong>: proposed start 1 Dec 2026, Day-90 review 1 Mar 2027.</li>
            </ol>
          </div>
          <div className="rounded-2xl bg-paper-2 p-4 text-sm">
            <div className="text-[11px] uppercase tracking-widest text-slate-500">Most you can lose</div>
            <div className="num mt-1 text-2xl font-semibold text-fg">{aed(exposure)}</div>
            <div className="mt-1 max-w-56 text-xs text-slate-500">the all-in pilot budget, if the gate says stop. Scaling waits for the gate.</div>
          </div>
        </div>
      </Glass>
    </div>
  );
}
