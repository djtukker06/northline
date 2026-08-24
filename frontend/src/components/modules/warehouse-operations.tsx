import Link from "next/link";
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine } from "lucide-react";
import { FACILITIES } from "@/lib/data";
import { CapacityBar } from "@/components/ui/metric";
import { FacilityStatusBadge } from "@/components/ui/status";
import { cn } from "@/lib/utils";

/**
 * Facilities ranked by pressure. The sites closest to capacity are the ones a
 * duty manager needs first, so the list is sorted rather than alphabetical.
 */
export function WarehouseOperations({ limit = 6 }: { limit?: number }) {
  const sites = [...FACILITIES]
    .sort((a, b) => b.capacityPct - a.capacityPct)
    .slice(0, limit);

  return (
    <div className="flex h-full flex-col">
      <header className="border-line flex items-center justify-between gap-3 border-b px-5 py-3">
        <div>
          <h2 className="text-ink text-body-lg font-semibold">Warehouse operations</h2>
          <p className="text-ink-2 text-small mt-0.5">Ranked by capacity pressure</p>
        </div>
        <Link
          href="/warehouses"
          className="text-ink-3 hover:text-ink transition-colors"
          aria-label="Open warehouses"
        >
          <ArrowRight className="size-4" />
        </Link>
      </header>

      <ul className="min-h-0 flex-1">
        {sites.map((f) => (
          <li key={f.id}>
            <Link
              href={`/warehouses?facility=${f.id}`}
              className="hover:bg-surface-soft border-line block border-b px-5 py-3 transition-colors last:border-b-0"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-ink text-small font-medium">{f.name}</span>
                <span
                  className={cn(
                    "text-small font-semibold tabular-nums",
                    f.capacityPct >= 88 ? "text-critical-text" : "text-ink",
                  )}
                >
                  {f.capacityPct}%
                </span>
              </div>
              <CapacityBar value={f.capacityPct} threshold={88} className="mt-2" height={5} />
              <div className="text-ink-3 text-caption mt-2 flex items-center gap-3 tabular-nums">
                <span className="flex items-center gap-1">
                  <ArrowDownToLine className="size-3" aria-hidden />
                  {f.inbound} in
                </span>
                <span className="flex items-center gap-1">
                  <ArrowUpFromLine className="size-3" aria-hidden />
                  {f.outbound} out
                </span>
                <span className="ml-auto">
                  <FacilityStatusBadge status={f.status} />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
