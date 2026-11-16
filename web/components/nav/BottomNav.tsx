"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PAGES } from "@/lib/pages";
import { Drawer } from "@/components/ui/Drawer";

/**
 * Phone navigation (below 768 px): a bottom tab bar with the demo pages and a "More" sheet listing all 11 pages.
 */
const TABS: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/", label: "Home", icon: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
  { href: "/command", label: "Command", icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></> },
  { href: "/optimizer", label: "Optimizer", icon: <><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h5a3 3 0 0 0 0-6h-2a3 3 0 0 1 0-6h5" /></> },
  { href: "/rerouting", label: "Re-route", icon: <path d="M4 7h11l-3-3M20 17H9l3 3M15 7a4 4 0 0 1 4 4M9 17a4 4 0 0 1-4-4" /> },
];

export function BottomNav() {
  const path = usePathname();
  const [more, setMore] = useState(false);
  const inTabs = TABS.some((t) => t.href === path);
  return (
    <>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-900/10 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden">
        <ul className="grid grid-cols-5">
          {TABS.map((t) => {
            const on = path === t.href;
            return (
              <li key={t.href}>
                <Link href={t.href} aria-current={on ? "page" : undefined}
                  className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ai ${on ? "text-ai-deep" : "text-slate-600"}`}>
                  <Icon on={on}>{t.icon}</Icon>
                  {t.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setMore(true)} aria-haspopup="dialog" aria-expanded={more}
              className={`flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ai ${!inTabs ? "text-ai-deep" : "text-slate-600"}`}>
              <Icon on={!inTabs}><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></Icon>
              More
            </button>
          </li>
        </ul>
      </nav>

      <Drawer open={more} onClose={() => setMore(false)} side="bottom" title="All pages" description="Simulated prototype, assumed data">
        <ul className="grid gap-1.5">
          {PAGES.map((p) => {
            const on = path === p.href;
            return (
              <li key={p.href}>
                <Link href={p.href} onClick={() => setMore(false)} aria-current={on ? "page" : undefined}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm transition focus-visible:outline-2 focus-visible:outline-ai ${on ? "bg-ai/10 font-semibold text-ai-deep" : "text-fg hover:bg-slate-900/5"}`}>
                  <span>{p.title}</span>
                  <span className="text-xs text-slate-600">Slide {p.slide} · {p.owner}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Drawer>
    </>
  );
}

function Icon({ children, on }: { children: ReactNode; on: boolean }) {
  return (
    <span className={`grid h-7 w-12 place-items-center rounded-full transition ${on ? "bg-ai/12" : ""}`}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{children}</svg>
    </span>
  );
}
