import type { ReactNode } from "react";
import { SideNav } from "./SideNav";

/** Wraps every page except the landing page. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="backdrop flex min-h-screen">
      <SideNav />
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-10">{children}</main>
    </div>
  );
}
