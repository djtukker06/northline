"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  PanelLeft,
  Search,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/dropdown";
import { SeverityBadge } from "@/components/ui/status";
import { ThemeToggle } from "./theme-toggle";
import { sectionTitle } from "./nav-items";
import { cn, formatFullDate, relativeTime, NOW } from "@/lib/utils";
import type { Alert } from "@/lib/data/types";

const RANGES = ["Today", "Last 7 days", "Last 30 days", "This quarter"] as const;

export function Topbar({
  onOpenSearch,
  onOpenNav,
  alerts,
  openAlertCount,
}: {
  onOpenSearch: () => void;
  onOpenNav: () => void;
  alerts: Alert[];
  openAlertCount: number;
}) {
  const pathname = usePathname();
  const [range, setRange] = React.useState<(typeof RANGES)[number]>("Today");
  const title = sectionTitle(pathname);
  const isDetail = pathname.startsWith("/shipments/");

  return (
    <header className="bg-surface/85 border-line sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-3 backdrop-blur-md sm:px-4">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="text-ink-2 hover:bg-neutral-soft hover:text-ink grid size-8 shrink-0 place-items-center rounded-control transition-colors lg:hidden"
      >
        <PanelLeft className="size-4" />
      </button>

      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-1.5">
          {isDetail && (
            <>
              <li>
                <Link
                  href="/shipments"
                  className="text-ink-2 hover:text-ink text-small transition-colors"
                >
                  Shipments
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="text-ink-3 size-3.5" />
              </li>
            </>
          )}
          <li>
            <span className="text-ink truncate text-body-lg font-semibold" aria-current="page">
              {title}
            </span>
          </li>
        </ol>
      </nav>

      <button
        type="button"
        onClick={onOpenSearch}
        className={cn(
          "border-line-strong bg-surface-soft text-ink-3 ml-auto flex h-8 items-center gap-2 rounded-control border px-2.5 transition-colors",
          "hover:border-ink-3 hover:text-ink-2 md:w-64 lg:w-72",
        )}
      >
        <Search className="size-3.5 shrink-0" aria-hidden />
        <span className="hidden flex-1 text-left text-small md:block">
          Search NORTHLINE
        </span>
        <kbd className="border-line bg-surface hidden rounded border px-1 py-px text-caption font-medium md:block">
          ⌘K
        </kbd>
      </button>

      <Menu>
        <MenuTrigger asChild>
          <button
            type="button"
            className="border-line-strong bg-surface text-ink hidden h-8 shrink-0 items-center gap-1.5 rounded-control border px-2.5 text-small font-medium transition-colors hover:bg-surface-soft xl:flex"
          >
            <CalendarDays className="text-ink-3 size-3.5" aria-hidden />
            {range === "Today" ? `Today · ${formatFullDate(NOW).replace(/^\w+, /, "")}` : range}
          </button>
        </MenuTrigger>
        <MenuContent>
          <MenuLabel>Date range</MenuLabel>
          {RANGES.map((r) => (
            <MenuItem key={r} onSelect={() => setRange(r)}>
              <span className="flex-1">{r}</span>
              <span
                className={cn("bg-brand size-1.5 rounded-full", range === r ? "opacity-100" : "opacity-0")}
                aria-hidden
              />
            </MenuItem>
          ))}
        </MenuContent>
      </Menu>

      <div className="flex shrink-0 items-center gap-0.5">
        <Menu>
          <Tooltip content="Notifications">
            <MenuTrigger asChild>
              <button
                type="button"
                aria-label={`Notifications, ${openAlertCount} open`}
                className="text-ink-2 hover:bg-neutral-soft hover:text-ink relative grid size-8 place-items-center rounded-control transition-colors"
              >
                <Bell className="size-4" />
                {openAlertCount > 0 && (
                  <span className="bg-critical border-surface absolute top-1 right-1 size-2 rounded-full border-2" />
                )}
              </button>
            </MenuTrigger>
          </Tooltip>
          <MenuContent className="w-[min(22rem,90vw)]">
            <MenuLabel>{openAlertCount} open alerts</MenuLabel>
            <MenuSeparator />
            {alerts.slice(0, 4).map((a) => (
              <MenuItem key={a.id} className="items-start gap-2.5 py-2">
                <span className="min-w-0 flex-1">
                  <span className="text-ink block text-small leading-snug font-medium">
                    {a.title}
                  </span>
                  <span className="text-ink-3 mt-1 flex items-center gap-2 text-caption">
                    <SeverityBadge severity={a.severity} />
                    {relativeTime(a.raisedAt)}
                  </span>
                </span>
              </MenuItem>
            ))}
            <MenuSeparator />
            <MenuItem>
              <Link href="/alerts" className="text-brand w-full font-medium">
                View all alerts
              </Link>
            </MenuItem>
          </MenuContent>
        </Menu>

        <Tooltip content="Help and shortcuts">
          <button
            type="button"
            aria-label="Help and shortcuts"
            className="text-ink-2 hover:bg-neutral-soft hover:text-ink hidden size-8 place-items-center rounded-control transition-colors sm:grid"
          >
            <CircleHelp className="size-4" />
          </button>
        </Tooltip>

        <ThemeToggle />
      </div>
    </header>
  );
}
