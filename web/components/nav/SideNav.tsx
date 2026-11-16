"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PAGES } from "@/lib/pages";

/** Desktop and tablet navigation (768 px and up). On phones the BottomNav takes over. */
export function SideNav() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-900/10 bg-white/70 p-5 backdrop-blur md:flex lg:w-64">
      <Link href="/" className="mb-8 block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ai">
        <div className="text-lg font-semibold tracking-tight text-fg">RouteMind <span className="text-gradient">Dubai</span></div>
        <div className="text-[11px] uppercase tracking-widest text-slate-600">AI in Operations · Group 2</div>
      </Link>
      <nav aria-label="Prototype pages" className="-mx-1 flex-1 space-y-0.5 overflow-y-auto px-1">
        {PAGES.map((p) => {
          const active = path === p.href;
          return (
            <Link
              key={p.href}
              href={p.href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center justify-between rounded-lg px-3 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ai ${active ? "bg-ai/10 font-medium text-ai-deep" : "text-slate-600 hover:bg-slate-900/5 hover:text-fg"}`}
            >
              {active && <span aria-hidden className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-ai" />}
              <span>{p.short}</span>
              <span className={`num text-[10px] ${active ? "text-ai-deep" : "text-slate-500"}`}>S{p.slide}</span>
            </Link>
          );
        })}
      </nav>
      <p className="mt-4 text-[11px] leading-relaxed text-slate-600">DubaiDash Express is fictional. All data is simulated or assumed.</p>
    </aside>
  );
}
