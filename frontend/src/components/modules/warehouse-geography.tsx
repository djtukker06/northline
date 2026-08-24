"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FacilityMap } from "@/components/map/facility-map";
import { Panel } from "@/components/ui/panel";
import { FACILITIES } from "@/lib/data";
import { CapacityBar } from "@/components/ui/metric";
import { cn, formatNumber } from "@/lib/utils";

/** Map and ranked list share one surface: the same question asked two ways. */
export function WarehouseGeography() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("facility");

  const select = (id: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("facility", id);
    router.replace(`/warehouses?${next}`, { scroll: false });
  };

  const ranked = [...FACILITIES].sort((a, b) => b.capacityPct - a.capacityPct);

  return (
    <Panel className="flex flex-col lg:h-[22rem] lg:flex-row">
      <div className="min-w-0 flex-1">
        <FacilityMap selectedId={selectedId} onSelect={select} className="h-full min-h-[20rem]" />
      </div>
      <div className="border-line flex min-h-0 flex-col border-t lg:w-[20rem] lg:shrink-0 lg:border-t-0 lg:border-l">
        <header className="border-line shrink-0 border-b px-4 py-2.5">
          <h2 className="text-ink text-body-lg font-semibold">Capacity pressure</h2>
          <p className="text-ink-2 text-small mt-0.5">All sites, highest first</p>
        </header>
        <ul className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
          {ranked.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => select(f.id)}
                className={cn(
                  "hover:bg-surface-soft border-line w-full border-b px-4 py-2.5 text-left transition-colors last:border-b-0",
                  selectedId === f.id && "bg-brand-soft",
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-ink truncate text-small font-medium">{f.name}</span>
                  <span
                    className={cn(
                      "shrink-0 text-small font-semibold tabular-nums",
                      f.capacityPct >= 88 ? "text-critical-text" : "text-ink-2",
                    )}
                  >
                    {f.capacityPct}%
                  </span>
                </div>
                <CapacityBar value={f.capacityPct} threshold={88} className="mt-1.5" height={4} />
                <p className="text-ink-3 text-caption mt-1 tabular-nums">
                  {formatNumber(f.palletsStored)} pallets · {f.throughputToday} movements
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}
