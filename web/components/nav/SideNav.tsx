"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PAGES } from "@/lib/pages";

export function SideNav() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-900/10 bg-white/70 p-5 backdrop-blur lg:flex">
      <Link href="/" className="mb-8 block">
        <div className="text-lg font-semibold tracking-tight text-fg">RouteMind <span className="text-gradient">Dubai</span></div>
        <div className="text-[11px] uppercase tracking-widest text-slate-500">AI in Operations · Group 2</div>
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {PAGES.map((p) => {
          const active = path === p.href;
          return (
            <Link key={p.href} href={p.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${active ? "bg-ai/10 text-ai" : "text-slate-500 hover:bg-slate-900/5 hover:text-fg"}`}>
              <span>{p.short}</span>
              {p.tier === 3 && <span className="text-[10px] text-slate-500">T3</span>}
            </Link>
          );
        })}
      </nav>
      <p className="mt-4 text-[11px] leading-relaxed text-slate-500">DubaiDash Express is fictional. All data is simulated or assumed.</p>
    </aside>
  );
}
