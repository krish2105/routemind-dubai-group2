/**
 * TODO (owner: Atharva): ETA/delay model inference in the browser.
 * Load /data/eta_model.json (exported by notebook/routemind_models.ipynb), predict minutes,
 * return top feature contributions. Until the model exists, a transparent rule-of-thumb stub is used and flagged.
 */
export interface EtaInput {
  distanceKm: number;
  hour: number;
  rain: boolean;
  sandstorm: boolean;
  vehicle: "van" | "bike";
}
export interface EtaPrediction {
  minutes: number;
  stub: boolean;
  contributions: { feature: string; minutes: number }[];
}

export function predictEta(i: EtaInput): EtaPrediction {
  const free = (i.distanceKm / 40) * 60;
  const traffic = i.hour >= 17 && i.hour <= 19 ? 0.45 : i.hour <= 9 ? 0.3 : 0.05;
  const weather = (i.rain ? 0.4 : 0) + (i.sandstorm ? 0.35 : 0);
  const minutes = free * (1 + traffic + weather);
  return {
    minutes,
    stub: true,
    contributions: [
      { feature: "distance", minutes: free },
      { feature: "traffic (hour)", minutes: free * traffic },
      { feature: "weather", minutes: free * weather },
    ],
  };
}
