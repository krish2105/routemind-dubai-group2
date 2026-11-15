"use client";
import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartEmpty, SERIES, StubTag, TOOLTIP_STYLE, type SeriesTone } from "./ChartFrame";

/**
 * ConvergenceChart (owner: Yash). Best cost per generation of the genetic algorithm (or any iterative search).
 *
 * Props
 *   data        number[]   best value per generation/iteration (index = generation). Required.
 *   height      number     px, default 224.
 *   valueLabel  string     tooltip label, default "best cost (AED)".
 *   xLabel      string     tooltip x label, default "generation".
 *   reference   number     optional horizontal line (e.g. the Clarke-Wright cost) drawn dashed in amber.
 *   referenceLabel string  label for that line, default "baseline".
 *   tone        "ai" | "base" | "risk" | "ok"   line colour, default "ai" (teal).
 *   stub        boolean    shows a red STUB tag (data from a stub algorithm).
 *   emptyText   string     message when data is empty.
 *
 * Usage: <ConvergenceChart data={plan.meta.convergence ?? []} stub={plan.meta.stub} />
 * Transparent background, light grid; colours come from theme tokens.
 */
export interface ConvergenceChartProps {
  data: number[];
  height?: number;
  valueLabel?: string;
  xLabel?: string;
  reference?: number;
  referenceLabel?: string;
  tone?: SeriesTone;
  stub?: boolean;
  emptyText?: string;
}

export function ConvergenceChart({
  data, height = 224, valueLabel = "best cost (AED)", xLabel = "generation", reference, referenceLabel = "baseline",
  tone = "ai", stub, emptyText = "No convergence data yet. Run the genetic algorithm to see best cost per generation.",
}: ConvergenceChartProps) {
  const rows = useMemo(() => data.filter((v) => Number.isFinite(v)).map((v, g) => ({ g, v })), [data]);
  if (!rows.length) return <ChartEmpty height={height}>{stub ? <StubTag note="no convergence data" /> : emptyText}</ChartEmpty>;
  const first = rows[0].v;
  const last = rows[rows.length - 1].v;
  const gain = first ? ((first - last) / first) * 100 : 0;
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="num text-fg">{rows.length}</span> {xLabel}s
        <span aria-hidden>·</span>
        <span>improved <span className="num text-ai">{gain.toFixed(1)}%</span> from first to last</span>
        {stub && <StubTag />}
      </div>
      <div style={{ height }} className="text-slate-500">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
            <CartesianGrid stroke="currentColor" strokeOpacity={0.12} vertical={false} />
            <XAxis dataKey="g" tick={{ fontSize: 11, fill: "currentColor" }} stroke="currentColor" strokeOpacity={0.3} />
            <YAxis tick={{ fontSize: 11, fill: "currentColor" }} stroke="currentColor" strokeOpacity={0.3} width={60} domain={["auto", "auto"]}
              tickFormatter={(v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 0 })} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 }), valueLabel]} labelFormatter={(g) => `${xLabel} ${g}`} />
            {reference !== undefined && (
              <ReferenceLine y={reference} stroke={SERIES.base} strokeDasharray="5 4" label={{ value: referenceLabel, position: "insideTopRight", fill: SERIES.base, fontSize: 11 }} />
            )}
            <Line type="monotone" dataKey="v" stroke={SERIES[tone]} strokeWidth={2.5} dot={false} isAnimationActive />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
