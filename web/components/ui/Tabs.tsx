"use client";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * Accessible tabs (WAI-ARIA tabs pattern): arrow keys move between tabs, Home/End jump, Tab moves into the panel.
 * Uncontrolled by default; pass `value` + `onChange` to control it.
 *
 *   <Tabs label="Results view" tabs={[
 *     { id: "kpi", label: "KPIs", content: <KpiGrid /> },
 *     { id: "routes", label: "Routes", content: <RouteTable /> },
 *   ]} />
 */
export interface TabItem { id: string; label: ReactNode; content: ReactNode }

export function Tabs({
  tabs, label, value, onChange, defaultValue, className = "",
}: {
  tabs: TabItem[];
  /** accessible name of the tab list */
  label: string;
  value?: string;
  onChange?: (id: string) => void;
  defaultValue?: string;
  className?: string;
}) {
  const base = useId();
  const [inner, setInner] = useState(defaultValue ?? tabs[0]?.id);
  const active = value ?? inner;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const select = (id: string) => { if (value === undefined) setInner(id); onChange?.(id); };
  const idx = Math.max(0, tabs.findIndex((t) => t.id === active));

  function onKey(e: KeyboardEvent) {
    let n = idx;
    if (e.key === "ArrowRight") n = (idx + 1) % tabs.length;
    else if (e.key === "ArrowLeft") n = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = tabs.length - 1;
    else return;
    e.preventDefault();
    select(tabs[n].id);
    refs.current[n]?.focus();
  }

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} onKeyDown={onKey}
        className="flex gap-1 overflow-x-auto border-b border-slate-900/10 [scrollbar-width:none]">
        {tabs.map((t, i) => {
          const on = i === idx;
          return (
            <button
              key={t.id}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="tab"
              id={`${base}-tab-${t.id}`}
              aria-selected={on}
              aria-controls={`${base}-panel-${t.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => select(t.id)}
              className={`relative shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ai ${on ? "text-fg" : "text-slate-600 hover:text-fg"}`}
            >
              {t.label}
              {on && <motion.span layoutId={`${base}-ink`} aria-hidden className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ai" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
            </button>
          );
        })}
      </div>
      {tabs.map((t, i) => (
        <div key={t.id} role="tabpanel" id={`${base}-panel-${t.id}`} aria-labelledby={`${base}-tab-${t.id}`}
          hidden={i !== idx} tabIndex={0} className="pt-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ai">
          {i === idx && t.content}
        </div>
      ))}
    </div>
  );
}
