"use client";

/**
 * Animated architecture diagram for /integration (Karan's area, built by Yash).
 * Inputs (left) -> RouteMind engine (centre) -> people and apps (right). Dashed lines move in the direction data flows.
 * `outage` = AI engine down: the engine greys out and the fallback path (last accepted plan / baseline, templates) takes over.
 * Colours come from the theme tokens, so it works in light (default) and dark mode.
 */
type Box = { id: string; x: number; y: number; w: number; h: number; title: string; sub: string };

const INPUTS: Box[] = [
  { id: "tms", x: 20, y: 30, w: 220, h: 74, title: "TMS / WMS", sub: "orders, parcels, time windows" },
  { id: "ecom", x: 20, y: 140, w: 220, h: 74, title: "E-commerce platforms", sub: "new and urgent orders" },
  { id: "traffic", x: 20, y: 250, w: 220, h: 74, title: "Traffic + weather APIs", sub: "jams, sandstorm, rain" },
  { id: "makani", x: 20, y: 360, w: 220, h: 74, title: "Makani address data", sub: "10-digit entrance code (R13)" },
];
const OUTPUTS: Box[] = [
  { id: "dispatch", x: 760, y: 30, w: 220, h: 84, title: "Dispatcher console", sub: "accept · edit · reject (human override)" },
  { id: "driver", x: 760, y: 175, w: 220, h: 74, title: "Driver app", sub: "stops, ETAs, re-routes" },
  { id: "notify", x: 760, y: 310, w: 220, h: 74, title: "Customer notifications", sub: "GenAI copilot, English + Arabic" },
];
const ENGINE = { x: 370, y: 70, w: 260, h: 300 };
const FALLBACK = { x: 370, y: 420, w: 260, h: 78 };
const STEPS = ["Predict · ETA model", "Cluster · k-means zones", "Optimise · savings + 2-opt, GA", "Re-route · live events", "Inform · copilot messages"];

const mid = (b: Box, side: "l" | "r") => ({ x: side === "r" ? b.x + b.w : b.x, y: b.y + b.h / 2 });

function curve(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = (b.x - a.x) / 2;
  return `M${a.x},${a.y} C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`;
}

export function ArchitectureDiagram({ outage }: { outage: boolean }) {
  const engineIn = (i: number) => ({ x: ENGINE.x, y: ENGINE.y + 60 + i * 55 });
  const engineOut = (i: number) => ({ x: ENGINE.x + ENGINE.w, y: ENGINE.y + 70 + i * 90 });
  const fbIn = { x: FALLBACK.x, y: FALLBACK.y + FALLBACK.h / 2 };
  const fbOut = { x: FALLBACK.x + FALLBACK.w, y: FALLBACK.y + FALLBACK.h / 2 };
  const live = "var(--color-ai)";
  const fb = "var(--color-base)";

  return (
    <svg viewBox="0 0 1000 520" className="h-auto w-full" role="img" aria-label="RouteMind integration architecture">
      <style>{`
        .rm-flow { stroke-dasharray: 7 9; animation: rm-flow 1.2s linear infinite; }
        @keyframes rm-flow { to { stroke-dashoffset: -32; } }
        @media (prefers-reduced-motion: reduce) { .rm-flow { animation: none; } }
      `}</style>
      <defs>
        <marker id="rm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
        </marker>
      </defs>

      {/* data lines: inputs -> engine (or fallback during an outage) */}
      {INPUTS.map((b, i) => (
        <path key={b.id} d={curve(mid(b, "r"), outage && (b.id === "tms" || b.id === "ecom") ? fbIn : engineIn(i))} fill="none"
          stroke={outage ? (b.id === "tms" || b.id === "ecom" ? fb : "rgba(100,116,139,0.35)") : live} strokeWidth={2}
          className={outage && !(b.id === "tms" || b.id === "ecom") ? "" : "rm-flow"} style={{ color: outage ? fb : live }} markerEnd="url(#rm-arrow)" />
      ))}
      {/* engine -> outputs */}
      {OUTPUTS.map((b, i) => (
        <path key={b.id} d={curve(engineOut(i), mid(b, "l"))} fill="none" stroke={outage ? "rgba(100,116,139,0.35)" : live} strokeWidth={2}
          className={outage ? "" : "rm-flow"} style={{ color: live }} markerEnd="url(#rm-arrow)" />
      ))}
      {/* fallback -> driver app and notifications during an outage */}
      {outage && OUTPUTS.slice(1).map((b) => (
        <path key={`fb-${b.id}`} d={curve(fbOut, mid(b, "l"))} fill="none" stroke={fb} strokeWidth={2.5} className="rm-flow" style={{ color: fb }} markerEnd="url(#rm-arrow)" />
      ))}
      {/* human override loop: dispatcher <-> driver app */}
      <path d="M870,114 L870,175" stroke="var(--color-ok)" strokeWidth={2} className="rm-flow" fill="none" style={{ color: "var(--color-ok)" }} markerEnd="url(#rm-arrow)" markerStart="url(#rm-arrow)" />
      <text x={880} y={150} fontSize={11} fill="var(--color-ok)">override</text>

      {[...INPUTS, ...OUTPUTS].map((b) => (
        <g key={b.id}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={14} fill="var(--color-paper)" stroke="rgba(100,116,139,0.35)" />
          <text x={b.x + 16} y={b.y + 30} fontSize={16} fontWeight={600} fill="var(--color-fg)">{b.title}</text>
          <text x={b.x + 16} y={b.y + 52} fontSize={12} fill="currentColor" className="text-slate-500">{b.sub}</text>
        </g>
      ))}

      {/* engine */}
      <g opacity={outage ? 0.35 : 1}>
        <rect x={ENGINE.x} y={ENGINE.y} width={ENGINE.w} height={ENGINE.h} rx={18} fill="var(--color-paper)" stroke={live} strokeWidth={2} />
        <text x={ENGINE.x + 20} y={ENGINE.y + 34} fontSize={19} fontWeight={700} fill={live}>RouteMind engine</text>
        {STEPS.map((s, i) => (
          <g key={s}>
            <circle cx={ENGINE.x + 26} cy={ENGINE.y + 72 + i * 46} r={5} fill={live} />
            <text x={ENGINE.x + 42} y={ENGINE.y + 77 + i * 46} fontSize={13} fill="var(--color-fg)">{s}</text>
          </g>
        ))}
      </g>
      {outage && <text x={ENGINE.x + ENGINE.w / 2} y={ENGINE.y + ENGINE.h / 2} textAnchor="middle" fontSize={22} fontWeight={700} fill="var(--color-risk)">AI DOWN</text>}

      {/* fallback */}
      <rect x={FALLBACK.x} y={FALLBACK.y} width={FALLBACK.w} height={FALLBACK.h} rx={14} fill="var(--color-paper)" stroke={fb} strokeWidth={outage ? 2.5 : 1.5} strokeDasharray={outage ? undefined : "5 5"} />
      <text x={FALLBACK.x + 16} y={FALLBACK.y + 28} fontSize={15} fontWeight={600} fill={fb}>Fallback</text>
      <text x={FALLBACK.x + 16} y={FALLBACK.y + 50} fontSize={12} fill="var(--color-fg)">last accepted plan, then baseline plan</text>
      <text x={FALLBACK.x + 16} y={FALLBACK.y + 67} fontSize={12} fill="var(--color-fg)">template messages, cached travel times</text>
    </svg>
  );
}

/** Phone version: the same flow as a stacked list (the SVG text would be too small at 390 px). */
export function ArchitectureList({ outage }: { outage: boolean }) {
  return (
    <ol className="space-y-2 text-sm">
      {INPUTS.map((b) => <li key={b.id} className="rounded-xl border border-slate-900/10 bg-white/70 px-3 py-2"><b className="font-medium text-fg">{b.title}</b><span className="block text-xs text-slate-500">{b.sub}</span></li>)}
      <li className="text-center text-ai" aria-hidden>↓</li>
      <li className={`rounded-xl border-2 px-3 py-2 ${outage ? "border-base/50" : "border-ai/50"}`}>
        <b className={outage ? "text-base" : "text-ai"}>{outage ? "Fallback (AI down)" : "RouteMind engine"}</b>
        <span className="block text-xs text-slate-500">{outage ? "last accepted plan, then baseline; template messages" : STEPS.join(" · ")}</span>
      </li>
      <li className="text-center text-ai" aria-hidden>↓</li>
      {OUTPUTS.map((b) => <li key={b.id} className="rounded-xl border border-slate-900/10 bg-white/70 px-3 py-2"><b className="font-medium text-fg">{b.title}</b><span className="block text-xs text-slate-500">{b.sub}</span></li>)}
    </ol>
  );
}
