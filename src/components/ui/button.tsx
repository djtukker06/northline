"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "icon" | "icon-sm";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-solid text-on-brand border border-transparent hover:bg-brand-solid-hover active:translate-y-px disabled:bg-brand-solid/40 disabled:text-on-brand/70",
  secondary:
    "bg-surface text-ink border border-line-strong hover:bg-surface-soft active:translate-y-px disabled:text-ink-3 disabled:bg-surface",
  ghost:
    "bg-transparent text-ink-2 border border-transparent hover:bg-neutral-soft hover:text-ink active:translate-y-px disabled:text-ink-3",
  danger:
    "bg-critical text-white border border-transparent hover:brightness-95 active:translate-y-px disabled:opacity-45",
  subtle:
    "bg-neutral-soft text-ink border border-transparent hover:bg-line active:translate-y-px disabled:text-ink-3",
};

const SIZES: Record<Size, string> = {
  sm: "h-7 px-2.5 text-small gap-1.5",
  md: "h-9 px-3.5 text-body gap-2",
  icon: "h-9 w-9 justify-center",
  "icon-sm": "h-7 w-7 justify-center",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "secondary", size = "md", asChild, ...props },
    ref,
  ) {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex select-none items-center rounded-control font-medium whitespace-nowrap",
          "transition-[background-color,color,border-color,transform,opacity] duration-150",
          "disabled:pointer-events-none disabled:cursor-not-allowed",
          "[&_svg]:shrink-0",
          VARIANTS[variant],
          SIZES[size],
          className,
        )}
        {...props}
      />
    );
  },
);
