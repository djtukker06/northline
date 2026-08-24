"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Clock,
  Flag,
  Thermometer,
  TriangleAlert,
  Truck,
  Warehouse,
  Wrench,
} from "lucide-react";
import { OPS_EVENTS } from "@/lib/data";
import type { OpsEvent } from "@/lib/data/types";
import { cn, formatTime, relativeTime } from "@/lib/utils";
import { Segmented } from "@/components/ui/segmented";

const KIND_ICON: Record<OpsEvent["kind"], typeof Truck> = {
  departure: ArrowUpFromLine,
  arrival: ArrowDownToLine,
  border: Flag,
  capacity: Warehouse,
  delay: Clock,
  delivery: CheckCircle2,
  maintenance: Wrench,
  assignment: Truck,
  temperature: Thermometer,
};

const TONE_STYLE: Record<OpsEvent["tone"], string> = {
  neutral: "bg-surface-sunken text-ink-2",
  positive: "bg-success-soft text-success-text",
  warning: "bg-warning-soft text-warning-text",
  critical: "bg-critical-soft text-critical-text",
};

type Filter = "all" | "exceptions";

/**
 * Rolling activity feed. New events arrive on a timer so the board feels live,
 * but nothing moves under the cursor: entries only enter at the top.
 */
export function LiveOperations({ className }: { className?: string }) {
  const [filter, setFilter] = React.useState<Filter>("all");
  const [visibleCount, setVisibleCount] = React.useState(14);

  const events = React.useMemo(() => {
    const base =
      filter === "exceptions"
        ? OPS_EVENTS.filter((e) => e.tone === "warning" || e.tone === "critical")
        : OPS_EVENTS;
    return base.slice(0, visibleCount);
  }, [filter, visibleCount]);

  React.useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const timer = setInterval(() => {
      setVisibleCount((c) => (c >= 40 ? c : c + 1));
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <header className="border-line flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="bg-success absolute inline-flex size-2 animate-ping rounded-full opacity-60" />
            <span className="bg-success relative inline-flex size-2 rounded-full" />
          </span>
          <h2 className="text-ink text-body-lg font-semibold">Live operations</h2>
        </div>
        <Segmented
          size="sm"
          label="Filter activity"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "exceptions", label: "Exceptions" },
          ]}
        />
      </header>

      <ol className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {events.map((e, i) => {
          const Icon = KIND_ICON[e.kind];
          return (
            <li key={e.id} className={cn(i === 0 && "animate-fade-up")}>
              <Link
                href={e.href ?? "#"}
                className="hover:bg-surface-soft border-line flex items-start gap-2.5 border-b px-4 py-2.5 transition-colors"
              >
                <span
                  className={cn(
                    "mt-px grid size-6 shrink-0 place-items-center rounded-full",
                    TONE_STYLE[e.tone],
                  )}
                >
                  <Icon className="size-3" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-ink block text-small leading-snug">{e.message}</span>
                  <span className="text-ink-3 mt-0.5 block text-caption tabular-nums">
                    {formatTime(e.at)} · {relativeTime(e.at)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
        {events.length === 0 && (
          <li className="px-4 py-10 text-center">
            <TriangleAlert className="text-ink-3 mx-auto size-5" aria-hidden />
            <p className="text-ink text-small mt-2 font-medium">No exceptions right now</p>
            <p className="text-ink-2 text-caption mt-0.5">
              Every load on the network is inside its window.
            </p>
          </li>
        )}
      </ol>
    </div>
  );
}
