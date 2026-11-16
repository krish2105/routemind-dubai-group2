"use client";
import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

/**
 * Big number that counts up from 0 when it scrolls into view (instant with reduced motion).
 * Pass the raw frozen value: `null` shows "n/a until frozen", never a fake number.
 *
 *   import { FROZEN } from "@/lib/frozen";
 *   <Stat value={FROZEN.cost_pct} suffix="%" label="Lower cost per parcel" tone="ai" />
 */
export function Stat({
  value, label, prefix = "", suffix = "", tone = "fg", hint, className = "",
}: {
  value: number | string | null | undefined;
  label: string;
  prefix?: string;
  suffix?: string;
  tone?: "fg" | "ai" | "base" | "risk" | "ok";
  /** small line under the label, e.g. "simulated" */
  hint?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const num = typeof value === "number" ? value : null;
  const decimals = num === null ? 0 : (String(num).split(".")[1]?.length ?? 0);
  const fmt = (v: number) => `${prefix}${v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;

  useEffect(() => {
    const el = ref.current;
    if (!el || num === null) return;
    if (reduced) { el.textContent = fmt(num); return; }
    if (!inView) return;
    const c = animate(0, num, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => { el.textContent = fmt(v); } });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, num, reduced]);

  const color = { fg: "text-fg", ai: "text-ai", base: "text-base", risk: "text-risk", ok: "text-ok" }[tone];
  const frozen = value !== null && value !== undefined;
  return (
    <div className={className}>
      {frozen ? (
        <span ref={ref} className={`num block text-4xl font-semibold ${color}`}>
          {num === null ? `${prefix}${value}${suffix}` : fmt(reduced ? num : 0)}
        </span>
      ) : (
        <span ref={ref} className="block text-lg font-medium text-slate-600">n/a until frozen</span>
      )}
      <span className="mt-1 block text-xs font-medium uppercase tracking-widest text-slate-600">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>}
    </div>
  );
}
