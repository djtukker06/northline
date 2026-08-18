"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BellOff, Check, RotateCcw, UserRound } from "lucide-react";
import { ALERTS, FACILITIES, FACILITY_BY_ID } from "@/lib/data";
import type { Alert, AlertCategory, AlertSeverity } from "@/lib/data/types";
import { Panel, DetailRow } from "@/components/ui/panel";
import { SearchInput } from "@/components/ui/input";
import { FilterMenu } from "@/components/ui/dropdown";
import { Segmented } from "@/components/ui/segmented";
import { SeverityBadge } from "@/components/ui/status";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { cn, formatDateTime, relativeTime, NOW } from "@/lib/utils";

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  resolved: 3,
};

const ACCENT: Record<AlertSeverity, string> = {
  critical: "bg-critical",
  warning: "bg-warning",
  info: "bg-info",
  resolved: "bg-success",
};

const CATEGORY_LABEL: Record<AlertCategory, string> = {
  capacity: "Capacity",
  delay: "Delay",
  maintenance: "Maintenance",
  route: "Route",
  customs: "Customs",
  temperature: "Temperature",
  compliance: "Compliance",
};

const SEVERITY_OPTIONS: Array<{ value: AlertSeverity | "all"; label: string }> = [
  { value: "all", label: "Any" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Information" },
  { value: "resolved", label: "Resolved" },
];

const CATEGORY_OPTIONS = [
  { value: "all" as const, label: "Any" },
  ...(Object.keys(CATEGORY_LABEL) as AlertCategory[]).map((c) => ({
    value: c,
    label: CATEGORY_LABEL[c],
  })),
];

const LOCATION_OPTIONS = [
  { value: "all" as const, label: "Anywhere" },
  ...FACILITIES.map((f) => ({ value: f.id, label: f.name })),
];

const AGE_OPTIONS = [
  { value: "all" as const, label: "Any time" },
  { value: "1", label: "Last hour" },
  { value: "6", label: "Last 6 hours" },
  { value: "24", label: "Last 24 hours" },
];

export function AlertsView() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("alert");

  const [status, setStatus] = React.useState<"open" | "resolved" | "all">("open");
  const [severity, setSeverity] = React.useState<AlertSeverity | "all">("all");
  const [category, setCategory] = React.useState<AlertCategory | "all">("all");
  const [location, setLocation] = React.useState<string>("all");
  const [age, setAge] = React.useState<string>("all");
  const [query, setQuery] = React.useState("");

  const select = (id: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (id) next.set("alert", id);
    else next.delete("alert");
    router.replace(`/alerts${next.toString() ? `?${next}` : ""}`, { scroll: false });
  };

  const counts = React.useMemo(
    () => ({
      open: ALERTS.filter((a) => a.severity !== "resolved").length,
      resolved: ALERTS.filter((a) => a.severity === "resolved").length,
      all: ALERTS.length,
    }),
    [],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = NOW.getTime();
    return ALERTS.filter((a) => {
      if (status === "open" && a.severity === "resolved") return false;
      if (status === "resolved" && a.severity !== "resolved") return false;
      if (severity !== "all" && a.severity !== severity) return false;
      if (category !== "all" && a.category !== category) return false;
      if (location !== "all" && a.facilityId !== location) return false;
      if (age !== "all") {
        const hours = (now - +new Date(a.raisedAt)) / 3_600_000;
        if (hours > Number(age)) return false;
      }
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.detail.toLowerCase().includes(q) ||
        a.entityLabel.toLowerCase().includes(q) ||
        a.owner.toLowerCase().includes(q)
      );
    }).sort(
      (a, b) =>
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        +new Date(b.raisedAt) - +new Date(a.raisedAt),
    );
  }, [status, severity, category, location, age, query]);

  const activeFilters =
    (severity !== "all" ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (location !== "all" ? 1 : 0) +
    (age !== "all" ? 1 : 0) +
    (query.trim() ? 1 : 0);

  const reset = () => {
    setSeverity("all");
    setCategory("all");
    setLocation("all");
    setAge("all");
    setQuery("");
  };

  const selected = selectedId ? ALERTS.find((a) => a.id === selectedId) : null;

  return (
    <>
      <Panel>
        <header className="border-line flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
          <Segmented
            label="Alert status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "open", label: `Open ${counts.open}` },
              { value: "resolved", label: `Resolved ${counts.resolved}` },
              { value: "all", label: `All ${counts.all}` },
            ]}
          />
          <SearchInput
            label="Search alerts"
            value={query}
            onValueChange={setQuery}
            placeholder="Title, entity, owner"
            className="w-full sm:w-60"
          />
          <FilterMenu label="Severity" value={severity} options={SEVERITY_OPTIONS} onChange={setSeverity} />
          <FilterMenu label="Category" value={category} options={CATEGORY_OPTIONS} onChange={setCategory} />
          <FilterMenu label="Location" value={location} options={LOCATION_OPTIONS} onChange={setLocation} />
          <FilterMenu label="Raised" value={age} options={AGE_OPTIONS} onChange={setAge} />
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="size-3.5" aria-hidden />
              Clear {activeFilters}
            </Button>
          )}
          <span className="text-ink-3 ml-auto text-small tabular-nums">
            {filtered.length} shown
          </span>
        </header>

        {filtered.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title="Nothing matches these filters"
            description="No alert on the network fits the current selection. Widen the severity or time range."
            action={{ label: "Clear filters", onClick: reset }}
          />
        ) : (
          <ul>
            {filtered.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => select(a.id)}
                  className={cn(
                    "hover:bg-surface-soft border-line relative flex w-full items-start gap-3 border-b px-5 py-3.5 text-left transition-colors last:border-b-0",
                    selectedId === a.id && "bg-brand-soft",
                  )}
                >
                  <span
                    className={cn("absolute inset-y-3 left-0 w-0.5 rounded-r", ACCENT[a.severity])}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "text-body font-medium",
                          a.severity === "resolved" ? "text-ink-2" : "text-ink",
                        )}
                      >
                        {a.title}
                      </span>
                      <SeverityBadge severity={a.severity} />
                    </span>
                    <span className="text-ink-2 mt-1 block text-small">{a.detail}</span>
                    <span className="text-ink-3 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption">
                      <span>{CATEGORY_LABEL[a.category]}</span>
                      <span>{a.entityLabel}</span>
                      <span className="flex items-center gap-1">
                        <UserRound className="size-3" aria-hidden />
                        {a.owner}
                      </span>
                      <span className="tabular-nums">{relativeTime(a.raisedAt)}</span>
                    </span>
                  </span>
                  <span className="text-ink-3 shrink-0 text-caption tabular-nums">{a.id}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Drawer
        open={Boolean(selected)}
        onOpenChange={(v) => !v && select(null)}
        title={selected?.title ?? ""}
        description={selected?.id}
        width="25rem"
        footer={
          selected && selected.severity !== "resolved" ? (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm">
                Reassign
              </Button>
              <Button variant="primary" size="sm">
                <Check className="size-3.5" aria-hidden />
                Mark resolved
              </Button>
            </div>
          ) : undefined
        }
      >
        {selected && <AlertDetail alert={selected} />}
      </Drawer>
    </>
  );
}

function AlertDetail({ alert }: { alert: Alert }) {
  const facility = alert.facilityId ? FACILITY_BY_ID.get(alert.facilityId) : null;
  const href =
    alert.entityType === "shipment"
      ? `/shipments/${alert.entityId}`
      : alert.entityType === "vehicle"
        ? `/fleet?vehicle=${alert.entityId}`
        : alert.entityType === "route"
          ? `/routes?route=${alert.entityId}`
          : alert.entityType === "facility"
            ? `/warehouses?facility=${alert.entityId}`
            : null;

  return (
    <div className="px-5 py-4">
      <SeverityBadge severity={alert.severity} />
      <p className="text-ink-2 text-small mt-3 leading-relaxed">{alert.detail}</p>

      <dl className="mt-4">
        <DetailRow label="Category">{CATEGORY_LABEL[alert.category]}</DetailRow>
        <DetailRow label="Affects">
          {href ? (
            <Link href={href} className="text-brand hover:underline">
              {alert.entityLabel}
            </Link>
          ) : (
            alert.entityLabel
          )}
        </DetailRow>
        <DetailRow label="Impact">{alert.impact}</DetailRow>
        <DetailRow label="Owner">{alert.owner}</DetailRow>
        {facility && <DetailRow label="Location">{facility.name}</DetailRow>}
        <DetailRow label="Raised">{formatDateTime(alert.raisedAt)}</DetailRow>
        {alert.resolvedAt && (
          <DetailRow label="Resolved">{formatDateTime(alert.resolvedAt)}</DetailRow>
        )}
      </dl>

      <p className="label-eyebrow mt-4 mb-2">Suggested next step</p>
      <div className="border-line bg-surface-soft rounded-well border p-3">
        <p className="text-ink-2 text-small">{nextStep(alert)}</p>
      </div>
    </div>
  );
}

function nextStep(alert: Alert) {
  switch (alert.category) {
    case "capacity":
      return "Divert the next two inbound loads to the nearest cross-dock and bring the evening shift forward by an hour.";
    case "delay":
      return "Confirm the receiving window with the customer, then re-sequence the remaining drops on this run.";
    case "maintenance":
      return "Release the vehicle from tomorrow's allocation and book it into the workshop on the early slot.";
    case "customs":
      return "Send the corrected commercial invoice to the broker and flag the load for priority clearance.";
    case "temperature":
      return "Call the driver to verify the set point, then check the reefer unit at the next stop.";
    case "compliance":
      return "Assign a relief driver at the next service area before the driving limit is reached.";
    case "route":
      return "Accept the proposed diversion and push the revised arrival times to the affected customers.";
    default:
      return "Review the affected records and assign an owner.";
  }
}
