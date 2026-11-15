"use client";
import { useMemo } from "react";
import Map, { NavigationControl, useControl } from "react-map-gl/maplibre";
import { MapboxOverlay, type MapboxOverlayProps } from "@deck.gl/mapbox";
import { TripsLayer } from "@deck.gl/geo-layers";
import { PathLayer, ScatterplotLayer } from "@deck.gl/layers";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Order, Plan, Point } from "@/lib/types";
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
}

export default function RouteMap({ orders, hub, baseline, ai, show, time, riskFrom, height = 520 }: RouteMapProps) {
  const theme = useTheme();
  const c = PALETTE[theme];
  const baseTrips = useMemo(() => (baseline && hub ? planToTrips(baseline, orders, hub) : []), [baseline, orders, hub]);
  const aiTrips = useMemo(() => (ai && hub ? planToTrips(ai, orders, hub) : []), [ai, orders, hub]);
  const dots = useMemo(() => orderDots(riskFrom, orders), [riskFrom, orders]);

  const layers = [];
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
    <div className="relative overflow-hidden rounded-2xl border border-slate-900/10" style={{ height }}>
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
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-white/70 px-2.5 py-1.5 text-[11px] text-slate-700 backdrop-blur">
        Straight-line legs for display; km use haversine × detour (assumed). Simulated data.
      </div>
    </div>
  );
}
