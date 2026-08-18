"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { RotateCcw, TruckIcon } from "lucide-react";
import {
  ACTIVE_SHIPMENTS,
  DRIVER_BY_ID,
  REGION_LABEL,
  VEHICLES,
  VEHICLE_BY_ID,
  VEHICLE_CLASS_LABEL,
} from "@/lib/data";
import type { Region, Vehicle, VehicleClass, VehicleStatus } from "@/lib/data/types";
import { DataTable, TablePager, useSort, type Column } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/input";
import { FilterMenu } from "@/components/ui/dropdown";
import { StatusBadge, VehicleStatusBadge } from "@/components/ui/status";
import { CapacityBar } from "@/components/ui/metric";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { DetailRow } from "@/components/ui/panel";
import { formatDay, formatDuration, formatNumber, formatTonnes } from "@/lib/utils";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: Array<{ value: VehicleStatus | "all"; label: string }> = [
  { value: "all", label: "Any" },
  { value: "in-transit", label: "In transit" },
  { value: "loading", label: "Loading" },
  { value: "idle", label: "Idle" },
  { value: "maintenance", label: "Maintenance" },
];

const CLASS_OPTIONS = [
  { value: "all" as const, label: "Any" },
  ...(Object.keys(VEHICLE_CLASS_LABEL) as VehicleClass[]).map((c) => ({
    value: c,
    label: VEHICLE_CLASS_LABEL[c],
  })),
];

const REGION_OPTIONS = [
  { value: "all" as const, label: "Any" },
  ...(Object.keys(REGION_LABEL) as Region[]).map((r) => ({ value: r, label: REGION_LABEL[r] })),
];

export function FleetTable() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("vehicle");

  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<VehicleStatus | "all">("all");
  const [vehicleClass, setVehicleClass] = React.useState<VehicleClass | "all">("all");
  const [region, setRegion] = React.useState<Region | "all">("all");
  const [page, setPage] = React.useState(0);

  const select = (id: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (id) next.set("vehicle", id);
    else next.delete("vehicle");
    router.replace(`/fleet${next.toString() ? `?${next}` : ""}`, { scroll: false });
  };

  const columns = React.useMemo<Column<Vehicle>[]>(
    () => [
      {
        key: "id",
        header: "Vehicle",
        sortable: true,
        width: "10rem",
        sortValue: (v) => v.id,
        render: (v) => (
          <span className="block">
            <span className="text-ink font-medium">{v.id}</span>
            <span className="text-ink-3 block text-caption">{v.model}</span>
          </span>
        ),
      },
      {
        key: "driver",
        header: "Driver",
        sortable: true,
        sortValue: (v) => (v.driverId ? DRIVER_BY_ID.get(v.driverId)!.name : "zz"),
        render: (v) =>
          v.driverId ? (
            <span className="text-ink-2">{DRIVER_BY_ID.get(v.driverId)!.name}</span>
          ) : (
            <span className="text-ink-3">Unassigned</span>
          ),
      },
      {
        key: "location",
        header: "Location",
        hideBelow: "lg",
        sortable: true,
        sortValue: (v) => v.locationLabel,
        render: (v) => <span className="text-ink-2">{v.locationLabel}</span>,
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        width: "8rem",
        sortValue: (v) => v.status,
        render: (v) => <VehicleStatusBadge status={v.status} />,
      },
      {
        key: "utilisation",
        header: "Utilisation",
        numeric: true,
        width: "8rem",
        sortable: true,
        sortValue: (v) => v.utilisation,
        render: (v) => (
          <span className="flex items-center justify-end gap-2">
            <CapacityBar
              value={v.utilisation}
              height={4}
              className="w-12"
              tone={v.utilisation < 40 ? "warning" : "brand"}
            />
            <span className="text-ink w-9 text-right">{v.utilisation.toFixed(0)}%</span>
          </span>
        ),
      },
      {
        key: "fuel",
        header: "Fuel",
        numeric: true,
        hideBelow: "xl",
        width: "6.5rem",
        sortable: true,
        sortValue: (v) => v.fuelPer100km,
        render: (v) => (
          <span className="text-ink-2">
            {v.fuelPer100km}
            <span className="text-ink-3 text-caption">
              {v.vehicleClass === "electric" ? " kWh" : " L"}
            </span>
          </span>
        ),
      },
      {
        key: "service",
        header: "Next service",
        numeric: true,
        hideBelow: "md",
        width: "7.5rem",
        sortable: true,
        sortValue: (v) => +new Date(v.nextServiceDate),
        render: (v) => {
          const overdue = new Date(v.nextServiceDate) < new Date();
          return (
            <span className={overdue ? "text-critical-text font-medium" : "text-ink-2"}>
              {overdue ? "Overdue" : formatDay(v.nextServiceDate)}
            </span>
          );
        },
      },
    ],
    [],
  );

  const { sort, toggle, apply } = useSort(columns, { key: "id", dir: "asc" });

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return VEHICLES.filter((v) => {
      if (status !== "all" && v.status !== status) return false;
      if (vehicleClass !== "all" && v.vehicleClass !== vehicleClass) return false;
      if (region !== "all" && v.region !== region) return false;
      if (!q) return true;
      const driver = v.driverId ? DRIVER_BY_ID.get(v.driverId)!.name.toLowerCase() : "";
      return (
        v.id.toLowerCase().includes(q) ||
        v.plate.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.locationLabel.toLowerCase().includes(q) ||
        driver.includes(q)
      );
    });
  }, [query, status, vehicleClass, region]);

  const sorted = React.useMemo(() => apply(filtered), [apply, filtered]);
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Changing a filter invalidates the offset. Adjusting during render avoids the
  // extra commit an effect would cause.
  const filterKey = `${query}|${status}|${vehicleClass}|${region}`;
  const [lastFilterKey, setLastFilterKey] = React.useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(0);
  }

  const activeFilters =
    (status !== "all" ? 1 : 0) +
    (vehicleClass !== "all" ? 1 : 0) +
    (region !== "all" ? 1 : 0) +
    (query.trim() ? 1 : 0);

  const reset = () => {
    setQuery("");
    setStatus("all");
    setVehicleClass("all");
    setRegion("all");
  };

  const selected = selectedId ? VEHICLE_BY_ID.get(selectedId) : null;

  return (
    <>
      <div className="border-line flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
        <SearchInput
          label="Search vehicles"
          value={query}
          onValueChange={setQuery}
          placeholder="Vehicle, plate, driver, location"
          className="w-full sm:w-72"
        />
        <FilterMenu label="Status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
        <FilterMenu label="Type" value={vehicleClass} options={CLASS_OPTIONS} onChange={setVehicleClass} />
        <FilterMenu label="Region" value={region} options={REGION_OPTIONS} onChange={setRegion} />
        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="size-3.5" aria-hidden />
            Clear {activeFilters}
          </Button>
        )}
        <span className="text-ink-3 ml-auto text-small tabular-nums">
          {sorted.length} of {VEHICLES.length}
        </span>
      </div>

      <DataTable
        caption="Fleet vehicles"
        columns={columns}
        rows={pageRows}
        rowKey={(v) => v.id}
        sort={sort}
        onSort={toggle}
        selectedKey={selectedId}
        onRowClick={(v) => select(v.id)}
        emptyState={
          <EmptyState
            icon={TruckIcon}
            title="No vehicles match these filters"
            description="Try a different status or region, or clear the search."
            action={{ label: "Clear filters", onClick: reset }}
          />
        }
      />

      {sorted.length > 0 && (
        <TablePager page={page} pageSize={PAGE_SIZE} total={sorted.length} onPage={setPage} />
      )}

      <Drawer
        open={Boolean(selected)}
        onOpenChange={(v) => !v && select(null)}
        title={selected?.id ?? ""}
        description={selected?.model}
        width="24rem"
      >
        {selected && <VehicleDetail vehicle={selected} />}
      </Drawer>
    </>
  );
}

function VehicleDetail({ vehicle }: { vehicle: Vehicle }) {
  const driver = vehicle.driverId ? DRIVER_BY_ID.get(vehicle.driverId) : null;
  const loads = ACTIVE_SHIPMENTS.filter((s) => s.vehicleId === vehicle.id);
  const overdue = new Date(vehicle.nextServiceDate) < new Date();

  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2">
        <VehicleStatusBadge status={vehicle.status} />
        <span className="text-ink-2 text-small">{VEHICLE_CLASS_LABEL[vehicle.vehicleClass]}</span>
      </div>

      <p className="label-eyebrow mt-4 mb-1.5">Payload</p>
      <div className="mb-1.5 flex items-baseline justify-between text-small">
        <span className="text-ink-2">
          {formatTonnes(vehicle.currentLoad)} of {formatTonnes(vehicle.payloadCapacity)}
        </span>
        <span className="text-ink font-semibold tabular-nums">
          {((vehicle.currentLoad / vehicle.payloadCapacity) * 100).toFixed(0)}%
        </span>
      </div>
      <CapacityBar value={(vehicle.currentLoad / vehicle.payloadCapacity) * 100} tone="brand" />

      <dl className="mt-4">
        <DetailRow label="Registration">{vehicle.plate}</DetailRow>
        <DetailRow label="Position">{vehicle.locationLabel}</DetailRow>
        <DetailRow label="Speed">{vehicle.telemetrySpeed} km/h</DetailRow>
        <DetailRow label="Utilisation">{vehicle.utilisation}%</DetailRow>
        <DetailRow label="Fuel use">
          {vehicle.fuelPer100km} {vehicle.vehicleClass === "electric" ? "kWh/100km" : "L/100km"}
        </DetailRow>
        <DetailRow label="Odometer">{formatNumber(vehicle.odometer)} km</DetailRow>
        <DetailRow label="Home base">{vehicle.homeBase}</DetailRow>
        <DetailRow label="Registered">{vehicle.yearRegistered}</DetailRow>
      </dl>

      <p className="label-eyebrow mt-4 mb-1.5">Condition</p>
      <div className="mb-1.5 flex items-baseline justify-between text-small">
        <span className="text-ink-2">Vehicle health</span>
        <span className="text-ink font-semibold tabular-nums">{vehicle.healthScore} of 100</span>
      </div>
      <CapacityBar
        value={vehicle.healthScore}
        tone={vehicle.healthScore < 55 ? "critical" : vehicle.healthScore < 75 ? "warning" : "success"}
      />
      <p className={`mt-2 text-caption ${overdue ? "text-critical-text font-medium" : "text-ink-3"}`}>
        {overdue
          ? `Service overdue since ${formatDay(vehicle.nextServiceDate)}`
          : `Next service ${formatDay(vehicle.nextServiceDate)} or in ${formatNumber(Math.max(0, vehicle.nextServiceKm))} km`}
      </p>

      {driver && (
        <>
          <p className="label-eyebrow mt-4 mb-2">Driver</p>
          <div className="border-line rounded-well border p-3">
            <div className="flex items-center gap-2.5">
              <span className="bg-brand-soft text-brand grid size-8 shrink-0 place-items-center rounded-full text-caption font-semibold">
                {driver.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-ink block text-small font-medium">{driver.name}</span>
                <span className="text-ink-3 block text-caption">
                  {driver.licence} · {driver.yearsOfService} years
                </span>
              </span>
            </div>
            <dl className="mt-2">
              <DetailRow label="On-time rate">{driver.onTimeRate}%</DetailRow>
              <DetailRow label="Deliveries">{formatNumber(driver.deliveries)}</DetailRow>
              <DetailRow label="Driving time left">
                {formatDuration(driver.drivingMinutesLeft)}
              </DetailRow>
            </dl>
          </div>
        </>
      )}

      <p className="label-eyebrow mt-4 mb-2">On board</p>
      {loads.length > 0 ? (
        <ul className="space-y-1.5">
          {loads.slice(0, 5).map((s) => (
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
      ) : (
        <p className="text-ink-3 text-small">No consignments loaded.</p>
      )}
    </div>
  );
}
