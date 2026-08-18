import { makeRng, randInt, pick, NOW } from "../utils";
import { FACILITIES } from "./network";
import { VEHICLES } from "./fleet";
import { ROUTES } from "./routes";
import { SHIPMENTS } from "./shipments";
import type { OpsEvent } from "./types";

function at(minutes: number) {
  return new Date(NOW.getTime() - minutes * 60_000).toISOString();
}

/** The events the brief calls out, kept at the head of the feed. */
const PINNED: OpsEvent[] = [
  {
    id: "EVT-9001",
    at: at(3),
    kind: "capacity",
    message: "Berlin Hub reached 91% of pallet capacity",
    entityId: "FAC-BER-01",
    entityLabel: "Berlin Hub",
    tone: "critical",
    href: "/warehouses",
  },
  {
    id: "EVT-9002",
    at: at(9),
    kind: "delay",
    message: "Route R-218 delayed by 18 minutes",
    entityId: "R-218",
    entityLabel: "R-218",
    tone: "warning",
    href: "/routes",
  },
  {
    id: "EVT-9003",
    at: at(16),
    kind: "border",
    message: "Vehicle NL-TRK-204 entered Germany at Bad Bentheim",
    entityId: "NL-TRK-204",
    entityLabel: "NL-TRK-204",
    tone: "neutral",
    href: "/fleet",
  },
  {
    id: "EVT-9004",
    at: at(24),
    kind: "delivery",
    message: "Shipment NL-48173 delivered to Hamburg North",
    entityId: "NL-48173",
    entityLabel: "NL-48173",
    tone: "positive",
    href: "/shipments",
  },
  {
    id: "EVT-9005",
    at: at(31),
    kind: "departure",
    message: "Shipment NL-48291 departed Rotterdam DC",
    entityId: "NL-48291",
    entityLabel: "NL-48291",
    tone: "neutral",
    href: "/shipments/NL-48291",
  },
];

const KINDS: Array<{
  kind: OpsEvent["kind"];
  tone: OpsEvent["tone"];
  build: (c: Ctx) => string;
  entity: (c: Ctx) => [string, string];
  href: (c: Ctx) => string;
}> = [
  {
    kind: "departure",
    tone: "neutral",
    build: (c) => `Shipment ${c.shipId} departed ${c.originName}`,
    entity: (c) => [c.shipId, c.shipId],
    href: (c) => `/shipments/${c.shipId}`,
  },
  {
    kind: "arrival",
    tone: "neutral",
    build: (c) => `Vehicle ${c.vehId} arrived at ${c.facilityName}`,
    entity: (c) => [c.vehId, c.vehId],
    href: () => "/fleet",
  },
  {
    kind: "delivery",
    tone: "positive",
    build: (c) => `Shipment ${c.shipId} delivered to ${c.facilityName}`,
    entity: (c) => [c.shipId, c.shipId],
    href: (c) => `/shipments/${c.shipId}`,
  },
  {
    kind: "border",
    tone: "neutral",
    build: (c) => `Vehicle ${c.vehId} cleared the ${c.corridor} corridor checkpoint`,
    entity: (c) => [c.vehId, c.vehId],
    href: () => "/fleet",
  },
  {
    kind: "capacity",
    tone: "warning",
    build: (c) => `${c.facilityName} reached ${c.capacity}% of pallet capacity`,
    entity: (c) => [c.facilityId, c.facilityName],
    href: () => "/warehouses",
  },
  {
    kind: "delay",
    tone: "warning",
    build: (c) => `Route ${c.routeId} delayed by ${c.n} minutes`,
    entity: (c) => [c.routeId, c.routeId],
    href: () => "/routes",
  },
  {
    kind: "assignment",
    tone: "neutral",
    build: (c) => `${c.driverName} assigned to ${c.vehId} on ${c.routeId}`,
    entity: (c) => [c.vehId, c.vehId],
    href: () => "/planning",
  },
  {
    kind: "maintenance",
    tone: "warning",
    build: (c) => `Vehicle ${c.vehId} booked into ${c.facilityName} workshop`,
    entity: (c) => [c.vehId, c.vehId],
    href: () => "/fleet",
  },
  {
    kind: "temperature",
    tone: "critical",
    build: (c) => `Reefer set point breached on ${c.shipId}`,
    entity: (c) => [c.shipId, c.shipId],
    href: (c) => `/shipments/${c.shipId}`,
  },
];

interface Ctx {
  shipId: string;
  vehId: string;
  facilityId: string;
  facilityName: string;
  originName: string;
  routeId: string;
  corridor: string;
  capacity: number;
  n: number;
  driverName: string;
}

const DRIVER_POOL = [
  "Marieke de Vries",
  "Piotr Kowalczyk",
  "Lars Andersen",
  "Giulia Ferrari",
  "Andrés Ibáñez",
  "Femke Bakker",
];

function generated(): OpsEvent[] {
  const out: OpsEvent[] = [];
  let elapsed = 36;
  for (let i = 0; i < 90; i++) {
    const rng = makeRng(66_000 + i * 271);
    const tpl = KINDS[i % KINDS.length];
    const fac = FACILITIES[(i * 5) % FACILITIES.length];
    const origin = FACILITIES[(i * 7) % FACILITIES.length];
    const ship = SHIPMENTS[(i * 61) % SHIPMENTS.length];
    const veh = VEHICLES[(i * 17) % VEHICLES.length];
    const rt = ROUTES[(i * 3) % ROUTES.length];
    const ctx: Ctx = {
      shipId: ship.id,
      vehId: veh.id,
      facilityId: fac.id,
      facilityName: fac.name,
      originName: origin.name,
      routeId: rt.id,
      corridor: rt.corridor,
      capacity: fac.capacityPct,
      n: randInt(rng, 6, 74),
      driverName: pick(rng, DRIVER_POOL),
    };
    elapsed += randInt(rng, 2, 11);
    const [entityId, entityLabel] = tpl.entity(ctx);
    out.push({
      id: `EVT-${8_900 - i}`,
      at: at(elapsed),
      kind: tpl.kind,
      message: tpl.build(ctx),
      entityId,
      entityLabel,
      tone: tpl.tone,
      href: tpl.href(ctx),
    });
  }
  return out;
}

export const OPS_EVENTS: OpsEvent[] = [...PINNED, ...generated()].sort(
  (a, b) => +new Date(b.at) - +new Date(a.at),
);
