import type { Metadata } from "next";
import { Suspense } from "react";
import { Download, Wrench } from "lucide-react";
import { PageHeader, Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { FleetTable } from "@/components/modules/fleet-table";
import { FleetStatus } from "@/components/modules/fleet-status";
import { DriverPerformance } from "@/components/modules/driver-performance";
import { TableSkeleton } from "@/components/ui/states";

export const metadata: Metadata = { title: "Fleet" };

export default function FleetPage() {
  return (
    <div className="mx-auto flex max-w-[112rem] flex-col gap-4 p-4 sm:p-5">
      <PageHeader
        title="Fleet"
        description="Vehicle availability, utilisation and driver performance across the network."
        actions={
          <>
            <Button variant="secondary">
              <Download className="size-4" aria-hidden />
              Export
            </Button>
            <Button variant="primary">
              <Wrench className="size-4" aria-hidden />
              Book maintenance
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <FleetStatus />
        </Panel>
        <Panel>
          <DriverPerformance />
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Vehicles" description="Select a vehicle to inspect its detail" />
        <Suspense fallback={<TableSkeleton rows={10} cols={7} />}>
          <FleetTable />
        </Suspense>
      </Panel>
    </div>
  );
}
