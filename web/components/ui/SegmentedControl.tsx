"use client";
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * Segmented control (a styled radio group) for 2 to 4 options.
 * Keyboard: Tab focuses the selected option, arrow keys move and select, Home/End jump.
 *
 *   <SegmentedControl label="Scene view" value={view} onChange={setView}
 *     options={[{ value: "base", label: "Baseline view", tone: "base" }, { value: "ai", label: "AI view", tone: "ai" }]} />
 */
export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  /** colour of the selected pill: teal (AI), amber (baseline) or navy (neutral) */
  tone?: "ai" | "base" | "neutral";
}

const pill = { ai: "bg-ai-deep", base: "bg-base-deep", neutral: "bg-fg" } as const;

export function SegmentedControl<T extends string>({
  options, value, onChange, label, size = "md", className = "",
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  /** accessible name of the group (read by screen readers) */
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = Math.max(0, options.findIndex((o) => o.value === value));

  function onKey(e: KeyboardEvent) {
    let n = idx;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (idx + 1) % options.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (idx - 1 + options.length) % options.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = options.length - 1;
    else return;
    e.preventDefault();
    onChange(options[n].value);
    refs.current[n]?.focus();
  }

  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKey}
      className={`glass inline-flex items-center gap-1 rounded-full p-1 ${className}`}>
      {options.map((o, i) => {
        const on = i === idx;
        return (
          <button
            key={o.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={`relative rounded-full font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ai ${pad} ${on ? "on-accent" : "text-slate-600 hover:text-fg"}`}
          >
            {on && (
              <motion.span layoutId={`seg-${id}`} aria-hidden
                className={`absolute inset-0 rounded-full shadow-sm ${pill[o.tone ?? "neutral"]}`}
                transition={{ type: "spring", stiffness: 420, damping: 34 }} />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
