import type { ReactNode } from "react";

const tones = {
  ai: "border-ai/40 bg-ai/10 text-ai-deep",
  base: "border-base/40 bg-base/10 text-base-deep",
  risk: "border-risk/40 bg-risk/10 text-risk",
  muted: "border-slate-900/10 bg-white/70 text-slate-600",
} as const;

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: keyof typeof tones }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${tones[tone]}`}>{children}</span>;
}

/** "SIMULATED · ASSUMED DATA". AppShell already shows it in the header of every page; use it on cards or the landing page. */
export function SimBadge({ compact = false }: { compact?: boolean }) {
  return <Badge tone="base">{compact ? "SIMULATED" : "SIMULATED · ASSUMED DATA"}</Badge>;
}
