"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  /** Right-align numeric columns so figures line up down the page. */
  numeric?: boolean;
  width?: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  render: (row: T) => React.ReactNode;
  /** Columns dropped first as the viewport narrows. */
  hideBelow?: "sm" | "md" | "lg" | "xl";
}

const HIDE_CLASS = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
} as const;

export type SortState = { key: string; dir: "asc" | "desc" } | null;

export function useSort<T>(columns: Column<T>[], initial: SortState = null) {
  const [sort, setSort] = React.useState<SortState>(initial);

  const toggle = React.useCallback((key: string) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }, []);

  const apply = React.useCallback(
    (rows: T[]) => {
      if (!sort) return rows;
      const col = columns.find((c) => c.key === sort.key);
      if (!col?.sortValue) return rows;
      const dir = sort.dir === "asc" ? 1 : -1;
      return [...rows].sort((a, b) => {
        const av = col.sortValue!(a);
        const bv = col.sortValue!(b);
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
        return String(av).localeCompare(String(bv)) * dir;
      });
    },
    [sort, columns],
  );

  return { sort, toggle, apply };
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  selectedKey,
  sort,
  onSort,
  className,
  emptyState,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedKey?: string | null;
  sort?: SortState;
  onSort?: (key: string) => void;
  className?: string;
  emptyState?: React.ReactNode;
  caption: string;
}) {
  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={cn("scrollbar-thin w-full overflow-x-auto", className)}>
      <table className="w-full min-w-[52rem] border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-line border-b">
            {columns.map((col) => {
              const active = sort?.key === col.key;
              const Icon = !active ? ChevronsUpDown : sort!.dir === "asc" ? ArrowUp : ArrowDown;
              return (
                <th
                  key={col.key}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  aria-sort={
                    active ? (sort!.dir === "asc" ? "ascending" : "descending") : "none"
                  }
                  className={cn(
                    "bg-surface-soft label-eyebrow sticky top-0 z-10 px-3 py-2 font-semibold",
                    col.numeric && "text-right",
                    col.hideBelow && HIDE_CLASS[col.hideBelow],
                  )}
                >
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className={cn(
                        "hover:text-ink inline-flex items-center gap-1 transition-colors",
                        active && "text-ink",
                        col.numeric && "flex-row-reverse",
                      )}
                    >
                      {col.header}
                      <Icon className="size-3 opacity-70" aria-hidden />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const key = rowKey(row);
            const selected = selectedKey === key;
            return (
              <tr
                key={key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? "button" : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                className={cn(
                  "border-line border-b transition-colors last:border-b-0",
                  onRowClick && "hover:bg-surface-soft cursor-pointer",
                  selected && "bg-brand-soft hover:bg-brand-soft",
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "text-body px-3 py-2.5 align-middle",
                      col.numeric && "text-right tabular-nums",
                      col.hideBelow && HIDE_CLASS[col.hideBelow],
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Page-size stepper for long tables. */
export function TablePager({
  page,
  pageSize,
  total,
  onPage,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  className?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);

  return (
    <div
      className={cn(
        "border-line text-small flex items-center justify-between gap-4 border-t px-4 py-2.5",
        className,
      )}
    >
      <p className="text-ink-2 tabular-nums">
        <span className="text-ink font-medium">{from.toLocaleString("en-GB")}</span> to{" "}
        <span className="text-ink font-medium">{to.toLocaleString("en-GB")}</span> of{" "}
        <span className="text-ink font-medium">{total.toLocaleString("en-GB")}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page === 0}
          className="text-ink-2 hover:bg-neutral-soft hover:text-ink h-7 rounded-control px-2.5 font-medium transition-colors disabled:pointer-events-none disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-ink-3 px-1.5 tabular-nums">
          {page + 1} / {pages}
        </span>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages - 1}
          className="text-ink-2 hover:bg-neutral-soft hover:text-ink h-7 rounded-control px-2.5 font-medium transition-colors disabled:pointer-events-none disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
