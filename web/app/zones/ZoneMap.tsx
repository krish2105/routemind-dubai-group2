"use client";
import Map, { NavigationControl, useControl } from "react-map-gl/maplibre";
import { MapboxOverlay, type MapboxOverlayProps } from "@deck.gl/mapbox";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Order, Point } from "@/lib/types";
import type { ZoneResult } from "@/lib/engine/kmeans";

/**
 * Zone map for /zones (owner: Yash). Light CARTO Positron basemap (always light, as agreed for the demo),
 * orders coloured by k-means zone, zone centroids (hollow rings) and micro-hub / locker candidates (navy pins).
 * Loaded client-side only (dynamic import in page.tsx).
 */
setWorkerUrl("/vendor/maplibre-gl-worker-6.18.0.mjs");
const POSITRON = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

type RGB = [number, number, number];
/** Categorical zone colours, readable on a light basemap. */
export const ZONE_COLORS: RGB[] = [
  [8, 145, 178], [217, 119, 6], [124, 58, 237], [5, 150, 105], [219, 39, 119],
  [37, 99, 235], [202, 138, 4], [13, 148, 136], [234, 88, 12], [71, 85, 105],
];
export const zoneHex = (z: number) => {
  const [r, g, b] = ZONE_COLORS[z % ZONE_COLORS.length];
  return `rgb(${r}, ${g}, ${b})`;
};

function DeckOverlay(props: MapboxOverlayProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

interface Dot { id: string; position: [number, number]; zone: number; urgent: boolean }

export default function ZoneMap({ orders, zones, hub, height = 480, lockers }: { orders: Order[]; zones: ZoneResult; hub: Point; height?: number; lockers: boolean }) {
  const dots: Dot[] = orders.map((o, i) => ({ id: o.id, position: [o.lng, o.lat], zone: zones.assignment[i] ?? 0, urgent: o.urgent }));
  const layers = [
    new ScatterplotLayer<Dot>({
      id: "orders", data: dots, pickable: true, getPosition: (d) => d.position,
      getFillColor: (d) => [...ZONE_COLORS[d.zone % ZONE_COLORS.length], 210],
      getLineColor: [255, 255, 255], stroked: true, lineWidthUnits: "pixels", getLineWidth: 1,
      radiusUnits: "pixels", getRadius: (d) => (d.urgent ? 5 : 3.5),
      updateTriggers: { getFillColor: [zones.k, zones.assignment.join(",")] },
    }),
    new ScatterplotLayer({
      id: "centroids", data: zones.centroids.map((c, z) => ({ ...c, z })), getPosition: (d: { lat: number; lng: number }) => [d.lng, d.lat],
      filled: false, stroked: true, getLineColor: (d: { z: number }) => ZONE_COLORS[d.z % ZONE_COLORS.length], lineWidthUnits: "pixels", getLineWidth: 2.5,
      radiusUnits: "pixels", getRadius: 14, updateTriggers: { getLineColor: [zones.k] },
    }),
    new ScatterplotLayer({
      id: "hubs", data: zones.hubs, pickable: true, getPosition: (d: ZoneResult["hubs"][number]) => [d.lng, d.lat],
      getFillColor: lockers ? [11, 27, 46] : [255, 255, 255], getLineColor: [11, 27, 46], stroked: true, lineWidthUnits: "pixels", getLineWidth: 2,
      radiusUnits: "pixels", getRadius: 7, updateTriggers: { getFillColor: [lockers] },
    }),
    new TextLayer({
      id: "zone-labels", data: zones.centroids.map((c, z) => ({ ...c, z })), getPosition: (d: { lat: number; lng: number }) => [d.lng, d.lat],
      getText: (d: { z: number }) => `Z${d.z + 1}`, getSize: 12, getColor: [11, 27, 46], getPixelOffset: [0, -24], fontWeight: 700,
      background: true, getBackgroundColor: [255, 255, 255, 220], backgroundPadding: [4, 2],
    }),
    new ScatterplotLayer({
      id: "depot", data: [hub], getPosition: (d: Point) => [d.lng, d.lat], getFillColor: [11, 27, 46],
      getLineColor: [8, 145, 178], stroked: true, lineWidthUnits: "pixels", getLineWidth: 3, radiusUnits: "pixels", getRadius: 9,
    }),
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-900/10" style={{ height }}>
      <Map initialViewState={{ longitude: 55.25, latitude: 25.15, zoom: 9.9 }} mapStyle={POSITRON} style={{ width: "100%", height: "100%" }} attributionControl={{ compact: true }}>
        <NavigationControl position="top-left" showCompass={false} />
        <DeckOverlay
          layers={layers}
          getTooltip={({ object }) => {
            if (!object) return null;
            if ("orderIdx" in object) return { text: `Micro-hub / locker candidate for zone Z${object.zone + 1}\n(medoid order ${object.orderId})` };
            const d = object as Dot;
            return { text: `${d.id}${d.urgent ? " · urgent" : ""}\nzone Z${d.zone + 1}` };
          }}
        />
      </Map>
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-3 rounded-lg bg-white/80 px-2.5 py-1.5 text-[11px] text-slate-700 backdrop-blur">
        <span>● order (bigger = urgent)</span><span>◯ zone centroid</span><span>◉ micro-hub / locker candidate</span><span>⬤ DubaiDash hub</span>
      </div>
    </div>
  );
}
