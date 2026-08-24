import * as React from "react";
import { cn } from "@/lib/utils";
import type {
  AlertSeverity,
  FacilityStatus,
  Priority,
  ShipmentStatus,
  VehicleStatus,
} from "@/lib/data/types";

type Tone = "neutral" | "brand" | "success" | "warning" | "critical" | "info";

const TONE_CHIP: Record<Tone, string> = {
  neutral: "bg-neutral-soft text-ink-2 border-line",
  brand: "bg-brand-soft text-brand border-brand-border",
  success: "bg-success-soft text-success-text border-success-border",
  warning: "bg-warning-soft text-warning-text border-warning-border",
  critical: "bg-critical-soft text-critical-text border-critical-border",
  info: "bg-info-soft text-info-text border-info-border",
};

const TONE_DOT: Record<Tone, string> = {
  neutral: "bg-ink-3",
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  critical: "bg-critical",
  info: "bg-info",
};

/** Single source of truth for how every operational state is worded and coloured. */
export const SHIPMENT_STATUS: Record<ShipmentStatus, { label: string; tone: Tone }> = {
  "in-transit": { label: "In transit", tone: "info" },
  loading: { label: "Loading", tone: "brand" },
  "at-risk": { label: "At risk", tone: "warning" },
  delayed: { label: "Delayed", tone: "critical" },
  customs: { label: "Customs", tone: "warning" },
  delivered: { label: "Delivered", tone: "success" },
  scheduled: { label: "Scheduled", tone: "neutral" },
};

export const VEHICLE_STATUS: Record<VehicleStatus, { label: string; tone: Tone }> = {
  "in-transit": { label: "In transit", tone: "info" },
  loading: { label: "Loading", tone: "brand" },
  idle: { label: "Idle", tone: "neutral" },
  maintenance: { label: "Maintenance", tone: "warning" },
};

export const FACILITY_STATUS: Record<FacilityStatus, { label: string; tone: Tone }> = {
  operational: { label: "Operational", tone: "success" },
  "near-capacity": { label: "Near capacity", tone: "warning" },
  "over-capacity": { label: "Over capacity", tone: "critical" },
  reduced: { label: "Reduced hours", tone: "neutral" },
};

export const ALERT_SEVERITY: Record<AlertSeverity, { label: string; tone: Tone }> = {
  critical: { label: "Critical", tone: "critical" },
  warning: { label: "Warning", tone: "warning" },
  info: { label: "Information", tone: "info" },
  resolved: { label: "Resolved", tone: "success" },
};

export const ROUTE_STATUS: Record<string, { label: string; tone: Tone }> = {
  "on-schedule": { label: "On schedule", tone: "success" },
  "at-risk": { label: "At risk", tone: "warning" },
  delayed: { label: "Delayed", tone: "critical" },
};

export const PRIORITY: Record<Priority, { label: string; tone: Tone }> = {
  low: { label: "Low", tone: "neutral" },
  normal: { label: "Normal", tone: "info" },
  high: { label: "High", tone: "warning" },
  critical: { label: "Critical", tone: "critical" },
};

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-caption font-medium whitespace-nowrap",
        TONE_CHIP[tone],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", TONE_DOT[tone])} aria-hidden />}
      {children}
    </span>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: ShipmentStatus;
  className?: string;
}) {
  const s = SHIPMENT_STATUS[status];
  return (
    <Badge tone={s.tone} dot className={className}>
      {s.label}
    </Badge>
  );
}

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const s = VEHICLE_STATUS[status];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

export function FacilityStatusBadge({ status }: { status: FacilityStatus }) {
  const s = FACILITY_STATUS[status];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

export function PriorityTag({ priority }: { priority: Priority }) {
  const p = PRIORITY[priority];
  // Normal priority is the default state and does not need to draw the eye.
  if (priority === "normal") {
    return <span className="text-small text-ink-3">Normal</span>;
  }
  return <Badge tone={p.tone}>{p.label}</Badge>;
}

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const s = ALERT_SEVERITY[severity];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

/** Colour used for map geometry and chart series, keyed off the same status vocabulary. */
export const STATUS_COLOR_VAR: Record<string, string> = {
  "on-schedule": "var(--nl-success)",
  "in-transit": "var(--nl-success)",
  delivered: "var(--nl-success)",
  "at-risk": "var(--nl-warning)",
  customs: "var(--nl-warning)",
  loading: "var(--nl-warning)",
  delayed: "var(--nl-critical)",
  selected: "var(--nl-brand)",
  scheduled: "var(--nl-text-muted)",
};
