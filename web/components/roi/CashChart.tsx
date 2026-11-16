"use client";
import { useId, useMemo } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SERIES, TOOLTIP_STYLE } from "@/components/charts/ChartFrame";
import type { RoiResult } from "@/lib/roi";
import { aedShort, months, shortNum } from "./fmt";

/**
 * 36-month cumulative net cash (owner: Harsh). Month 0 = the pilot investment.
 * Teal area = current what-if; thin slate dashes = conservative / optimistic; amber dashed zero line = do nothing (baseline).
 * Slider-driven, so no chart animation (it would replay on every tick).
 */
export function CashChart({ current, conservative, optimistic, height = 300, seriesLabel = "your what-if" }: { current: RoiResult; conservative: RoiResult; optimistic: RoiResult; height?: number; seriesLabel?: string }) {
  const gid = useId().replace(/:/g, "");
  const rows = useMemo(() => current.cumulative.map((v, m) => ({ m, current: v, conservative: conservative.cumulative[m], optimistic: optimistic.cumulative[m] })),
    [current, conservative, optimistic]);
  const pb = current.paybackMonths;
  const axis = { tick: { fontSize: 11, fill: "currentColor" }, stroke: "currentColor", strokeOpacity: 0.3 } as const;
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-ai/60" />{seriesLabel}</span>
        <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-slate-400" />conservative / optimistic</span>
        <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-base" />do nothing (today&apos;s planning) = AED 0</span>
      </div>
      <div style={{ height }} className="min-w-0 text-slate-500" role="img"
        aria-label={`Cumulative net cash over 36 months. Starts at ${aedShort(current.cumulative[0])}, breaks even at ${months(pb)} months, ends at ${aedShort(current.net36)}.`}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height }}>
          <ComposedChart data={rows} margin={{ top: 16, right: 16, bottom: 18, left: 4 }}>
            <defs>
              <linearGradient id={`cash-${gid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES.ai} stopOpacity={0.35} />
                <stop offset="100%" stopColor={SERIES.ai} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="currentColor" strokeOpacity={0.1} vertical={false} />
            <XAxis dataKey="m" type="number" domain={[0, 36]} ticks={[0, 3, 6, 9, 12, 18, 24, 30, 36]} {...axis}
              label={{ value: "months after roll-out", position: "insideBottom", offset: -10, fontSize: 11, fill: "currentColor" }} />
            <YAxis {...axis} width={58} tickFormatter={(v: number) => shortNum(v)} />
            <Tooltip {...TOOLTIP_STYLE} labelFormatter={(m) => `Month ${m}`}
              formatter={(v, name) => [aedShort(Number(v)), name === "current" ? seriesLabel : String(name)]} />
            <ReferenceLine y={0} stroke={SERIES.base} strokeDasharray="5 4" />
            {pb !== null && pb <= 36 && (
              <ReferenceLine x={pb} stroke={SERIES.ai} strokeDasharray="3 3"
                label={{ value: `break-even ${months(pb)} mo`, position: "insideTopRight", fill: SERIES.ai, fontSize: 11 }} />
            )}
            <Line dataKey="conservative" stroke="currentColor" strokeOpacity={0.55} strokeDasharray="4 4" strokeWidth={1.25} dot={false} isAnimationActive={false} />
            <Line dataKey="optimistic" stroke="currentColor" strokeOpacity={0.55} strokeDasharray="4 4" strokeWidth={1.25} dot={false} isAnimationActive={false} />
            <Area dataKey="current" type="linear" stroke={SERIES.ai} strokeWidth={2.5} fill={`url(#cash-${gid})`} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
