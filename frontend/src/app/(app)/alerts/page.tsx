import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/panel";
import { AlertsView } from "@/components/modules/alerts-view";
import { ALERT_COUNTS } from "@/lib/data";
import { Skeleton } from "@/components/ui/states";

export const metadata: Metadata = { title: "Alerts" };

export default function AlertsPage() {
  const open = ALERT_COUNTS.critical + ALERT_COUNTS.warning + ALERT_COUNTS.info;

  return (
    <div className="mx-auto flex max-w-[112rem] flex-col gap-4 p-4 sm:p-5">
      <PageHeader
        title="Alerts"
        description={
          ALERT_COUNTS.critical > 0
            ? `${ALERT_COUNTS.critical} critical and ${ALERT_COUNTS.warning} warnings across ${open} open items.`
            : `${open} open items, none critical.`
        }
      />
      <Suspense fallback={<Skeleton className="h-[40rem] w-full rounded-panel" />}>
        <AlertsView />
      </Suspense>
    </div>
  );
}
