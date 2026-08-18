import type { Metadata } from "next";
import { Plus, Sparkles } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { DispatchBoard } from "@/components/modules/dispatch-board";
import { ConflictPanel } from "@/components/modules/conflict-panel";
import { LoadingSlots } from "@/components/modules/loading-slots";
import { planForDay } from "@/lib/data";

export const metadata: Metadata = { title: "Planning" };

export default function PlanningPage() {
  const rows = planForDay(0);
  const conflicts = rows.reduce((s, r) => s + r.conflicts.length, 0);

  return (
    <div className="mx-auto flex max-w-[112rem] flex-col gap-4 p-4 sm:p-5">
      <PageHeader
        title="Planning"
        description={
          conflicts > 0
            ? `${conflicts} allocations need resolving before tomorrow's despatch.`
            : "Every allocation is clear for despatch."
        }
        actions={
          <>
            <Button variant="secondary">
              <Sparkles className="size-4" aria-hidden />
              Auto-assign
            </Button>
            <Button variant="primary">
              <Plus className="size-4" aria-hidden />
              New allocation
            </Button>
          </>
        }
      />

      <DispatchBoard />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel className="lg:h-[24rem]">
          <ConflictPanel />
        </Panel>
        <Panel className="lg:h-[24rem]">
          <LoadingSlots />
        </Panel>
      </div>
    </div>
  );
}
