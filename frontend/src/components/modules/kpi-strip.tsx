import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { KPIS } from "@/lib/data";
import { Sparkline, TrendIndicator } from "@/components/ui/metric";
import { cn } from "@/lib/utils";

/**
 * One strip divided by rules rather than four separate cards. The metrics belong to
 * the same reading, so they share a surface.
 */
export function KpiStrip() {
  return (
    <section
      aria-label="Network headline metrics"
      className="bg-surface border-line rounded-panel grid grid-cols-1 overflow-hidden border max-sm:divide-y max-sm:divide-[var(--nl-border)] sm:grid-cols-2 xl:grid-cols-4"
    >
      {KPIS.map((kpi, i) => (
        <Link
          key={kpi.id}
          href={kpi.href}
          className={cn(
            "group hover:bg-surface-soft flex items-start justify-between gap-3 px-5 py-4 transition-colors",
            "border-line sm:border-l sm:[&:nth-child(odd)]:border-l-0",
            "xl:border-l xl:[&:nth-child(odd)]:border-l xl:first:border-l-0",
            // On the two-column layout the lower pair needs its own top rule.
            i >= 2 && "sm:border-t xl:border-t-0",
          )}
        >
          <div className="min-w-0">
            <p className="text-ink-2 text-small font-medium">{kpi.label}</p>
            <p className="text-ink text-metric mt-1.5 font-semibold tabular-nums">
              {kpi.value}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5">
              <TrendIndicator delta={kpi.delta} />
              <span className="text-ink-3 text-caption">{kpi.comparison}</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <ArrowUpRight className="text-ink-3 size-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
            <Sparkline
              data={kpi.series}
              width={84}
              height={30}
              stroke={
                kpi.tone === "positive" ? "var(--nl-success)" : "var(--nl-critical)"
              }
            />
          </div>
        </Link>
      ))}
    </section>
  );
}
