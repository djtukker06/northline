"use client";

import * as React from "react";
import * as DM from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const CONTENT = cn(
  "bg-surface border-line rounded-panel z-50 min-w-[11rem] overflow-hidden border p-1 shadow-md",
  "data-[state=open]:animate-fade-in",
);

const ITEM = cn(
  "text-ink text-small flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 outline-none select-none",
  "data-[highlighted]:bg-neutral-soft data-[disabled]:text-ink-3 data-[disabled]:pointer-events-none",
);

export interface Option<T extends string = string> {
  value: T;
  label: string;
  count?: number;
}

/**
 * Filter control used across every list view. Behaves as a menu rather than a native
 * select so option rows can carry counts.
 */
export function FilterMenu<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
  align = "start",
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  className?: string;
  align?: "start" | "end";
}) {
  const current = options.find((o) => o.value === value);
  const isDefault = value === options[0]?.value;

  return (
    <DM.Root>
      <DM.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-control border px-2.5 text-small font-medium whitespace-nowrap transition-colors",
            isDefault
              ? "border-line-strong bg-surface text-ink-2 hover:text-ink hover:bg-surface-soft"
              : "border-brand-border bg-brand-soft text-brand",
            className,
          )}
        >
          <span className={cn(isDefault && "text-ink-3")}>{label}</span>
          <span className="text-ink font-semibold">{current?.label}</span>
          <ChevronDown className="size-3.5 opacity-60" aria-hidden />
        </button>
      </DM.Trigger>
      <DM.Portal>
        <DM.Content className={CONTENT} align={align} sideOffset={6} collisionPadding={12}>
          {options.map((o) => (
            <DM.Item key={o.value} className={ITEM} onSelect={() => onChange(o.value)}>
              <Check
                className={cn("size-3.5 shrink-0", o.value === value ? "opacity-100" : "opacity-0")}
                aria-hidden
              />
              <span className="flex-1">{o.label}</span>
              {o.count !== undefined && (
                <span className="text-ink-3 text-caption tabular-nums">{o.count}</span>
              )}
            </DM.Item>
          ))}
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}

export const Menu = DM.Root;
export const MenuTrigger = DM.Trigger;
export function MenuContent({
  children,
  align = "end",
  className,
}: {
  children: React.ReactNode;
  align?: "start" | "end" | "center";
  className?: string;
}) {
  return (
    <DM.Portal>
      <DM.Content
        className={cn(CONTENT, className)}
        align={align}
        sideOffset={6}
        collisionPadding={12}
      >
        {children}
      </DM.Content>
    </DM.Portal>
  );
}
export function MenuItem({
  children,
  onSelect,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <DM.Item className={cn(ITEM, className)} onSelect={onSelect} disabled={disabled}>
      {children}
    </DM.Item>
  );
}
export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <DM.Label className="label-eyebrow px-2 py-1.5">{children}</DM.Label>;
}
export function MenuSeparator() {
  return <DM.Separator className="bg-line -mx-1 my-1 h-px" />;
}
