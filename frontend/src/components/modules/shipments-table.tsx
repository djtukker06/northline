"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PackageSearch, RotateCcw } from "lucide-react";
import { CARRIERS, FACILITIES, FACILITY_BY_ID, SHIPMENTS } from "@/lib/data";
import type { Priority, Shipment, ShipmentStatus } from "@/lib/data/types";
import { DataTable, TablePager, useSort, type Column } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/input";
import { FilterMenu } from "@/components/ui/dropdown";
import { PriorityTag, StatusBadge } from "@/components/ui/status";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { cn, formatWhen, formatTonnes } from "@/lib/utils";

const PAGE_SIZE = 25;

type StatusFilter = ShipmentStatus | "all" | "active";

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "active", label: "Active" },
  { value: "all", label: "All" },
  { value: "in-transit", label: "In transit" },
  { value: "loading", label: "Loading" },
  { value: "at-risk", label: "At risk" },
  { value: "delayed", label: "Delayed" },
  { value: "customs", label: "Customs" },
  { value: "scheduled", label: "Scheduled" },
  { value: "delivered", label: "Delivered" },
];

const PRIORITY_OPTIONS: Array<{ value: Priority | "all"; label: string }> = [
  { value: "all", label: "Any" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

const PLACE_OPTIONS = [
  { value: "all" as const, label: "Any" },
  ...FACILITIES.map((f) => ({ value: f.id, label: f.city })),
];

const CARRIER_OPTIONS = [
  { value: "all" as const, label: "Any" },
  ...CARRIERS.map((c) => ({ value: c, label: c })),
];

export function ShipmentsTable() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  // The page is an operations view, so it opens on the live book rather than the archive.
  const [status, setStatus] = React.useState<StatusFilter>("active");
  const [priority, setPriority] = React.useState<Priority | "all">("all");
  const [origin, setOrigin] = React.useState<string>("all");
  const [destination, setDestination] = React.useState<string>("all");
  const [carrier, setCarrier] = React.useState<string>("all");
  const [page, setPage] = React.useState(0);

  const columns = React.useMemo<Column<Shipment>[]>(
    () => [
      {
        key: "id",
        header: "Shipment",
        sortable: true,
        width: "9.5rem",
        sortValue: (r) => r.id,
        render: (r) => (
          <span className="block">
            <span className="text-ink font-medium">{r.id}</span>
            <span className="text-ink-3 block text-caption">{r.reference}</span>
          </span>
        ),
      },
      {
        key: "origin",
        header: "Origin",
        sortable: true,
        sortValue: (r) => FACILITY_BY_ID.get(r.originId)!.city,
        render: (r) => (
          <span className="text-ink-2">{FACILITY_BY_ID.get(r.originId)!.city}</span>
        ),
      },
      {
        key: "destination",
        header: "Destination",
        sortable: true,
        sortValue: (r) => FACILITY_BY_ID.get(r.destinationId)!.city,
        render: (r) => (
          <span className="text-ink">{FACILITY_BY_ID.get(r.destinationId)!.city}</span>
        ),
      },
      {
        key: "carrier",
        header: "Carrier",
        hideBelow: "xl",
        sortable: true,
        sortValue: (r) => r.carrier,
        render: (r) => <span className="text-ink-2">{r.carrier}</span>,
      },
      {
        key: "vehicle",
        header: "Vehicle",
        hideBelow: "lg",
        sortable: true,
        sortValue: (r) => r.vehicleId ?? "",
        render: (r) =>
          r.vehicleId ? (
            <span className="text-ink-2">{r.vehicleId}</span>
          ) : (
            <span className="text-ink-3">Unassigned</span>
          ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        width: "8rem",
        sortValue: (r) => r.status,
        render: (r) => <StatusBadge status={r.status} />,
      },
      {
        key: "eta",
        header: "ETA",
        numeric: true,
        sortable: true,
        width: "7rem",
        sortValue: (r) => +new Date(r.status === "delivered" ? r.deliveredAt! : r.eta),
        render: (r) => (
          <span className="block">
            <span className="text-ink">{formatWhen(r.status === "delivered" ? r.deliveredAt! : r.eta)}</span>
            {r.delayMinutes > 0 && (
              <span className="text-critical-text block text-caption">+{r.delayMinutes} min</span>
            )}
          </span>
        ),
      },
      {
        key: "weight",
        header: "Weight",
        numeric: true,
        hideBelow: "md",
        sortable: true,
        width: "6rem",
        sortValue: (r) => r.weightTonnes,
        render: (r) => <span className="text-ink-2">{formatTonnes(r.weightTonnes)}</span>,
      },
      {
        key: "priority",
        header: "Priority",
        hideBelow: "sm",
        width: "6.5rem",
        sortable: true,
        sortValue: (r) => ["low", "normal", "high", "critical"].indexOf(r.priority),
        render: (r) => <PriorityTag priority={r.priority} />,
      },
    ],
    [],
  );

  const { sort, toggle, apply } = useSort(columns, { key: "eta", dir: "asc" });

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return SHIPMENTS.filter((s) => {
      if (status === "active" && s.status === "delivered") return false;
      if (status !== "all" && status !== "active" && s.status !== status) return false;
      if (priority !== "all" && s.priority !== priority) return false;
      if (origin !== "all" && s.originId !== origin) return false;
      if (destination !== "all" && s.destinationId !== destination) return false;
      if (carrier !== "all" && s.carrier !== carrier) return false;
      if (!q) return true;
      return (
        s.id.toLowerCase().includes(q) ||
        s.reference.toLowerCase().includes(q) ||
        s.customer.toLowerCase().includes(q) ||
        (s.vehicleId ?? "").toLowerCase().includes(q) ||
        FACILITY_BY_ID.get(s.originId)!.city.toLowerCase().includes(q) ||
        FACILITY_BY_ID.get(s.destinationId)!.city.toLowerCase().includes(q)
      );
    });
  }, [query, status, priority, origin, destination, carrier]);

  const sorted = React.useMemo(() => apply(filtered), [apply, filtered]);
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Any filter change invalidates the current page offset.
  // Changing a filter invalidates the offset. Adjusting during render avoids the
  // extra commit an effect would cause.
  const filterKey = `${query}|${status}|${priority}|${origin}|${destination}|${carrier}`;
  const [lastFilterKey, setLastFilterKey] = React.useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(0);
  }

  const activeFilters =
    (status !== "active" ? 1 : 0) +
    (priority !== "all" ? 1 : 0) +
    (origin !== "all" ? 1 : 0) +
    (destination !== "all" ? 1 : 0) +
    (carrier !== "all" ? 1 : 0) +
    (query.trim() ? 1 : 0);

  const reset = () => {
    setQuery("");
    setStatus("active");
    setPriority("all");
    setOrigin("all");
    setDestination("all");
    setCarrier("all");
  };

  return (
    <>
      <div className="border-line flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
        <SearchInput
          label="Search shipments"
          value={query}
          onValueChange={setQuery}
          placeholder="Shipment, reference, customer, city"
          className="w-full sm:w-72"
        />
        <FilterMenu label="Status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
        <FilterMenu label="From" value={origin} options={PLACE_OPTIONS} onChange={setOrigin} />
        <FilterMenu label="To" value={destination} options={PLACE_OPTIONS} onChange={setDestination} />
        <FilterMenu label="Carrier" value={carrier} options={CARRIER_OPTIONS} onChange={setCarrier} />
        <FilterMenu label="Priority" value={priority} options={PRIORITY_OPTIONS} onChange={setPriority} />
        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="size-3.5" aria-hidden />
            Clear {activeFilters}
          </Button>
        )}
        <span className={cn("text-ink-3 ml-auto text-small tabular-nums")}>
          {sorted.length.toLocaleString("en-GB")} of {SHIPMENTS.length.toLocaleString("en-GB")}
        </span>
      </div>

      <DataTable
        caption="Shipments"
        columns={columns}
        rows={pageRows}
        rowKey={(r) => r.id}
        sort={sort}
        onSort={toggle}
        onRowClick={(r) => router.push(`/shipments/${r.id}`)}
        emptyState={
          <EmptyState
            icon={PackageSearch}
            title="No shipments match these filters"
            description="Widen the status or route filters, or clear the search to see the full book."
            action={{ label: "Clear filters", onClick: reset }}
          />
        }
      />

      {sorted.length > 0 && (
        <TablePager page={page} pageSize={PAGE_SIZE} total={sorted.length} onPage={setPage} />
      )}
    </>
  );
}
