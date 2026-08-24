"use client";

import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import {
  ACTIVE_SHIPMENTS,
  DRIVER_BY_ID,
  FACILITY_BY_ID,
  ROUTE_BY_ID,
  VEHICLE_BY_ID,
} from "@/lib/data";
import { MAP_VEHICLES } from "@/lib/map-data";
import type { MapSelection } from "@/components/map/network-map";
import { DetailRow } from "@/components/ui/panel";
import { Badge, FacilityStatusBadge, ROUTE_STATUS, StatusBadge, VehicleStatusBadge } from "@/components/ui/status";
import { CapacityBar } from "@/components/ui/metric";
import {
  formatDistance,
  formatDuration,
  formatNumber,
  formatTime,
  formatTonnes,
} from "@/lib/utils";

/**
 * Contextual read-out for whatever is selected on the map. One component covers all
 * three entity types so the panel behaves identically whichever layer is clicked.
 */
export function MapDetail({
  selection,
  onClose,
}: {
  selection: MapSelection;
  onClose: () => void;
}) {
  if (!selection) return null;

  return (
    <aside
      key={`${selection.kind}-${selection.id}`}
      className="bg-surface border-line animate-slide-in-right absolute top-3 right-3 bottom-3 z-10 flex w-[19rem] flex-col overflow-hidden rounded-panel border shadow-md"
      aria-label="Selection detail"
    >
      <header className="border-line flex items-start justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <p className="label-eyebrow">{LABEL[selection.kind]}</p>
          <p className="text-ink mt-0.5 truncate text-body-lg font-semibold">
            {titleFor(selection)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close detail"
          className="text-ink-3 hover:bg-neutral-soft hover:text-ink -mt-0.5 grid size-7 shrink-0 place-items-center rounded-control transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </header>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {selection.kind === "route" && <RouteBody id={selection.id} />}
        {selection.kind === "hub" && <HubBody id={selection.id} />}
        {selection.kind === "vehicle" && <VehicleBody id={selection.id} />}
      </div>
    </aside>
  );
}

const LABEL = {
  route: "Route",
  hub: "Facility",
  vehicle: "Vehicle",
} as const;

function titleFor(s: NonNullable<MapSelection>) {
  if (s.kind === "route") return ROUTE_BY_ID.get(s.id)?.id ?? s.id;
  if (s.kind === "hub") return FACILITY_BY_ID.get(s.id)?.name ?? s.id;
  return s.id;
}

function RouteBody({ id }: { id: string }) {
  const r = ROUTE_BY_ID.get(id);
  if (!r) return null;
  const origin = FACILITY_BY_ID.get(r.originId)!;
  const destination = FACILITY_BY_ID.get(r.destinationId)!;
  const status = ROUTE_STATUS[r.status];

  return (
    <>
      <p className="text-ink-2 text-small flex items-center gap-1.5">
        {origin.city}
        <ArrowRight className="text-ink-3 size-3" aria-hidden />
        {destination.city}
      </p>
      <div className="mt-2.5">
        <Badge tone={status.tone} dot>
          {status.label}
        </Badge>
      </div>

      <dl className="mt-3">
        <DetailRow label="Corridor">{r.corridor}</DetailRow>
        <DetailRow label="Distance">{formatDistance(r.distanceKm)}</DetailRow>
        <DetailRow label="Planned transit">{formatDuration(r.plannedMinutes)}</DetailRow>
        <DetailRow label="Running">
          {r.delayMinutes > 0 ? (
            <span className="text-critical-text">{formatDuration(r.delayMinutes)} late</span>
          ) : (
            <span className="text-success-text">On plan</span>
          )}
        </DetailRow>
        <DetailRow label="Loads on route">{formatNumber(r.shipmentCount)}</DetailRow>
        <DetailRow label="Vehicles">{r.vehicleIds.length}</DetailRow>
        <DetailRow label="Efficiency">{r.efficiency}%</DetailRow>
        <DetailRow label="Cost per km">€{r.costPerKm.toFixed(2)}</DetailRow>
      </dl>

      <p className="label-eyebrow mt-4 mb-2">Stops</p>
      <ol className="space-y-2">
        {r.stops.map((stop) => {
          const f = FACILITY_BY_ID.get(stop.facilityId)!;
          return (
            <li key={stop.facilityId} className="flex items-baseline justify-between gap-3 text-small">
              <span className="flex min-w-0 items-baseline gap-2">
                <span
                  className={
                    stop.status === "completed"
                      ? "bg-success size-1.5 shrink-0 rounded-full"
                      : stop.status === "active"
                        ? "bg-brand size-1.5 shrink-0 rounded-full"
                        : "bg-ink-3/50 size-1.5 shrink-0 rounded-full"
                  }
                  aria-hidden
                />
                <span className="text-ink truncate">{f.name}</span>
              </span>
              <span className="text-ink-3 shrink-0 tabular-nums">
                {formatTime(stop.actualArrival ?? stop.plannedArrival)}
              </span>
            </li>
          );
        })}
      </ol>

      <Link
        href={`/routes?route=${r.id}`}
        className="text-brand mt-4 inline-flex items-center gap-1 text-small font-medium hover:underline"
      >
        Open route
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </>
  );
}

function HubBody({ id }: { id: string }) {
  const f = FACILITY_BY_ID.get(id);
  if (!f) return null;

  return (
    <>
      <p className="text-ink-2 text-small">
        {f.city}, {f.country}
      </p>
      <div className="mt-2.5">
        <FacilityStatusBadge status={f.status} />
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-ink-2 text-small">Pallet capacity</span>
          <span className="text-ink text-small font-semibold tabular-nums">
            {f.capacityPct}%
          </span>
        </div>
        <CapacityBar value={f.capacityPct} threshold={88} />
      </div>

      <dl className="mt-3">
        <DetailRow label="Inbound today">{f.inbound}</DetailRow>
        <DetailRow label="Outbound today">{f.outbound}</DetailRow>
        <DetailRow label="Docks in use">
          {f.docksInUse} of {f.dockDoors}
        </DetailRow>
        <DetailRow label="Staff on shift">
          {f.staffOnShift} of {f.staffPlanned}
        </DetailRow>
        <DetailRow label="Average dwell">{formatDuration(f.dwellMinutes)}</DetailRow>
        <DetailRow label="Shift pattern">{f.shiftPattern}</DetailRow>
        <DetailRow label="Site manager">{f.manager}</DetailRow>
      </dl>

      <Link
        href={`/warehouses?facility=${f.id}`}
        className="text-brand mt-4 inline-flex items-center gap-1 text-small font-medium hover:underline"
      >
        Open facility
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </>
  );
}

function VehicleBody({ id }: { id: string }) {
  const v = VEHICLE_BY_ID.get(id);
  const mapV = MAP_VEHICLES.find((x) => x.id === id);
  if (!v) return null;

  const driver = v.driverId ? DRIVER_BY_ID.get(v.driverId) : null;
  const load = ACTIVE_SHIPMENTS.find((s) => s.vehicleId === id);
  const route = mapV ? ROUTE_BY_ID.get(mapV.routeId) : null;

  return (
    <>
      <p className="text-ink-2 text-small">{v.model}</p>
      <div className="mt-2.5">
        <VehicleStatusBadge status={v.status} />
      </div>

      <dl className="mt-3">
        <DetailRow label="Position">{v.locationLabel}</DetailRow>
        {route && <DetailRow label="Route">{route.id} · {route.name}</DetailRow>}
        <DetailRow label="Driver">{driver?.name ?? "Unassigned"}</DetailRow>
        <DetailRow label="Speed">{v.telemetrySpeed} km/h</DetailRow>
        <DetailRow label="Load">
          {formatTonnes(v.currentLoad)} of {formatTonnes(v.payloadCapacity)}
        </DetailRow>
        <DetailRow label="Utilisation">{v.utilisation}%</DetailRow>
        <DetailRow label="Vehicle health">{v.healthScore}</DetailRow>
      </dl>

      {driver && (
        <>
          <p className="label-eyebrow mt-4 mb-1.5">Driving time</p>
          <div className="mb-1.5 flex items-baseline justify-between text-small">
            <span className="text-ink-2">Remaining before break</span>
            <span className="text-ink font-semibold tabular-nums">
              {formatDuration(driver.drivingMinutesLeft)}
            </span>
          </div>
          <CapacityBar
            value={(driver.drivingMinutesLeft / 540) * 100}
            tone={driver.drivingMinutesLeft < 60 ? "critical" : "success"}
          />
        </>
      )}

      {load && (
        <>
          <p className="label-eyebrow mt-4 mb-2">Current consignment</p>
          <Link
            href={`/shipments/${load.id}`}
            className="border-line hover:bg-surface-soft block rounded-well border p-2.5 transition-colors"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-ink text-small font-medium">{load.id}</span>
              <StatusBadge status={load.status} />
            </span>
            <span className="text-ink-3 mt-1 block text-caption">
              {load.customer} · {formatTonnes(load.weightTonnes)}
            </span>
          </Link>
        </>
      )}
    </>
  );
}
