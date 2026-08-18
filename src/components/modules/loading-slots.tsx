"use client";

import * as React from "react";
import { DAY_END, DAY_START, FACILITIES, planForDay } from "@/lib/data";
import { FilterMenu } from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, i) => DAY_START / 60 + i);

/**
 * Dock occupancy for one site. Rows are dock doors, so a planner can see at a glance
 * which bays are free and where two vehicles have been booked into the same slot.
 */
export function LoadingSlots() {
  const [facilityId, setFacilityId] = React.useState(FACILITIES[0].id);
  const facility = FACILITIES.find((f) => f.id === facilityId)!;
  const rows = React.useMemo(() => planForDay(0), []);

  const bookings = React.useMemo(
    () =>
      rows.flatMap((r) =>
        r.blocks
          .filter((b) => b.facilityId === facilityId && b.dock !== undefined)
          .map((b) => ({ ...b, vehicleId: r.vehicleId })),
      ),
    [rows, facilityId],
  );

  const docks = React.useMemo(() => {
    const used = [...new Set(bookings.map((b) => b.dock!))].sort((a, b) => a - b);
    // Always show a workable strip of bays, even when only a few are booked.
    const shown = new Set(used);
    for (let d = 1; shown.size < 8 && d <= facility.dockDoors; d++) shown.add(d);
    return [...shown].sort((a, b) => a - b).slice(0, 10);
  }, [bookings, facility.dockDoors]);

  const span = DAY_END - DAY_START;
  const pct = (m: number) => ((m - DAY_START) / span) * 100;

  return (
    <div className="flex h-full flex-col">
      <header className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
        <div>
          <h2 className="text-ink text-body-lg font-semibold">Loading slots</h2>
          <p className="text-ink-2 text-small mt-0.5 tabular-nums">
            {bookings.length} bookings · {facility.dockDoors} bays on site
          </p>
        </div>
        <FilterMenu
          label="Site"
          value={facilityId}
          options={FACILITIES.map((f) => ({ value: f.id, label: f.name }))}
          onChange={setFacilityId}
          align="end"
        />
      </header>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        <div className="text-ink-3 border-line flex border-b px-5 py-1.5 text-caption">
          <span className="w-14 shrink-0">Bay</span>
          <span className="relative flex-1">
            {HOURS.filter((h) => h % 3 === 0).map((h) => (
              <span
                key={h}
                className="absolute -translate-x-1/2 tabular-nums"
                style={{ left: `${pct(h * 60)}%` }}
              >
                {String(h).padStart(2, "0")}
              </span>
            ))}
          </span>
        </div>

        <ul>
          {docks.map((dock) => {
            const slots = bookings.filter((b) => b.dock === dock);
            return (
              <li key={dock} className="border-line flex items-center border-b px-5 py-1.5 last:border-b-0">
                <span className="text-ink-2 w-14 shrink-0 text-caption font-medium tabular-nums">
                  {String(dock).padStart(2, "0")}
                </span>
                <span className="bg-surface-sunken relative h-5 flex-1 overflow-hidden rounded-[4px]">
                  {slots.map((s) => (
                    <span
                      key={s.id}
                      title={`${s.vehicleId} · ${s.label}`}
                      className={cn(
                        "absolute inset-y-0 rounded-[3px] border px-1 text-caption leading-5 font-medium",
                        s.conflict
                          ? "bg-critical-soft border-critical-border text-critical-text"
                          : s.kind === "load"
                            ? "bg-warning-soft border-warning-border text-warning-text"
                            : "bg-info-soft border-info-border text-info-text",
                      )}
                      style={{
                        left: `${pct(s.start)}%`,
                        width: `calc(${pct(s.end) - pct(s.start)}% - 1px)`,
                      }}
                    >
                      <span className="block truncate">{s.vehicleId}</span>
                    </span>
                  ))}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
