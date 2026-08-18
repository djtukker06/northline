import type { Metadata } from "next";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { AnalyticsView } from "@/components/modules/analytics-view";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <div className="mx-auto flex max-w-[112rem] flex-col gap-4 p-4 sm:p-5">
      <PageHeader
        title="Analytics"
        description="Delivery performance, cost and efficiency across the European network."
        actions={
          <Button variant="secondary">
            <Download className="size-4" aria-hidden />
            Export report
          </Button>
        }
      />
      <AnalyticsView />
    </div>
  );
}
