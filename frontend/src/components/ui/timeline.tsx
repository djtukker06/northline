import * as React from "react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";
import type { ShipmentEvent } from "@/lib/data/types";

const STATE_STYLE: Record<ShipmentEvent["state"], { dot: string; ring: string }> = {
  completed: { dot: "bg-success", ring: "border-success/30" },
  active: { dot: "bg-brand", ring: "border-brand/35" },
  exception: { dot: "bg-warning", ring: "border-warning/35" },
  planned: { dot: "bg-ink-3/50", ring: "border-line" },
};

/** Vertical progress list for shipment and route milestones. */
export function Timeline({
  events,
  className,
}: {
  events: ShipmentEvent[];
  className?: string;
}) {
  return (
    <ol className={cn("relative", className)}>
      {events.map((e, i) => {
        const style = STATE_STYLE[e.state];
        const last = i === events.length - 1;
        return (
          <li key={`${e.at}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
            {!last && (
              <span
                className={cn(
                  "absolute top-4 left-[5px] w-px",
                  "bottom-0",
                  e.state === "planned" ? "bg-line" : "bg-line-strong",
                )}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "relative mt-1 size-2.5 shrink-0 rounded-full border-2 border-[var(--nl-surface)]",
                style.dot,
                e.state === "active" && "ring-brand/25 ring-4",
              )}
              aria-hidden
            />
            <div className="-mt-0.5 min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p
                  className={cn(
                    "text-small font-medium",
                    e.state === "planned" ? "text-ink-2" : "text-ink",
                  )}
                >
                  {e.label}
                </p>
                <time
                  className="text-ink-3 text-caption shrink-0 tabular-nums"
                  dateTime={e.at}
                >
                  {formatTime(e.at)}
                </time>
              </div>
              {e.detail && <p className="text-ink-3 text-caption mt-0.5">{e.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
