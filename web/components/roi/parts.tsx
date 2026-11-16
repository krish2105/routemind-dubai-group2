"use client";
import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Glass } from "@/components/ui/Glass";

/**
 * Small building blocks for /business-case and /rl-lab (owner: Harsh).
 * Colour rules: teal = AI / our plan, amber = baseline ("do nothing") only, red = risk only (payback > 24 months or none).
 */

/** Numbered section heading, same pattern as the /problem page. */
export function Section({ n, title, kicker, children, id, aside }: { n: number; title: string; kicker?: string; children: ReactNode; id?: string; aside?: ReactNode }) {
  return (
    <section className="mb-8" aria-labelledby={id}>
      <Reveal>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <div className="flex items-baseline gap-3">
            <span className="num text-sm text-ai">0{n}</span>
            <div>
              <h2 id={id} className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">{title}</h2>
              {kicker && <p className="text-sm text-slate-500">{kicker}</p>}
            </div>
          </div>
          {aside}
        </div>
      </Reveal>
      {children}
    </section>
  );
}

/** One financial figure with a label and a caption (single values, unlike the baseline-vs-AI KpiCard). */
export function StatTile({ label, value, caption, tone = "fg", children }: { label: string; value: ReactNode; caption?: ReactNode; tone?: "fg" | "ai" | "risk"; children?: ReactNode }) {
  const color = tone === "ai" ? "text-ai" : tone === "risk" ? "text-risk" : "text-fg";
  return (
    <Glass className="flex min-w-0 flex-col p-4">
      <div className="text-xs uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`num mt-2 text-2xl font-semibold ${color}`}>{value}</div>
      {caption && <div className="mt-1 text-xs text-slate-500">{caption}</div>}
      {children}
    </Glass>
  );
}

/**
 * Animated number: counts up from 0 on first show (1 s), then tweens 0.3 s on every change.
 * Reduced motion: shows the value at once. The visible digits are aria-hidden; give the screen-reader text separately.
 */
export function CountUp({ value, decimals = 1, className = "" }: { value: number; decimals?: number; className?: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  const first = useRef(true);
  useEffect(() => {
    if (reduce) { shownRef.current = value; setShown(value); first.current = false; return; }
    const c = animate(shownRef.current, value, {
      duration: first.current ? 1 : 0.3,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => { shownRef.current = v; setShown(v); },
      onComplete: () => { shownRef.current = value; setShown(value); },
    });
    first.current = false;
    return () => c.stop();
  }, [value, reduce]);
  return <span aria-hidden className={`num ${className}`}>{shown.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
}

/** Screen-reader sentence that updates only after the value settles (no chatter while a slider moves). */
export function LiveText({ text, delay = 700 }: { text: string; delay?: number }) {
  const [said, setSaid] = useState(text);
  useEffect(() => {
    const t = setTimeout(() => setSaid(text), delay);
    return () => clearTimeout(t);
  }, [text, delay]);
  return <span className="sr-only" aria-live="polite">{said}</span>;
}

/** Small outlined chip. */
export function Chip({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "ai" | "risk" | "base" }) {
  const t = {
    muted: "border-slate-900/10 text-slate-500",
    ai: "border-ai/40 text-ai",
    risk: "border-risk/40 text-risk",
    base: "border-base/40 text-base",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full border bg-white/70 px-2 py-0.5 text-[11px] font-medium ${t}`}>{children}</span>;
}
