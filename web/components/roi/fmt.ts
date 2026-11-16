/**
 * Number formats for the business case (owner: Harsh). One place so tiles, charts, grid and the slide agree.
 * Always an explicit locale ("en-US") so server and client render the same text (no hydration warnings).
 */
import { HORIZON_MONTHS } from "@/lib/roi";

const MINUS = "−";

/** AED 420,000 (exact, for the ask and the investment). */
export function aed(x: number): string {
  return `${x < 0 ? MINUS : ""}AED ${Math.round(Math.abs(x)).toLocaleString("en-US")}`;
}

/** AED 420k / AED 1.2M (compact, for tiles and chart axes); real minus sign for losses. */
export function aedShort(x: number): string {
  const v = Math.abs(x);
  const sign = x < 0 ? MINUS : "";
  if (v >= 999_500) return `${sign}AED ${(v / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: v >= 9_995_000 ? 0 : 1 })}M`;
  if (v >= 1_000) return `${sign}AED ${Math.round(v / 1_000).toLocaleString("en-US")}k`;
  return `${sign}AED ${Math.round(v).toLocaleString("en-US")}`;
}

/** Axis ticks: 420k, 1.2M, −420k. */
export function shortNum(x: number): string {
  return aedShort(x).replace("AED ", "");
}

/** "6.4" months with one decimal, "never" when there is no payback, "> 36" beyond the horizon (decimals there are noise). */
export function months(m: number | null, digits = 1): string {
  if (m === null || !Number.isFinite(m)) return "never";
  if (m > HORIZON_MONTHS) return `> ${HORIZON_MONTHS}`;
  return m.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function pct(x: number, digits = 0): string {
  return `${x.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}

export function int(x: number): string {
  return Math.round(x).toLocaleString("en-US");
}
