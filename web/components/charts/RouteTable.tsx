"use client";
import { useMemo, useState } from "react";
import type { Plan, Vehicle } from "@/lib/types";
import { assumptions } from "@/lib/assumptions";
import { ChartEmpty, StubTag } from "./ChartFrame";

/**
 * RouteTable (owner: Yash). One row per vehicle route, sortable by any column (click a header; click again to flip).
 * Columns: vehicle, type, stops, km, hours on duty, load %, breaches (late stops), duty (ok / over).
 *
 * Props
 *   plan        Plan        the plan to show (from solve()). Optional: undefined shows the empty state.
 *   vehicles    Vehicle[]   optional, for exact capacities; otherwise capacity comes from assumptions by type.
 *   orderCount  number      optional, total orders (footer shows "x of y served").
 *   highlight   string[]    optional vehicle ids to highlight (e.g. routes changed by re-routing), shown in teal.
 *   maxRows     number      optional, rows shown before "show all" (default: all).
 *   emptyText   string      message when there is no plan.
 *
 * Stub plans (plan.meta.stub) get a red STUB tag. Hours = (end - start) / 60. Load % = load / capacity.
 */
export interface RouteTableProps {
  plan?: Plan;
  vehicles?: Vehicle[];
  orderCount?: number;
  highlight?: string[];
  maxRows?: number;
  emptyText?: string;
}

type Key = "vehicle" | "stops" | "km" | "hours" | "loadPct" | "breaches";
const COLS: { key: Key; label: string; num: boolean }[] = [
  { key: "vehicle", label: "Vehicle", num: false },
  { key: "stops", label: "Stops", num: true },
  { key: "km", label: "km", num: true },
  { key: "hours", label: "Hours", num: true },
  { key: "loadPct", label: "Load %", num: true },
  { key: "breaches", label: "Breaches", num: true },
];

export function RouteTable({ plan, vehicles, orderCount, highlight = [], maxRows, emptyText = "Run an algorithm to see the routes." }: RouteTableProps) {
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: "vehicle", dir: 1 });
  const [all, setAll] = useState(false);
  const hl = useMemo(() => new Set(highlight), [highlight]);

  const rows = useMemo(() => {
    if (!plan) return [];
    const vById = new Map((vehicles ?? []).map((v) => [v.id, v]));
    const out = plan.routes.map((r) => {
      const v = vById.get(r.vehicleId);
      const type = v?.type ?? (r.vehicleId.startsWith("B") ? "bike" : "van");
      const cap = v?.capacity ?? assumptions.vehicles[type].capacity_parcels;
      return {
        vehicle: r.vehicleId,
        type,
        stops: r.stops.length,
        km: r.km,
        hours: (r.endMin - r.startMin) / 60,
        loadPct: cap ? (r.load / cap) * 100 : 0,
        breaches: r.stops.filter((s) => s.late).length,
        overDuty: r.overDuty,
      };
    });
    out.sort((a, b) => {
      const x = a[sort.key], y = b[sort.key];
      const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return c * sort.dir || a.vehicle.localeCompare(b.vehicle);
    });
    return out;
  }, [plan, vehicles, sort]);

  if (!plan) return <ChartEmpty>{emptyText}</ChartEmpty>;
  const shown = maxRows && !all ? rows.slice(0, maxRows) : rows;
  const served = plan.routes.reduce((s, r) => s + r.stops.length, 0);
  const totalBreaches = rows.reduce((s, r) => s + r.breaches, 0);

  return (
    <div>
      {plan.meta.stub && <div className="mb-2"><StubTag note={plan.meta.note ?? "stub algorithm"} /></div>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-900/10 text-left text-xs uppercase tracking-wider text-slate-500">
              {COLS.map((c) => (
                <th key={c.key} className={`py-2 pr-3 font-medium ${c.num ? "text-right" : ""}`} aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                  <button type="button" className="inline-flex items-center gap-1 uppercase hover:text-fg"
                    onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? (s.dir === 1 ? -1 : 1) : c.num ? -1 : 1 }))}>
                    {c.label}<span aria-hidden className="text-[9px]">{sort.key === c.key ? (sort.dir === 1 ? "▲" : "▼") : ""}</span>
                  </button>
                </th>
              ))}
              <th className="py-2 pr-3 text-right font-medium">Duty</th>
            </tr>
          </thead>
          <tbody className="num">
            {shown.map((r) => (
              <tr key={r.vehicle} className={`border-b border-slate-900/5 ${hl.has(r.vehicle) ? "bg-ai/10" : ""}`}>
                <td className="py-1.5 pr-3 font-sans text-fg">
                  {r.vehicle} <span className="text-xs text-slate-500">{r.type}</span>
                  {hl.has(r.vehicle) && <span className="ml-1.5 text-[10px] font-medium uppercase text-ai">changed</span>}
                </td>
                <td className="py-1.5 pr-3 text-right">{r.stops}</td>
                <td className="py-1.5 pr-3 text-right">{r.km.toFixed(1)}</td>
                <td className="py-1.5 pr-3 text-right">{r.hours.toFixed(1)}</td>
                <td className="py-1.5 pr-3 text-right">{r.loadPct.toFixed(0)}</td>
                <td className={`py-1.5 pr-3 text-right ${r.breaches ? "text-risk" : "text-ok"}`}>{r.breaches}</td>
                <td className={`py-1.5 pr-3 text-right font-sans text-xs ${r.overDuty ? "text-risk" : "text-slate-500"}`}>{r.overDuty ? "over" : "ok"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          {rows.length} vehicles · {served}{orderCount ? ` of ${orderCount}` : ""} orders served · {totalBreaches} late stops
          {plan.unserved.length ? <span className="text-risk"> · {plan.unserved.length} unserved</span> : null}
        </span>
        {maxRows && rows.length > maxRows && (
          <button type="button" className="text-ai hover:underline" onClick={() => setAll((a) => !a)}>{all ? "Show fewer" : `Show all ${rows.length}`}</button>
        )}
      </div>
    </div>
  );
}
