import type { Metadata } from "next";
import { Download, Plus } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { ShipmentsTable } from "@/components/modules/shipments-table";
import { SHIPMENT_STATUS_COUNTS, ACTIVE_SHIPMENT_COUNT, FREIGHT_IN_TRANSIT } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Shipments" };

const SUMMARY = [
  { label: "Active", value: formatNumber(ACTIVE_SHIPMENT_COUNT) },
  { label: "In transit", value: formatNumber(SHIPMENT_STATUS_COUNTS["in-transit"]) },
  { label: "At risk", value: formatNumber(SHIPMENT_STATUS_COUNTS["at-risk"]), tone: "warning" },
  { label: "Delayed", value: formatNumber(SHIPMENT_STATUS_COUNTS.delayed), tone: "critical" },
  { label: "In customs", value: formatNumber(SHIPMENT_STATUS_COUNTS.customs) },
  { label: "Freight moving", value: `${formatNumber(FREIGHT_IN_TRANSIT)} t` },
] as const;

export default function ShipmentsPage() {
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

      <div className="bg-surface border-line rounded-panel grid grid-cols-2 overflow-hidden border sm:grid-cols-3 lg:grid-cols-6">
        {SUMMARY.map((s, i) => (
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
            <p
              className={
                "mt-1 text-h2 font-semibold tabular-nums " +
                ("tone" in s && s.tone === "critical"
                  ? "text-critical-text"
                  : "tone" in s && s.tone === "warning"
                    ? "text-warning-text"
                    : "text-ink")
              }
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <Panel>
        <ShipmentsTable />
      </Panel>
    </div>
  );
}
