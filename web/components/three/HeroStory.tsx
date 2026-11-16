"use client";
import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { MotionConfig, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import HeroCanvas, { type HeroView } from "./HeroCanvas";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Stat } from "@/components/ui/Stat";
import { Badge, SimBadge } from "@/components/ui/Badge";
import { FROZEN } from "@/lib/frozen";

/**
 * Landing scroll story (owner: Gagandeep). The 3D scene stays pinned while four chapters scroll over it:
 * 0 hero, 1 the problem (amber baseline), 2 the AI loop (teal), 3 the result (frozen numbers).
 * Scrolling into a chapter sets the scene view; the toggle lets the viewer override it at any time.
 */
const CHAPTERS = ["Intro", "The problem", "The AI loop", "The result"] as const;
const CHAPTER_VIEW: HeroView[] = ["ai", "base", "ai", "ai"];

const LOOP = [
  { t: "Predict", d: "ETA and delay model" },
  { t: "Cluster", d: "k-means delivery zones" },
  { t: "Optimise", d: "Clarke-Wright + 2-opt, genetic algorithm" },
  { t: "Re-route", d: "Live re-plan for a jam or storm" },
  { t: "Inform", d: "GenAI copilot, English and Arabic" },
];

export function HeroStory() {
  const section = useRef<HTMLElement>(null);
  const chapterEls = useRef<(HTMLDivElement | null)[]>([]);
  const reduced = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const [chapter, setChapter] = useState(0);
  const [view, setView] = useState<HeroView>("ai");

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const c = Math.min(CHAPTERS.length - 1, Math.max(0, Math.round(p * (CHAPTERS.length - 1))));
    if (c !== chapter) {
      setChapter(c);
      setView(CHAPTER_VIEW[c]);
    }
  });

  const go = (i: number) => chapterEls.current[i]?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });

  return (
    <MotionConfig reducedMotion="user">
      <section ref={section} aria-label="RouteMind Dubai story" className="relative" style={{ height: `${CHAPTERS.length * 100}svh` }}>
        {/* pinned 3D scene and controls */}
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <HeroCanvas view={view} progress={scrollYProgress} reduced={reduced} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-paper/90 via-transparent to-paper/40" />
          {/* desktop: text sits on the left; phone: text sits on top, the city shows underneath */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-paper/95 via-paper/55 to-transparent max-sm:hidden" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-paper/90 via-paper/60 to-transparent sm:hidden" />

          <div className="absolute inset-x-0 bottom-5 z-20 flex flex-col items-center gap-2 px-4">
            <SegmentedControl
              label="Scene view"
              value={view}
              onChange={setView}
              options={[
                { value: "base", label: "Baseline view", tone: "base" },
                { value: "ai", label: "AI view", tone: "ai" },
              ]}
            />
            <p className="text-center text-xs text-slate-600">
              {view === "base" ? "Amber: baseline plan (assumed nearest-neighbour method)" : "Teal: AI plan on the same seeded orders"} · illustration, not data
            </p>
          </div>

          <nav aria-label="Story chapters" className="absolute right-5 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 md:flex">
            {CHAPTERS.map((c, i) => (
              <button key={c} type="button" onClick={() => go(i)} aria-label={`Go to ${c}`} aria-current={chapter === i ? "step" : undefined}
                className="group flex items-center justify-end gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ai">
                <span className={`text-xs font-medium transition-opacity ${chapter === i ? "text-fg opacity-100" : "text-slate-600 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}>{c}</span>
                <span className={`block h-2.5 rounded-full transition-all duration-300 ${chapter === i ? "w-6 bg-ai" : "w-2.5 bg-slate-400/70"}`} />
              </button>
            ))}
          </nav>
        </div>

        {/* chapters scroll over the pinned scene */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <Chapter refFn={(el) => { chapterEls.current[0] = el; }}>
            <div className="flex flex-wrap gap-2"><Badge tone="ai">AI in Operations · Group 2</Badge><SimBadge /></div>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-tight text-fg sm:text-7xl">
              RouteMind <span className="text-gradient">Dubai</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-700 sm:text-xl">
              One AI loop that predicts delays, plans the routes, re-plans live and tells the customer. Same Dubai orders, shorter routes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/command" className="pointer-events-auto rounded-xl bg-ai-deep px-6 py-3 text-sm font-semibold on-accent shadow-[0_8px_30px_-6px_rgba(8,145,178,0.55)] transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ai">
                Open live demo
              </Link>
              <Link href="/business-case" className="pointer-events-auto rounded-xl border border-slate-900/15 bg-white/80 px-6 py-3 text-sm font-semibold text-fg backdrop-blur transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ai">
                See the business case
              </Link>
            </div>
            <button type="button" onClick={() => go(1)} className="pointer-events-auto mt-12 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ai">
              <motion.span aria-hidden animate={{ y: [0, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>↓</motion.span>
              Scroll the story
            </button>
          </Chapter>

          <Chapter refFn={(el) => { chapterEls.current[1] = el; }} panel>
            <Eyebrow tone="base">01 · The problem</Eyebrow>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">Long, tangled routes, planned once in the morning</h2>
            <p className="mt-4 text-base text-slate-700">
              Last-mile delivery is about <strong className="text-fg">53% of total shipping cost</strong>, worldwide (Statista, Feb 2024).
              In Dubai, traffic on Sheikh Zayed Road, the summer midday work break and hard-to-find doors make every route harder.
            </p>
            <p className="mt-4 text-sm text-slate-600"><span className="font-semibold text-base-deep">Amber</span> = today&apos;s plan for the fictional courier DubaiDash Express (assumed nearest-neighbour method).</p>
          </Chapter>

          <Chapter refFn={(el) => { chapterEls.current[2] = el; }} panel>
            <Eyebrow tone="ai">02 · The AI loop</Eyebrow>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">Shorter routes that re-plan themselves</h2>
            <ol className="mt-5 space-y-2.5">
              {LOOP.map((s, i) => (
                <li key={s.t} className="flex items-baseline gap-3">
                  <span className="num w-5 shrink-0 text-lg text-ai">{i + 1}</span>
                  <span><span className="font-semibold text-fg">{s.t}</span> <span className="text-slate-700">· {s.d}</span></span>
                </li>
              ))}
            </ol>
          </Chapter>

          <Chapter refFn={(el) => { chapterEls.current[3] = el; }} panel>
            <Eyebrow tone="ai">03 · The result</Eyebrow>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">Same seeded orders, two plans</h2>
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5">
              <Stat value={FROZEN.cost_pct} suffix="%" label="Lower cost per parcel" tone="ai" />
              <Stat value={FROZEN.vans_fewer} label="Fewer vans" tone="ai" />
              <Stat value={FROZEN.km_pct} suffix="%" label="Fewer kilometres" tone="ai" />
              <Stat value={FROZEN.ontime_ai} suffix="%" label="On time with AI" tone="ok" />
            </div>
            <p className="mt-6 text-xs text-slate-600">
              Simulated: baseline and AI plan the same {FROZEN.seed !== null ? `seeded orders (seed ${FROZEN.seed})` : "seeded orders"}. DubaiDash Express is fictional and its data is assumed.
              {FROZEN.frozen_at === null && " Numbers appear after the Monday 18:00 freeze."}
            </p>
            <Link href="/command" className="pointer-events-auto mt-5 inline-flex rounded-xl bg-ai-deep px-5 py-2.5 text-sm font-semibold on-accent transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ai">
              See it live in the Command Center
            </Link>
          </Chapter>
        </div>
      </section>
    </MotionConfig>
  );
}

function Chapter({ children, panel = false, refFn }: { children: ReactNode; panel?: boolean; refFn: (el: HTMLDivElement | null) => void }) {
  return (
    <div ref={refFn} className="flex h-[100svh] items-center pb-24">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <motion.div
          // the intro is visible on first paint (fast LCP); the other chapters fade in as they arrive
          initial={panel ? { opacity: 0, y: 28 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.45 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={panel ? "glass pointer-events-auto max-w-lg rounded-3xl p-6 sm:p-8" : "max-w-3xl"}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

function Eyebrow({ children, tone }: { children: ReactNode; tone: "ai" | "base" }) {
  return <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${tone === "ai" ? "text-ai-deep" : "text-base-deep"}`}>{children}</p>;
}
