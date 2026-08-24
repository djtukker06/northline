"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PackageSearch, RotateCcw } from "lucide-react";
import type { Facility, Shipment } from "@/lib/api/types";
import { DataTable, TablePager, type Column } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/input";
import { FilterMenu } from "@/components/ui/dropdown";
import { PriorityTag, StatusBadge } from "@/components/ui/status";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { cn, formatWhen, formatTonnes } from "@/lib/utils";

/**
 * The list is now driven by the URL, not by component state.
 *
 * Every filter writes a query parameter, the server re-fetches, and the table
 * re-renders. That is slower to feel than filtering an in-memory array, and it is
 * the right trade: the database does the work, the browser never holds 1,924 rows,
 * and a filtered view can be bookmarked, shared and reloaded.
 *
 * `useTransition` keeps the current rows on screen while the next page loads, so
 * the table dims instead of collapsing to a spinner. Without it every keystroke in
 * the search box would blank the table.
 */

const STATUS_OPTIONS = [
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

const PRIORITY_OPTIONS = [
  { value: "", label: "Any" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

export function ShipmentsTableApi({
  shipments,
  total,
  page,
  perPage,
  lastPage,
  facilities,
  carriers,
}: {
  shipments: Shipment[];
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  facilities: Facility[];
  carriers: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = React.useTransition();

  // Local mirror of the search box so typing stays responsive while the server
  // catches up. The URL is only updated after a pause.
  const [search, setSearch] = React.useState(params.get("search") ?? "");

  const setParam = React.useCallback(
    (updates: Record<string, string | number | undefined>) => {
      const next = new URLSearchParams(params.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "" || value === "active") next.delete(key);
        else next.set(key, String(value));
      }
      // Any change to a filter invalidates the current page offset.
      if (!("page" in updates)) next.delete("page");

      startTransition(() => {
        router.replace(`/shipments${next.toString() ? `?${next}` : ""}`, { scroll: false });
      });
    },
    [params, router],
  );

  // Debouncing: wait until typing stops before asking the server. Without it,
  // "Rotterdam" would fire nine requests and the answers could arrive out of order.
  React.useEffect(() => {
    const current = params.get("search") ?? "";
    if (search === current) return;

    const timer = setTimeout(() => setParam({ search: search || undefined }), 350);
    return () => clearTimeout(timer);
  }, [search, params, setParam]);

  const placeOptions = React.useMemo(
    () => [{ value: "", label: "Any" }, ...facilities.map((f) => ({ value: f.code, label: f.city }))],
    [facilities],
  );

  const carrierOptions = React.useMemo(
    () => [{ value: "", label: "Any" }, ...carriers.map((c) => ({ value: c, label: c }))],
    [carriers],
  );

  const sort = params.get("sort") ?? "eta";
  const sortState = {
    key: sort.replace("-", ""),
    dir: sort.startsWith("-") ? ("desc" as const) : ("asc" as const),
  };

  const columns = React.useMemo<Column<Shipment>[]>(
    () => [
      {
        key: "ref",
        header: "Shipment",
        sortable: true,
        width: "9.5rem",
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
        render: (r) => <span className="text-ink-2">{r.origin.city}</span>,
      },
      {
        key: "destination",
        header: "Destination",
        render: (r) => <span className="text-ink">{r.destination.city}</span>,
      },
      {
        key: "carrier",
        header: "Carrier",
        hideBelow: "xl",
        render: (r) => <span className="text-ink-2">{r.carrier}</span>,
      },
      {
        key: "vehicle",
        header: "Vehicle",
        hideBelow: "lg",
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
        render: (r) => <StatusBadge status={r.status} />,
      },
      {
        key: "eta",
        header: "ETA",
        numeric: true,
        sortable: true,
        width: "7rem",
        render: (r) => (
          <span className="block">
            <span className="text-ink">{formatWhen(r.deliveredAt ?? r.eta)}</span>
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
        render: (r) => <span className="text-ink-2">{formatTonnes(r.weightTonnes)}</span>,
      },
      {
        key: "priority",
        header: "Priority",
        hideBelow: "sm",
        sortable: true,
        width: "6.5rem",
        render: (r) => <PriorityTag priority={r.priority} />,
      },
    ],
    [],
  );

  const toggleSort = (key: string) => {
    const current = params.get("sort") ?? "eta";
    const next = current === key ? `-${key}` : current === `-${key}` ? "eta" : key;
    setParam({ sort: next === "eta" ? undefined : next });
  };

  const activeCount =
    (params.get("status") ? 1 : 0) +
    (params.get("priority") ? 1 : 0) +
    (params.get("origin") ? 1 : 0) +
    (params.get("destination") ? 1 : 0) +
    (params.get("carrier") ? 1 : 0) +
    (search ? 1 : 0);

  const reset = () => {
    setSearch("");
    startTransition(() => router.replace("/shipments", { scroll: false }));
  };

  return (
    <>
      <div className="border-line flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
        <SearchInput
          label="Search shipments"
          value={search}
          onValueChange={setSearch}
          placeholder="Shipment, reference, customer, cargo"
          className="w-full sm:w-72"
        />
        <FilterMenu
          label="Status"
          value={params.get("status") ?? "active"}
          options={STATUS_OPTIONS}
          onChange={(v) => setParam({ status: v })}
        />
        <FilterMenu
          label="From"
          value={params.get("origin") ?? ""}
          options={placeOptions}
          onChange={(v) => setParam({ origin: v })}
        />
        <FilterMenu
          label="To"
          value={params.get("destination") ?? ""}
          options={placeOptions}
          onChange={(v) => setParam({ destination: v })}
        />
        <FilterMenu
          label="Carrier"
          value={params.get("carrier") ?? ""}
          options={carrierOptions}
          onChange={(v) => setParam({ carrier: v })}
        />
        <FilterMenu
          label="Priority"
          value={params.get("priority") ?? ""}
          options={PRIORITY_OPTIONS}
          onChange={(v) => setParam({ priority: v })}
        />
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="size-3.5" aria-hidden />
            Clear {activeCount}
          </Button>
        )}
        <span className="text-ink-3 ml-auto text-small tabular-nums">
          {total.toLocaleString("en-GB")} matching
        </span>
      </div>

      {/* Dimmed rather than replaced, so the table never jumps while paging. */}
      <div className={cn("transition-opacity duration-150", pending && "pointer-events-none opacity-55")}>
        <DataTable
          caption="Shipments"
          columns={columns}
          rows={shipments}
          rowKey={(r) => r.id}
          sort={sortState}
          onSort={toggleSort}
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
      </div>

      {total > 0 && (
        <TablePager
          page={page - 1}
          pageSize={perPage}
          total={total}
          onPage={(p) => setParam({ page: p + 1 })}
        />
      )}
      <span className="sr-only" aria-live="polite">
        {pending ? "Loading shipments" : `Page ${page} of ${lastPage}`}
      </span>
    </>
  );
}
