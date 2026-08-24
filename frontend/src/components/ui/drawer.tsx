"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Contextual detail surface. A side panel on desktop, a full-height sheet on mobile,
 * so the same component serves both without a second implementation.
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  width = "26rem",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-40 bg-[rgba(9,12,17,0.5)] backdrop-blur-[1px]",
            "data-[state=open]:animate-fade-in",
          )}
        />
        <Dialog.Content
          style={{ ["--drawer-w" as string]: width }}
          className={cn(
            "bg-surface border-line fixed z-50 flex flex-col shadow-lg",
            "inset-x-0 bottom-0 top-16 rounded-t-panel border-t",
            "sm:inset-y-0 sm:right-0 sm:left-auto sm:top-0 sm:w-[var(--drawer-w)] sm:max-w-[92vw] sm:rounded-none sm:border-t-0 sm:border-l",
            "data-[state=open]:animate-slide-in-right",
          )}
        >
          <header className="border-line flex items-start justify-between gap-3 border-b px-5 py-3.5">
            <div className="min-w-0">
              <Dialog.Title className="text-ink text-body-lg font-semibold">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-ink-2 text-small mt-0.5">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="text-ink-3 hover:bg-neutral-soft hover:text-ink -mt-1 grid size-8 shrink-0 place-items-center rounded-control transition-colors"
              aria-label="Close panel"
            >
              <X className="size-4" />
            </Dialog.Close>
          </header>
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer && <div className="border-line border-t px-5 py-3">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(9,12,17,0.5)] data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            "bg-surface border-line fixed top-1/2 left-1/2 z-50 w-[min(34rem,92vw)] -translate-x-1/2 -translate-y-1/2",
            "rounded-panel border shadow-lg data-[state=open]:animate-fade-up",
          )}
        >
          <header className="border-line border-b px-5 py-3.5">
            <Dialog.Title className="text-ink text-body-lg font-semibold">{title}</Dialog.Title>
            {description && (
              <Dialog.Description className="text-ink-2 text-small mt-0.5">
                {description}
              </Dialog.Description>
            )}
          </header>
          <div className="px-5 py-4">{children}</div>
          {footer && (
            <div className="border-line flex justify-end gap-2 border-t px-5 py-3">{footer}</div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
