import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The workspace surface. Panels group a whole area of the operation rather than a
 * single statistic, so the shell reads as one tool instead of a grid of cards.
 */
export function Panel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        "bg-surface border-line rounded-panel border overflow-hidden",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  description,
  actions,
  className,
  dense,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  dense?: boolean;
}) {
  return (
    <header
      className={cn(
        "border-line flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b",
        dense ? "px-4 py-2.5" : "px-5 py-3.5",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-ink text-body-lg leading-tight font-semibold">{title}</h2>
        {description && (
          <p className="text-ink-2 text-small mt-0.5 truncate">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

/** A titled block inside a panel. Separated by a rule, never by another border box. */
export function PanelSection({
  title,
  actions,
  className,
  children,
  bodyClassName,
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("border-line border-b last:border-b-0", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
          <h3 className="label-eyebrow">{title}</h3>
          {actions}
        </div>
      )}
      <div className={cn(bodyClassName)}>{children}</div>
    </div>
  );
}

/** Page heading used at the top of every route. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-6 gap-y-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-ink text-h1 font-semibold">{title}</h1>
        {description && <p className="text-ink-2 text-body-lg mt-1">{description}</p>}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

/** Key/value row used across every detail panel. */
export function DetailRow({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 py-2 text-small",
        className,
      )}
    >
      <dt className="text-ink-2 shrink-0">{label}</dt>
      <dd className="text-ink min-w-0 text-right font-medium" data-numeric>
        {children}
      </dd>
    </div>
  );
}
