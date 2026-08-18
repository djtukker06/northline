"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Small exclusive control used for time ranges and view switches. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string; icon?: React.ReactNode }>;
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "bg-surface-sunken inline-flex items-center gap-0.5 rounded-control p-0.5",
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[4px] font-medium whitespace-nowrap transition-colors duration-150",
              size === "sm" ? "h-6 px-2 text-caption" : "h-7 px-2.5 text-small",
              active
                ? "bg-surface text-ink shadow-sm"
                : "text-ink-2 hover:text-ink",
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Toggleable filter chips. Multi-select, used above the map and lists. */
export function FilterChips<T extends string>({
  values,
  onToggle,
  options,
  label,
  className,
}: {
  values: Set<T>;
  onToggle: (v: T) => void;
  options: Array<{ value: T; label: string; color?: string; count?: number }>;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)} aria-label={label}>
      {options.map((o) => {
        const active = values.has(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(o.value)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-caption font-medium transition-colors",
              active
                ? "border-ink/15 bg-surface text-ink shadow-sm"
                : "border-transparent bg-transparent text-ink-3 hover:text-ink-2",
            )}
          >
            {o.color && (
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: o.color, opacity: active ? 1 : 0.45 }}
                aria-hidden
              />
            )}
            {o.label}
            {o.count !== undefined && (
              <span className="text-ink-3 tabular-nums">{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
