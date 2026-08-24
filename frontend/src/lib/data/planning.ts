import { makeRng, randInt, clamp } from "../utils";
import { FACILITIES } from "./network";
import { DRIVERS, VEHICLES } from "./fleet";
import { ROUTES } from "./routes";
import { ACTIVE_SHIPMENTS } from "./shipments";

export type BlockKind = "load" | "haul" | "unload" | "rest" | "maintenance";

export type ConflictKind =
  | "overlap"
  | "driving-hours"
  | "dock-clash"
  | "window-missed"
  | "unassigned";

export interface Conflict {
  kind: ConflictKind;
  label: string;
  detail: string;
}

export interface PlanBlock {
  id: string;
  vehicleId: string;
  driverId: string | null;
  kind: BlockKind;
  /** Minutes from 00:00 on the planning date. */
  start: number;
  end: number;
  label: string;
  facilityId?: string;
  routeId?: string;
  shipmentIds: string[];
  dock?: number;
  conflict?: Conflict;
}

export interface PlanRow {
  vehicleId: string;
  driverId: string | null;
  driverName: string;
  vehicleModel: string;
  homeBase: string;
  region: string;
  vehicleClass: string;
  blocks: PlanBlock[];
  committedMinutes: number;
  conflicts: Conflict[];
}

export const DAY_START = 4 * 60;
export const DAY_END = 23 * 60;

const KIND_LABEL: Record<BlockKind, string> = {
  load: "Loading",
  haul: "Line-haul",
  unload: "Unloading",
  rest: "Rest",
  maintenance: "Workshop",
};

/**
 * A day of work for one vehicle: load at origin, run the corridor, unload, then a
 * statutory rest. Conflicts are seeded deliberately at known indices so the board
 * always has something worth resolving rather than relying on chance.
 */
function buildRow(vehicleIndex: number, dayOffset: number): PlanRow {
  const vehicle = VEHICLES[vehicleIndex];
  const rng = makeRng(77_000 + vehicleIndex * 271 + dayOffset * 13);
  const driver = vehicle.driverId ? DRIVERS.find((d) => d.id === vehicle.driverId) ?? null : null;
  const blocks: PlanBlock[] = [];
  const conflicts: Conflict[] = [];

  if (vehicle.status === "maintenance") {
    const start = DAY_START + randInt(rng, 60, 200);
    blocks.push({
      id: `${vehicle.id}-mx`,
      vehicleId: vehicle.id,
      driverId: null,
      kind: "maintenance",
      start,
      end: start + randInt(rng, 240, 420),
      label: `${KIND_LABEL.maintenance} · ${vehicle.homeBase}`,
      facilityId: FACILITIES.find((f) => f.name === vehicle.homeBase)?.id,
      shipmentIds: [],
    });
    return finalise(vehicle, driver, blocks, conflicts);
  }

  const route = ROUTES[(vehicleIndex * 5) % ROUTES.length];
  const origin = FACILITIES.find((f) => f.id === route.originId)!;
  const destination = FACILITIES.find((f) => f.id === route.destinationId)!;
  const loads = ACTIVE_SHIPMENTS.filter((s) => s.routeId === route.id)
    .slice(vehicleIndex % 4, (vehicleIndex % 4) + randInt(rng, 1, 4))
    .map((s) => s.id);

  let cursor = DAY_START + randInt(rng, 15, 180);

  const loadDuration = randInt(rng, 45, 95);
  blocks.push({
    id: `${vehicle.id}-load`,
    vehicleId: vehicle.id,
    driverId: driver?.id ?? null,
    kind: "load",
    start: cursor,
    end: cursor + loadDuration,
    label: `${KIND_LABEL.load} · ${origin.city}`,
    facilityId: origin.id,
    dock: randInt(rng, 1, Math.min(24, origin.dockDoors)),
    shipmentIds: loads,
  });
  cursor += loadDuration;

  // Line-haul is capped so a single run still fits inside the visible day.
  const haulDuration = clamp(Math.round(route.plannedMinutes * (0.55 + rng() * 0.3)), 120, 560);
  blocks.push({
    id: `${vehicle.id}-haul`,
    vehicleId: vehicle.id,
    driverId: driver?.id ?? null,
    kind: "haul",
    start: cursor,
    end: cursor + haulDuration,
    label: `${route.id} · ${origin.city} to ${destination.city}`,
    routeId: route.id,
    shipmentIds: loads,
  });
  cursor += haulDuration;

  const unloadDuration = randInt(rng, 40, 80);
  blocks.push({
    id: `${vehicle.id}-unload`,
    vehicleId: vehicle.id,
    driverId: driver?.id ?? null,
    kind: "unload",
    start: cursor,
    end: cursor + unloadDuration,
    label: `${KIND_LABEL.unload} · ${destination.city}`,
    facilityId: destination.id,
    dock: randInt(rng, 1, Math.min(24, destination.dockDoors)),
    shipmentIds: loads,
  });
  cursor += unloadDuration;

  if (cursor + 60 < DAY_END) {
    blocks.push({
      id: `${vehicle.id}-rest`,
      vehicleId: vehicle.id,
      driverId: driver?.id ?? null,
      kind: "rest",
      start: cursor,
      end: Math.min(DAY_END, cursor + randInt(rng, 165, 300)),
      label: "Daily rest",
      shipmentIds: [],
    });
  }

  // Seeded exceptions. Each one is a situation a dispatcher genuinely has to fix.
  const slot = (vehicleIndex + dayOffset * 3) % 17;

  if (slot === 2) {
    const haul = blocks.find((b) => b.kind === "haul")!;
    const extra = ROUTES[(vehicleIndex * 3) % ROUTES.length];
    const overlapStart = haul.end - randInt(rng, 60, 130);
    blocks.push({
      id: `${vehicle.id}-haul2`,
      vehicleId: vehicle.id,
      driverId: driver?.id ?? null,
      kind: "haul",
      start: overlapStart,
      end: overlapStart + randInt(rng, 150, 240),
      label: `${extra.id} · second allocation`,
      routeId: extra.id,
      shipmentIds: [],
      conflict: {
        kind: "overlap",
        label: "Double booked",
        detail: `${vehicle.id} is allocated to ${extra.id} while still running ${route.id}.`,
      },
    });
    conflicts.push(blocks[blocks.length - 1].conflict!);
  }

  if (slot === 5 && driver) {
    const haul = blocks.find((b) => b.kind === "haul")!;
    haul.conflict = {
      kind: "driving-hours",
      label: "Exceeds driving time",
      detail: `${driver.name} has ${Math.round(driver.drivingMinutesLeft)} min left under Regulation 561/2006 against a ${haul.end - haul.start} min run.`,
    };
    conflicts.push(haul.conflict);
  }

  if (slot === 8) {
    const load = blocks.find((b) => b.kind === "load")!;
    load.conflict = {
      kind: "dock-clash",
      label: "Dock double booked",
      detail: `Dock ${load.dock} at ${origin.name} is committed to another vehicle in this window.`,
    };
    conflicts.push(load.conflict);
  }

  if (slot === 12) {
    const unload = blocks.find((b) => b.kind === "unload")!;
    unload.conflict = {
      kind: "window-missed",
      label: "Outside delivery window",
      detail: `${destination.name} closes goods-in before this slot ends.`,
    };
    conflicts.push(unload.conflict);
  }

  if (slot === 15 && !driver) {
    const haul = blocks.find((b) => b.kind === "haul")!;
    haul.conflict = {
      kind: "unassigned",
      label: "No driver assigned",
      detail: `${route.id} has no driver allocated for this departure.`,
    };
    conflicts.push(haul.conflict);
  }

  return finalise(vehicle, driver, blocks, conflicts);
}

function finalise(
  vehicle: (typeof VEHICLES)[number],
  driver: (typeof DRIVERS)[number] | null,
  blocks: PlanBlock[],
  conflicts: Conflict[],
): PlanRow {
  return {
    vehicleId: vehicle.id,
    driverId: driver?.id ?? null,
    driverName: driver?.name ?? "Unassigned",
    vehicleModel: vehicle.model,
    homeBase: vehicle.homeBase,
    region: vehicle.region,
    vehicleClass: vehicle.vehicleClass,
    blocks: blocks.sort((a, b) => a.start - b.start),
    committedMinutes: blocks
      .filter((b) => b.kind !== "rest")
      .reduce((s, b) => s + (b.end - b.start), 0),
    conflicts,
  };
}

/** The board covers the vehicles a duty planner can realistically work in one sitting. */
export function planForDay(dayOffset: number): PlanRow[] {
  return Array.from({ length: 34 }, (_, i) => buildRow(i, dayOffset));
}

export const BLOCK_LABEL = KIND_LABEL;
