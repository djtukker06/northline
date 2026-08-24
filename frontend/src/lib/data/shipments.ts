import { makeRng, pick, randInt, clamp, NOW } from "../utils";
import { CARGO_TYPES, CARRIERS, CUSTOMERS, facility } from "./network";
import { DRIVERS, VEHICLES } from "./fleet";
import { ROUTES } from "./routes";
import type { Priority, Shipment, ShipmentEvent, ShipmentStatus } from "./types";

/**
 * Composition of the 1,284 shipments currently live on the network. The split is
 * fixed rather than random so headline counts stay stable across renders.
 */
const ACTIVE_PLAN: Array<[ShipmentStatus, number]> = [
  ["in-transit", 812],
  ["loading", 143],
  ["at-risk", 96],
  ["delayed", 67],
  ["customs", 58],
  ["scheduled", 108],
];

export const ACTIVE_SHIPMENT_COUNT = ACTIVE_PLAN.reduce((s, [, n]) => s + n, 0);

/** Deliveries closed out today. Feeds the on-time rate. */
const DELIVERED_COUNT = 640;
const ON_TIME_TARGET = 0.948;

const PRIORITY_WEIGHTS: Array<[Priority, number]> = [
  ["low", 0.14],
  ["normal", 0.58],
  ["high", 0.22],
  ["critical", 0.06],
];

function priorityFor(roll: number): Priority {
  let acc = 0;
  for (const [p, w] of PRIORITY_WEIGHTS) {
    acc += w;
    if (roll <= acc) return p;
  }
  return "normal";
}

const IN_TRANSIT_STATES: ShipmentStatus[] = ["in-transit", "at-risk", "delayed", "customs"];

function buildShipment(
  index: number,
  status: ShipmentStatus,
  seq: number,
): Shipment {
  const rng = makeRng(31_000 + index * 131);
  const route = ROUTES[index % ROUTES.length];
  const id = `NL-${48_000 + seq}`;

  // Where the load sits on its route right now.
  const progress =
    status === "scheduled"
      ? 0
      : status === "loading"
        ? clamp(rng() * 6, 0, 6)
        : status === "delivered"
          ? 100
          : status === "customs"
            ? 40 + rng() * 40
            : 8 + rng() * 88;

  const delayMinutes =
    status === "delayed"
      ? randInt(rng, 35, 240)
      : status === "at-risk"
        ? randInt(rng, 8, 34)
        : status === "customs"
          ? randInt(rng, 0, 55)
          : 0;

  const plannedRunMs = route.plannedMinutes * 60_000;
  const departedAt = new Date(NOW.getTime() - plannedRunMs * (progress / 100));
  const plannedEta = new Date(departedAt.getTime() + plannedRunMs);
  const eta = new Date(plannedEta.getTime() + delayMinutes * 60_000);

  const vehicle =
    status === "scheduled"
      ? null
      : VEHICLES[(index * 7) % VEHICLES.length];
  const driver = vehicle ? DRIVERS[(index * 5) % DRIVERS.length] : null;

  const pallets = randInt(rng, 4, 33);
  const cargo = pick(rng, CARGO_TYPES);
  const temperatureControlled =
    cargo === "Refrigerated produce" || cargo === "Pharmaceuticals" || rng() > 0.86;

  return {
    id,
    originId: route.originId,
    destinationId: route.destinationId,
    routeId: route.id,
    carrier: pick(rng, CARRIERS),
    vehicleId: vehicle?.id ?? null,
    driverId: driver?.id ?? null,
    status,
    priority: priorityFor(rng()),
    departedAt: departedAt.toISOString(),
    eta: eta.toISOString(),
    plannedEta: plannedEta.toISOString(),
    deliveredAt: null,
    weightTonnes: Number((pallets * (0.42 + rng() * 0.34)).toFixed(1)),
    pallets,
    cargo,
    temperatureControlled,
    customer: pick(rng, CUSTOMERS),
    reference: `PO-${randInt(rng, 100_000, 999_999)}`,
    progress: Number(progress.toFixed(1)),
    delayMinutes,
    valueEur: randInt(rng, 8_400, 486_000),
  };
}

function buildDelivered(index: number, seq: number, onTime: boolean): Shipment {
  const rng = makeRng(88_000 + index * 197);
  const route = ROUTES[index % ROUTES.length];
  const delayMinutes = onTime ? 0 : randInt(rng, 16, 195);
  const deliveredAt = new Date(NOW.getTime() - randInt(rng, 20, 1_010) * 60_000);
  const plannedEta = new Date(deliveredAt.getTime() - delayMinutes * 60_000);
  const departedAt = new Date(plannedEta.getTime() - route.plannedMinutes * 60_000);
  const pallets = randInt(rng, 4, 33);
  const vehicle = VEHICLES[(index * 11) % VEHICLES.length];

  return {
    id: `NL-${48_000 + seq}`,
    originId: route.originId,
    destinationId: route.destinationId,
    routeId: route.id,
    carrier: pick(rng, CARRIERS),
    vehicleId: vehicle.id,
    driverId: DRIVERS[(index * 3) % DRIVERS.length].id,
    status: "delivered",
    priority: priorityFor(rng()),
    departedAt: departedAt.toISOString(),
    eta: deliveredAt.toISOString(),
    plannedEta: plannedEta.toISOString(),
    deliveredAt: deliveredAt.toISOString(),
    weightTonnes: Number((pallets * (0.42 + rng() * 0.34)).toFixed(1)),
    pallets,
    cargo: pick(rng, CARGO_TYPES),
    temperatureControlled: rng() > 0.84,
    customer: pick(rng, CUSTOMERS),
    reference: `PO-${randInt(rng, 100_000, 999_999)}`,
    progress: 100,
    delayMinutes,
    valueEur: randInt(rng, 8_400, 486_000),
  };
}

function build(): Shipment[] {
  const out: Shipment[] = [];
  let seq = 173;
  let index = 0;

  for (const [status, count] of ACTIVE_PLAN) {
    for (let i = 0; i < count; i++) {
      out.push(buildShipment(index, status, seq));
      seq += randInt(makeRng(seq), 1, 3);
      index += 1;
    }
  }

  const onTimeCount = Math.round(DELIVERED_COUNT * ON_TIME_TARGET);
  for (let i = 0; i < DELIVERED_COUNT; i++) {
    out.push(buildDelivered(index, seq, i < onTimeCount));
    seq += randInt(makeRng(seq), 1, 3);
    index += 1;
  }

  return out;
}

const RAW = build();

/** The shipment the brief follows end to end. Pinned so every screen tells one story. */
const FEATURED_ID = "NL-48291";
const FEATURED_WEIGHT = 18.4;

(function pinFeaturedShipment() {
  const target = RAW.find((s) => s.status === "at-risk") ?? RAW[0];
  const r218 = ROUTES.find((r) => r.id === "R-218")!;
  target.id = FEATURED_ID;
  target.routeId = r218.id;
  target.originId = r218.originId;
  target.destinationId = r218.destinationId;
  target.carrier = "Northline Freight";
  target.vehicleId = "NL-TRK-204";
  target.driverId = DRIVERS[0].id; // Thomas Weber
  target.status = "at-risk";
  target.priority = "high";
  target.weightTonnes = FEATURED_WEIGHT;
  target.pallets = 26;
  target.cargo = "Automotive parts";
  target.customer = "Kestrel Automotive";
  target.temperatureControlled = false;
  target.delayMinutes = 24;
  target.reference = "PO-441882";
  target.valueEur = 214_600;
  target.departedAt = new Date("2026-08-18T06:12:00Z").toISOString();
  target.plannedEta = new Date("2026-08-18T14:18:00Z").toISOString();
  target.eta = new Date("2026-08-18T14:42:00Z").toISOString();
  const total = new Date(target.plannedEta).getTime() - new Date(target.departedAt).getTime();
  target.progress = Number(
    (((NOW.getTime() - new Date(target.departedAt).getTime()) / total) * 100).toFixed(1),
  );
})();

/**
 * Freight currently on the road is a headline figure, so the generated weights are
 * scaled to land on it exactly while each individual load stays plausible. The pinned
 * shipment keeps its fixed tonnage and is held out of the scaling.
 */
const FREIGHT_IN_TRANSIT_TARGET = 18_492;

(function normaliseWeights() {
  const moving = RAW.filter(
    (s) => IN_TRANSIT_STATES.includes(s.status) && s.id !== FEATURED_ID,
  );
  const remaining = FREIGHT_IN_TRANSIT_TARGET - FEATURED_WEIGHT;
  const sum = moving.reduce((acc, s) => acc + s.weightTonnes, 0);
  const factor = remaining / sum;
  let running = 0;
  moving.forEach((s, i) => {
    if (i === moving.length - 1) {
      s.weightTonnes = Number((remaining - running).toFixed(1));
    } else {
      s.weightTonnes = Number((s.weightTonnes * factor).toFixed(1));
      running = Number((running + s.weightTonnes).toFixed(1));
    }
  });
})();

export const SHIPMENTS: Shipment[] = RAW;
export const SHIPMENT_BY_ID = new Map(SHIPMENTS.map((s) => [s.id, s]));
export const FEATURED_SHIPMENT_ID = FEATURED_ID;

export const ACTIVE_SHIPMENTS = SHIPMENTS.filter((s) => s.status !== "delivered");
export const MOVING_SHIPMENTS = SHIPMENTS.filter((s) => IN_TRANSIT_STATES.includes(s.status));
export const DELIVERED_SHIPMENTS = SHIPMENTS.filter((s) => s.status === "delivered");

export const FREIGHT_IN_TRANSIT = Number(
  MOVING_SHIPMENTS.reduce((s, x) => s + x.weightTonnes, 0).toFixed(0),
);

export const ON_TIME_RATE = Number(
  (
    (DELIVERED_SHIPMENTS.filter((s) => s.delayMinutes === 0).length /
      DELIVERED_SHIPMENTS.length) *
    100
  ).toFixed(1),
);

export const SHIPMENT_STATUS_COUNTS = ACTIVE_PLAN.reduce(
  (acc, [status, count]) => ({ ...acc, [status]: count }),
  {} as Record<ShipmentStatus, number>,
);

// Each route reports how much of the active book it is carrying.
for (const r of ROUTES) {
  r.shipmentCount = ACTIVE_SHIPMENTS.filter((s) => s.routeId === r.id).length;
}

export function shipment(id: string): Shipment | undefined {
  return SHIPMENT_BY_ID.get(id);
}

/** Milestones for a single consignment, derived from its route and progress. */
export function buildTimeline(s: Shipment): ShipmentEvent[] {
  const route = ROUTES.find((r) => r.id === s.routeId)!;
  const origin = facility(s.originId);
  const destination = facility(s.destinationId);
  const rng = makeRng(Number(s.id.replace(/\D/g, "")) || 1);
  const start = new Date(s.departedAt).getTime();
  const plannedEnd = new Date(s.plannedEta).getTime();
  const span = plannedEnd - start;

  const events: ShipmentEvent[] = [
    {
      at: new Date(start - randInt(rng, 45, 130) * 60_000).toISOString(),
      label: `Booked at ${origin.name}`,
      detail: `${s.pallets} pallets · ${s.customer}`,
      facilityId: origin.id,
      state: "completed",
    },
    {
      at: new Date(start - randInt(rng, 20, 44) * 60_000).toISOString(),
      label: `Loaded at ${origin.name}`,
      detail: `Dock ${randInt(rng, 1, origin.dockDoors)} · ${s.weightTonnes.toFixed(1)} t`,
      facilityId: origin.id,
      state: "completed",
    },
    {
      at: new Date(start).toISOString(),
      label: `Departed ${origin.city}`,
      detail: s.vehicleId ? `Vehicle ${s.vehicleId}` : undefined,
      facilityId: origin.id,
      state: "completed",
    },
  ];

  for (const viaId of route.viaIds) {
    const via = facility(viaId);
    events.push({
      at: new Date(start + span * 0.42).toISOString(),
      label: `Border checkpoint`,
      detail: `${via.city} · cleared in ${randInt(rng, 12, 48)} min`,
      facilityId: via.id,
      state: "completed",
    });
  }

  if (s.status === "customs") {
    events.push({
      at: new Date(start + span * 0.55).toISOString(),
      label: "Held at customs",
      detail: `Documentation review · ${s.delayMinutes} min elapsed`,
      state: "exception",
    });
  }

  if (s.delayMinutes > 0 && s.status !== "customs") {
    events.push({
      at: new Date(start + span * 0.62).toISOString(),
      label: "Running behind schedule",
      detail: `${s.delayMinutes} min lost to congestion on the ${route.corridor} corridor`,
      state: "exception",
    });
  }

  const current = NOW.getTime();
  events.push({
    at: new Date(current).toISOString(),
    label:
      s.status === "delivered"
        ? `Delivered to ${destination.name}`
        : s.status === "loading"
          ? `Loading at ${origin.name}`
          : s.status === "scheduled"
            ? `Awaiting despatch at ${origin.name}`
            : `Entered ${destination.city} region`,
    detail:
      s.status === "delivered"
        ? "Signed for at goods-in"
        : `${Math.round(s.progress)}% of route complete`,
    facilityId: s.status === "delivered" ? destination.id : undefined,
    state: s.status === "delivered" ? "completed" : "active",
  });

  if (s.status !== "delivered") {
    events.push({
      at: s.eta,
      label: `Expected arrival at ${destination.name}`,
      detail: s.delayMinutes > 0 ? `${s.delayMinutes} min later than planned` : "On plan",
      facilityId: destination.id,
      state: "planned",
    });
  }

  return events.sort((a, b) => +new Date(a.at) - +new Date(b.at));
}
