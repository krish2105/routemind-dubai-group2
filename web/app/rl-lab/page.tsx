"use client";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/nav/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Glass } from "@/components/ui/Glass";
import { Badge } from "@/components/ui/Badge";
import { CompareBars } from "@/components/charts/CompareBars";
import { ChartEmpty, SERIES, TOOLTIP_STYLE } from "@/components/charts/ChartFrame";
import { PAGES } from "@/lib/pages";
import rl from "@/public/data/rl.json";

/**
 * RL Dispatch Lab (owner: Harsh). Illustrative, small simulation from notebook/rl_dispatch.ipynb (web/public/data/rl.json).
 * Not part of the frozen results and not quoted as a result on any slide: Slides 3 and 7 call RL the "next step".
 */
const page = PAGES.find((p) => p.href === "/rl-lab")!;

interface PolicyStats { cost_per_order: number; ci95: number[]; on_time_pct: number; on_time_normal_pct: number; on_time_surge_pct: number; van_share_pct: number; defers_per_order: number; km_per_order: number; split_per_order: Record<string, number> }
interface RlData {
  setup: { pool: { van: number; bike: number }; urgent_orders_per_day: number; surge_day_share: number; surge_orders: number; window_min: number; defer_min: number; max_defers: number; force_slack_min: number; states: number; reachable_states: number; train_days: number[]; validation_days: number[]; test_days: number[]; agent_seeds: number[]; costs: { sla_penalty_aed: number } };
  learning_curve: { episode: number; q_median: number; q_min: number; q_max: number }[];
  reference: { greedy_validation: number; myopic_validation: number };
  test: Record<"greedy" | "myopic" | "random" | "q_learning" | "q_no_wait", PolicyStats>;
  q_learning_runs_test: number[];
  paired: Record<"greedy" | "myopic", { mean_diff_aed: number; ci95: number[]; days_cheaper_pct: number }>;
  policy: { slack: string; bike: string; visits: number; share_pct: Record<"van" | "bike" | "defer", number> }[];
  policy_note: string;
  waiting_worth_aed: number;
  surge_test_days: number;
  verdict_code: string;
  verdict: string;
}
const D = rl as unknown as RlData;
const f2 = (x: number) => x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const sgn = (x: number) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${f2(Math.abs(x))}`;
const NAMES: Record<keyof RlData["test"], string> = { q_learning: "Q-learning (median of 5 runs)", q_no_wait: "Q-learning, waiting switched off", myopic: "Cost-aware rule", greedy: "Greedy: nearest vehicle", random: "Random" };

function LearningCurve() {
  const rows = D.learning_curve.map((r) => ({ ...r, band: [r.q_min, r.q_max] as [number, number] }));
  if (!rows.length) return <ChartEmpty height={300}>No learning curve yet: run notebook/rl_dispatch.ipynb.</ChartEmpty>;
  const axis = { tick: { fontSize: 11, fill: "currentColor" }, stroke: "currentColor", strokeOpacity: 0.3 } as const;
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-ai" />Q-learning, median of {D.setup.agent_seeds.length} runs</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-ai/20" />range of the runs</span>
        <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-base" />greedy (baseline)</span>
        <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-slate-400" />cost-aware rule</span>
      </div>
      <div className="h-[300px] min-w-0 text-slate-500" role="img"
        aria-label={`Learning curve: validation cost per urgent order falls from ${f2(rows[0].q_median)} to ${f2(rows[rows.length - 1].q_median)} AED over ${rows[rows.length - 1].episode} training days; greedy ${f2(D.reference.greedy_validation)}, cost-aware rule ${f2(D.reference.myopic_validation)}.`}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 300 }}>
          <ComposedChart data={rows} margin={{ top: 12, right: 16, bottom: 18, left: 4 }}>
            <CartesianGrid stroke="currentColor" strokeOpacity={0.1} vertical={false} />
            <XAxis dataKey="episode" type="number" domain={[1, "dataMax"]} {...axis}
              label={{ value: "simulated training days", position: "insideBottom", offset: -10, fontSize: 11, fill: "currentColor" }} />
            <YAxis {...axis} width={48} domain={["auto", "auto"]} tickFormatter={(v: number) => v.toFixed(0)}
              label={{ value: "AED per urgent order", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "currentColor" }} />
            <Tooltip {...TOOLTIP_STYLE} labelFormatter={(e) => `after ${e} training days`}
              formatter={(v, name) => [Array.isArray(v) ? `${f2(Number(v[0]))} to ${f2(Number(v[1]))}` : f2(Number(v)), name === "band" ? "range of runs" : "median"]} />
            <ReferenceLine y={D.reference.greedy_validation} stroke={SERIES.base} strokeDasharray="5 4" />
            <ReferenceLine y={D.reference.myopic_validation} stroke="currentColor" strokeOpacity={0.55} strokeDasharray="4 4" />
            <Area dataKey="band" stroke="none" fill={SERIES.ai} fillOpacity={0.15} isAnimationActive={false} />
            <Line dataKey="q_median" stroke={SERIES.ai} strokeWidth={2.5} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-xs text-slate-500">Measured with exploration off on {D.setup.validation_days[1] - D.setup.validation_days[0] + 1} fixed validation days after every 100 training days (never on the test days).</p>
    </div>
  );
}

export default function RlLabPage() {
  const t = D.test;
  const q = t.q_learning, g = t.greedy;
  const beatsGreedy = D.paired.greedy.ci95[1] < 0;
  const beatsRule = D.paired.myopic.ci95[1] < 0;
  return (
    <AppShell>
      <PageHeader page={page} />

      <Glass className="mb-6 border-ai/30 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="base">ILLUSTRATIVE · SMALL SIMULATION</Badge>
          <Badge>not in the frozen results</Badge>
          <Badge tone={beatsRule ? "ai" : "muted"}>{beatsRule ? "beats both rules" : beatsGreedy ? "beats greedy, not the cost-aware rule" : "does not beat the rules"}</Badge>
        </div>
        <p className="mt-3 max-w-4xl text-base leading-relaxed text-fg">{D.verdict}</p>
      </Glass>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Glass className="min-w-0 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Learning curve: cost per urgent order (lower is better)</h2>
          <div className="mt-3"><LearningCurve /></div>
        </Glass>
        <Glass className="min-w-0 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Q-learning vs greedy, {D.setup.test_days[1] - D.setup.test_days[0] + 1} held-out days</h2>
          <div className="mt-3">
            <CompareBars baseLabel="Greedy (nearest vehicle)" aiLabel="Q-learning" items={[
              { label: "Cost per urgent order", base: g.cost_per_order, ai: q.cost_per_order, unit: "AED", decimals: 2 },
              { label: "On time", base: g.on_time_pct, ai: q.on_time_pct, unit: "%", decimals: 1, lowerIsBetter: false },
              { label: "Van share", base: g.van_share_pct, ai: q.van_share_pct, unit: "%", decimals: 1 },
              { label: "km per order", base: g.km_per_order, ai: q.km_per_order, unit: "km", decimals: 1 },
            ]} />
          </div>
          <p className="mt-3 text-xs text-slate-500">The lower cost comes from using motorbikes instead of vans (waiting is worth only AED {f2(D.waiting_worth_aed)} of it). It also accepts more late urgent orders, because the assumed SLA penalty is only AED {D.setup.costs.sla_penalty_aed}.</p>
        </Glass>
      </div>

      <Glass className="mt-5 overflow-x-auto p-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">All policies on the same {D.setup.test_days[1] - D.setup.test_days[0] + 1} test days (common random numbers)</h2>
        <table className="num mt-3 w-full min-w-[640px] text-left text-sm text-slate-700">
          <thead className="text-[11px] uppercase tracking-wider text-slate-500">
            <tr><th className="py-1 pr-3 font-medium">Policy</th><th className="pr-3 font-medium">AED / urgent order</th><th className="pr-3 font-medium">95% CI</th><th className="pr-3 font-medium">On time</th><th className="pr-3 font-medium">Normal / surge days</th><th className="pr-3 font-medium">Van share</th><th className="font-medium">Waits / order</th></tr>
          </thead>
          <tbody>
            {(["q_learning", "q_no_wait", "myopic", "greedy", "random"] as const).map((k) => (
              <tr key={k} className="border-t border-slate-900/5">
                <td className={`py-1.5 pr-3 font-sans ${k === "q_learning" ? "text-ai" : k === "greedy" ? "text-base" : "text-fg"}`}>{NAMES[k]}</td>
                <td className="pr-3 text-fg">{f2(t[k].cost_per_order)}</td>
                <td className="pr-3 text-slate-500">{f2(t[k].ci95[0])} to {f2(t[k].ci95[1])}</td>
                <td className="pr-3">{t[k].on_time_pct.toFixed(1)}%</td>
                <td className="pr-3 text-slate-500">{t[k].on_time_normal_pct.toFixed(0)}% / {t[k].on_time_surge_pct.toFixed(0)}%</td>
                <td className="pr-3">{t[k].van_share_pct.toFixed(1)}%</td>
                <td>{f2(t[k].defers_per_order)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-slate-500">
          Paired difference, Q-learning minus greedy: <span className="text-fg">{sgn(D.paired.greedy.mean_diff_aed)} AED</span> per order (95% CI {sgn(D.paired.greedy.ci95[0])} to {sgn(D.paired.greedy.ci95[1])}; cheaper on {D.paired.greedy.days_cheaper_pct.toFixed(0)}% of days).
          Minus the cost-aware rule: <span className="text-fg">{sgn(D.paired.myopic.mean_diff_aed)} AED</span> (CI {sgn(D.paired.myopic.ci95[0])} to {sgn(D.paired.myopic.ci95[1])}; cheaper on {D.paired.myopic.days_cheaper_pct.toFixed(0)}% of days).
          The five training runs score {D.q_learning_runs_test.map(f2).join(", ")} AED on the test days; the table shows the median run, not the best.
          {" "}{D.surge_test_days} of the test days have a 25-order surge; on those days every policy misses many 60-minute promises.
        </p>
      </Glass>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Glass className="min-w-0 overflow-x-auto p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">What the policy learned (indicative)</h2>
          <table className="num mt-3 w-full min-w-[420px] text-left text-sm text-slate-700">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500">
              <tr><th className="py-1 pr-2 font-medium">Slack</th><th className="pr-2 font-medium">Motorbike</th><th className="pr-2 font-medium">Van</th><th className="pr-2 font-medium">Bike</th><th className="font-medium">Wait</th></tr>
            </thead>
            <tbody>
              {D.policy.map((r) => {
                const top = (Object.entries(r.share_pct) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0];
                const cell = (k: "van" | "bike" | "defer") => <td className={`pr-2 ${top === k ? "font-semibold text-ai" : ""}`}>{r.share_pct[k].toFixed(0)}%</td>;
                return (
                  <tr key={`${r.slack}-${r.bike}`} className="border-t border-slate-900/5">
                    <td className="py-1.5 pr-2 font-sans">{r.slack}</td><td className="pr-2 font-sans text-slate-600">{r.bike}</td>{cell("van")}{cell("bike")}{cell("defer")}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-500">Share of decisions per action (median run), weighted by visits. With plenty of slack and a bike free it sends the bike; when no bike is near it often waits 10 minutes. States seen fewer than 30 times are left out; {D.policy_note}.</p>
        </Glass>
        <Glass className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">The experiment</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li><span className="font-medium text-fg">State</span> ({D.setup.reachable_states} reachable of {D.setup.states} buckets): time of day, slack to the {D.setup.window_min}-minute promise, motorbike availability, distance from the hub.</li>
            <li><span className="font-medium text-fg">Actions</span>: send a van, send a motorbike, or wait {D.setup.defer_min} minutes (at most {D.setup.max_defers} times per order). Each order is its own short episode.</li>
            <li><span className="font-medium text-fg">Reward</span>: minus (km cost + driver time + AED {D.setup.costs.sla_penalty_aed} if late), all rates assumed.</li>
            <li><span className="font-medium text-fg">Days</span>: {D.setup.urgent_orders_per_day} urgent orders, plus a {D.setup.surge_orders}-order surge on {Math.round(D.setup.surge_day_share * 100)}% of days; urgent pool of {D.setup.pool.van} vans and {D.setup.pool.bike} motorbikes (assumed). Train, validation and test days never overlap.</li>
          </ul>
          <p className="mt-4 rounded-xl bg-paper-2 p-3 text-sm text-slate-700">
            <span className="font-medium text-ai">Next step, not part of the pilot:</span> with per-order rewards the learner optimises the same cost as the rule with less information, so matching the rule is its ceiling. The real gain would come from learning how one dispatch affects the next orders, which needs logged dispatch decisions; the 90-day pilot records them in shadow mode.
          </p>
        </Glass>
      </div>

      <Glass className="mt-6 p-5">
        <p className="text-sm text-slate-600">
          <span className="font-medium text-ai">What this means for operations:</span> a learned dispatch policy can match a sensible rule (send a motorbike unless it would be late)
          and clearly beats &quot;nearest vehicle&quot;, but at this scale it does not beat the rule. So we start the pilot with transparent rules and the optimiser, and keep RL as the next step once the pilot has produced real data.
        </p>
      </Glass>
      <p className="mt-4 text-xs text-slate-500">Source: notebook/rl_dispatch.ipynb (seeded; Restart &amp; Run All reproduces web/public/data/rl.json exactly). DubaiDash Express is fictional; all costs are assumed and all results simulated.</p>
    </AppShell>
  );
}
