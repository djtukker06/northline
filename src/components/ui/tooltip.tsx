"use client";

import * as React from "react";
import * as TP from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export const TooltipProvider = TP.Provider;

export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  if (!content) return <>{children}</>;
  return (
    <TP.Root>
      <TP.Trigger asChild>{children}</TP.Trigger>
      <TP.Portal>
        <TP.Content
          side={side}
          sideOffset={6}
          collisionPadding={10}
          className={cn(
            "bg-ink text-caption z-50 max-w-64 rounded-control px-2 py-1 font-medium shadow-md",
            "text-[var(--nl-surface)]",
            "data-[state=delayed-open]:animate-fade-in",
            className,
          )}
        >
          {content}
          <TP.Arrow className="fill-[var(--nl-text)]" width={9} height={4} />
        </TP.Content>
      </TP.Portal>
    </TP.Root>
  );
}
