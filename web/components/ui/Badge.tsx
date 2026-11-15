import type { ReactNode } from "react";

const tones = {
  ai: "border-ai/40 bg-ai/10 text-ai",
  base: "border-base/40 bg-base/10 text-base",
  risk: "border-risk/40 bg-risk/10 text-risk",
  muted: "border-slate-900/10 bg-white/70 text-slate-500",
} as const;

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: keyof typeof tones }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${tones[tone]}`}>{children}</span>;
}

/** Use on every page that shows simulated or assumed data. */
export function SimBadge() {
  return <Badge tone="base">SIMULATED · ASSUMED DATA</Badge>;
}
