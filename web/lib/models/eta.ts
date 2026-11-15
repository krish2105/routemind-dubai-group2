/**
 * ETA / delay model inference in the browser. Owner: Atharva.
 * The trees come from notebook/routemind_models.ipynb (LightGBM, trained on the Kaggle Amazon Delivery Dataset,
 * Indian cities: it shows the method, not Dubai ground truth). Pure TypeScript, no Python at runtime.
 * Call loadEta() once (fetches /data/eta_model.json); until it resolves predictEta() uses a flagged rule-of-thumb stub.
 */
export type Traffic = "Low" | "Medium" | "High" | "Jam";
export type ZoneType = "Metropolitian" | "Urban" | "Semi-Urban" | "Other";

export interface EtaInput {
  distanceKm: number;
  hour: number;
  rain: boolean;
  sandstorm: boolean;
  vehicle: "van" | "bike";
  /** default: from the hour (rush hours busier). ASSUMED mapping, see trafficFromHour */
  traffic?: Traffic;
  /** default "Metropolitian" (the dataset's spelling) */
  zone?: ZoneType;
  /** promised delivery slot in minutes, used for delayRiskPct (default 120 = DubaiDash window, assumed) */
  promiseMin?: number;
}
export interface EtaPrediction {
  minutes: number;
  /** chance (0 to 100) that the delivery takes longer than promiseMin, from the model's test residual spread */
  delayRiskPct: number;
  stub: boolean;
  /** step-by-step change from a calm reference (11:00, low traffic, sunny, motorbike, metropolitan); sums to minutes */
  contributions: { feature: string; minutes: number }[];
}

interface Tree { f: number[]; t: number[]; l: number[]; r: number[]; v: number[]; d: number[] }
export interface EtaModel {
  features: string[];
  traffic: Record<string, number>;
  categories: Record<string, string[]>;
  defaults: Record<string, number>;
  residual_sd: number;
  trees: Tree[];
  dataset_note: string;
}

const DEFAULT_PROMISE_MIN = 120;

/** Sum of all trees for one feature vector (LightGBM rule: left if x <= threshold; NaN follows the default side). */
export function evalTrees(m: EtaModel, x: number[]): number {
  let s = 0;
  for (const tr of m.trees) {
    let k = 0;
    while (tr.f[k] >= 0) {
      const v = x[tr.f[k]];
      const left = Number.isNaN(v) ? tr.d[k] === 1 : v <= tr.t[k];
      k = left ? tr.l[k] : tr.r[k];
    }
    s += tr.v[k];
  }
  return s;
}

/** ASSUMED: Dubai rush hours map to heavier traffic classes of the training data. */
export function trafficFromHour(hour: number): Traffic {
  if (hour >= 17 && hour < 20) return "Jam";
  if ((hour >= 7 && hour < 10) || (hour >= 13 && hour < 15)) return "High";
  if (hour >= 10 && hour < 17) return "Medium";
  return "Low";
}

function toVector(m: EtaModel, i: EtaInput): number[] {
  const cat = (name: string, value: string) => Math.max(0, m.categories[name].indexOf(value));
  const byName: Record<string, number> = {
    distance_km: i.distanceKm,
    hour: i.hour,
    weekday: m.defaults.weekday,
    traffic: m.traffic[i.traffic ?? trafficFromHour(i.hour)],
    weather: cat("Weather", i.sandstorm ? "Sandstorms" : i.rain ? "Stormy" : "Sunny"),
    vehicle: cat("Vehicle", i.vehicle === "van" ? "van" : "motorcycle"),
    area: cat("Area", i.zone ?? "Metropolitian"),
    category: m.defaults.category,
    Agent_Age: m.defaults.Agent_Age,
    Agent_Rating: m.defaults.Agent_Rating,
  };
  return m.features.map((f) => byName[f]);
}

/** Standard normal CDF (Abramowitz-Stegun 7.1.26, error < 1.5e-7). */
function normCdf(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

let model: EtaModel | null = null;
let loading: Promise<EtaModel> | null = null;

/** Fetch the exported model once (browser). Tests pass the JSON straight to setEtaModel(). */
export function loadEta(url = "/data/eta_model.json"): Promise<EtaModel> {
  loading ??= fetch(url).then((r) => {
    if (!r.ok) throw new Error(`ETA model ${r.status}`);
    return r.json() as Promise<EtaModel>;
  }).then((m) => (model = m));
  return loading;
}
export function setEtaModel(m: EtaModel | null): void { model = m; }
export function etaModelLoaded(): boolean { return model !== null; }

export function predictEta(i: EtaInput): EtaPrediction {
  const promise = i.promiseMin ?? DEFAULT_PROMISE_MIN;
  if (!model) return stubEta(i, promise);
  const m = model;
  const minutes = evalTrees(m, toVector(m, i));
  // sequential attribution: start from a calm reference, switch one input at a time to the real value
  const steps: [string, Partial<EtaInput>][] = [
    ["traffic", { traffic: i.traffic ?? trafficFromHour(i.hour) }],
    ["time of day", { hour: i.hour }],
    ["weather", { rain: i.rain, sandstorm: i.sandstorm }],
    ["vehicle", { vehicle: i.vehicle }],
    ["zone type", { zone: i.zone }],
  ];
  let cur: EtaInput = { distanceKm: i.distanceKm, hour: 11, rain: false, sandstorm: false, vehicle: "bike", traffic: "Low", zone: "Metropolitian" };
  let prev = evalTrees(m, toVector(m, cur));
  const contributions = [{ feature: "distance + base", minutes: prev }];
  for (const [feature, change] of steps) {
    cur = { ...cur, ...change };
    const now = evalTrees(m, toVector(m, cur));
    contributions.push({ feature, minutes: now - prev });
    prev = now;
  }
  return { minutes, delayRiskPct: 100 * (1 - normCdf((promise - minutes) / m.residual_sd)), stub: false, contributions };
}

/** Transparent rule of thumb used only until the model JSON has loaded. Flagged stub: true. */
function stubEta(i: EtaInput, promise: number): EtaPrediction {
  const free = (i.distanceKm / 40) * 60;
  const traffic = i.hour >= 17 && i.hour <= 19 ? 0.45 : i.hour <= 9 ? 0.3 : 0.05;
  const weather = (i.rain ? 0.4 : 0) + (i.sandstorm ? 0.35 : 0);
  const minutes = free * (1 + traffic + weather);
  return {
    minutes,
    delayRiskPct: minutes > promise ? 100 : 0,
    stub: true,
    contributions: [
      { feature: "distance", minutes: free },
      { feature: "traffic (hour)", minutes: free * traffic },
      { feature: "weather", minutes: free * weather },
    ],
  };
}
