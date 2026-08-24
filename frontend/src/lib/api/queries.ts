import "server-only";

import { apiGet, apiList, type Paginated } from "./client";
import type {
  Alert,
  Driver,
  Facility,
  NetworkKpis,
  NetworkRoute,
  OpsEvent,
  Shipment,
  Vehicle,
  HistoryPoint,
} from "./types";

/**
 * One named function per thing a page needs, rather than pages assembling URLs
 * themselves. When an endpoint changes, exactly one function changes.
 *
 * The `revalidate` value on each call is a product decision, not a technical one:
 * how stale may this number be before it misleads someone? Alerts and the live
 * feed are short; the reference list of warehouses is long, because a distribution
 * centre does not appear twice a minute.
 */

export function getKpis() {
  return apiGet<NetworkKpis>("kpis", undefined, { revalidate: 30, tags: ["kpis"] });
}

export function getHistory(days: 7 | 30 | 90 = 30) {
  return apiGet<HistoryPoint[]>("history", { days }, { revalidate: 300, tags: ["history"] });
}

export interface ShipmentQuery {
  status?: string;
  priority?: string;
  carrier?: string;
  origin?: string;
  destination?: string;
  route?: string;
  vehicle?: string;
  search?: string;
  sort?: string;
  page?: number;
  per_page?: number;
}

export function getShipments(query: ShipmentQuery = {}): Promise<Paginated<Shipment>> {
  return apiList<Shipment>("shipments", { ...query }, { revalidate: 15, tags: ["shipments"] });
}

export function getShipment(ref: string) {
  return apiGet<Shipment>(`shipments/${encodeURIComponent(ref)}`, undefined, {
    revalidate: 15,
    tags: ["shipments", `shipment:${ref}`],
  });
}

export function getVehicles(query: Record<string, string | number | undefined> = {}) {
  return apiList<Vehicle>("vehicles", query, { revalidate: 20, tags: ["vehicles"] });
}

export function getVehicle(ref: string) {
  return apiGet<Vehicle>(`vehicles/${encodeURIComponent(ref)}`, undefined, { revalidate: 20 });
}

export function getDrivers(query: Record<string, string | number | boolean | undefined> = {}) {
  return apiGet<Driver[]>("drivers", query, { revalidate: 60, tags: ["drivers"] });
}

export function getRoutes(query: Record<string, string | undefined> = {}) {
  return apiGet<NetworkRoute[]>("routes", query, { revalidate: 30, tags: ["routes"] });
}

export function getRoute(ref: string) {
  return apiGet<NetworkRoute>(`routes/${encodeURIComponent(ref)}`, undefined, { revalidate: 30 });
}

export function getFacilities(query: Record<string, string | undefined> = {}) {
  // Reference data: eighteen sites that change a few times a year.
  return apiGet<Facility[]>("facilities", query, { revalidate: 600, tags: ["facilities"] });
}

export function getAlerts(query: Record<string, string | number | boolean | undefined> = {}) {
  return apiGet<Alert[]>("alerts", query, { revalidate: 15, tags: ["alerts"] });
}

export function getOpsEvents(query: Record<string, string | number | boolean | undefined> = {}) {
  return apiGet<OpsEvent[]>("events", query, { revalidate: 10, tags: ["events"] });
}

/**
 * Pages that need several things fetch them together.
 *
 * Promise.all runs the requests concurrently. Awaiting them one after another
 * would make the page as slow as the sum of the requests instead of the slowest
 * one: this is a request waterfall, and it is the most common performance mistake
 * when a frontend first starts talking to a real API.
 */
export async function getDashboardData() {
  const [kpis, facilities, routes, alerts, events, vehicles] = await Promise.all([
    getKpis(),
    getFacilities(),
    getRoutes(),
    getAlerts({ state: "all", limit: 12 }),
    getOpsEvents({ limit: 40 }),
    getVehicles({ status: "in-transit", per_page: 100 }),
  ]);

  return { kpis, facilities, routes, alerts, events, vehicles: vehicles.data };
}
