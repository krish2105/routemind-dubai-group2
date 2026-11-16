"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Short status messages ("Re-route applied", "Copied"). Screen readers hear them (aria-live).
 * ToastProvider is already in app/layout.tsx, so any client component can call useToast().
 *
 *   const toast = useToast();
 *   toast({ title: "Re-route applied", description: "3 orders moved to van 7", tone: "ai" });
 */
export type ToastTone = "ai" | "base" | "risk" | "ok" | "neutral";
export interface ToastInput { title: string; description?: string; tone?: ToastTone; /** ms, default 4000 */ duration?: number }
interface ToastItem extends Required<Omit<ToastInput, "description">> { id: number; description?: string }

const Ctx = createContext<((t: ToastInput) => void) | null>(null);

export function useToast() {
  const fn = useContext(Ctx);
  // Outside the provider (tests, isolated renders) toasts are a silent no-op instead of a crash.
  return fn ?? (() => {});
}

const bar: Record<ToastTone, string> = { ai: "bg-ai", base: "bg-base", risk: "bg-risk", ok: "bg-ok", neutral: "bg-slate-400" };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);
  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const push = useCallback((t: ToastInput) => {
    const item: ToastItem = { id: next.current++, title: t.title, description: t.description, tone: t.tone ?? "neutral", duration: t.duration ?? 4000 };
    setItems((xs) => [...xs.slice(-2), item]); // at most 3 on screen
  }, []);
  const value = useMemo(() => push, [push]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-live="polite" aria-relevant="additions" className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 md:bottom-6 md:right-6 md:left-auto md:items-end">
        <AnimatePresence initial={false}>
          {items.map((t) => <ToastCard key={t.id} item={t} onClose={() => dismiss(t.id)} />)}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = window.setTimeout(onClose, item.duration);
    return () => window.clearTimeout(t);
  }, [paused, item.duration, onClose]);
  return (
    <motion.div
      layout
      role="status"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="glass pointer-events-auto flex w-full max-w-sm overflow-hidden rounded-2xl"
    >
      <span aria-hidden className={`w-1.5 shrink-0 ${bar[item.tone]}`} />
      <div className="min-w-0 flex-1 px-4 py-3">
        <p className="text-sm font-semibold text-fg">{item.title}</p>
        {item.description && <p className="mt-0.5 text-sm text-slate-600">{item.description}</p>}
      </div>
      <button type="button" onClick={onClose} aria-label="Dismiss"
        className="m-2 grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-900/5 hover:text-fg focus-visible:outline-2 focus-visible:outline-ai">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </motion.div>
  );
}
