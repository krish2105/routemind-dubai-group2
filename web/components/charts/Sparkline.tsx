import { SERIES, type SeriesTone } from "./ChartFrame";

/**
 * Sparkline (owner: Yash). Tiny inline trend line (pure SVG, no library, works in server and client components).
 *
 * Props
 *   data     number[]  values in order. Required; fewer than 2 values draws a flat dashed line.
 *   width    number    px, default 96
 *   height   number    px, default 28
 *   tone     "ai" | "base" | "risk" | "ok"   default "ai"
 *   fill     boolean   soft area under the line, default true
 *   showLast boolean   dot on the last value, default true
 *   label    string    accessible label (aria-label), default "trend"
 */
export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  tone?: SeriesTone;
  fill?: boolean;
  showLast?: boolean;
  label?: string;
}

export function Sparkline({ data, width = 96, height = 28, tone = "ai", fill = true, showLast = true, label = "trend" }: SparklineProps) {
  const vals = data.filter((v) => Number.isFinite(v));
  const color = SERIES[tone];
  if (vals.length < 2) {
    return (
      <svg width={width} height={height} role="img" aria-label={`${label}: not enough data`}>
        <line x1={2} x2={width - 2} y1={height / 2} y2={height / 2} stroke="currentColor" strokeOpacity={0.3} strokeDasharray="3 3" />
      </svg>
    );
  }
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pad = 3;
  const sx = (i: number) => pad + (i / (vals.length - 1)) * (width - 2 * pad);
  const sy = (v: number) => (max === min ? height / 2 : pad + (1 - (v - min) / (max - min)) * (height - 2 * pad));
  const d = vals.map((v, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
  const area = `${d} L${sx(vals.length - 1).toFixed(1)},${height - pad} L${sx(0).toFixed(1)},${height - pad} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${label}: ${vals[0]} to ${vals[vals.length - 1]}`}>
      {fill && <path d={area} fill={color} fillOpacity={0.12} />}
      <path d={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      {showLast && <circle cx={sx(vals.length - 1)} cy={sy(vals[vals.length - 1])} r={2.4} fill={color} />}
    </svg>
  );
}
