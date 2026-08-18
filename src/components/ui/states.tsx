import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <span className="bg-surface-sunken text-ink-3 mb-3 grid size-10 place-items-center rounded-full">
        <Icon className="size-5" />
      </span>
      <p className="text-ink text-body font-semibold">{title}</p>
      <p className="text-ink-2 text-small mt-1 max-w-sm">{description}</p>
      {action && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  icon: Icon,
  title,
  description,
  onRetry,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center" role="alert">
      <span className="bg-critical-soft text-critical-text mb-3 grid size-10 place-items-center rounded-full">
        <Icon className="size-5" />
      </span>
      <p className="text-ink text-body font-semibold">{title}</p>
      <p className="text-ink-2 text-small mt-1 max-w-sm">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Skeletons mirror the shape of the content they stand in for. */
export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={cn("skeleton rounded-control", className)} style={style} aria-hidden />;
}

export function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="px-3 py-2" aria-busy="true" aria-label="Loading rows">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="border-line flex items-center gap-3 border-b py-3 last:border-b-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className="h-3.5"
              // Varying widths read as content rather than as a loading grid.
              style={{ width: `${[22, 14, 14, 12, 10, 9, 8][c % 7]}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
