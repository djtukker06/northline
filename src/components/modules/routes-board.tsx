"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Route as RouteIcon } from "lucide-react";
import { CORRIDORS, FACILITY_BY_ID, ROUTES, ROUTE_BY_ID, ACTIVE_SHIPMENTS } from "@/lib/data";
import type { RouteDef } from "@/lib/data/types";
import { NetworkMap, type MapFilters, type MapSelection } from "@/components/map/network-map";
import { Panel, DetailRow } from "@/components/ui/panel";
import { Badge, ROUTE_STATUS, StatusBadge } from "@/components/ui/status";
import { FilterMenu } from "@/components/ui/dropdown";
import { Segmented } from "@/components/ui/segmented";
import { CapacityBar } from "@/components/ui/metric";
import { EmptyState } from "@/components/ui/states";
import {
  cn,
  formatDistance,
  formatDuration,
  formatNumber,
  formatTime,
} from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "all" as const, label: "Any" },
  { value: "on-schedule" as const, label: "On schedule" },
  { value: "at-risk" as const, label: "At risk" },
  { value: "delayed" as const, label: "Delayed" },
];

const CORRIDOR_OPTIONS = [
  { value: "all" as const, label: "All corridors" },
  ...CORRIDORS.map((c) => ({ value: c, label: c })),
];

type SortKey = "delay" | "efficiency" | "loads" | "distance";

export function RoutesBoard() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("route");

  const [status, setStatus] = React.useState<RouteDef["status"] | "all">("all");
  const [corridor, setCorridor] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("delay");

  const select = (id: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (id) next.set("route", id);
    else next.delete("route");
    router.replace(`/routes${next.toString() ? `?${next}` : ""}`, { scroll: false });
  };

  const routes = React.useMemo(() => {
    const list = ROUTES.filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (corridor === "all" || r.corridor === corridor),
    );
    return [...list].sort((a, b) => {
      if (sortKey === "efficiency") return b.efficiency - a.efficiency;
      if (sortKey === "loads") return b.shipmentCount - a.shipmentCount;
      if (sortKey === "distance") return b.distanceKm - a.distanceKm;
      return b.delayMinutes - a.delayMinutes || b.shipmentCount - a.shipmentCount;
    });
  }, [status, corridor, sortKey]);

  const selected = selectedId ? ROUTE_BY_ID.get(selectedId) : null;

  const mapFilters: MapFilters = React.useMemo(
    () => ({
      statuses:
        status === "all"
          ? new Set(["on-schedule", "at-risk", "delayed"] as const)
          : new Set([status]),
      regions: new Set<string>(),
      vehicleClasses: new Set<string>(),
    }),
    [status],
  );

  const mapSelection: MapSelection = selectedId ? { kind: "route", id: selectedId } : null;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col xl:h-[32rem] xl:flex-row">
        <div className="border-line flex min-h-0 flex-col border-b xl:w-[24rem] xl:shrink-0 xl:border-b-0 xl:border-r">
          <header className="border-line shrink-0 space-y-2 border-b px-4 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-ink text-body-lg font-semibold">Active routes</h2>
              <span className="text-ink-3 text-caption tabular-nums">{routes.length} shown</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FilterMenu label="Status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
              <FilterMenu
                label="Corridor"
                value={corridor}
                options={CORRIDOR_OPTIONS}
                onChange={setCorridor}
              />
            </div>
            <Segmented
              size="sm"
              label="Sort routes"
              value={sortKey}
              onChange={setSortKey}
              options={[
                { value: "delay", label: "Delay" },
                { value: "efficiency", label: "Efficiency" },
                { value: "loads", label: "Loads" },
                { value: "distance", label: "Distance" },
              ]}
            />
          </header>

          {routes.length === 0 ? (
            <EmptyState
              icon={RouteIcon}
              title="No routes match"
              description="No corridor matches the current status filter."
              action={{ label: "Show all routes", onClick: () => { setStatus("all"); setCorridor("all"); } }}
            />
          ) : (
            <ul className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
              {routes.map((r) => {
                const meta = ROUTE_STATUS[r.status];
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => select(selectedId === r.id ? null : r.id)}
                      className={cn(
                        "hover:bg-surface-soft border-line w-full border-b px-4 py-3 text-left transition-colors last:border-b-0",
                        selectedId === r.id && "bg-brand-soft",
                      )}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-ink text-small font-semibold">{r.id}</span>
                        <Badge tone={meta.tone} dot>
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="text-ink-2 text-small mt-1 flex items-center gap-1.5">
                        {FACILITY_BY_ID.get(r.originId)!.city}
                        <ArrowRight className="text-ink-3 size-3 shrink-0" aria-hidden />
                        {FACILITY_BY_ID.get(r.destinationId)!.city}
                      </p>
                      <div className="text-ink-3 text-caption mt-1.5 flex items-center gap-3 tabular-nums">
                        <span>{formatDistance(r.distanceKm)}</span>
                        <span>{r.shipmentCount} loads</span>
                        <span className="ml-auto">
                          {r.delayMinutes > 0 ? (
                            <span className="text-critical-text font-medium">
                              +{formatDuration(r.delayMinutes)}
                            </span>
                          ) : (
                            <span className="text-success-text font-medium">On plan</span>
                          )}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="relative min-h-[20rem] flex-1">
          <NetworkMap
            selection={mapSelection}
            onSelect={(s) => select(s?.kind === "route" ? s.id : null)}
            filters={mapFilters}
            showVehicles
            focusRouteId={selectedId}
          />
        </div>
      </Panel>

      {selected ? (
        <RouteDetail route={selected} />
      ) : (
        <Panel>
          <EmptyState
            icon={RouteIcon}
            title="Select a route to inspect it"
            description="Choose a corridor from the list or click a line on the map to see its stops, vehicles and cost profile."
          />
        </Panel>
      )}
    </div>
  );
}

function RouteDetail({ route }: { route: RouteDef }) {
  const loads = ACTIVE_SHIPMENTS.filter((s) => s.routeId === route.id);
  const meta = ROUTE_STATUS[route.status];

  return (
    <Panel>
      <header className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-ink text-body-lg font-semibold">{route.id}</h2>
            <Badge tone={meta.tone} dot>
              {meta.label}
            </Badge>
          </div>
          <p className="text-ink-2 text-small mt-0.5">
            {route.name} · {route.corridor} corridor
          </p>
        </div>
        <div className="text-right">
          <p className="text-ink-3 text-caption">Efficiency</p>
          <p className="text-ink text-h2 font-semibold tabular-nums">{route.efficiency}%</p>
        </div>
      </header>

      <div className="grid grid-cols-1 divide-y divide-[var(--nl-border)] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        <div className="px-5 py-4">
          <h3 className="label-eyebrow mb-2">Schedule</h3>
          <dl>
            <DetailRow label="Distance">{formatDistance(route.distanceKm)}</DetailRow>
            <DetailRow label="Planned transit">{formatDuration(route.plannedMinutes)}</DetailRow>
            <DetailRow label="Actual transit">{formatDuration(route.actualMinutes)}</DetailRow>
            <DetailRow label="Variance">
              {route.delayMinutes > 0 ? (
                <span className="text-critical-text">+{formatDuration(route.delayMinutes)}</span>
              ) : (
                <span className="text-success-text">On plan</span>
              )}
            </DetailRow>
            <DetailRow label="Stops">{route.stops.length}</DetailRow>
          </dl>
          <div className="mt-3">
            <div className="mb-1.5 flex items-baseline justify-between text-caption">
              <span className="text-ink-2">Schedule adherence</span>
              <span className="text-ink font-semibold tabular-nums">{route.efficiency}%</span>
            </div>
            <CapacityBar
              value={route.efficiency}
              tone={route.efficiency > 90 ? "success" : route.efficiency > 78 ? "warning" : "critical"}
            />
          </div>
        </div>

        <div className="px-5 py-4">
          <h3 className="label-eyebrow mb-2">Stops</h3>
          <ol className="space-y-2.5">
            {route.stops.map((stop) => {
              const f = FACILITY_BY_ID.get(stop.facilityId)!;
              return (
                <li key={stop.facilityId} className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      stop.status === "completed"
                        ? "bg-success"
                        : stop.status === "active"
                          ? "bg-brand ring-brand/25 ring-4"
                          : "bg-ink-3/50",
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="text-ink block text-small font-medium">{f.name}</span>
                    <span className="text-ink-3 block text-caption tabular-nums">
                      {stop.actualArrival ? "Arrived" : "Planned"}{" "}
                      {formatTime(stop.actualArrival ?? stop.plannedArrival)} · dwell{" "}
                      {formatDuration(stop.dwellMinutes)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="px-5 py-4">
          <h3 className="label-eyebrow mb-2">Cost and assignment</h3>
          <dl>
            <DetailRow label="Cost per km">€{route.costPerKm.toFixed(2)}</DetailRow>
            <DetailRow label="Estimated line-haul">
              €{formatNumber(Math.round(route.costPerKm * route.distanceKm))}
            </DetailRow>
            <DetailRow label="Tolls">€{formatNumber(route.tollsEur)}</DetailRow>
            <DetailRow label="CO₂ intensity">{route.co2PerTonneKm} g/t·km</DetailRow>
            <DetailRow label="Loads on route">{formatNumber(route.shipmentCount)}</DetailRow>
          </dl>

          <h3 className="label-eyebrow mt-4 mb-2">Assigned vehicles</h3>
          <ul className="flex flex-wrap gap-1.5">
            {route.vehicleIds.map((id) => (
              <li key={id}>
                <Link
                  href={`/fleet?vehicle=${id}`}
                  className="border-line bg-surface-soft text-ink-2 hover:text-ink hover:border-line-strong inline-flex rounded-full border px-2 py-0.5 text-caption font-medium transition-colors"
                >
                  {id}
                </Link>
              </li>
            ))}
            {route.vehicleIds.length === 0 && (
              <li className="text-ink-3 text-small">No vehicles assigned.</li>
            )}
          </ul>
        </div>
      </div>

      {loads.length > 0 && (
        <div className="border-line border-t px-5 py-4">
          <h3 className="label-eyebrow mb-2">Loads on this route</h3>
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {loads.slice(0, 9).map((s) => (
              <li key={s.id}>
                <Link
                  href={`/shipments/${s.id}`}
                  className="border-line hover:bg-surface-soft flex items-center justify-between gap-2 rounded-well border px-2.5 py-2 transition-colors"
                >
                  <span className="min-w-0">
                    <span className="text-ink block text-small font-medium">{s.id}</span>
                    <span className="text-ink-3 block truncate text-caption">{s.customer}</span>
                  </span>
                  <StatusBadge status={s.status} />
                </Link>
              </li>
            ))}
          </ul>
          {loads.length > 9 && (
            <Link
              href="/shipments"
              className="text-brand mt-2.5 inline-block text-small font-medium hover:underline"
            >
              View all {formatNumber(loads.length)} loads
            </Link>
          )}
        </div>
      )}
    </Panel>
  );
}
