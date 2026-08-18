import type { Metadata } from "next";
import { Suspense } from "react";
import { Download } from "lucide-react";
import { PageHeader, Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { WarehouseBoard } from "@/components/modules/warehouse-board";
import { WarehouseGeography } from "@/components/modules/warehouse-geography";
import { FACILITIES } from "@/lib/data";
import { formatNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/states";

export const metadata: Metadata = { title: "Warehouses" };

export default function WarehousesPage() {
  const totalPositions = FACILITIES.reduce((s, f) => s + f.palletPositions, 0);
  const stored = FACILITIES.reduce((s, f) => s + f.palletsStored, 0);
  const inbound = FACILITIES.reduce((s, f) => s + f.inbound, 0);
  const outbound = FACILITIES.reduce((s, f) => s + f.outbound, 0);
  const staff = FACILITIES.reduce((s, f) => s + f.staffOnShift, 0);
  const nearCapacity = FACILITIES.filter((f) => f.capacityPct >= 88).length;

  const summary = [
    { label: "Facilities", value: formatNumber(FACILITIES.length) },
    { label: "Network capacity", value: `${((stored / totalPositions) * 100).toFixed(1)}%` },
    { label: "Pallets stored", value: formatNumber(stored) },
    { label: "Inbound today", value: formatNumber(inbound) },
    { label: "Outbound today", value: formatNumber(outbound) },
    { label: "Staff on shift", value: formatNumber(staff) },
  ];

  return (
    <div className="mx-auto flex max-w-[112rem] flex-col gap-4 p-4 sm:p-5">
      <PageHeader
        title="Warehouses"
        description={
          nearCapacity > 0
            ? `${nearCapacity} of ${FACILITIES.length} sites are running near or above their capacity threshold.`
            : "Every site is operating inside its capacity threshold."
        }
        actions={
          <Button variant="secondary">
            <Download className="size-4" aria-hidden />
            Export
          </Button>
        }
      />

      <div className="bg-surface border-line rounded-panel grid grid-cols-2 overflow-hidden border sm:grid-cols-3 lg:grid-cols-6">
        {summary.map((s, i) => (
          <div
            key={s.label}
            className={
              "border-line px-4 py-3 " +
              (i % 2 === 1 ? "border-l " : "") +
              "sm:border-l sm:[&:nth-child(3n+1)]:border-l-0 lg:[&:nth-child(3n+1)]:border-l lg:first:border-l-0 " +
              (i >= 2 ? "border-t sm:[&:nth-child(-n+3)]:border-t-0 " : "") +
              "lg:border-t-0"
            }
          >
            <p className="text-ink-2 text-small">{s.label}</p>
            <p className="text-ink mt-1 text-h2 font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <Suspense fallback={<Skeleton className="h-[22rem] w-full rounded-panel" />}>
        <WarehouseGeography />
      </Suspense>

      <Panel>
        <PanelHeader
          title="All facilities"
          description="Select a site to inspect capacity, staffing and open alerts"
        />
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <WarehouseBoard />
        </Suspense>
      </Panel>
    </div>
  );
}
