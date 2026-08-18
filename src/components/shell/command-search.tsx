"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import {
  ArrowRight,
  CornerDownLeft,
  LayoutDashboard,
  Package,
  Route as RouteIcon,
  Search,
  TriangleAlert,
  Truck,
  UserRound,
  Warehouse,
} from "lucide-react";
import { KIND_LABEL, search, type ResultKind, type SearchResult } from "@/lib/search";
import { cn } from "@/lib/utils";

const ICONS: Record<ResultKind, typeof Package> = {
  shipment: Package,
  vehicle: Truck,
  route: RouteIcon,
  warehouse: Warehouse,
  alert: TriangleAlert,
  driver: UserRound,
  page: LayoutDashboard,
};

const SUGGESTIONS: SearchResult[] = [
  {
    id: "s1",
    kind: "shipment",
    title: "NL-48291",
    subtitle: "Rotterdam to Berlin",
    meta: "At risk",
    href: "/shipments/NL-48291",
    haystack: "",
    boost: 0,
  },
  {
    id: "s2",
    kind: "warehouse",
    title: "Berlin Hub",
    subtitle: "Berlin, Germany",
    meta: "91% capacity",
    href: "/warehouses?facility=FAC-BER-01",
    haystack: "",
    boost: 0,
  },
  {
    id: "s3",
    kind: "vehicle",
    title: "NL-TRK-204",
    subtitle: "Volvo FH16 500",
    meta: "A2 near Hannover",
    href: "/fleet?vehicle=NL-TRK-204",
    haystack: "",
    boost: 0,
  },
  {
    id: "s4",
    kind: "route",
    title: "R-218",
    subtitle: "Rotterdam to Berlin",
    meta: "Delayed 18 min",
    href: "/routes?route=R-218",
    haystack: "",
    boost: 0,
  },
];

export function CommandSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  const results = React.useMemo(() => search(query), [query]);
  const shown = query.trim() ? results : SUGGESTIONS;

  const grouped = React.useMemo(() => {
    const map = new Map<ResultKind, SearchResult[]>();
    for (const r of shown) {
      const list = map.get(r.kind) ?? [];
      list.push(r);
      map.set(r.kind, list);
    }
    return [...map.entries()];
  }, [shown]);

  React.useEffect(() => {
    if (!open) {
      // Reset once the closing animation has finished.
      const t = setTimeout(() => setQuery(""), 180);
      return () => clearTimeout(t);
    }
  }, [open]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(9,12,17,0.45)] data-[state=open]:animate-fade-in" />
        <Dialog.Content
          aria-label="Search NORTHLINE"
          className={cn(
            "bg-surface border-line fixed top-[12vh] left-1/2 z-50 w-[min(38rem,94vw)] -translate-x-1/2",
            "rounded-panel overflow-hidden border shadow-lg data-[state=open]:animate-fade-up",
          )}
        >
          <Dialog.Title className="sr-only">Search NORTHLINE</Dialog.Title>
          <Command shouldFilter={false} loop className="flex flex-col">
            <div className="border-line flex items-center gap-2.5 border-b px-4">
              <Search className="text-ink-3 size-4 shrink-0" aria-hidden />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search shipments, vehicles, routes, warehouses"
                className="text-ink placeholder:text-ink-3 h-12 flex-1 bg-transparent text-body-lg outline-none"
              />
              <kbd className="text-ink-3 border-line bg-surface-soft hidden rounded border px-1.5 py-0.5 text-caption font-medium sm:block">
                Esc
              </kbd>
            </div>

            <Command.List className="scrollbar-thin max-h-[min(24rem,52vh)] overflow-y-auto p-1.5">
              <Command.Empty className="px-3 py-10 text-center">
                <p className="text-ink text-small font-medium">
                  Nothing matches “{query}”
                </p>
                <p className="text-ink-2 text-caption mt-1">
                  Try a shipment number, a vehicle ID, or a city.
                </p>
              </Command.Empty>

              {!query.trim() && (
                <p className="label-eyebrow px-2.5 pt-2 pb-1.5">Jump to</p>
              )}

              {grouped.map(([kind, items]) => (
                <Command.Group
                  key={kind}
                  heading={query.trim() ? KIND_LABEL[kind] : undefined}
                  className={cn(
                    "[&_[cmdk-group-heading]]:label-eyebrow [&_[cmdk-group-heading]]:px-2.5",
                    "[&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5",
                  )}
                >
                  {items.map((r) => {
                    const Icon = ICONS[r.kind];
                    return (
                      <Command.Item
                        key={`${r.kind}-${r.id}`}
                        value={`${r.kind}-${r.id}`}
                        onSelect={() => go(r.href)}
                        className={cn(
                          "group flex cursor-pointer items-center gap-3 rounded-control px-2.5 py-2",
                          "data-[selected=true]:bg-neutral-soft",
                        )}
                      >
                        <span className="bg-surface-sunken text-ink-2 grid size-7 shrink-0 place-items-center rounded-control">
                          <Icon className="size-3.5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="text-ink block truncate text-small font-medium">
                            {r.title}
                          </span>
                          <span className="text-ink-3 block truncate text-caption">
                            {r.subtitle}
                          </span>
                        </span>
                        {r.meta && (
                          <span className="text-ink-3 hidden shrink-0 text-caption sm:block">
                            {r.meta}
                          </span>
                        )}
                        <ArrowRight
                          className="text-ink-3 size-3.5 shrink-0 opacity-0 transition-opacity group-data-[selected=true]:opacity-100"
                          aria-hidden
                        />
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              ))}
            </Command.List>

            <footer className="border-line text-ink-3 flex items-center gap-4 border-t px-4 py-2 text-caption">
              <span className="flex items-center gap-1.5">
                <CornerDownLeft className="size-3" aria-hidden /> Open
              </span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <span className="border-line bg-surface-soft rounded border px-1 py-px">↑</span>
                <span className="border-line bg-surface-soft rounded border px-1 py-px">↓</span>
                Navigate
              </span>
              {query.trim() && (
                <span className="ml-auto tabular-nums">
                  {results.length} result{results.length === 1 ? "" : "s"}
                </span>
              )}
            </footer>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
