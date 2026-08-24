import { GEO_POINTS } from "./geo";
import { FACILITIES, ROUTES, VEHICLES, SHIPMENTS } from "./data";
import type { RouteDef } from "./data/types";
import { arcControl, quadPoint } from "./utils";

export type Pt = [number, number];

/** Screen position of a facility, resolved through the shared projection. */
export function facilityPoint(geo: string): Pt {
  const p = GEO_POINTS[geo];
  if (!p) throw new Error(`No projected point for ${geo}`);
  return p;
}

export interface RouteGeometry {
  id: string;
  /** Full SVG path through origin, any intermediate hubs, and destination. */
  d: string;
  segments: Array<{ a: Pt; c: Pt; b: Pt; length: number }>;
  totalLength: number;
  nodes: Pt[];
}

const geoCache = new Map<string, RouteGeometry>();

function chord(a: Pt, b: Pt) {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

/**
 * Routes are drawn as chained quadratic arcs. Bowing each leg keeps parallel
 * corridors legible where several routes share the same pair of hubs.
 */
export function routeGeometry(route: RouteDef): RouteGeometry {
  const cached = geoCache.get(route.id);
  if (cached) return cached;

  const ids = [route.originId, ...route.viaIds, route.destinationId];
  const nodes = ids.map((id) => {
    const f = FACILITIES.find((x) => x.id === id)!;
    return facilityPoint(f.geo);
  });

  const segments: RouteGeometry["segments"] = [];
  let d = `M${nodes[0][0]},${nodes[0][1]}`;
  // Alternate the bow direction per leg so multi-leg runs read as one continuous line.
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i];
    const b = nodes[i + 1];
    const c = arcControl(a, b, 0.13);
    d += `Q${c[0].toFixed(1)},${c[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`;
    segments.push({ a, c, b, length: chord(a, c) + chord(c, b) });
  }

  const totalLength = segments.reduce((s, x) => s + x.length, 0);
  const geometry = { id: route.id, d, segments, totalLength, nodes };
  geoCache.set(route.id, geometry);
  return geometry;
}

/** Position and heading at a fractional distance along a route. */
export function pointAlong(geometry: RouteGeometry, t: number): { p: Pt; angle: number } {
  const clamped = Math.min(1, Math.max(0, t));
  let target = clamped * geometry.totalLength;

  for (const seg of geometry.segments) {
    if (target <= seg.length || seg === geometry.segments[geometry.segments.length - 1]) {
      const local = Math.min(1, target / seg.length);
      const p = quadPoint(seg.a, seg.c, seg.b, local);
      const ahead = quadPoint(seg.a, seg.c, seg.b, Math.min(1, local + 0.02));
      return {
        p,
        angle: (Math.atan2(ahead[1] - p[1], ahead[0] - p[0]) * 180) / Math.PI,
      };
    }
    target -= seg.length;
  }
  const last = geometry.segments[geometry.segments.length - 1];
  return { p: last.b, angle: 0 };
}

export interface MapVehicle {
  id: string;
  routeId: string;
  t: number;
  status: "on-schedule" | "at-risk" | "delayed";
  driverName: string;
  label: string;
  loadTonnes: number;
  speed: number;
  region: string;
  vehicleClass: string;
}

/**
 * One marker per vehicle actually on the road. Their position comes from the
 * progress of the shipments they carry, so the map agrees with the shipment list.
 */
export function buildMapVehicles(): MapVehicle[] {
  const out: MapVehicle[] = [];
  const seen = new Set<string>();

  for (const route of ROUTES) {
    route.vehicleIds.forEach((vehicleId, i) => {
      if (seen.has(vehicleId)) return;
      seen.add(vehicleId);
      const vehicle = VEHICLES.find((v) => v.id === vehicleId);
      if (!vehicle) return;

      const carried = SHIPMENTS.find(
        (s) => s.vehicleId === vehicleId && s.status !== "delivered",
      );
      const t = carried ? carried.progress / 100 : ((i + 1) / (route.vehicleIds.length + 1));

      out.push({
        id: vehicleId,
        routeId: route.id,
        t: Math.min(0.97, Math.max(0.03, t)),
        status: route.status,
        driverName: vehicle.driverId ?? "Unassigned",
        label: vehicle.model,
        loadTonnes: vehicle.currentLoad,
        speed: vehicle.telemetrySpeed,
        region: vehicle.region,
        vehicleClass: vehicle.vehicleClass,
      });
    });
  }
  return out;
}

export const MAP_VEHICLES = buildMapVehicles();

/** Hub marker sizing reflects throughput so the busiest sites read first. */
export const MAP_HUBS = FACILITIES.map((f) => ({
  id: f.id,
  name: f.name,
  city: f.city,
  code: f.code,
  point: facilityPoint(f.geo),
  capacityPct: f.capacityPct,
  throughput: f.throughputToday,
  status: f.status,
  region: f.region,
  kind: f.kind,
  radius: 4 + (f.throughputToday / 170) * 4.5,
}));
