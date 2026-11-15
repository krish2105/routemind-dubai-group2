import frozen from "@/public/data/frozen_results.json";

export type Frozen = Record<string, number | string | null>;
export const FROZEN = frozen as unknown as Frozen;

/** Returns the frozen number as text, or an em dash if not frozen yet. */
export function fz(key: string, suffix = ""): string {
  const v = FROZEN[key];
  return v === null || v === undefined ? "—" : `${v}${suffix}`;
}
