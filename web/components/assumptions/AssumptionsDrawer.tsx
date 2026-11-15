"use client";
import { useEffect, useState } from "react";
import { assumptions } from "@/lib/assumptions";
import { assumptionRows, type AssumptionRow } from "./rows";

/**
 * Assumptions drawer (owner: Advait). Lists every assumed input with its value, reason and range,
 * read from public/data/assumptions.json (provenance block). Simple modal until a shared Drawer exists.
 * Usage: <AssumptionsButton /> anywhere (for example in PageHeader).
 */
export function AssumptionsButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 rounded-full border border-base/40 bg-white px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-base hover:bg-base/10 ${className}`}
      >
        Assumptions
      </button>
      {open && <AssumptionsDrawer onClose={() => setOpen(false)} />}
    </>
  );
}

export function AssumptionsDrawer({ onClose }: { onClose: () => void }) {
  const rows = assumptionRows(assumptions);
  const groups = rows.reduce<Record<string, AssumptionRow[]>>((acc, r) => {
    (acc[r.group] ??= []).push(r);
    return acc;
  }, {});
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20" onClick={onClose} role="presentation">
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Assumptions"
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-xl overflow-y-auto border-l border-slate-900/10 bg-white p-6 text-fg shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Assumptions</h2>
            <p className="mt-1 text-sm text-slate-600">
              DubaiDash Express is fictional. Every value below is an <b className="text-base">assumed</b> model input, not a statistic; every result is simulated. Version {assumptions.version}, seed {assumptions.seed}.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-900/10 px-3 py-1 text-sm text-slate-700 hover:bg-paper">Close</button>
        </div>
        {Object.entries(groups).map(([g, rs]) => (
          <section key={g} className="mt-6">
            <h3 className="text-xs uppercase tracking-widest text-slate-500">{g}</h3>
            <table className="mt-2 w-full text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr><th className="py-1 pr-2 font-medium">Input</th><th className="py-1 pr-2 font-medium">Value</th><th className="py-1 font-medium">Reason · range</th></tr>
              </thead>
              <tbody>
                {rs.map((r) => (
                  <tr key={r.key} className="border-t border-slate-900/5 align-top">
                    <td className="py-1.5 pr-2 text-slate-700">{r.label}</td>
                    <td className="num py-1.5 pr-2 whitespace-nowrap">{r.value}</td>
                    <td className="py-1.5 text-slate-600">
                      <span className="mr-1 rounded bg-base/10 px-1 text-[11px] text-base">{r.status}</span>
                      {r.reason}. <span className="text-slate-500">Range {r.range}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
        <p className="mt-6 text-xs text-slate-500">Source file: data_seed/assumptions.json · table: docs/06_assumptions_table.md</p>
      </aside>
    </div>
  );
}
