"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "bg-surface border-line-strong text-ink placeholder:text-ink-3 h-9 w-full rounded-control border px-3 text-body",
        "transition-[border-color,box-shadow] duration-150",
        "hover:border-ink-3 focus:border-brand focus:outline-none focus-visible:outline-none",
        "focus:ring-2 focus:ring-[var(--nl-ring)]",
        "disabled:bg-surface-soft disabled:text-ink-3 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
});

/** Search field with a clear affordance that only appears once there is a query. */
export function SearchInput({
  value,
  onValueChange,
  placeholder = "Search",
  className,
  autoFocus,
  label,
}: {
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  label: string;
}) {
  const id = React.useId();
  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        className="text-ink-3 pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        id={id}
        type="search"
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onValueChange(e.target.value)}
        className="pr-8 pl-8 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onValueChange("")}
          className="text-ink-3 hover:text-ink hover:bg-neutral-soft absolute top-1/2 right-1.5 grid size-6 -translate-y-1/2 place-items-center rounded-control transition-colors"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-ink text-small font-medium">
        {children}
      </label>
      {hint && <span className="text-ink-3 text-caption">{hint}</span>}
    </div>
  );
}
