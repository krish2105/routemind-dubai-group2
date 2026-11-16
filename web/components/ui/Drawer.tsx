"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Slide-in panel (right side on desktop, or a bottom sheet). Modal: focus moves inside and is kept there,
 * Escape or a click on the backdrop closes it, focus returns to the button that opened it, page scroll is locked.
 *
 *   const [open, setOpen] = useState(false);
 *   <button onClick={() => setOpen(true)}>Assumptions</button>
 *   <Drawer open={open} onClose={() => setOpen(false)} title="Assumptions" description="All values assumed">…</Drawer>
 */
export function Drawer({
  open, onClose, title, description, children, side = "right", footer, className = "",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  side?: "right" | "bottom";
  footer?: ReactNode;
  className?: string;
}) {
  const titleId = useId();
  const descId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // keep the latest onClose without re-running the focus effect when the parent re-renders
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () =>
      Array.from(panel.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []);
    const t = window.setTimeout(() => (focusables()[0] ?? panel.current)?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); closeRef.current(); return; }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) { e.preventDefault(); return; }
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open]);

  if (!mounted) return null;
  const right = side === "right";
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            initial={right ? { x: "100%" } : { y: "100%" }}
            animate={right ? { x: 0 } : { y: 0 }}
            exit={right ? { x: "100%" } : { y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className={`absolute flex flex-col bg-white text-fg shadow-2xl outline-none ${right
              ? "inset-y-0 right-0 w-full max-w-xl border-l border-slate-900/10"
              : "inset-x-0 bottom-0 max-h-[85svh] rounded-t-3xl border-t border-slate-900/10 pb-[env(safe-area-inset-bottom)]"} ${className}`}
          >
            {!right && <span aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-slate-300" />}
            <div className="flex items-start justify-between gap-4 border-b border-slate-900/5 px-6 py-4">
              <div>
                <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
                {description && <p id={descId} className="mt-1 text-sm text-slate-600">{description}</p>}
              </div>
              <button type="button" onClick={onClose} aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-900/10 text-slate-600 transition hover:bg-paper hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ai">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="border-t border-slate-900/5 px-6 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
