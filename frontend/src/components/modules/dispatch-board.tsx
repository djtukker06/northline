"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertOctagon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  TriangleAlert,
  Truck,
} from "lucide-react";
import {
  BLOCK_LABEL,
  DAY_END,
  DAY_START,
  FACILITY_BY_ID,
  REGION_LABEL,
  VEHICLE_CLASS_LABEL,
  planForDay,
  type PlanBlock,
  type PlanRow,
} from "@/lib/data";
import type { Region, VehicleClass } from "@/lib/data/types";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { FilterMenu } from "@/components/ui/dropdown";
import { Segmented } from "@/components/ui/segmented";
import { Badge } from "@/components/ui/status";
import { Drawer } from "@/components/ui/drawer";
import { DetailRow } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/states";
import { Tooltip } from "@/components/ui/tooltip";
import { cn, formatDuration, formatFullDate, NOW } from "@/lib/utils";

const HOURS = Array.from(
  { length: (DAY_END - DAY_START) / 60 + 1 },
  (_, i) => DAY_START / 60 + i,
);

const BLOCK_STYLE: Record<PlanBlock["kind"], string> = {
  load: "bg-warning-soft border-warning-border text-warning-text",
  haul: "bg-brand-soft border-brand-border text-brand",
  unload: "bg-info-soft border-info-border text-info-text",
  rest: "bg-neutral-soft border-line text-ink-3",
  maintenance: "bg-critical-soft border-critical-border text-critical-text",
};

const REGION_OPTIONS = [
  { value: "all" as const, label: "All regions" },
  ...(Object.keys(REGION_LABEL) as Region[]).map((r) => ({ value: r, label: REGION_LABEL[r] })),
];

const CLASS_OPTIONS = [
  { value: "all" as const, label: "All types" },
  ...(Object.keys(VEHICLE_CLASS_LABEL) as VehicleClass[]).map((c) => ({
    value: c,
    label: VEHICLE_CLASS_LABEL[c],
  })),
];

function minutesToLabel(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/**
 * Dispatch timeline. Rows are vehicles, columns are the working day. Everything is
 * positioned as a percentage of the visible window so the board reflows with the
 * viewport instead of needing a fixed pixel grid.
 */
export function DispatchBoard() {
  const [dayOffset, setDayOffset] = React.useState(0);
  const [region, setRegion] = React.useState<Region | "all">("all");
  const [vehicleClass, setVehicleClass] = React.useState<VehicleClass | "all">("all");
  const [only, setOnly] = React.useState<"all" | "conflicts">("all");
  const [selected, setSelected] = React.useState<{ row: PlanRow; block: PlanBlock } | null>(null);

  const allRows = React.useMemo(() => planForDay(dayOffset), [dayOffset]);

  const rows = React.useMemo(
    () =>
      allRows.filter(
        (r) =>
          (region === "all" || r.region === region) &&
          (vehicleClass === "all" || r.vehicleClass === vehicleClass) &&
          (only === "all" || r.conflicts.length > 0),
      ),
    [allRows, region, vehicleClass, only],
  );

  const conflictCount = allRows.reduce((s, r) => s + r.conflicts.length, 0);
  const span = DAY_END - DAY_START;
  const pct = (m: number) => ((m - DAY_START) / span) * 100;

  const date = new Date(NOW.getTime() + dayOffset * 86_400_000);
  const nowPct = dayOffset === 0 ? pct(14 * 60 + 20) : null;

  return (
    <>
      <Panel>
        <header className="border-line flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2.5">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous day"
              onClick={() => setDayOffset((d) => d - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-ink inline-flex min-w-[11rem] items-center justify-center gap-1.5 text-small font-semibold">
              <CalendarDays className="text-ink-3 size-3.5" aria-hidden />
              {dayOffset === 0 ? "Today" : formatFullDate(date).replace(/,.*/, "")}
              <span className="text-ink-3 font-normal">
                {formatFullDate(date).replace(/^\w+, /, "")}
              </span>
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next day"
              onClick={() => setDayOffset((d) => d + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
            {dayOffset !== 0 && (
              <Button variant="ghost" size="sm" onClick={() => setDayOffset(0)}>
                Today
              </Button>
            )}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <FilterMenu label="Region" value={region} options={REGION_OPTIONS} onChange={setRegion} />
            <FilterMenu label="Type" value={vehicleClass} options={CLASS_OPTIONS} onChange={setVehicleClass} />
            <Segmented
              label="Filter rows"
              value={only}
              onChange={setOnly}
              options={[
                { value: "all", label: `All ${allRows.length}` },
                { value: "conflicts", label: `Conflicts ${conflictCount}` },
              ]}
            />
          </div>
        </header>

        {rows.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Nothing scheduled in this view"
            description="No vehicle matches the current filters for this date."
            action={{
              label: "Show all vehicles",
              onClick: () => {
                setRegion("all");
                setVehicleClass("all");
                setOnly("all");
              },
            }}
          />
        ) : (
          <div className="scrollbar-thin max-h-[34rem] overflow-auto">
            <div className="min-w-[56rem]">
              {/* Time ruler */}
              <div className="border-line bg-surface-soft sticky top-0 z-10 flex border-b">
                <div className="border-line label-eyebrow w-52 shrink-0 border-r px-4 py-2">
                  Vehicle
                </div>
                <div className="relative flex-1 py-2">
                  {HOURS.map((h) => (
                    <span
                      key={h}
                      className="text-ink-3 absolute -translate-x-1/2 text-caption tabular-nums"
                      style={{ left: `${pct(h * 60)}%` }}
                    >
                      {String(h).padStart(2, "0")}
                    </span>
                  ))}
                </div>
              </div>

              <ul>
                {rows.map((row) => (
                  <li key={row.vehicleId} className="border-line flex border-b last:border-b-0">
                    <div className="border-line w-52 shrink-0 border-r px-4 py-2">
                      <p className="text-ink text-small font-medium">{row.vehicleId}</p>
                      <p className="text-ink-3 truncate text-caption">{row.driverName}</p>
                      <p className="text-ink-3 mt-0.5 text-caption tabular-nums">
                        {formatDuration(row.committedMinutes)} committed
                      </p>
                    </div>

                    <div className="relative min-h-[3.75rem] flex-1">
                      {/* Hour rules sit behind the blocks. */}
                      {HOURS.map((h) => (
                        <span
                          key={h}
                          className="bg-line absolute inset-y-0 w-px opacity-60"
                          style={{ left: `${pct(h * 60)}%` }}
                          aria-hidden
                        />
                      ))}
                      {nowPct !== null && (
                        <span
                          className="bg-brand absolute inset-y-0 z-10 w-px"
                          style={{ left: `${nowPct}%` }}
                          aria-hidden
                        />
                      )}

                      {row.blocks.map((block, i) => {
                        const left = pct(block.start);
                        const width = pct(block.end) - left;
                        // Overlapping allocations are stacked so both stay visible.
                        const overlapping = row.blocks.some(
                          (b, j) => j < i && b.end > block.start && b.kind === "haul" && block.kind === "haul",
                        );
                        return (
                          <Tooltip
                            key={block.id}
                            content={
                              <span>
                                {block.label}
                                <br />
                                {minutesToLabel(block.start)} to {minutesToLabel(block.end)}
                                {block.conflict ? ` · ${block.conflict.label}` : ""}
                              </span>
                            }
                          >
                            <button
                              type="button"
                              onClick={() => setSelected({ row, block })}
                              className={cn(
                                "absolute flex items-center gap-1 overflow-hidden rounded-[5px] border px-1.5 text-caption font-medium transition-[filter,box-shadow]",
                                "hover:brightness-[0.97] hover:shadow-sm",
                                BLOCK_STYLE[block.kind],
                                block.conflict &&
                                  "ring-critical/60 ring-2 ring-offset-1 ring-offset-[var(--nl-surface)]",
                              )}
                              style={{
                                left: `${left}%`,
                                width: `calc(${width}% - 2px)`,
                                top: overlapping ? "1.9rem" : "0.45rem",
                                height: "1.5rem",
                              }}
                            >
                              {block.conflict && (
                                <TriangleAlert className="text-critical size-3 shrink-0" aria-hidden />
                              )}
                              <span className="truncate">{block.label}</span>
                            </button>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <footer className="border-line flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t px-4 py-2.5">
          {(Object.keys(BLOCK_LABEL) as PlanBlock["kind"][]).map((kind) => (
            <span key={kind} className="text-ink-2 text-caption flex items-center gap-1.5">
              <span
                className={cn("size-2.5 rounded-[3px] border", BLOCK_STYLE[kind])}
                aria-hidden
              />
              {BLOCK_LABEL[kind]}
            </span>
          ))}
          <span className="text-ink-2 text-caption ml-auto flex items-center gap-1.5">
            <span className="bg-brand h-3 w-px" aria-hidden />
            Now 14:20
          </span>
        </footer>
      </Panel>

      <Drawer
        open={Boolean(selected)}
        onOpenChange={(v) => !v && setSelected(null)}
        title={selected?.block.label ?? ""}
        description={selected ? `${selected.row.vehicleId} · ${selected.row.driverName}` : undefined}
        width="24rem"
      >
        {selected && <BlockDetail row={selected.row} block={selected.block} />}
      </Drawer>
    </>
  );
}

function BlockDetail({ row, block }: { row: PlanRow; block: PlanBlock }) {
  const facility = block.facilityId ? FACILITY_BY_ID.get(block.facilityId) : null;

  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2">
        <Badge tone={block.kind === "maintenance" ? "critical" : "brand"}>
          {BLOCK_LABEL[block.kind]}
        </Badge>
        {block.conflict && (
          <Badge tone="critical" dot>
            {block.conflict.label}
          </Badge>
        )}
      </div>

      {block.conflict && (
        <div className="border-critical-border bg-critical-soft mt-3 flex gap-2.5 rounded-well border p-3">
          <AlertOctagon className="text-critical-text mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="text-ink text-small font-medium">{block.conflict.label}</p>
            <p className="text-ink-2 text-caption mt-0.5">{block.conflict.detail}</p>
          </div>
        </div>
      )}

      <dl className="mt-3">
        <DetailRow label="Window">
          {minutesToLabel(block.start)} to {minutesToLabel(block.end)}
        </DetailRow>
        <DetailRow label="Duration">{formatDuration(block.end - block.start)}</DetailRow>
        <DetailRow label="Vehicle">
          <Link href={`/fleet?vehicle=${row.vehicleId}`} className="text-brand hover:underline">
            {row.vehicleId}
          </Link>
        </DetailRow>
        <DetailRow label="Model">{row.vehicleModel}</DetailRow>
        <DetailRow label="Driver">{row.driverName}</DetailRow>
        {facility && <DetailRow label="Facility">{facility.name}</DetailRow>}
        {block.dock !== undefined && <DetailRow label="Dock">{block.dock}</DetailRow>}
        {block.routeId && (
          <DetailRow label="Route">
            <Link href={`/routes?route=${block.routeId}`} className="text-brand hover:underline">
              {block.routeId}
            </Link>
          </DetailRow>
        )}
        <DetailRow label="Day committed">{formatDuration(row.committedMinutes)}</DetailRow>
      </dl>

      {block.shipmentIds.length > 0 && (
        <>
          <p className="label-eyebrow mt-4 mb-2">Consignments</p>
          <ul className="space-y-1.5">
            {block.shipmentIds.map((id) => (
              <li key={id}>
                <Link
                  href={`/shipments/${id}`}
                  className="border-line hover:bg-surface-soft flex items-center justify-between gap-2 rounded-well border px-2.5 py-2 text-small transition-colors"
                >
                  <span className="text-ink font-medium">{id}</span>
                  <Clock className="text-ink-3 size-3.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
