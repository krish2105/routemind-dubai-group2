import Link from "next/link";
import type { ReactNode } from "react";
import { SideNav } from "./SideNav";
import { BottomNav } from "./BottomNav";
import { SimBadge } from "@/components/ui/Badge";

/**
 * Wraps every page except the landing page: skip link, side nav (768 px and up) or bottom tab bar (phones),
 * and a slim header with the SIMULATED badge.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="backdrop flex min-h-screen">
      <a href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-ai-deep focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
        Skip to content
      </a>
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 py-4 pl-5 pr-16 sm:pl-10">
          <Link href="/" className="whitespace-nowrap rounded-md text-[1rem] font-semibold tracking-tight text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ai md:hidden">
            RouteMind <span className="text-gradient">Dubai</span>
          </Link>
          <div className="ml-auto" title="Simulated prototype, assumed data (DubaiDash Express is fictional)">
            <span className="sm:hidden"><SimBadge compact /></span>
            <span className="hidden sm:inline"><SimBadge /></span>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 px-5 pb-28 pt-2 outline-none sm:px-10 md:pb-10">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
