/**
 * SHARED CONTRACTS. Do not change a type without telling the whole team
 * (post in the group chat + open a PR labelled "contract-change", Krishna approves).
 * Time unit everywhere: minutes after midnight (08:00 = 480).
 * Distances: km. Money: AED. All data is simulated / assumed.
 */
export type VehicleType = "van" | "bike";
export type AlgorithmId = "baseline" | "cw2opt" | "ga";
export type EventType = "szr_jam" | "al_khail_jam" | "sandstorm" | "rain" | "urgent_surge";
export type Corridor = "szr" | "alkhail";

export interface Point {
  id: string;
  name: string;
  lat: number;
  lng: number;
  corridors: Corridor[];
}

export interface Order {
  id: string;
  pointId: string;
  lat: number;
  lng: number;
  /** parcel units (1 to 3) counted against vehicle capacity */
  weight: number;
  windowStart: number;
  windowEnd: number;
  urgent: boolean;
  cod: boolean;
  serviceMin: number;
}

export interface Vehicle {
  id: string;
  type: VehicleType;
  capacity: number;
  costPerKm: number;
  co2PerKm: number;
  shiftStart: number;
  /** hard end of duty = shiftStart + maxDutyMin */
  shiftEnd: number;
}

export interface TrafficEvent {
  id: string;
  type: EventType;
  startMin: number;
  endMin: number;
}

export interface Assumptions {
  version: string;
  seed: number;
  vehicles: Record<VehicleType, {
    count: number; capacity_parcels: number; cost_per_km_aed: number;
    co2_kg_per_km: number; co2_kg_per_km_electric: number;
    service_time_min: number; max_duty_min: number;
  }>;
  orders: { count: number; time_window_min: number; cod_share: number; urgent_surge_orders: number; urgent_share: number; urgent_window_min: number };
  costs: { driver_cost_per_hour_aed: number; failed_delivery_cost_aed: number; sla_penalty_aed: number };
  failed_attempt: { base_probability: number; sandstorm_extra: number };
  traffic_hour_multipliers: Record<string, number>;
  event_multipliers: { sheikh_zayed_road_jam: number; al_khail_road_jam: number; sandstorm_citywide: number; heavy_rain_citywide: number };
  fallback: { haversine_detour_factor: number; average_speed_kmh_free_flow: number; bike_traffic_sensitivity: number };
  business_case: { pilot_investment_aed: number; monthly_running_cost_aed: number; parcels_per_day: number; working_days_per_year: number; adoption_haircut: number };
}

export interface Scenario {
  seed: number;
  orderCount: number;
  vans: number;
  bikes: number;
  events: TrafficEvent[];
  /** 0 to 1 share of fleet that is electric (CO2 factor only) */
  evShare: number;
}

/** Everything an algorithm needs. Node 0 = hub, node i+1 = orders[i]. */
export interface Problem {
  hub: Point;
  orders: Order[];
  vehicles: Vehicle[];
  /** road km between nodes (haversine x detour, or OSRM later) */
  km: number[][];
  assumptions: Assumptions;
  events: TrafficEvent[];
  evShare: number;
}

export interface Stop {
  /** index into problem.orders */
  orderIdx: number;
  orderId: string;
  arrival: number;
  departure: number;
  late: boolean;
  /** minutes of slack before the window closes (negative = late) */
  slack: number;
}

export interface Route {
  vehicleId: string;
  stops: Stop[];
  km: number;
  driveMin: number;
  startMin: number;
  endMin: number;
  load: number;
  overDuty: boolean;
}

export interface Plan {
  algorithm: AlgorithmId;
  routes: Route[];
  /** order ids no vehicle could serve */
  unserved: string[];
  meta: { runMs: number; stub?: boolean; note?: string; generations?: number; convergence?: number[] };
}

export interface Kpis {
  orders: number;
  served: number;
  vehiclesUsed: number;
  km: number;
  driveHours: number;
  totalCostAed: number;
  costPerParcelAed: number;
  capacityUtilPct: number;
  shiftUtilPct: number;
  onTimePct: number;
  slaBreaches: number;
  /** deliveries late or with under 15 minutes of slack */
  atRisk: number;
  expectedFailedAttempts: number;
  co2Kg: number;
  /** coefficient of variation of route durations (lower = fairer) */
  workloadCv: number;
}
