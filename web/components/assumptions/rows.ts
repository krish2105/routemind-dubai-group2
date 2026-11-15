import type { Assumptions } from "@/lib/types";

export interface AssumptionRow {
  key: string;
  group: string;
  label: string;
  value: string;
  status: string;
  reason: string;
  range: string;
}

type Prov = Record<string, { status: string; reason: string; range: string } | string>;

const GROUPS: Record<string, string> = {
  seed: "Scenario", vehicles: "Vehicles", orders: "Orders", costs: "Costs (AED)", failed_attempt: "Failed first attempts",
  sla: "Service levels", fuel: "Fuel and CO2", traffic_hour_multipliers: "Traffic", event_multipliers: "What-if events",
  fallback: "Travel-time model", business_case: "Business case", shifts: "Shifts",
};

const label = (key: string) =>
  key.split(".").slice(1).join(" ").replace(/_/g, " ").replace(/\baed\b/g, "AED").replace(/\bco2\b/g, "CO2") || key;

function lookup(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
}

function show(v: unknown): string {
  if (v && typeof v === "object") return Object.entries(v as Record<string, unknown>).map(([k, x]) => `${k}: ${x}`).join(", ");
  if (typeof v === "number") return v.toLocaleString("en-US");
  return String(v ?? "n/a");
}

/** Flatten the provenance block of assumptions.json into drawer rows (value read from the same file). */
export function assumptionRows(a: Assumptions): AssumptionRow[] {
  const prov = ((a as unknown as { provenance?: Prov }).provenance ?? {}) as Prov;
  return Object.entries(prov)
    .filter(([k, v]) => !k.startsWith("_") && typeof v === "object")
    .map(([key, v]) => {
      const p = v as { status: string; reason: string; range: string };
      return { key, group: GROUPS[key.split(".")[0]] ?? "Other", label: label(key), value: show(lookup(a, key)), ...p };
    });
}
