import type { Metadata } from "next";
import { Suspense } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { RoutesBoard } from "@/components/modules/routes-board";
import { Skeleton } from "@/components/ui/states";
import { ROUTES } from "@/lib/data";

export const metadata: Metadata = { title: "Routes" };

export default function RoutesPage() {
  const delayed = ROUTES.filter((r) => r.status !== "on-schedule").length;

  return (
    <div className="mx-auto flex max-w-[112rem] flex-col gap-4 p-4 sm:p-5">
      <PageHeader
        title="Routes"
        description={
          delayed > 0
            ? `${delayed} of ${ROUTES.length} corridors are running behind plan.`
            : "Every corridor is running to plan."
        }
        actions={
          <Button variant="secondary">
            <Download className="size-4" aria-hidden />
            Export
          </Button>
        }
      />
      <Suspense fallback={<Skeleton className="h-[32rem] w-full rounded-panel" />}>
        <RoutesBoard />
      </Suspense>
    </div>
  );
}
