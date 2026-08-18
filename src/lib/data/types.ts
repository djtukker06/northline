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

export type FacilityStatus =
  | "operational"
  | "near-capacity"
  | "over-capacity"
  | "reduced";

export type AlertSeverity = "critical" | "warning" | "info" | "resolved";

export type AlertCategory =
  | "capacity"
  | "delay"
  | "maintenance"
  | "route"
  | "customs"
  | "temperature"
  | "compliance";

export type Region = "benelux" | "dach" | "france" | "iberia" | "italy" | "cee" | "nordics" | "uk";

export type VehicleClass =
  | "tractor"
  | "rigid"
  | "reefer"
  | "van"
  | "tanker"
  | "electric";

export interface Facility {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  region: Region;
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

export interface Driver {
  id: string;
  name: string;
  initials: string;
  base: string;
  licence: string;
  onTimeRate: number;
  deliveries: number;
  rating: number;
  /** Minutes of driving left under Regulation 561/2006 before a mandatory break. */
  drivingMinutesLeft: number;
  shiftEnds: string;
  yearsOfService: number;
  status: "driving" | "rest" | "loading" | "off-duty";
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  vehicleClass: VehicleClass;
  status: VehicleStatus;
  driverId: string | null;
  locationLabel: string;
  geo: string;
  region: Region;
  utilisation: number;
  fuelPer100km: number;
  odometer: number;
  payloadCapacity: number;
  currentLoad: number;
  nextServiceKm: number;
  nextServiceDate: string;
  healthScore: number;
  telemetrySpeed: number;
  homeBase: string;
  yearRegistered: number;
}

export interface RouteStop {
  facilityId: string;
  plannedArrival: string;
  actualArrival: string | null;
  dwellMinutes: number;
  status: "completed" | "active" | "planned" | "skipped";
}

export interface RouteDef {
  id: string;
  name: string;
  corridor: string;
  originId: string;
  destinationId: string;
  viaIds: string[];
  distanceKm: number;
  plannedMinutes: number;
  actualMinutes: number;
  stops: RouteStop[];
  vehicleIds: string[];
  shipmentCount: number;
  efficiency: number;
  status: "on-schedule" | "at-risk" | "delayed";
  delayMinutes: number;
  costPerKm: number;
  tollsEur: number;
  co2PerTonneKm: number;
}

export interface ShipmentEvent {
  at: string;
  label: string;
  detail?: string;
  facilityId?: string;
  state: "completed" | "active" | "planned" | "exception";
}

export interface Shipment {
  id: string;
  originId: string;
  destinationId: string;
  routeId: string;
  carrier: string;
  vehicleId: string | null;
  driverId: string | null;
  status: ShipmentStatus;
  priority: Priority;
  departedAt: string;
  eta: string;
  plannedEta: string;
  deliveredAt: string | null;
  weightTonnes: number;
  pallets: number;
  cargo: string;
  temperatureControlled: boolean;
  customer: string;
  reference: string;
  progress: number;
  delayMinutes: number;
  valueEur: number;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  detail: string;
  entityType: "shipment" | "vehicle" | "facility" | "route" | "driver";
  entityId: string;
  entityLabel: string;
  raisedAt: string;
  resolvedAt: string | null;
  owner: string;
  facilityId?: string;
  impact: string;
}

export interface OpsEvent {
  id: string;
  at: string;
  kind:
    | "departure"
    | "arrival"
    | "border"
    | "capacity"
    | "delay"
    | "delivery"
    | "maintenance"
    | "assignment"
    | "temperature";
  message: string;
  entityId: string;
  entityLabel: string;
  tone: "neutral" | "positive" | "warning" | "critical";
  href?: string;
}

export interface SeriesPoint {
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
