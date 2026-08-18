"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  DoorOpen,
  Users,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import {
  ACTIVE_SHIPMENTS,
  FACILITIES,
  FACILITY_BY_ID,
  REGION_LABEL,
  alertsForFacility,
} from "@/lib/data";
import type { Facility, Region } from "@/lib/data/types";
import { CapacityBar, StackedBar } from "@/components/ui/metric";
import { FacilityStatusBadge, SeverityBadge } from "@/components/ui/status";
import { FilterMenu } from "@/components/ui/dropdown";
import { Segmented } from "@/components/ui/segmented";
import { Drawer } from "@/components/ui/drawer";
import { DetailRow } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/states";
import { cn, formatDuration, formatNumber } from "@/lib/utils";

const REGION_OPTIONS = [
  { value: "all" as const, label: "All regions" },
  ...(Object.keys(REGION_LABEL) as Region[]).map((r) => ({ value: r, label: REGION_LABEL[r] })),
];

const KIND_OPTIONS = [
  { value: "all" as const, label: "All types" },
  { value: "distribution" as const, label: "Distribution" },
  { value: "hub" as const, label: "Hub" },
  { value: "cross-dock" as const, label: "Cross-dock" },
  { value: "port" as const, label: "Port" },
  { value: "rail" as const, label: "Rail" },
];

type SortKey = "capacity" | "throughput" | "name";

export function WarehouseBoard() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("facility");

  const [region, setRegion] = React.useState<Region | "all">("all");
  const [kind, setKind] = React.useState<Facility["kind"] | "all">("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("capacity");

  const select = (id: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (id) next.set("facility", id);
    else next.delete("facility");
    router.replace(`/warehouses${next.toString() ? `?${next}` : ""}`, { scroll: false });
  };

  const sites = React.useMemo(() => {
    const list = FACILITIES.filter(
      (f) => (region === "all" || f.region === region) && (kind === "all" || f.kind === kind),
    );
    return [...list].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "throughput") return b.throughputToday - a.throughputToday;
      return b.capacityPct - a.capacityPct;
    });
  }, [region, kind, sortKey]);

  const selected = selectedId ? FACILITY_BY_ID.get(selectedId) : null;

  return (
    <>
      <div className="border-line flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
        <FilterMenu label="Region" value={region} options={REGION_OPTIONS} onChange={setRegion} />
        <FilterMenu label="Type" value={kind} options={KIND_OPTIONS} onChange={setKind} />
        <Segmented
          label="Sort facilities"
          value={sortKey}
          onChange={setSortKey}
          className="ml-auto"
          options={[
            { value: "capacity", label: "Capacity" },
            { value: "throughput", label: "Throughput" },
            { value: "name", label: "Name" },
          ]}
        />
      </div>

      {sites.length === 0 ? (
        <EmptyState
          icon={WarehouseIcon}
          title="No facilities in this view"
          description="No site matches the selected region and type."
          action={{ label: "Show all regions", onClick: () => { setRegion("all"); setKind("all"); } }}
        />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {sites.map((f) => (
            <li
              key={f.id}
              className={cn(
                "border-line border-b",
                "md:[&:nth-child(odd)]:border-r xl:[&:nth-child(odd)]:border-r-0",
                "xl:[&:not(:nth-child(3n))]:border-r",
              )}
            >
              <button
                type="button"
                onClick={() => select(f.id)}
                className={cn(
                  "hover:bg-surface-soft block w-full px-5 py-4 text-left transition-colors",
                  selectedId === f.id && "bg-brand-soft",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-ink text-body font-semibold">{f.name}</p>
                    <p className="text-ink-3 text-caption mt-0.5">
                      {f.city}, {f.country} · {f.code}
                    </p>
                  </div>
                  <FacilityStatusBadge status={f.status} />
                </div>

                <div className="mt-3 flex items-baseline justify-between text-small">
                  <span className="text-ink-2">Pallet positions</span>
                  <span className="text-ink font-semibold tabular-nums">
                    {formatNumber(f.palletsStored)} / {formatNumber(f.palletPositions)}
                  </span>
                </div>
                <CapacityBar value={f.capacityPct} threshold={88} className="mt-1.5" />

                <dl className="mt-3 grid grid-cols-3 gap-2">
                  <Stat icon={ArrowDownToLine} label="Inbound" value={f.inbound} />
                  <Stat icon={ArrowUpFromLine} label="Outbound" value={f.outbound} />
                  <Stat icon={DoorOpen} label="Docks" value={`${f.docksInUse}/${f.dockDoors}`} />
                </dl>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Drawer
        open={Boolean(selected)}
        onOpenChange={(v) => !v && select(null)}
        title={selected?.name ?? ""}
        description={selected ? `${selected.city}, ${selected.country}` : undefined}
        width="25rem"
      >
        {selected && <FacilityDetail facility={selected} />}
      </Drawer>
    </>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-ink-3 text-caption flex items-center gap-1">
        <Icon className="size-3" />
        {label}
      </dt>
      <dd className="text-ink mt-0.5 text-small font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function FacilityDetail({ facility }: { facility: Facility }) {
  const alerts = alertsForFacility(facility.id);
  const inbound = ACTIVE_SHIPMENTS.filter((s) => s.destinationId === facility.id).length;
  const outbound = ACTIVE_SHIPMENTS.filter((s) => s.originId === facility.id).length;
  const staffShortfall = facility.staffPlanned - facility.staffOnShift;

  return (
    <div className="px-5 py-4">
      <FacilityStatusBadge status={facility.status} />

      <p className="label-eyebrow mt-4 mb-1.5">Storage</p>
      <div className="mb-1.5 flex items-baseline justify-between text-small">
        <span className="text-ink-2">
          {formatNumber(facility.palletsStored)} of {formatNumber(facility.palletPositions)} pallets
        </span>
        <span className="text-ink font-semibold tabular-nums">{facility.capacityPct}%</span>
      </div>
      <CapacityBar value={facility.capacityPct} threshold={88} />

      <p className="label-eyebrow mt-4 mb-1.5">Movements today</p>
      <StackedBar
        segments={[
          { label: "Inbound", value: facility.inbound, color: "var(--nl-info)" },
          { label: "Outbound", value: facility.outbound, color: "var(--nl-brand)" },
        ]}
      />
      <div className="text-caption mt-1.5 flex justify-between tabular-nums">
        <span className="text-info-text">{facility.inbound} inbound</span>
        <span className="text-brand">{facility.outbound} outbound</span>
      </div>

      <dl className="mt-4">
        <DetailRow label="Live inbound loads">{formatNumber(inbound)}</DetailRow>
        <DetailRow label="Live outbound loads">{formatNumber(outbound)}</DetailRow>
        <DetailRow label="Throughput vs target">
          {facility.throughputToday} / {facility.throughputTarget}
        </DetailRow>
        <DetailRow label="Average dwell">{formatDuration(facility.dwellMinutes)}</DetailRow>
        <DetailRow label="Dock doors">
          {facility.docksInUse} of {facility.dockDoors} in use
        </DetailRow>
        <DetailRow label="Floor area">{formatNumber(facility.floorArea)} m²</DetailRow>
        <DetailRow label="Shift pattern">{facility.shiftPattern}</DetailRow>
        <DetailRow label="Site manager">{facility.manager}</DetailRow>
      </dl>

      <p className="label-eyebrow mt-4 mb-1.5">Staffing</p>
      <div className="border-line flex items-center gap-3 rounded-well border p-3">
        <Users className="text-ink-3 size-4 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-ink text-small font-medium tabular-nums">
            {facility.staffOnShift} of {facility.staffPlanned} on shift
          </p>
          <p className={cn("text-caption", staffShortfall > 0 ? "text-warning-text" : "text-ink-3")}>
            {staffShortfall > 0
              ? `${staffShortfall} below plan for this shift`
              : "Fully staffed"}
          </p>
        </div>
      </div>

      <p className="label-eyebrow mt-4 mb-2">Open alerts</p>
      {alerts.length > 0 ? (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.id} className="border-line rounded-well border p-2.5">
              <p className="text-ink text-small leading-snug font-medium">{a.title}</p>
              <div className="mt-1.5">
                <SeverityBadge severity={a.severity} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink-3 text-small">Nothing open at this site.</p>
      )}

      <Link
        href={`/shipments?destination=${facility.id}`}
        className="text-brand mt-4 inline-flex items-center gap-1.5 text-small font-medium hover:underline"
      >
        <Boxes className="size-3.5" aria-hidden />
        View inbound shipments
      </Link>
    </div>
  );
}
