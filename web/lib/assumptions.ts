import type { Assumptions } from "@/lib/types";
import raw from "@/public/data/assumptions.json";

/** Single typed import of the assumed numbers (keep in sync with data_seed/assumptions.json). */
export const assumptions = raw as unknown as Assumptions;
