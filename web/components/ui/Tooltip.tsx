"use client";
import { cloneElement, isValidElement, useId, useState, type ReactElement, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Small text bubble on hover AND keyboard focus; Escape hides it. The child must be focusable (button, link)
 * so keyboard users can reach it. Named export clashes with Recharts' Tooltip: import as `{ Tooltip as Tip }`.
 *
 *   <Tooltip content="Cost per delivered parcel, AED (simulated)"><button>Cost/parcel</button></Tooltip>
 *   <InfoTip content="Baseline = assumed nearest-neighbour plan" />   // small (i) button
 */
export function Tooltip({
  content, children, side = "top", className = "",
}: {
  content: ReactNode;
  children: ReactElement<{ "aria-describedby"?: string }>;
  side?: "top" | "bottom";
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const pos = side === "top" ? "bottom-full mb-2" : "top-full mt-2";
  const child = isValidElement(children) ? cloneElement(children, { "aria-describedby": open ? id : undefined }) : children;
  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
    >
      {child}
      <AnimatePresence>
        {open && (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, y: side === "top" ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`pointer-events-none absolute left-1/2 z-50 w-max max-w-64 -translate-x-1/2 rounded-lg bg-fg px-3 py-2 text-xs leading-snug font-medium text-paper shadow-lg ${pos}`}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/** A small (i) button that shows a tooltip. `label` is read by screen readers. */
export function InfoTip({ content, label = "More information", side }: { content: ReactNode; label?: string; side?: "top" | "bottom" }) {
  return (
    <Tooltip content={content} side={side}>
      <button type="button" aria-label={label}
        className="inline-grid h-4 w-4 place-items-center rounded-full border border-slate-900/20 text-[10px] font-semibold text-slate-600 transition hover:border-ai hover:text-ai-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ai">
        i
      </button>
    </Tooltip>
  );
}
