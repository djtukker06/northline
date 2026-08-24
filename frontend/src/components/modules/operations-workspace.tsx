"use client";

import * as React from "react";
import { Layers, MapPin, Truck } from "lucide-react";
import { NetworkMap, type MapFilters, type MapSelection } from "@/components/map/network-map";
import { MapDetail } from "./map-detail";
import { LiveOperations } from "./live-operations";
import { FilterChips } from "@/components/ui/segmented";
import { FilterMenu } from "@/components/ui/dropdown";
import { REGION_LABEL, ROUTES, VEHICLE_CLASS_LABEL } from "@/lib/data";
import { MAP_VEHICLES } from "@/lib/map-data";
import type { Region, VehicleClass } from "@/lib/data/types";

type RouteStatus = "on-schedule" | "at-risk" | "delayed";

const STATUS_OPTIONS: Array<{ value: RouteStatus; label: string; color: string }> = [
  { value: "on-schedule", label: "On schedule", color: "var(--nl-success)" },
  { value: "at-risk", label: "At risk", color: "var(--nl-warning)" },
  { value: "delayed", label: "Delayed", color: "var(--nl-critical)" },
];

const REGION_OPTIONS = [
  { value: "all" as const, label: "All regions" },
  ...(Object.keys(REGION_LABEL) as Region[]).map((r) => ({
    value: r,
    label: REGION_LABEL[r],
  })),
];

const CLASS_OPTIONS = [
  { value: "all" as const, label: "All types" },
  ...(Object.keys(VEHICLE_CLASS_LABEL) as VehicleClass[]).map((c) => ({
    value: c,
    label: VEHICLE_CLASS_LABEL[c],
  })),
];

/**
 * The map and the activity feed are one workspace, not two cards. They share a
 * border and a header rail, which is how a dispatcher actually reads them.
 */
export function OperationsWorkspace() {
  const [selection, setSelection] = React.useState<MapSelection>(null);
  const [statuses, setStatuses] = React.useState<Set<RouteStatus>>(
    () => new Set(["on-schedule", "at-risk", "delayed"]),
  );
  const [region, setRegion] = React.useState<Region | "all">("all");
  const [vehicleClass, setVehicleClass] = React.useState<VehicleClass | "all">("all");
  const [showVehicles, setShowVehicles] = React.useState(true);

  const filters: MapFilters = React.useMemo(
    () => ({
      statuses,
      regions: region === "all" ? new Set() : new Set([region]),
      vehicleClasses: vehicleClass === "all" ? new Set() : new Set([vehicleClass]),
    }),
    [statuses, region, vehicleClass],
  );

  const counts = React.useMemo(() => {
    const c: Record<RouteStatus, number> = { "on-schedule": 0, "at-risk": 0, delayed: 0 };
    for (const r of ROUTES) c[r.status] += 1;
    return c;
  }, []);

  const toggleStatus = (value: RouteStatus) => {
    setStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        // Never let the operator filter the map down to nothing.
        if (next.size > 1) next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const visibleVehicles = MAP_VEHICLES.filter(
    (v) => statuses.has(v.status) && (vehicleClass === "all" || v.vehicleClass === vehicleClass),
  ).length;

  return (
    <section
      aria-label="Network operations"
      className="bg-surface border-line rounded-panel flex flex-col overflow-hidden border xl:h-[34rem] xl:flex-row"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-line flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2.5">
          <div className="mr-auto flex items-center gap-2">
            <MapPin className="text-ink-3 size-4" aria-hidden />
            <h2 className="text-ink text-body-lg font-semibold">Network</h2>
            <span className="text-ink-3 text-caption tabular-nums">
              {visibleVehicles} vehicles moving
            </span>
          </div>

          <FilterChips
            label="Filter by status"
            values={statuses}
            onToggle={toggleStatus}
            options={STATUS_OPTIONS.map((o) => ({ ...o, count: counts[o.value] }))}
          />

          <button
            type="button"
            onClick={() => setShowVehicles((v) => !v)}
            aria-pressed={showVehicles}
            className={
              showVehicles
                ? "border-ink/15 bg-surface text-ink inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-caption font-medium shadow-sm"
                : "text-ink-3 hover:text-ink-2 inline-flex h-7 items-center gap-1.5 rounded-full border border-transparent px-2.5 text-caption font-medium"
            }
          >
            <Truck className="size-3" aria-hidden />
            Vehicles
          </button>

          <FilterMenu
            label="Region"
            value={region}
            options={REGION_OPTIONS}
            onChange={setRegion}
            className="h-7"
          />
          <FilterMenu
            label="Type"
            value={vehicleClass}
            options={CLASS_OPTIONS}
            onChange={setVehicleClass}
            className="h-7"
          />
        </header>

        <div className="relative min-h-[22rem] flex-1">
          <NetworkMap
            selection={selection}
            onSelect={(s) =>
              setSelection((prev) =>
                prev && s && prev.kind === s.kind && prev.id === s.id ? null : s,
              )
            }
            filters={filters}
            showVehicles={showVehicles}
          />
          <MapDetail selection={selection} onClose={() => setSelection(null)} />
          <MapLegend />
        </div>
      </div>

      <div className="border-line flex min-h-0 flex-col border-t xl:w-[21rem] xl:shrink-0 xl:border-t-0 xl:border-l">
        <LiveOperations className="max-xl:max-h-[26rem]" />
      </div>
    </section>
  );
}

function MapLegend() {
  return (
    <div className="bg-surface/90 border-line text-caption absolute bottom-3 left-3 flex items-center gap-3 rounded-control border px-2.5 py-1.5 backdrop-blur">
      <Layers className="text-ink-3 size-3" aria-hidden />
      {STATUS_OPTIONS.map((s) => (
        <span key={s.value} className="text-ink-2 flex items-center gap-1.5">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
          {s.label}
        </span>
      ))}
      <span className="text-ink-2 flex items-center gap-1.5">
        <span className="bg-ink size-1.5 rounded-full" aria-hidden />
        Hub
      </span>
    </div>
  );
}
