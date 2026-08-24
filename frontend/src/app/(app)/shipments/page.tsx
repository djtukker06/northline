import type { Metadata } from "next";
import { Suspense } from "react";
import { Download, Plus } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { ShipmentsTableApi } from "@/components/modules/shipments-table-api";
import { ApiErrorState } from "@/components/modules/api-error-state";
import { TableSkeleton } from "@/components/ui/states";
import { getFacilities, getKpis, getShipments } from "@/lib/api/queries";
import { ApiError } from "@/lib/api/client";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Shipments" };

/*
 * This page reads live data, so it must not be baked at build time. Without this
 * Next.js would prerender it once during `npm run build` and serve that snapshot
 * for ever, which for an operations board is worse than being slow.
 */
export const dynamic = "force-dynamic";

const CARRIERS = [
  "Northline Freight", "Meridian Cargo", "Hansa Transport", "Corso Logistics",
  "Iberia Directa", "Baltic Line", "Vantage Road",
];

export default async function ShipmentsPage(props: PageProps<"/shipments">) {
  const params = await props.searchParams;

  const read = (key: string): string | undefined => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  return (
    <div className="mx-auto flex max-w-[112rem] flex-col gap-4 p-4 sm:p-5">
      <PageHeader
        title="Shipments"
        description="Every consignment on the network, from booking to proof of delivery."
        actions={
          <>
            <Button variant="secondary">
              <Download className="size-4" aria-hidden />
              Export
            </Button>
            <Button variant="primary">
              <Plus className="size-4" aria-hidden />
              Book shipment
            </Button>
          </>
        }
      />

      {/*
        Two Suspense boundaries rather than one. The summary and the table are
        independent requests, so each streams in when it is ready instead of the
        page waiting for the slower of the two.
      */}
      <Suspense fallback={<SummarySkeleton />}>
        <ShipmentSummary />
      </Suspense>

      <Panel>
        <Suspense key={JSON.stringify(params)} fallback={<TableSkeleton rows={12} cols={8} />}>
          <ShipmentList
            page={Number(read("page") ?? 1)}
            status={read("status")}
            priority={read("priority")}
            origin={read("origin")}
            destination={read("destination")}
            carrier={read("carrier")}
            search={read("search")}
            sort={read("sort")}
          />
        </Suspense>
      </Panel>
    </div>
  );
}

async function ShipmentSummary() {
  let kpis;

  /*
   * The try/catch wraps only the await, never the JSX below it. Returning markup
   * from inside a try block implies the catch would handle a child's render error,
   * and it will not: by the time React renders the child, this function has already
   * returned. Render errors belong to an error boundary (error.tsx).
   */
  try {
    kpis = await getKpis();
  } catch (error) {
    return <ApiErrorState error={error} what="the network summary" compact />;
  }

  const byStatus = kpis.shipmentsByStatus ?? {};

  const cells = [
    { label: "Active", value: formatNumber(kpis.activeShipments) },
    { label: "In transit", value: formatNumber(byStatus["in-transit"] ?? 0) },
    { label: "At risk", value: formatNumber(byStatus["at-risk"] ?? 0), tone: "warning" as const },
    { label: "Delayed", value: formatNumber(byStatus.delayed ?? 0), tone: "critical" as const },
    { label: "In customs", value: formatNumber(byStatus.customs ?? 0) },
    { label: "Freight moving", value: `${formatNumber(kpis.freightTonnes)} t` },
  ];

  return (
    <div className="bg-surface border-line rounded-panel grid grid-cols-2 overflow-hidden border sm:grid-cols-3 lg:grid-cols-6">
      {cells.map((cell, i) => (
        <div
          key={cell.label}
          className={
            "border-line px-4 py-3 " +
            (i % 2 === 1 ? "border-l " : "") +
            "sm:border-l sm:[&:nth-child(3n+1)]:border-l-0 lg:[&:nth-child(3n+1)]:border-l lg:first:border-l-0 " +
            (i >= 2 ? "border-t sm:[&:nth-child(-n+3)]:border-t-0 " : "") +
            "lg:border-t-0"
          }
        >
          <p className="text-ink-2 text-small">{cell.label}</p>
          <p
            className={
              "mt-1 text-h2 font-semibold tabular-nums " +
              (cell.tone === "critical"
                ? "text-critical-text"
                : cell.tone === "warning"
                  ? "text-warning-text"
                  : "text-ink")
            }
          >
            {cell.value}
          </p>
        </div>
      ))}
    </div>
  );
}

async function ShipmentList(query: {
  page: number;
  status?: string;
  priority?: string;
  origin?: string;
  destination?: string;
  carrier?: string;
  search?: string;
  sort?: string;
}) {
  let shipments;
  let facilities;

  try {
    // Both requests leave at once. Awaiting them in sequence would make the page
    // as slow as the sum of the two instead of the slower one.
    [shipments, facilities] = await Promise.all([
      getShipments({ ...query, per_page: 25 }),
      getFacilities(),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 422) {
      return (
        <ApiErrorState
          error={error}
          what="these filters"
          hint="The API rejected one of the filter values. Clear the filters and try again."
        />
      );
    }
    return <ApiErrorState error={error} what="the shipment list" />;
  }

  return (
    <ShipmentsTableApi
      shipments={shipments.data}
      total={shipments.meta.total}
      page={shipments.meta.current_page}
      perPage={shipments.meta.per_page}
      lastPage={shipments.meta.last_page}
      facilities={facilities}
      carriers={CARRIERS}
    />
  );
}

function SummarySkeleton() {
  return (
    <div className="bg-surface border-line rounded-panel grid grid-cols-2 overflow-hidden border sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border-line px-4 py-3 [&:not(:first-child)]:border-l">
          <div className="skeleton h-3.5 w-20 rounded-control" />
          <div className="skeleton mt-2 h-6 w-16 rounded-control" />
        </div>
      ))}
    </div>
  );
}
