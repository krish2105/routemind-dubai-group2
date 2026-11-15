import Link from "next/link";
import HeroCanvas from "@/components/three/HeroCanvas";
import { Reveal } from "@/components/ui/Reveal";
import { Badge, SimBadge } from "@/components/ui/Badge";
import { Glass } from "@/components/ui/Glass";
import { PAGES } from "@/lib/pages";
import { fz } from "@/lib/frozen";

const LOOP = [
  { n: "1", t: "Predict", d: "Gradient-boosting ETA and delay model" },
  { n: "2", t: "Cluster", d: "k-means zones, micro-hubs and lockers" },
  { n: "3", t: "Optimise", d: "Clarke-Wright + 2-opt, genetic algorithm" },
  { n: "4", t: "Re-route", d: "Live re-plan when a jam or storm hits" },
  { n: "5", t: "Inform", d: "GenAI copilot, English and Arabic" },
];

export default function Landing() {
  return (
    <div className="backdrop min-h-screen">
      <section className="relative h-[100svh] min-h-[640px] overflow-hidden">
        <div className="absolute inset-0"><HeroCanvas /></div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-paper via-transparent to-paper/40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-paper/90 via-paper/40 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-6xl px-6">
            <Reveal>
              <div className="flex flex-wrap gap-2"><Badge tone="ai">AI in Operations · Group 2</Badge><SimBadge /></div>
              <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight text-fg sm:text-7xl">
                RouteMind <span className="text-gradient">Dubai</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-slate-700">
                One AI loop that predicts delays, plans the routes, re-plans live and tells the customer. Same Dubai orders, shorter routes.
              </p>
              <div className="pointer-events-auto mt-8 flex flex-wrap gap-3">
                <Link href="/command" className="rounded-xl bg-ai px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_-4px_rgba(8,145,178,0.45)] transition hover:brightness-110">Open Command Center</Link>
                <Link href="/business-case" className="rounded-xl border border-slate-900/15 bg-white/70 px-6 py-3 text-sm font-semibold text-fg backdrop-blur transition hover:bg-white">See the 90-day pilot</Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-6 text-sm">
                <Stat label="Cost per parcel" value={fz("cost_pct", "%")} />
                <Stat label="Fewer vans" value={fz("vans_fewer")} />
                <Stat label="Distance" value={fz("km_pct", "%")} />
                <Stat label="On-time" value={fz("ontime_ai", "%")} />
              </div>
              <p className="mt-3 text-xs text-slate-500">Simulated results on identical seeded orders; numbers appear here after the Monday 6 pm freeze.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal><h2 className="text-3xl font-semibold tracking-tight text-fg">One loop, five steps</h2></Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {LOOP.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.07}>
              <Glass className="h-full p-5">
                <div className="num text-3xl text-ai">{s.n}</div>
                <div className="mt-2 font-medium text-fg">{s.t}</div>
                <div className="mt-1 text-sm text-slate-500">{s.d}</div>
              </Glass>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28">
        <Reveal><h2 className="text-3xl font-semibold tracking-tight text-fg">Explore the prototype</h2></Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PAGES.map((p, i) => (
            <Reveal key={p.href} delay={(i % 3) * 0.06}>
              <Link href={p.href} className="block h-full">
                <Glass className="h-full p-5 transition hover:border-ai/40">
                  <div className="flex items-center justify-between"><span className="font-medium text-fg">{p.title}</span><Badge>Slide {p.slide}</Badge></div>
                  <p className="mt-2 text-sm text-slate-500">{p.meaning}</p>
                  <div className="mt-3 text-xs text-slate-500">Built by {p.owner}</div>
                </Glass>
              </Link>
            </Reveal>
          ))}
        </div>
        <p className="mt-10 text-xs text-slate-500">DubaiDash Express is a fictional courier. All company figures are assumed and all results simulated. Prototype built with AI assistance (Claude Code); prompts shared separately.</p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="num text-3xl text-fg">{value}</div>
      <div className="text-xs uppercase tracking-widest text-slate-500">{label}</div>
    </div>
  );
}
