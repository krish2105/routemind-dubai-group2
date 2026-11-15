"use client";
import { animate, motion, useInView } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AppShell } from "@/components/nav/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Glass } from "@/components/ui/Glass";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { PAGES } from "@/lib/pages";
import { assumptions } from "@/lib/assumptions";
import { HUB } from "@/lib/engine/points";
import rawAssumptions from "@/public/data/assumptions.json";

/**
 * /problem: The Problem & Market (owner: Yash, Slide 2).
 * Every outside fact on this page comes from docs/04_research_brief.md (row number shown on each source chip).
 * Statista is labelled "worldwide". No PDPL fine claims. DubaiDash numbers come from lib/assumptions.ts (assumed).
 */
const page = PAGES.find((p) => p.href === "/problem")!;

/** Sources from docs/04_research_brief.md. `row` = row number in the brief. */
const SRC = {
  statista: { row: 1, label: "Statista, Feb 2024 (worldwide)", href: "https://statista.com/statistics/1434298/last-mile-share-of-total-shipping-costs" },
  gulfToday: { row: 2, label: "Gulf Today, Sep 2026", href: "https://www.gulftoday.ae/business/2026/09/28/uae-e-commerce-market-size-reaches-dhs422-billion-in-2025" },
  wam: { row: 2, label: "WAM", href: "https://www.wam.ae/en/article/c2h35yn-uae-e-commerce-market-size-reaches-aed422-billion" },
  failed: { row: 3, label: "SmartRoutes summary (indicative)", href: "https://smartroutes.io/blogs/delivery-success-rates-key-stats-for-retail-and-ecommerce/" },
  makani: { row: 13, label: "Gulf News", href: "https://gulfnews.com/living-in-uae/housing/makani-number-what-is-it-and-why-do-you-need-it-1.1606302505909" },
  heatKt: { row: 14, label: "Khaleej Times", href: "https://www.khaleejtimes.com/uae/delivery-drivers-cannot-be-forced-work-midday-break" },
  heatRta: { row: 14, label: "RTA, Jun 2026", href: "https://www.rta.ae/wps/portal/rta/ae/home/news-and-media/all-news/NewsDetails/23-temporary-rest-areas-to-protect-delivery-riders-from-heat-stress" },
} as const;
type SrcKey = keyof typeof SRC;

function SourceChip({ s }: { s: SrcKey }) {
  const src = SRC[s];
  return (
    <a href={src.href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-slate-900/10 bg-white/70 px-2 py-0.5 text-[11px] text-slate-500 transition hover:border-ai/40 hover:text-ai">
      <span className="num text-[10px] text-ai">R{src.row}</span>{src.label}<span aria-hidden>↗</span>
    </a>
  );
}

/** Counts up to `to` once it scrolls into view. */
function CountUp({ to, decimals = 0, prefix = "", suffix = "" }: { to: number; decimals?: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: setV, onComplete: () => setV(to) });
    return () => c.stop();
  }, [inView, to]);
  return <span ref={ref} className="num" aria-label={`${prefix}${to.toFixed(decimals)}${suffix}`}>{prefix}{v.toFixed(decimals)}{suffix}</span>;
}

function Section({ n, title, kicker, children }: { n: number; title: string; kicker: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <Reveal>
        <div className="mb-4 flex items-baseline gap-3">
          <span className="num text-sm text-ai">0{n}</span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">{title}</h2>
            <p className="text-sm text-slate-500">{kicker}</p>
          </div>
        </div>
      </Reveal>
      {children}
    </section>
  );
}

/** Animated column chart for R1 (two values only, so plain divs are clearer than a chart library). */
function ShareBars() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const bars = [
    { year: "2018", v: 41, cls: "bg-base", text: "text-base" },
    { year: "2023", v: 53, cls: "bg-ai", text: "text-ai" },
  ];
  return (
    <div ref={ref} className="flex h-64 items-end justify-center gap-10 border-b border-slate-900/10 px-4 sm:gap-16">
      {bars.map((b, i) => (
        <div key={b.year} className="flex h-full w-20 flex-col items-center justify-end sm:w-24">
          <div className={`num mb-2 text-3xl font-semibold ${b.text}`}>{inView ? <CountUp to={b.v} suffix="%" /> : "0%"}</div>
          <motion.div className={`w-full rounded-t-xl ${b.cls}`} initial={{ height: 0 }} animate={{ height: inView ? `${(b.v / 60) * 100}%` : 0 }}
            transition={{ duration: 1.1, delay: 0.15 + i * 0.25, ease: [0.22, 1, 0.36, 1] }} style={{ maxHeight: "78%" }} />
          <div className="mt-2 text-sm text-slate-500">{b.year}</div>
        </div>
      ))}
    </div>
  );
}

const PAINS: { icon: string; title: string; body: ReactNode; src?: SrcKey[]; tag: "fact" | "scenario" }[] = [
  {
    icon: "🌡", title: "Heat and the midday break", tag: "fact", src: ["heatKt", "heatRta"],
    body: <>Outdoor work in direct sun is banned from 12:30 to 15:00 between 15 June and 15 September, and riders cannot be forced to work then. RTA set up 23 temporary rest areas for delivery riders in 2026. Schedules must plan around it.</>,
  },
  {
    icon: "🛣", title: "Traffic on the main corridors", tag: "scenario",
    body: <>Sheikh Zayed Road and Al Khail Road are the two corridors in our model. We treat jams on them as <b className="font-medium text-fg">what-if scenarios</b> with assumed slow-down factors, not measured congestion data.</>,
  },
  {
    icon: "🏢", title: "Addresses and gated access", tag: "fact", src: ["makani"],
    body: <>Towers, gated communities and unclear addresses make it hard to find the right door. Dubai&apos;s Makani system gives each building entrance a unique 10-digit number, which helps when it is captured.</>,
  },
  {
    icon: "📦", title: "Failed first attempts", tag: "fact", src: ["failed"],
    body: <>Industry sources report that roughly 8% to 20% of parcels fail on the first attempt globally (indicative only, low-confidence source). Every failure means a second trip. Our model uses its own assumed failure rate, not this figure.</>,
  },
  {
    icon: "⏱", title: "Tight windows and urgent surges", tag: "scenario",
    body: <>Customers expect narrow delivery windows and same-day urgent orders arrive mid-shift. In our simulation these are assumed inputs (window lengths and urgent share below).</>,
  },
  {
    icon: "🌪", title: "Sandstorms and heavy rain", tag: "scenario",
    body: <>Weather slows vans and riders citywide. We include sandstorm and heavy-rain scenarios with assumed slow-down factors, so the plan can be tested before it happens.</>,
  },
];

export default function ProblemPage() {
  const a = assumptions;
  const fleet = a.vehicles.van.count + a.vehicles.bike.count;
  const sim: { label: string; value: string; note: string }[] = [
    { label: "Orders per day", value: String(a.orders.count), note: `seed ${a.seed}, same for baseline and AI` },
    { label: "Fleet", value: `${a.vehicles.van.count} vans + ${a.vehicles.bike.count} bikes`, note: `${fleet} vehicles, two shifts (08:00 and 11:00)` },
    { label: "Hub", value: "Al Quoz", note: HUB.name },
    { label: "Operating day", value: `${rawAssumptions.operating_window.start} to ${rawAssumptions.operating_window.end}`, note: "minutes after midnight in the engine" },
    { label: "Delivery window", value: `${a.orders.time_window_min} min`, note: `urgent orders: ${a.orders.urgent_window_min} min` },
    { label: "Urgent share", value: `${Math.round(a.orders.urgent_share * 100)}%`, note: `+${a.orders.urgent_surge_orders} orders in a surge scenario` },
    { label: "Failed first attempt", value: `${Math.round(a.failed_attempt.base_probability * 100)}%`, note: `+${Math.round(a.failed_attempt.sandstorm_extra * 100)} pts in a sandstorm (assumed)` },
    { label: "SZR jam slow-down", value: `×${a.event_multipliers.sheikh_zayed_road_jam}`, note: `sandstorm ×${a.event_multipliers.sandstorm_citywide}, rain ×${a.event_multipliers.heavy_rain_citywide}` },
  ];

  return (
    <AppShell>
      <PageHeader page={page} />

      {/* 1. last mile is the costly leg */}
      <Section n={1} title="The last mile is the most expensive leg" kicker="Share of total shipping cost spent on the last mile, worldwide">
        <div className="grid gap-5 lg:grid-cols-5">
          <div className="min-w-0 lg:col-span-3"><Reveal>
            <Glass className="p-5">
              <ShareBars />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-500">Last-mile share of total shipping cost, <b className="font-medium text-fg">worldwide</b></p>
                <SourceChip s="statista" />
              </div>
            </Glass>
          </Reveal></div>
          <div className="space-y-4 lg:col-span-2">
            <Reveal delay={0.1}>
              <Glass className="p-5">
                <div className="text-xs uppercase tracking-widest text-slate-500">In five years</div>
                <div className="mt-1 text-4xl font-semibold text-ai"><CountUp to={12} prefix="+" suffix=" pts" /></div>
                <p className="mt-2 text-sm text-slate-700">The last mile went from about 41% to about 53% of the shipping bill (2018 to 2023), so it is now more than half of it.</p>
              </Glass>
            </Reveal>
            <Reveal delay={0.2}>
              <Glass className="p-5">
                <p className="text-sm text-slate-700">Why it adds up: every parcel needs its own stop, parking, wait and walk to the door, and a failed attempt means doing it all again.</p>
                <p className="mt-2 text-xs text-slate-500">The Statista page does not name the underlying study. We quote it as a worldwide figure, not a UAE one.</p>
              </Glass>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* 2. Dubai growth drivers */}
      <Section n={2} title="UAE online shopping is growing fast" kicker="More orders means more small drops to deliver">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { k: <CountUp to={42.2} decimals={1} prefix="AED " suffix="B" />, l: "UAE e-commerce in 2025", s: "about US$11.5 billion" },
            { k: <CountUp to={17.6} decimals={1} prefix="AED " suffix="B" />, l: "in 2020", s: "five years earlier" },
            { k: <CountUp to={19} suffix="%" />, l: "growth per year", s: "2020 to 2025" },
            { k: <CountUp to={15.7} decimals={1} suffix="%" />, l: "of all retail sales", s: "forecast to pass 20% by 2030 (source forecast)" },
          ].map((c, i) => (
            <Reveal key={c.l} delay={i * 0.08}>
              <Glass className="h-full p-5">
                <div className="text-3xl font-semibold text-ai">{c.k}</div>
                <div className="mt-1 text-sm font-medium text-fg">{c.l}</div>
                <div className="text-xs text-slate-500">{c.s}</div>
              </Glass>
            </Reveal>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          Other reports give different totals because they count different things, so we name the source: <SourceChip s="gulfToday" /> <SourceChip s="wam" />
        </div>
      </Section>

      {/* 3. why Dubai is harder */}
      <Section n={3} title="Why delivering in Dubai is harder" kicker="Facts are sourced; scenarios are our assumed what-ifs, labelled as such">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PAINS.map((p, i) => (
            <Reveal key={p.title} delay={(i % 3) * 0.08}>
              <Glass className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-2xl" aria-hidden>{p.icon}</div>
                  {p.tag === "fact" ? <Badge tone="ai">sourced fact</Badge> : <Badge tone="base">what-if scenario</Badge>}
                </div>
                <h3 className="mt-3 font-semibold text-fg">{p.title}</h3>
                <p className="mt-1.5 flex-1 text-sm text-slate-700">{p.body}</p>
                {p.src && <div className="mt-3 flex flex-wrap gap-1.5">{p.src.map((s) => <SourceChip key={s} s={s} />)}</div>}
              </Glass>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 4. what we simulate */}
      <Section n={4} title="What we simulate: one day at DubaiDash Express" kicker="A fictional courier. Every number in this section is an assumed model input, not a statistic">
        <Reveal>
          <Glass className="p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge tone="base">ASSUMED INPUTS</Badge>
              <span className="text-xs text-slate-500">Read live from <code className="num">data_seed/assumptions.json</code> (version {a.version})</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {sim.map((s) => (
                <div key={s.label} className="rounded-xl border border-slate-900/10 bg-white/70 p-3">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500">{s.label}</div>
                  <div className="num mt-1 text-lg text-fg">{s.value}</div>
                  <div className="text-xs text-slate-500">{s.note}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-700">
              Today, DubaiDash plans routes once each morning and rarely changes them (our assumed baseline: nearest-neighbour). RouteMind plans the same orders with
              optimisation, groups them into zones, and re-plans live when a jam or storm hits.
            </p>
          </Glass>
        </Reveal>
      </Section>

      <Reveal>
        <Glass className="border-ai/30 p-5">
          <div className="text-xs uppercase tracking-widest text-ai">What this means for operations</div>
          <p className="mt-2 text-fg">
            The last mile is already more than half of the shipping bill, and Dubai adds heat rules, corridor traffic, hard-to-find addresses and failed attempts.
            A plan made once at 8 am cannot keep up, so the gain is in planning smarter and re-planning live.
          </p>
        </Glass>
      </Reveal>
    </AppShell>
  );
}
