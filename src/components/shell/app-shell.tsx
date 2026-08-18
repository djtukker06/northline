"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar, SidebarContent } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandSearch } from "./command-search";
import type { Alert } from "@/lib/data/types";

export function AppShell({
  children,
  alerts,
  counts,
}: {
  children: React.ReactNode;
  alerts: Alert[];
  counts: { alerts: number; shipments: number };
}) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [navOpen, setNavOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      // "/" is the other muscle-memory shortcut, but not while typing.
      if (
        e.key === "/" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Navigating dismisses the mobile drawer. Handled during render so the drawer never
  // paints once at the new route before closing.
  const [lastPath, setLastPath] = React.useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (navOpen) setNavOpen(false);
  }

  return (
    <TooltipProvider delayDuration={350} skipDelayDuration={200}>
      <a
        href="#main"
        className="bg-brand-solid text-on-brand sr-only rounded-control px-3 py-2 text-small font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]"
      >
        Skip to content
      </a>

      <div className="flex min-h-dvh">
        <Sidebar counts={counts} />

        <Dialog.Root open={navOpen} onOpenChange={setNavOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(9,12,17,0.5)] data-[state=open]:animate-fade-in lg:hidden" />
            <Dialog.Content className="bg-surface border-line fixed inset-y-0 left-0 z-50 w-[15rem] border-r shadow-lg data-[state=open]:animate-fade-in lg:hidden">
              <Dialog.Title className="sr-only">Navigation</Dialog.Title>
              <SidebarContent counts={counts} onNavigate={() => setNavOpen(false)} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            onOpenSearch={() => setSearchOpen(true)}
            onOpenNav={() => setNavOpen(true)}
            alerts={alerts}
            openAlertCount={counts.alerts}
          />
          <main id="main" className="min-w-0 flex-1">
            {children}
          </main>
        </div>
      </div>

      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </TooltipProvider>
  );
}
