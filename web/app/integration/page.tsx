"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/nav/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Glass } from "@/components/ui/Glass";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { PAGES } from "@/lib/pages";
import { assumptions } from "@/lib/assumptions";
import { ArchitectureDiagram, ArchitectureList } from "./ArchitectureDiagram";
import { RISKS, type Level, type Theme } from "./risks";

/**
 * /integration: Integration & Risk (Karan's area, built by Yash; Slide 6).
 * How RouteMind plugs into existing systems, the human override, the fallback when AI is down,
 * the four C-suite themes, and the risk register (docs/09_risk_register.md). Facts cite docs/04_research_brief.md rows.
 */
const page = PAGES.find((p) => p.href === "/integration")!;

const THEMES: { theme: Theme; icon: string; points: string[] }[] = [
  { theme: "Business model", icon: "💼", points: ["Parcel lockers at zone micro-hubs", "Paid delivery slots and premium urgent delivery", "Advisory mode first, so dispatchers stay in charge"] },
  {
    theme: "Tech investment", icon: "🧮",
    points: [
      `Pilot: AED ${assumptions.business_case.pilot_investment_aed.toLocaleString("en-US")} (assumed)`,
      `Running: AED ${assumptions.business_case.monthly_running_cost_aed.toLocaleString("en-US")} per month (assumed)`,
      "Open-source engine in the browser, no per-route licence",
    ],
  },
  { theme: "Ecosystem integration", icon: "🔗", points: ["TMS/WMS and e-commerce order feeds", "Makani addresses (R13)", "Robots, EV charging and lockers later (R16, R17)"] },
  { theme: "Operational risk", icon: "🛡", points: ["Human override on every route", "Fallback to last plan or baseline", "Heat rules respected (R14); privacy by design (R19)"] },
];

const OVERRIDE = [
  { t: "AI suggests", d: "New plan for the remaining stops, with before/after at-risk counts", tone: "ai" },
  { t: "Dispatcher decides", d: "Accept, edit (move a stop) or reject", tone: "fg" },
  { t: "Drivers update", d: "Accepted stops go to the driver app; customers get new ETAs", tone: "ok" },
  { t: "Logged for review", d: "Every rejection and edit is kept to improve the model", tone: "base" },
] as const;

const STEP_TONE = { ai: "border-ai/40 text-ai", fg: "border-slate-900/20 text-fg", ok: "border-ok/40 text-ok", base: "border-base/40 text-base" } as const;

const lv: Record<Level, string> = { L: "Low", M: "Med", H: "High" };
const lvTone: Record<Level, string> = { L: "text-ok border-ok/40 bg-ok/10", M: "text-base border-base/40 bg-base/10", H: "text-risk border-risk/40 bg-risk/10" };

export default function IntegrationPage() {
  const [outage, setOutage] = useState(false);
  const [filter, setFilter] = useState<Theme | "All">("All");
  const rows = useMemo(() => RISKS.filter((r) => filter === "All" || r.theme === filter), [filter]);
  const grid = useMemo(() => {
    const g: Record<string, number[]> = {};
    for (const r of RISKS) (g[`${r.l}${r.i}`] ??= []).push(r.n);
    return g;
  }, []);

  return (
    <AppShell>
      <PageHeader page={page} />

      <Reveal>
        <Glass className="p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">How RouteMind plugs in</h2>
              <p className="text-xs text-slate-500">Moving lines = data flow. Green = human override between dispatcher and drivers.</p>
            </div>
            <button type="button" onClick={() => setOutage((o) => !o)} aria-pressed={outage}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${outage ? "bg-base text-white" : "border border-slate-900/15 text-fg hover:bg-slate-900/5"}`}>
              {outage ? "Restore AI engine" : "Simulate AI outage"}
            </button>
          </div>
          <div className="hidden sm:block"><ArchitectureDiagram outage={outage} /></div>
          <div className="sm:hidden"><ArchitectureList outage={outage} /></div>
          <motion.p key={String(outage)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mt-3 text-sm ${outage ? "text-base" : "text-slate-700"}`}>
            {outage
              ? "AI down: drivers keep the last accepted plan (already on their app). If there is none, dispatch uses the baseline plan, the same rule as today. Customer messages switch to templates, so no LLM is needed."
              : "Phase 1 connects through file or API exports from the existing TMS/WMS, so nothing has to be replaced. RouteMind runs as an advisory tool beside the dispatchers first."}
          </motion.p>
        </Glass>
      </Reveal>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Reveal>
          <Glass className="h-full p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">Human override flow</h2>
            <ol className="space-y-3">
              {OVERRIDE.map((s, i) => (
                <motion.li key={s.t} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                  className="flex gap-3">
                  <span className={`num flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm ${STEP_TONE[s.tone]}`}>{i + 1}</span>
                  <div><div className="font-medium text-fg">{s.t}</div><div className="text-sm text-slate-500">{s.d}</div></div>
                </motion.li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-slate-500">Try it on Live Re-routing: inject a jam, press Re-optimise, then Accept or Reject.</p>
          </Glass>
        </Reveal>
        <Reveal delay={0.1}>
          <Glass className="h-full p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">Rules we design for</h2>
            <ul className="space-y-3 text-sm text-slate-700">
              <li><b className="font-medium text-fg">Midday break.</b> Outdoor work in direct sun is banned 12:30 to 15:00 from 15 June to 15 September; riders cannot be forced to work then (R14). The scheduler must keep these windows free.</li>
              <li><b className="font-medium text-fg">Privacy.</b> UAE PDPL (Federal Decree-Law 45/2021) has applied since 2 January 2022 (R19). We minimise personal data and use consent; we would confirm the executive-regulation status with legal counsel before go-live (R20).</li>
              <li><b className="font-medium text-fg">Addresses.</b> Makani gives every building entrance a unique 10-digit number (R13), which cuts failed drops caused by unclear addresses.</li>
            </ul>
          </Glass>
        </Reveal>
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-widest text-slate-500">The four boardroom questions</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {THEMES.map((t, i) => (
          <Reveal key={t.theme} delay={i * 0.08}>
            <button type="button" onClick={() => setFilter(filter === t.theme ? "All" : t.theme)} className="h-full w-full text-left">
              <Glass className={`h-full p-5 transition ${filter === t.theme ? "ring-2 ring-ai/50" : ""}`}>
                <div className="text-2xl" aria-hidden>{t.icon}</div>
                <div className="mt-2 font-semibold text-ai">{t.theme}</div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">{t.points.map((p) => <li key={p}>{p}</li>)}</ul>
                <div className="mt-3 text-xs text-slate-500">{RISKS.filter((r) => r.theme === t.theme).length} risks · click to filter</div>
              </Glass>
            </button>
          </Reveal>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-4">
        <Glass className="min-w-0 overflow-x-auto p-5 xl:col-span-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Risk register {filter !== "All" && <span className="normal-case text-ai">· {filter}</span>}</h2>
            <div className="flex items-center gap-2">
              <Badge tone="base">likelihood and impact assumed</Badge>
              {filter !== "All" && <button type="button" onClick={() => setFilter("All")} className="text-xs text-ai hover:underline">show all</button>}
            </div>
          </div>
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-900/10 text-left text-xs uppercase tracking-wider text-slate-500">
                {["#", "Risk", "L", "I", "Mitigation", "Fallback", "Owner"].map((h) => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.n} className="border-b border-slate-900/5 align-top">
                  <td className="num py-2 pr-3 text-slate-500">{r.n}</td>
                  <td className="py-2 pr-3 font-medium text-fg">{r.risk}<div className="text-[11px] font-normal text-slate-500">{r.theme}</div></td>
                  <td className="py-2 pr-3"><span className={`rounded-full border px-2 py-0.5 text-[11px] ${lvTone[r.l]}`}>{lv[r.l]}</span></td>
                  <td className="py-2 pr-3"><span className={`rounded-full border px-2 py-0.5 text-[11px] ${lvTone[r.i]}`}>{lv[r.i]}</span></td>
                  <td className="py-2 pr-3 text-slate-700">{r.mitigation}</td>
                  <td className="py-2 pr-3 text-slate-700">{r.fallback}</td>
                  <td className="py-2 pr-3 text-xs text-slate-500">{r.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Glass>
        <Glass className="p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-500">Heat map</h2>
          <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-1 text-[11px]">
            <div />
            {(["L", "M", "H"] as Level[]).map((i) => <div key={i} className="text-center text-slate-500">impact {lv[i]}</div>)}
            {(["H", "M", "L"] as Level[]).map((l) => (
              <div key={l} className="contents">
                <div className="flex items-center pr-1 text-slate-500">{lv[l]}</div>
                {(["L", "M", "H"] as Level[]).map((i) => {
                  const score = { L: 1, M: 2, H: 3 }[l] * { L: 1, M: 2, H: 3 }[i];
                  const tone = score >= 6 ? "bg-risk/15 text-risk" : score >= 3 ? "bg-base/15 text-base" : "bg-ok/10 text-ok";
                  const ns = grid[`${l}${i}`] ?? [];
                  return <div key={i} className={`num flex min-h-12 flex-wrap items-center justify-center gap-1 rounded-lg p-1 ${tone}`}>{ns.join(" ") || "·"}</div>;
                })}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">Rows: likelihood. Numbers are risk ids from the table.</p>
        </Glass>
      </div>

      <Glass className="mt-5 border-ai/30 p-5">
        <div className="text-xs uppercase tracking-widest text-ai">What this means for operations</div>
        <p className="mt-2 text-fg">
          RouteMind starts beside today&apos;s systems through file or API exports, the dispatcher can override every route, and if the AI fails the drivers simply keep the last plan.
          The biggest risks are data quality, adoption and integration, so the 90-day pilot tests exactly those before any larger spend.
        </p>
      </Glass>
    </AppShell>
  );
}
