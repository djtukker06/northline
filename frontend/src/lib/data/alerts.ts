import { makeRng, randInt, NOW } from "../utils";
import { FACILITIES } from "./network";
import { VEHICLES } from "./fleet";
import { ROUTES } from "./routes";
import { SHIPMENTS } from "./shipments";
import type { Alert, AlertCategory, AlertSeverity } from "./types";

function minutesAgo(m: number) {
  return new Date(NOW.getTime() - m * 60_000).toISOString();
}

/** The four alerts the operations team is actively working, in brief order. */
const PINNED: Alert[] = [
  {
    id: "ALT-4471",
    severity: "critical",
    category: "capacity",
    title: "Berlin Hub projected to exceed capacity within 6 hours",
    detail:
      "Inbound bookings put Berlin Hub at 104% of pallet positions by 20:30. Seven inbound loads have no assigned dock.",
    entityType: "facility",
    entityId: "FAC-BER-01",
    entityLabel: "Berlin Hub",
    facilityId: "FAC-BER-01",
    raisedAt: minutesAgo(2),
    resolvedAt: null,
    owner: "Matthias Brandt",
    impact: "7 inbound loads · 142 pallets",
  },
  {
    id: "ALT-4468",
    severity: "warning",
    category: "delay",
    title: "Shipment NL-48291 is 24 minutes behind schedule",
    detail:
      "Congestion on the A2 near Hannover has pushed arrival at Berlin Hub to 16:42. The receiving window closes at 17:00.",
    entityType: "shipment",
    entityId: "NL-48291",
    entityLabel: "NL-48291",
    facilityId: "FAC-BER-01",
    raisedAt: minutesAgo(12),
    resolvedAt: null,
    owner: "Sanne Jansen",
    impact: "18.4 t · Kestrel Automotive",
  },
  {
    id: "ALT-4462",
    severity: "warning",
    category: "maintenance",
    title: "Vehicle NL-TRK-119 requires maintenance",
    detail:
      "Brake wear sensor has crossed the service threshold 2,400 km early. The vehicle is booked on R-181 tomorrow at 05:00.",
    entityType: "vehicle",
    entityId: "NL-TRK-119",
    entityLabel: "NL-TRK-119",
    raisedAt: minutesAgo(38),
    resolvedAt: null,
    owner: "Stefan Müller",
    impact: "Blocks 1 line-haul departure",
  },
  {
    id: "ALT-4455",
    severity: "resolved",
    category: "route",
    title: "Route R-128 delay resolved",
    detail:
      "The Lyon diversion has cleared. All four loads on R-128 are back inside their delivery windows.",
    entityType: "route",
    entityId: "R-128",
    entityLabel: "R-128 Paris to Madrid",
    raisedAt: minutesAgo(94),
    resolvedAt: minutesAgo(31),
    owner: "Élodie Marchand",
    impact: "4 loads recovered",
  },
];

const TEMPLATES: Array<{
  severity: AlertSeverity;
  category: AlertCategory;
  title: (ctx: Ctx) => string;
  detail: (ctx: Ctx) => string;
  impact: (ctx: Ctx) => string;
  entityType: Alert["entityType"];
}> = [
  {
    severity: "warning",
    category: "capacity",
    entityType: "facility",
    title: (c) => `${c.facilityName} is at ${c.capacity}% of pallet capacity`,
    detail: (c) =>
      [
        `Storage has climbed ${c.n % 14 + 4} points since the shift began. Overflow will route to the nearest cross-dock.`,
        `Inbound is running ahead of outbound by ${c.n % 9 + 3} loads. The evening despatch will need to clear the backlog.`,
        `Two aisles are blocked by staged outbound freight, so usable positions are lower than the figure suggests.`,
        `Put-away is ${c.n % 40 + 20} minutes behind, which is holding trailers on the yard.`,
      ][c.n % 4],
    impact: (c) => `${(c.n % 14 + 4) * 12} pallets above plan`,
  },
  {
    severity: "warning",
    category: "delay",
    entityType: "shipment",
    title: (c) => `Shipment ${c.shipmentId} is ${c.n} minutes behind schedule`,
    detail: (c) =>
      [
        `Traffic on the ${c.corridor} corridor has eroded the buffer. The customer window is unchanged.`,
        `The load waited ${c.n % 30 + 15} minutes for a free bay at its intermediate stop.`,
        `A lane closure on the ${c.corridor} corridor is adding time on every run today.`,
        `The driver took a mandatory break earlier than planned, which pushed the arrival back.`,
      ][c.n % 4],
    impact: (c) => `${c.weight} t · ${c.customer}`,
  },
  {
    severity: "critical",
    category: "temperature",
    entityType: "shipment",
    title: (c) => `Trailer on ${c.shipmentId} drifted to ${(6 + c.n / 22).toFixed(1)}°C`,
    detail: (c) =>
      `The set point is 2 to 6°C. Telematics alerted ${c.driverName} ${c.n} minutes ago and the unit is now recovering.`,
    impact: (c) => `${c.weight} t of ${c.customer} stock`,
  },
  {
    severity: "warning",
    category: "customs",
    entityType: "shipment",
    title: (c) => `${c.shipmentId} held for documentation review`,
    detail: (c) =>
      [
        "The commercial invoice does not match the manifest line count. Clearance is paused pending a corrected document.",
        "The certificate of origin is missing for two lines on the manifest.",
        "The declared commodity code was rejected by the broker and needs reclassifying.",
        "The consignee VAT number could not be validated against the register.",
      ][c.n % 4],
    impact: (c) => `${c.n} min in queue`,
  },
  {
    severity: "warning",
    category: "maintenance",
    entityType: "vehicle",
    title: (c) => `${c.vehicleId} is ${c.n * 40} km past its service interval`,
    detail: (c) => `Scheduled maintenance is overdue at ${c.facilityName}. Health score has fallen to ${c.health}.`,
    impact: () => "Compliance risk on next inspection",
  },
  {
    severity: "critical",
    category: "compliance",
    entityType: "driver",
    title: (c) => `${c.driverName} reaches the driving limit in ${c.n} minutes`,
    detail: (c) =>
      `Permitted driving under Regulation 561/2006 runs out before ${c.facilityName}. A relief driver has not been assigned.`,
    impact: (c) => `Rest due before ${c.facilityName}`,
  },
  {
    severity: "critical",
    category: "route",
    entityType: "route",
    title: (c) => `${c.routeId} blocked by an incident on the ${c.corridor} corridor`,
    detail: (c) =>
      `Traffic control reports a full closure. ${c.n} minutes of delay is already committed and no diversion has been accepted.`,
    impact: (c) => `${c.n} min committed`,
  },
  {
    severity: "critical",
    category: "capacity",
    entityType: "facility",
    title: (c) => `${c.facilityName} has no free dock until ${String(14 + (c.n % 8)).padStart(2, "0")}:00`,
    detail: (c) =>
      `Every one of the ${c.capacity}% occupied bays is committed. Inbound vehicles are queuing on the approach road.`,
    impact: (c) => `${Math.round(c.n / 8)} vehicles waiting`,
  },
  {
    severity: "info",
    category: "route",
    entityType: "route",
    title: (c) => `${c.routeId} rerouted around road works`,
    detail: (c) =>
      `A diversion on the ${c.corridor} corridor adds ${c.n} km. Estimated arrival times have been recalculated.`,
    impact: (c) => `${c.n} km added`,
  },
  {
    severity: "resolved",
    category: "capacity",
    entityType: "facility",
    title: (c) => `${c.facilityName} capacity back within plan`,
    detail: () => "Outbound loading has drawn storage below the 85% threshold. No further action is needed.",
    impact: () => "Cleared without escalation",
  },
  {
    severity: "resolved",
    category: "delay",
    entityType: "shipment",
    title: (c) => `${c.shipmentId} recovered its schedule`,
    detail: () => "The load made up time on the final leg and arrived inside the agreed window.",
    impact: () => "Delivered on time",
  },
];

interface Ctx {
  facilityName: string;
  capacity: number;
  n: number;
  shipmentId: string;
  corridor: string;
  weight: string;
  customer: string;
  vehicleId: string;
  health: number;
  driverName: string;
  routeId: string;
}

/**
 * Template order for the generated backlog. A network running at 94.8% on time does
 * not sit on seventeen criticals, so severe templates appear rarely and the bulk of
 * the board is warnings, information and items already closed out.
 */
const ROTATION = (() => {
  const bySeverity = (sev: AlertSeverity) =>
    TEMPLATES.map((t, i) => [t, i] as const)
      .filter(([t]) => t.severity === sev)
      .map(([, i]) => i);

  const critical = bySeverity("critical");
  const warning = bySeverity("warning");
  const info = bySeverity("info");
  const resolved = bySeverity("resolved");

  const order: number[] = [];
  for (let i = 0; i < 64; i++) {
    if (i % 23 === 7) order.push(critical[(i / 23) | 0 % critical.length]);
    else if (i % 3 === 0) order.push(resolved[i % resolved.length]);
    else if (i % 7 === 5) order.push(info[i % info.length]);
    else order.push(warning[i % warning.length]);
  }
  return order;
})();

function generated(): Alert[] {
  const out: Alert[] = [];
  const seen = new Set<string>();
  const owners = FACILITIES.map((f) => f.manager);
  for (let i = 0; i < 64; i++) {
    const rng = makeRng(55_000 + i * 313);
    const tpl = TEMPLATES[ROTATION[i] ?? 0];
    // Capacity alerts only make sense for sites actually under pressure.
    const pool =
      tpl.category === "capacity"
        ? FACILITIES.filter((f) => f.capacityPct >= 78)
        : FACILITIES;
    const fac = pool[(i * 3) % pool.length];
    const ship = SHIPMENTS[(i * 97) % SHIPMENTS.length];
    const veh = VEHICLES[(i * 13) % VEHICLES.length];
    const rt = ROUTES[(i * 5) % ROUTES.length];
    const ctx: Ctx = {
      facilityName: fac.name,
      capacity: fac.capacityPct,
      n: randInt(rng, 12, 88),
      shipmentId: ship.id,
      corridor: rt.corridor,
      weight: ship.weightTonnes.toFixed(1),
      customer: ship.customer,
      vehicleId: veh.id,
      health: veh.healthScore,
      driverName: "Piotr Kowalczyk",
      routeId: rt.id,
    };
    const raised = randInt(rng, 8, 2_600);
    const entityId =
      tpl.entityType === "facility"
        ? fac.id
        : tpl.entityType === "shipment"
          ? ship.id
          : tpl.entityType === "vehicle"
            ? veh.id
            : tpl.entityType === "route"
              ? rt.id
              : "DRV-1042";
    const entityLabel =
      tpl.entityType === "facility"
        ? fac.name
        : tpl.entityType === "route"
          ? `${rt.id} ${rt.name}`
          : tpl.entityType === "driver"
            ? ctx.driverName
            : entityId;

    const dedupeKey = `${tpl.category}-${entityId}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    out.push({
      id: `ALT-${4_400 - i * 3}`,
      severity: tpl.severity,
      category: tpl.category,
      title: tpl.title(ctx),
      detail: tpl.detail(ctx),
      entityType: tpl.entityType,
      entityId,
      entityLabel,
      facilityId: tpl.entityType === "facility" ? fac.id : undefined,
      raisedAt: minutesAgo(raised),
      resolvedAt: tpl.severity === "resolved" ? minutesAgo(Math.floor(raised / 2)) : null,
      owner: owners[i % owners.length],
      impact: tpl.impact(ctx),
    });
  }
  return out;
}

export const ALERTS: Alert[] = [...PINNED, ...generated()].sort(
  (a, b) => +new Date(b.raisedAt) - +new Date(a.raisedAt),
);

export const OPEN_ALERTS = ALERTS.filter((a) => a.severity !== "resolved");

export const ALERT_COUNTS = {
  critical: ALERTS.filter((a) => a.severity === "critical").length,
  warning: ALERTS.filter((a) => a.severity === "warning").length,
  info: ALERTS.filter((a) => a.severity === "info").length,
  resolved: ALERTS.filter((a) => a.severity === "resolved").length,
};

export function alertsForFacility(id: string) {
  return ALERTS.filter((a) => a.facilityId === id && a.severity !== "resolved");
}
