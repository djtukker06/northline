"use client";

import { AlertOctagon, CheckCircle2, Clock3, DoorClosed, UserX } from "lucide-react";
import { planForDay, type ConflictKind } from "@/lib/data";
import { cn } from "@/lib/utils";

const ICON: Record<ConflictKind, React.ComponentType<{ className?: string }>> = {
  overlap: AlertOctagon,
  "driving-hours": Clock3,
  "dock-clash": DoorClosed,
  "window-missed": Clock3,
  unassigned: UserX,
};

/**
 * Everything on the board that will not work as planned, gathered in one place so a
 * planner does not have to scan the timeline to find the exceptions.
 */
export function ConflictPanel({ dayOffset = 0 }: { dayOffset?: number }) {
  const rows = planForDay(dayOffset);
  const items = rows.flatMap((r) =>
    r.conflicts.map((c) => ({ ...c, vehicleId: r.vehicleId, driverName: r.driverName })),
  );

  return (
    <div className="flex h-full flex-col">
      <header className="border-line flex items-center justify-between gap-3 border-b px-5 py-3">
        <div>
          <h2 className="text-ink text-body-lg font-semibold">Conflicts</h2>
          <p className="text-ink-2 text-small mt-0.5 tabular-nums">
            {items.length} to resolve before despatch
          </p>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
          <span className="bg-success-soft text-success-text mb-3 grid size-10 place-items-center rounded-full">
            <CheckCircle2 className="size-5" />
          </span>
          <p className="text-ink text-small font-semibold">The board is clean</p>
          <p className="text-ink-2 text-caption mt-1">
            Every allocation on this date has a driver, a dock and enough hours.
          </p>
        </div>
      ) : (
        <ul className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
          {items.map((c, i) => {
            const Icon = ICON[c.kind];
            return (
              <li
                key={`${c.vehicleId}-${c.kind}-${i}`}
                className="border-line flex gap-2.5 border-b px-5 py-3 last:border-b-0"
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
                    c.kind === "overlap" || c.kind === "unassigned"
                      ? "bg-critical-soft text-critical-text"
                      : "bg-warning-soft text-warning-text",
                  )}
                >
                  <Icon className="size-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink text-small font-medium">{c.label}</p>
                  <p className="text-ink-2 text-caption mt-0.5">{c.detail}</p>
                  <p className="text-ink-3 mt-1 text-caption">
                    {c.vehicleId} · {c.driverName}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
