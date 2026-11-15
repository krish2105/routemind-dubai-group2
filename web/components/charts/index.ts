/**
 * Shared chart components (owner: Yash). Import from "@/components/charts".
 *   ConvergenceChart : GA best cost per generation (number[])
 *   CompareBars      : baseline (amber) vs AI (teal) for a KPI list
 *   RouteTable       : sortable per-vehicle route table
 *   Sparkline        : tiny inline SVG trend
 * Props are documented at the top of each file. All use theme tokens (light by default, dark toggle works).
 */
export { ConvergenceChart, type ConvergenceChartProps } from "./ConvergenceChart";
export { CompareBars, type CompareBarsProps, type CompareItem } from "./CompareBars";
export { RouteTable, type RouteTableProps } from "./RouteTable";
export { Sparkline, type SparklineProps } from "./Sparkline";
export { ChartEmpty, StubTag, SERIES, TOOLTIP_STYLE, type SeriesTone } from "./ChartFrame";
