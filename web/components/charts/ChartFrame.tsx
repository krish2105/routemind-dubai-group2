import type { ReactNode } from "react";

/**
 * Shared helpers for the chart components (owner: Yash).
 * - <ChartEmpty>  : the "no data yet" message every chart shows instead of an empty axis.
 * - <StubTag>     : red tag shown when the data comes from a stub algorithm, so a fake result is never silent.
 * - TOOLTIP_STYLE : Recharts tooltip colours from the theme tokens (works in light and dark).
 * Colours: teal (--color-ai) = AI, amber (--color-base) = baseline, red (--color-risk) = SLA risk.
 */
export function ChartEmpty({ children, height = 160 }: { children?: ReactNode; height?: number }) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-900/15 px-4 text-center text-sm text-slate-500" style={{ minHeight: height }}>
      {children ?? "No data yet."}
    </div>
  );
}

export function StubTag({ note = "stub data" }: { note?: string }) {
  return <span className="inline-flex items-center rounded-full border border-risk/40 bg-risk/10 px-2 py-0.5 text-[11px] font-medium text-risk">STUB · {note}</span>;
}

export const TOOLTIP_STYLE = {
  contentStyle: { background: "var(--color-paper)", border: "1px solid rgba(100,116,139,0.25)", borderRadius: 10, color: "var(--color-fg)", fontSize: 12 },
  labelStyle: { color: "var(--color-fg)" },
  itemStyle: { color: "var(--color-fg)" },
} as const;

export const SERIES = {
  ai: "var(--color-ai)",
  base: "var(--color-base)",
  risk: "var(--color-risk)",
  ok: "var(--color-ok)",
} as const;
export type SeriesTone = keyof typeof SERIES;
