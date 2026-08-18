"use client";

import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function TrendIndicator({
  delta,
  positiveIsGood = true,
  className,
  showIcon = true,
}: {
  delta: number;
  positiveIsGood?: boolean;
  className?: string;
  showIcon?: boolean;
}) {
  const rising = delta > 0;
  const good = positiveIsGood ? rising : !rising;
  const Icon = rising ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-small font-medium tabular-nums",
        good ? "text-success-text" : "text-critical-text",
        className,
      )}
    >
      {showIcon && <Icon className="size-3.5" aria-hidden />}
      {rising ? "+" : ""}
      {delta.toFixed(1)}%
    </span>
  );
}

/**
 * Compact trend line for KPI rows. Drawn as a filled area so it reads at 28px tall
 * without competing with the number beside it.
 */
export function Sparkline({
  data,
  className,
  stroke = "var(--nl-brand)",
  width = 96,
  height = 28,
}: {
  data: number[];
  className?: string;
  stroke?: string;
  width?: number;
  height?: number;
}) {
  const id = React.useId();
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const pad = 3;
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);

  const line = data.map((v, i) => `${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `M0,${height} L${data
    .map((v, i) => `${(i * step).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" L")} L${width},${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      aria-hidden
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={width}
        cy={y(data[data.length - 1])}
        r="2.5"
        fill={stroke}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Utilisation bar. The track carries a threshold marker so a number is not needed twice. */
export function CapacityBar({
  value,
  threshold,
  tone,
  className,
  height = 6,
}: {
  value: number;
  threshold?: number;
  tone?: "success" | "warning" | "critical" | "brand";
  className?: string;
  height?: number;
}) {
  const resolved =
    tone ?? (value >= 90 ? "critical" : value >= 80 ? "warning" : "success");
  const fill = {
    success: "bg-success",
    warning: "bg-warning",
    critical: "bg-critical",
    brand: "bg-brand",
  }[resolved];

  return (
    <div
      className={cn("bg-surface-sunken relative w-full overflow-hidden rounded-full", className)}
      style={{ height }}
      role="img"
      aria-label={`${value.toFixed(0)} percent`}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", fill)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
      {threshold !== undefined && (
        <span
          className="bg-ink/35 absolute top-0 h-full w-px"
          style={{ left: `${threshold}%` }}
          aria-hidden
        />
      )}
    </div>
  );
}

/** Radial gauge for single-value readouts where a bar would be too wide. */
export function Gauge({
  value,
  size = 56,
  stroke = 5,
  tone = "var(--nl-brand)",
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: string;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const sweep = 0.75; // three-quarter dial
  const arc = circumference * sweep;
  const filled = arc * (Math.min(100, Math.max(0, value)) / 100);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[225deg]" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--nl-surface-sunken)"
          strokeWidth={stroke}
          strokeDasharray={`${arc} ${circumference}`}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
          className="transition-[stroke-dasharray] duration-700"
        />
      </svg>
      <span className="text-ink absolute text-small font-semibold tabular-nums">
        {label ?? `${Math.round(value)}`}
      </span>
    </div>
  );
}

/** Horizontal count breakdown. Used for fleet and shipment status mixes. */
export function StackedBar({
  segments,
  className,
  height = 8,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  className?: string;
  height?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div
      className={cn("flex w-full overflow-hidden rounded-full", className)}
      style={{ height }}
    >
      {segments.map((s) => (
        <span
          key={s.label}
          className="h-full first:rounded-l-full last:rounded-r-full"
          style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
          title={`${s.label}: ${s.value}`}
        />
      ))}
    </div>
  );
}
