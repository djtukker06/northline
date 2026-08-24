import type { Metadata } from "next";
import { Download } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { KpiStrip } from "@/components/modules/kpi-strip";
import { OperationsWorkspace } from "@/components/modules/operations-workspace";
import { DeliveryPerformance } from "@/components/modules/delivery-performance";
import { FleetStatus } from "@/components/modules/fleet-status";
import { WarehouseOperations } from "@/components/modules/warehouse-operations";
import { AttentionRequired } from "@/components/modules/attention-required";
import { formatFullDate, NOW } from "@/lib/utils";

export const metadata: Metadata = { title: "Operations Overview" };

export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-[112rem] flex-col gap-4 p-4 sm:p-5">
      <PageHeader
        title="Operations Overview"
        description="Real-time view of your logistics network."
        actions={
          <>
            <span className="text-ink-2 border-line bg-surface hidden h-9 items-center rounded-control border px-3 text-small font-medium sm:inline-flex">
              Today · {formatFullDate(NOW).replace(/^\w+, /, "")}
            </span>
            <Button variant="primary">
              <Download className="size-4" aria-hidden />
              Export report
            </Button>
          </>
        }
      />

      <KpiStrip />
      <OperationsWorkspace />

      {/* Performance carries the widest column: it is the reading that takes longest. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <DeliveryPerformance />
        </Panel>
        <Panel>
          <AttentionRequired />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <FleetStatus />
        </Panel>
        <Panel>
          <WarehouseOperations />
        </Panel>
      </div>
    </div>
  );
}
