import { makeRng, randInt, clamp, NOW } from "../utils";
import { facility } from "./network";
import { VEHICLES } from "./fleet";
import type { RouteDef, RouteStop } from "./types";

interface RouteSeed {
  id: string;
  corridor: string;
  from: string;
  to: string;
  via?: string[];
  distanceKm: number;
  plannedMinutes: number;
  delayMinutes: number;
}

/**
 * Line-haul corridors. Distances follow real road distances between the hubs,
 * which keeps derived figures (cost per km, CO2, arrival times) plausible.
 */
const SEEDS: RouteSeed[] = [
  { id: "R-218", corridor: "Rhine-Elbe", from: "RTM-01", to: "BER-01", via: ["DUI-01"], distanceKm: 682, plannedMinutes: 486, delayMinutes: 18 },
  { id: "R-104", corridor: "Rhine-Elbe", from: "RTM-01", to: "HAM-01", distanceKm: 489, plannedMinutes: 352, delayMinutes: 0 },
  { id: "R-112", corridor: "North Sea", from: "ANR-01", to: "RTM-01", distanceKm: 103, plannedMinutes: 96, delayMinutes: 0 },
  { id: "R-128", corridor: "Atlantic", from: "PAR-02", to: "MAD-01", via: ["LYO-01"], distanceKm: 1274, plannedMinutes: 852, delayMinutes: 0 },
  { id: "R-134", corridor: "Alpine", from: "MUC-01", to: "MIL-01", distanceKm: 494, plannedMinutes: 392, delayMinutes: 34 },
  { id: "R-141", corridor: "Baltic", from: "BER-01", to: "WAW-01", via: ["PRG-01"], distanceKm: 776, plannedMinutes: 561, delayMinutes: 0 },
  { id: "R-156", corridor: "Atlantic", from: "MAD-01", to: "LIS-01", distanceKm: 626, plannedMinutes: 401, delayMinutes: 0 },
  { id: "R-162", corridor: "Mediterranean", from: "BCN-01", to: "MIL-01", distanceKm: 1012, plannedMinutes: 704, delayMinutes: 12 },
  { id: "R-173", corridor: "North Sea", from: "LON-01", to: "ANR-01", distanceKm: 372, plannedMinutes: 342, delayMinutes: 47 },
  { id: "R-181", corridor: "Rhine-Elbe", from: "DUI-01", to: "MUC-01", distanceKm: 596, plannedMinutes: 424, delayMinutes: 0 },
  { id: "R-194", corridor: "Nordic", from: "HAM-01", to: "CPH-01", distanceKm: 336, plannedMinutes: 268, delayMinutes: 0 },
  { id: "R-203", corridor: "Alpine", from: "ZRH-01", to: "MIL-01", distanceKm: 289, plannedMinutes: 236, delayMinutes: 0 },
  { id: "R-211", corridor: "Danube", from: "VIE-01", to: "WAW-01", distanceKm: 674, plannedMinutes: 478, delayMinutes: 0 },
  { id: "R-224", corridor: "Atlantic", from: "PAR-02", to: "LYO-01", distanceKm: 465, plannedMinutes: 318, delayMinutes: 0 },
  { id: "R-236", corridor: "Iberian", from: "MAD-01", to: "BCN-01", distanceKm: 621, plannedMinutes: 398, delayMinutes: 0 },
  { id: "R-247", corridor: "Rhine-Elbe", from: "RTM-01", to: "PAR-02", distanceKm: 517, plannedMinutes: 382, delayMinutes: 23 },
  { id: "R-255", corridor: "Danube", from: "PRG-01", to: "VIE-01", distanceKm: 334, plannedMinutes: 254, delayMinutes: 0 },
  { id: "R-261", corridor: "Baltic", from: "WAW-01", to: "CPH-01", distanceKm: 1043, plannedMinutes: 742, delayMinutes: 61 },
  { id: "R-274", corridor: "Alpine", from: "ZRH-01", to: "MUC-01", distanceKm: 312, plannedMinutes: 238, delayMinutes: 0 },
  { id: "R-283", corridor: "Mediterranean", from: "MIL-01", to: "LYO-01", distanceKm: 486, plannedMinutes: 366, delayMinutes: 0 },
  { id: "R-291", corridor: "North Sea", from: "ANR-01", to: "BER-01", via: ["DUI-01"], distanceKm: 726, plannedMinutes: 512, delayMinutes: 0 },
  { id: "R-306", corridor: "Iberian", from: "LIS-01", to: "BCN-01", distanceKm: 1234, plannedMinutes: 798, delayMinutes: 28 },
  { id: "R-314", corridor: "Nordic", from: "CPH-01", to: "BER-01", distanceKm: 442, plannedMinutes: 336, delayMinutes: 0 },
  { id: "R-322", corridor: "North Sea", from: "LON-01", to: "PAR-02", distanceKm: 458, plannedMinutes: 396, delayMinutes: 0 },
];

function buildStops(seed: RouteSeed, rng: () => number): RouteStop[] {
  const ids = [seed.from, ...(seed.via ?? []), seed.to].map((c) => `FAC-${c}`);
  const legMinutes = seed.plannedMinutes / (ids.length - 1);
  // The run started far enough back that the first legs are already complete.
  const startedAt = NOW.getTime() - seed.plannedMinutes * 0.58 * 60_000;
  let activeAssigned = false;

  return ids.map((facilityId, i) => {
    const plannedTs = startedAt + i * legMinutes * 60_000;
    const elapsedShare = (NOW.getTime() - plannedTs) / 60_000;
    let status: RouteStop["status"];
    if (elapsedShare > 0) {
      status = "completed";
    } else if (!activeAssigned) {
      status = "active";
      activeAssigned = true;
    } else {
      status = "planned";
    }
    const drift = i === 0 ? 0 : Math.round((seed.delayMinutes * i) / (ids.length - 1));
    return {
      facilityId,
      plannedArrival: new Date(plannedTs).toISOString(),
      actualArrival:
        status === "completed" ? new Date(plannedTs + drift * 60_000).toISOString() : null,
      dwellMinutes: i === 0 || i === ids.length - 1 ? randInt(rng, 25, 65) : randInt(rng, 35, 95),
      status,
    };
  });
}

export const ROUTES: RouteDef[] = SEEDS.map((seed, i) => {
  const rng = makeRng(7700 + i * 53);
  const stops = buildStops(seed, rng);
  const vehicleIds = VEHICLES.filter((v) => v.status === "in-transit")
    .filter((_, vi) => vi % SEEDS.length === i)
    .slice(0, randInt(rng, 3, 8))
    .map((v) => v.id);

  const status: RouteDef["status"] =
    seed.delayMinutes >= 30 ? "delayed" : seed.delayMinutes > 0 ? "at-risk" : "on-schedule";

  // Efficiency compares realised transit against plan, then discounts for empty running
  // and for time the vehicle spends standing at intermediate stops.
  const scheduleScore = 100 - (seed.delayMinutes / seed.plannedMinutes) * 100 * 3.4;
  const emptyRunning = 1.5 + rng() * 7.5;
  const standing = (seed.via?.length ?? 0) * 1.8;
  const efficiency = clamp(scheduleScore - emptyRunning - standing, 61, 98.4);

  return {
    id: seed.id,
    name: `${facility(`FAC-${seed.from}`).city} to ${facility(`FAC-${seed.to}`).city}`,
    corridor: seed.corridor,
    originId: `FAC-${seed.from}`,
    destinationId: `FAC-${seed.to}`,
    viaIds: (seed.via ?? []).map((c) => `FAC-${c}`),
    distanceKm: seed.distanceKm,
    plannedMinutes: seed.plannedMinutes,
    actualMinutes: seed.plannedMinutes + seed.delayMinutes,
    stops,
    vehicleIds,
    shipmentCount: 0,
    efficiency: Number(efficiency.toFixed(1)),
    status,
    delayMinutes: seed.delayMinutes,
    costPerKm: Number((1.06 + rng() * 0.42).toFixed(2)),
    tollsEur: Math.round(seed.distanceKm * (0.11 + rng() * 0.09)),
    co2PerTonneKm: Number((52 + rng() * 22).toFixed(1)),
  };
});

export const ROUTE_BY_ID = new Map(ROUTES.map((r) => [r.id, r]));

export function route(id: string): RouteDef {
  const r = ROUTE_BY_ID.get(id);
  if (!r) throw new Error(`Unknown route ${id}`);
  return r;
}

export const CORRIDORS = Array.from(new Set(ROUTES.map((r) => r.corridor))).sort();
