"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, LogOut, UserCog } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { LogoMark, Wordmark } from "./logo";
import { PRIMARY_NAV, SECONDARY_NAV, type NavItem } from "./nav-items";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/dropdown";

function NavLink({
  item,
  counts,
  onNavigate,
}: {
  item: NavItem;
  counts: { alerts: number; shipments: number };
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href);
  const Icon = item.icon;
  const badge = item.badge ? counts[item.badge] : undefined;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-8 items-center gap-2.5 rounded-control px-2.5 text-small font-medium transition-colors duration-150",
        active
          ? "bg-brand-soft text-brand"
          : "text-ink-2 hover:bg-neutral-soft hover:text-ink",
      )}
    >
      <Icon
        className={cn("size-4 shrink-0", active ? "text-brand" : "text-ink-3 group-hover:text-ink-2")}
        aria-hidden
      />
      <span className="flex-1 truncate">{item.label}</span>
      {badge !== undefined && (
        <span
          className={cn(
            "shrink-0 text-caption tabular-nums",
            item.badge === "alerts" && badge > 0
              ? "text-critical-text font-semibold"
              : "text-ink-3",
          )}
        >
          {formatNumber(badge)}
        </span>
      )}
    </Link>
  );
}

export function SidebarContent({
  counts,
  onNavigate,
}: {
  counts: { alerts: number; shipments: number };
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2.5 px-4">
        <LogoMark />
        <Wordmark />
      </div>

      <nav className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2.5 pb-2" aria-label="Main">
        <ul className="space-y-0.5">
          {PRIMARY_NAV.map((item) => (
            <li key={item.href}>
              <NavLink item={item} counts={counts} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>

        <p className="label-eyebrow px-2.5 pt-5 pb-1.5">Workspace</p>
        <ul className="space-y-0.5">
          {SECONDARY_NAV.map((item) => (
            <li key={item.href}>
              <NavLink item={item} counts={counts} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-line shrink-0 border-t p-2.5">
        <Menu>
          <MenuTrigger asChild>
            <button
              type="button"
              className="hover:bg-neutral-soft flex w-full items-center gap-2.5 rounded-control p-1.5 text-left transition-colors"
            >
              <span className="bg-brand-solid text-on-brand grid size-8 shrink-0 place-items-center rounded-full text-caption font-semibold">
                DS
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-ink block truncate text-small font-medium">
                  Daniëlle Sørensen
                </span>
                <span className="text-ink-3 block truncate text-caption">
                  Operations manager
                </span>
              </span>
              <ChevronsUpDown className="text-ink-3 size-3.5 shrink-0" aria-hidden />
            </button>
          </MenuTrigger>
          <MenuContent align="start" className="w-56">
            <MenuLabel>d.sorensen@northline.eu</MenuLabel>
            <MenuSeparator />
            <MenuItem>
              <UserCog className="size-3.5" aria-hidden />
              Account settings
            </MenuItem>
            <MenuItem>
              <LogOut className="size-3.5" aria-hidden />
              Sign out
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
    </div>
  );
}

export function Sidebar({ counts }: { counts: { alerts: number; shipments: number } }) {
  return (
    <aside className="bg-surface border-line hidden w-[15rem] shrink-0 border-r lg:block">
      <div className="sticky top-0 h-dvh">
        <SidebarContent counts={counts} />
      </div>
    </aside>
  );
}
