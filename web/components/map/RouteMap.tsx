"use client";
import { useMemo } from "react";
import Map, { NavigationControl, useControl } from "react-map-gl/maplibre";
import { MapboxOverlay, type MapboxOverlayProps } from "@deck.gl/mapbox";
import { TripsLayer } from "@deck.gl/geo-layers";
import { PathLayer, ScatterplotLayer } from "@deck.gl/layers";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Order, Plan, Point, TrafficEvent } from "@/lib/types";
import { EVENT_LABELS } from "@/lib/engine/events";
import { CORRIDOR_PATHS, activeEvents } from "./corridors";
import { useTheme } from "@/components/theme/ThemeToggle";
import { hhmm, orderDots, planToTrips, type OrderDot, type Risk } from "./trips";

/**
 * Dubai route map (owner: Krishna). MapLibre + free CARTO basemap (Positron in light mode, Dark Matter in dark mode)
 * with deck.gl layers: animated TripsLayer per vehicle, faint full route paths, orders coloured by SLA risk, the hub.
 * Rendered client-side only (see dynamic import in the pages).
 */
// MapLibre's own worker, served as a static file (the bundler's auto-detected URL breaks in production builds).
// Copied from node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs; re-copy if maplibre-gl is upgraded.
setWorkerUrl("/vendor/maplibre-gl-worker-6.18.0.mjs");

/** MapLibre's own controls are white; restyle them for dark mode (scoped to this map). */
const DARK_CONTROLS_CSS = `
html[data-theme="dark"] .rm-map .maplibregl-ctrl-group { background: #14283f; box-shadow: 0 0 0 1px rgba(148,163,184,.2); }
html[data-theme="dark"] .rm-map .maplibregl-ctrl-group button + button { border-top-color: rgba(148,163,184,.2); }
html[data-theme="dark"] .rm-map .maplibregl-ctrl-icon { filter: invert(1) hue-rotate(180deg) brightness(1.4); }
html[data-theme="dark"] .rm-map .maplibregl-ctrl-attrib { background: rgba(11,27,46,.85); color: #cbd5e1; }
html[data-theme="dark"] .rm-map .maplibregl-ctrl-attrib a { color: #e2e8f0; }
html[data-theme="dark"] .rm-map .maplibregl-ctrl-attrib-button { filter: invert(1); }
html[data-theme="dark"] .rm-map .deck-tooltip { background: #14283f !important; color: #e6eef7 !important; }
.rm-map .deck-tooltip { border-radius: 8px; font-size: 12px; line-height: 1.4; }
`;

const STYLE = {
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

type RGB = [number, number, number];
const PALETTE: Record<"light" | "dark", { ai: RGB; base: RGB; risk: Record<Risk, RGB>; hub: RGB }> = {
  light: { ai: [8, 145, 178], base: [217, 119, 6], hub: [11, 27, 46], risk: { late: [220, 38, 38], tight: [217, 119, 6], ok: [5, 150, 105], unserved: [100, 116, 139] } },
  dark: { ai: [34, 211, 238], base: [245, 158, 11], hub: [230, 238, 247], risk: { late: [248, 113, 113], tight: [245, 158, 11], ok: [52, 211, 153], unserved: [148, 163, 184] } },
};

function DeckOverlay(props: MapboxOverlayProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

export interface RouteMapProps {
  orders: Order[];
  hub: Point | null;
  baseline?: Plan;
  ai?: Plan;
  show: "baseline" | "ai" | "both";
  time: number;
  /** plan whose risk colours the order dots */
  riskFrom?: Plan;
  height?: number;
  /** scenario events: road jams are drawn on their corridor while active; citywide events show a banner */
  events?: TrafficEvent[];
}

export default function RouteMap({ orders, hub, baseline, ai, show, time, riskFrom, height = 520, events = [] }: RouteMapProps) {
  const theme = useTheme();
  const c = PALETTE[theme];
  const baseTrips = useMemo(() => (baseline && hub ? planToTrips(baseline, orders, hub) : []), [baseline, orders, hub]);
  const aiTrips = useMemo(() => (ai && hub ? planToTrips(ai, orders, hub) : []), [ai, orders, hub]);
  const dots = useMemo(() => orderDots(riskFrom, orders), [riskFrom, orders]);

  const layers = [];
  const live = activeEvents(events, time);
  // road jams: a soft red glow under the routes plus a dashed core line, only while the jam is on
  const jams = live.flatMap((e) => (CORRIDOR_PATHS[e.type] ? [{ id: e.id, path: CORRIDOR_PATHS[e.type]! }] : []));
  if (jams.length) {
    const pulse = 0.55 + 0.45 * Math.sin(time / 2.5);
    layers.push(
      new PathLayer({ id: "jam-glow", data: jams, getPath: (d) => d.path, getColor: [...c.risk.late, Math.round(70 * pulse)],
        widthUnits: "pixels", getWidth: 18, capRounded: true, jointRounded: true, updateTriggers: { getColor: [time, theme] } }),
      new PathLayer({ id: "jam-core", data: jams, getPath: (d) => d.path, getColor: [...c.risk.late, 230],
        widthUnits: "pixels", getWidth: 4, capRounded: true, jointRounded: true, updateTriggers: { getColor: [theme] } }),
    );
  }
  const add = (id: "base" | "ai", trips: typeof aiTrips, color: RGB) => {
    layers.push(
      new PathLayer({ id: `${id}-paths`, data: trips, getPath: (d) => d.path, getColor: [...color, 55], widthUnits: "pixels", getWidth: 1.5 }),
      new TripsLayer({
        id: `${id}-trips`, data: trips, getPath: (d) => d.path, getTimestamps: (d) => d.timestamps,
        getColor: color, widthUnits: "pixels", getWidth: 4, capRounded: true, jointRounded: true,
        trailLength: 45, currentTime: time, fadeTrail: true,
      }),
    );
  };
  if (show !== "ai") add("base", baseTrips, c.base);
  if (show !== "baseline") add("ai", aiTrips, c.ai);
  layers.push(
    new ScatterplotLayer<OrderDot>({
      id: "orders", data: dots, pickable: true, getPosition: (d) => d.position,
      getFillColor: (d) => [...c.risk[d.risk], d.arrival !== undefined && d.arrival <= time ? 90 : 220],
      getLineColor: theme === "dark" ? [7, 17, 31] : [255, 255, 255], stroked: true, lineWidthUnits: "pixels", getLineWidth: 1,
      radiusUnits: "pixels", getRadius: (d) => (d.urgent ? 5 : 3.5),
      updateTriggers: { getFillColor: [time, theme], getLineColor: [theme] },
    }),
  );
  if (hub) {
    layers.push(new ScatterplotLayer({
      id: "hub", data: [hub], getPosition: (d: Point) => [d.lng, d.lat], getFillColor: c.hub,
      getLineColor: c.ai, stroked: true, lineWidthUnits: "pixels", getLineWidth: 3, radiusUnits: "pixels", getRadius: 9,
    }));
  }

  return (
    <div className="rm-map relative overflow-hidden rounded-2xl border border-slate-900/10" style={{ height }}>
      <style>{DARK_CONTROLS_CSS}</style>
      <Map
        initialViewState={{ longitude: 55.24, latitude: 25.16, zoom: 10.2, pitch: 40, bearing: -12 }}
        mapStyle={STYLE[theme]}
        style={{ width: "100%", height: "100%" }}
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="top-left" visualizePitch />
        <DeckOverlay
          layers={layers}
          getTooltip={({ object }) => {
            const d = object as OrderDot | undefined;
            if (!d || !("risk" in d)) return null;
            const when = d.arrival !== undefined ? `arrives ${hhmm(d.arrival)} (${d.vehicleId})` : "not served";
            return { text: `${d.id}${d.urgent ? " · urgent" : ""}\nwindow ${hhmm(d.windowStart)}-${hhmm(d.windowEnd)}\n${when}\nrisk: ${d.risk}` };
          }}
        />
      </Map>
      {live.length > 0 && (
        <div className="pointer-events-none absolute right-3 top-3 space-y-1.5" aria-live="polite">
          {live.map((e) => (
            <div key={e.id} className="flex items-center gap-2 rounded-lg border border-risk/40 bg-paper/90 px-3 py-1.5 text-xs font-medium text-risk shadow-sm backdrop-blur">
              <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-risk opacity-60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-risk" /></span>
              {EVENT_LABELS[e.type]} · {hhmm(e.startMin)}-{hhmm(e.endMin)}
            </div>
          ))}
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-white/70 px-2.5 py-1.5 text-[11px] text-slate-700 backdrop-blur">
        Straight-line legs for display; km use haversine × detour (assumed). Simulated data.
      </div>
    </div>
  );
}
