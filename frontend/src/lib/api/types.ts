/**
 * The API contract, expressed as TypeScript types.
 *
 * These mirror the PHP API Resources in api/app/Http/Resources/. When a backend
 * developer changes a resource, this file is what has to change with it, and
 * `tsc --noEmit` in CI is what catches the mismatch before a user does.
 *
 * In a larger team this file would be generated from an OpenAPI specification the
 * backend publishes, rather than hand-written. Worth asking for: "is there an
 * OpenAPI spec?" is a good early question when you join a project.
 */

export type ShipmentStatus =
  | "in-transit"
  | "loading"
  | "at-risk"
  | "delayed"
  | "customs"
  | "delivered"
  | "scheduled";

export type Priority = "low" | "normal" | "high" | "critical";
export type VehicleStatus = "in-transit" | "loading" | "idle" | "maintenance";
export type FacilityStatus = "operational" | "near-capacity" | "over-capacity" | "reduced";
export type AlertSeverity = "critical" | "warning" | "info" | "resolved";
export type RouteStatus = "on-schedule" | "at-risk" | "delayed";

export interface FacilitySummary {
  id: string;
  name: string;
  city: string;
}

export interface Facility extends FacilitySummary {
  code: string;
  country: string;
  countryCode: string;
  region: string;
  geo: string;
  kind: "distribution" | "hub" | "cross-dock" | "port" | "rail";
  capacityPct: number;
  inbound: number;
  outbound: number;
  staffOnShift: number;
  staffPlanned: number;
  throughputToday: number;
  throughputTarget: number;
  dockDoors: number;
  docksInUse: number;
  floorArea: number;
  palletPositions: number;
  palletsStored: number;
  status: FacilityStatus;
  shiftPattern: string;
  manager: string;
  dwellMinutes: number;
}

export interface ShipmentEvent {
  at: string;
  label: string;
  detail: string | null;
  state: "completed" | "active" | "planned" | "exception";
  facilityId?: string;
}

export interface Shipment {
  id: string;
  status: ShipmentStatus;
  priority: Priority;
  carrier: string;
  customer: string;
  reference: string;
  cargo: string;
  origin: FacilitySummary;
  destination: FacilitySummary;
  routeId?: string;
  vehicleId?: string | null;
  driverName?: string | null;
  weightTonnes: number;
  pallets: number;
  valueEur: number;
  temperatureControlled: boolean;
  progress: number;
  delayMinutes: number;
  departedAt: string;
  eta: string;
  plannedEta: string;
  deliveredAt: string | null;
  timeline?: ShipmentEvent[];
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  vehicleClass: "tractor" | "rigid" | "reefer" | "van" | "tanker" | "electric";
  status: VehicleStatus;
  driverId?: string | null;
  driverName?: string | null;
  locationLabel: string;
  geo: string;
  region: string;
  utilisation: number;
  fuelPer100km: number;
  odometer: number;
  payloadCapacity: number;
  currentLoad: number;
  nextServiceKm: number;
  nextServiceDate: string;
  healthScore: number;
  telemetrySpeed: number;
  homeBase?: string;
  yearRegistered: number;
}

export interface Driver {
  id: string;
  name: string;
  initials: string;
  base: string;
  licence: string;
  onTimeRate: number;
  deliveries: number;
  rating: number;
  drivingMinutesLeft: number;
  shiftEnds: string;
  yearsOfService: number;
  status: "driving" | "rest" | "loading" | "off-duty";
}

export interface RouteStop {
  facilityId: string;
  plannedArrival: string;
  actualArrival: string | null;
  dwellMinutes: number;
  status: "completed" | "active" | "planned" | "skipped";
}

export interface NetworkRoute {
  id: string;
  name: string;
  corridor: string;
  originId: string;
  destinationId: string;
  distanceKm: number;
  plannedMinutes: number;
  actualMinutes: number;
  efficiency: number;
  status: RouteStatus;
  delayMinutes: number;
  costPerKm: number;
  tollsEur: number;
  co2PerTonneKm: number;
  shipmentCount?: number;
  vehicleIds?: string[];
  stops?: RouteStop[];
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: string;
  title: string;
  detail: string;
  entityType: "shipment" | "vehicle" | "facility" | "route" | "driver";
  entityId: string;
  entityLabel: string;
  facilityId?: string | null;
  raisedAt: string;
  resolvedAt: string | null;
  owner: string;
  impact: string;
}

export interface OpsEvent {
  id: string;
  at: string;
  kind: string;
  message: string;
  entityId: string;
  entityLabel: string;
  tone: "neutral" | "positive" | "warning" | "critical";
  href: string | null;
}

export interface HistoryPoint {
  date: string;
  label: string;
  onTime: number;
  delayed: number;
  completed: number;
  volume: number;
  costPerShipment: number;
  utilisation: number;
  throughput: number;
}

export interface NetworkKpis {
  activeShipments: number;
  onTimeRate: number;
  fleetUtilisation: number;
  freightTonnes: number;
  fleetSize: number;
  fleetByStatus: Record<VehicleStatus, number>;
  shipmentsByStatus: Record<string, number>;
  history: Array<{
    date: string;
    onTime: number;
    delayed: number;
    completed: number;
    volume: number;
    utilisation: number;
    costPerShipment: number;
  }>;
  computedAt: string;
}
