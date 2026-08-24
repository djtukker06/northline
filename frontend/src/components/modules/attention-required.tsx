import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ALERTS } from "@/lib/data";
import { SeverityBadge } from "@/components/ui/status";
import { cn, relativeTime } from "@/lib/utils";
import type { Alert } from "@/lib/data/types";

const ACCENT: Record<Alert["severity"], string> = {
  critical: "bg-critical",
  warning: "bg-warning",
  info: "bg-info",
  resolved: "bg-success",
};

const ORDER: Record<Alert["severity"], number> = {
  critical: 0,
  warning: 1,
  info: 2,
  resolved: 3,
};

export function AttentionRequired({ limit = 5 }: { limit?: number }) {
  const ranked = [...ALERTS].filter((a) => a.severity !== "resolved").sort(
    (a, b) =>
      ORDER[a.severity] - ORDER[b.severity] ||
      +new Date(b.raisedAt) - +new Date(a.raisedAt),
  );

  // One recurring fault class should not fill the whole module.
  const perCategory = new Map<string, number>();
  const alerts: Alert[] = [];
  for (const a of ranked) {
    const seen = perCategory.get(a.category) ?? 0;
    if (seen >= 2) continue;
    perCategory.set(a.category, seen + 1);
    alerts.push(a);
    if (alerts.length === limit) break;
  }

  const open = ALERTS.filter((a) => a.severity !== "resolved").length;
  // One closed item gives the board a sense of what has already been handled.
  const lastResolved = ALERTS.filter((a) => a.severity === "resolved").sort(
    (a, b) => +new Date(b.resolvedAt ?? b.raisedAt) - +new Date(a.resolvedAt ?? a.raisedAt),
  )[0];

  return (
    <div className="flex h-full flex-col">
      <header className="border-line flex items-center justify-between gap-3 border-b px-5 py-3">
        <div>
          <h2 className="text-ink text-body-lg font-semibold">Attention required</h2>
          <p className="text-ink-2 text-small mt-0.5 tabular-nums">{open} open items</p>
        </div>
        <Link
          href="/alerts"
          className="text-ink-3 hover:text-ink transition-colors"
          aria-label="Open alerts"
        >
          <ArrowRight className="size-4" />
        </Link>
      </header>

      <ul className="min-h-0 flex-1">
        {alerts.map((a) => (
          <li key={a.id}>
            <Link
              href={`/alerts?alert=${a.id}`}
              className="hover:bg-surface-soft border-line relative block border-b py-3 pr-5 pl-5 transition-colors last:border-b-0"
            >
              <span
                className={cn("absolute top-3 bottom-3 left-0 w-0.5 rounded-r", ACCENT[a.severity])}
                aria-hidden
              />
              <div className="flex items-start justify-between gap-3">
                <p
                  className={cn(
                    "text-small leading-snug font-medium",
                    a.severity === "resolved" ? "text-ink-2" : "text-ink",
                  )}
                >
                  {a.title}
                </p>
                <span className="text-ink-3 text-caption shrink-0 tabular-nums">
                  {relativeTime(a.raisedAt)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <SeverityBadge severity={a.severity} />
                <span className="text-ink-3 text-caption truncate">{a.impact}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {lastResolved && (
        <Link
          href={`/alerts?alert=${lastResolved.id}`}
          className="border-line hover:bg-surface-soft flex items-center gap-2 border-t px-5 py-2.5 transition-colors"
        >
          <SeverityBadge severity="resolved" />
          <span className="text-ink-2 min-w-0 flex-1 truncate text-caption">
            {lastResolved.title}
          </span>
          <span className="text-ink-3 shrink-0 text-caption tabular-nums">
            {relativeTime(lastResolved.resolvedAt ?? lastResolved.raisedAt)}
          </span>
        </Link>
      )}
    </div>
  );
}
