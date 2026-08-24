"use client";

import * as React from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { seriesForRange } from "@/lib/data";
import { Segmented } from "@/components/ui/segmented";
import { formatNumber } from "@/lib/utils";

type Range = "7" | "30" | "90";

/**
 * On-time and delayed are stacked, so their combined height is the completed total.
 * Plotting completed as its own line would trace almost exactly the on-time line and
 * tell the reader nothing. The rate rides a second axis because it answers a different
 * question: not how much moved, but how much of it arrived on time.
 */
const SERIES = [
  { key: "onTime", label: "On time", color: "var(--nl-success)" },
  { key: "delayed", label: "Delayed", color: "var(--nl-critical)" },
  { key: "rate", label: "On-time rate", color: "var(--nl-brand)" },
] as const;

export function DeliveryPerformance() {
  const [range, setRange] = React.useState<Range>("30");
  const data = React.useMemo(
    () =>
      seriesForRange(Number(range) as 7 | 30 | 90).map((p) => ({
        ...p,
        rate: Number(((p.onTime / p.completed) * 100).toFixed(1)),
      })),
    [range],
  );

  const totals = React.useMemo(() => {
    const completed = data.reduce((s, p) => s + p.completed, 0);
    const onTime = data.reduce((s, p) => s + p.onTime, 0);
    return { completed, onTime, rate: (onTime / completed) * 100 };
  }, [data]);

  // A dense axis is unreadable on a 90 day window, so thin the ticks instead.
  const tickInterval = range === "7" ? 0 : range === "30" ? 4 : 14;

  return (
    <div className="flex h-full flex-col">
      <header className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
        <div>
          <h2 className="text-ink text-body-lg font-semibold">Delivery performance</h2>
          <p className="text-ink-2 text-small mt-0.5 tabular-nums">
            {formatNumber(totals.completed)} completed over {range} days ·{" "}
            <span className="text-success-text font-medium">{totals.rate.toFixed(1)}% on time</span>
          </p>
        </div>
        <Segmented
          label="Time range"
          value={range}
          onChange={setRange}
          options={[
            { value: "7", label: "7 days" },
            { value: "30", label: "30 days" },
            { value: "90", label: "90 days" },
          ]}
        />
      </header>

      <div className="flex items-center gap-4 px-5 pt-3">
        {SERIES.map((s) => (
          <span key={s.key} className="text-ink-2 text-caption flex items-center gap-1.5">
            <span
              className={s.key === "rate" ? "h-0.5 w-3 rounded-full" : "size-2 rounded-[2px]"}
              style={{ backgroundColor: s.color }}
              aria-hidden
            />
            {s.label}
          </span>
        ))}
      </div>

      <div className="h-[17rem] px-1 pt-2 pb-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="nl-ontime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--nl-success)" stopOpacity={0.34} />
                <stop offset="100%" stopColor="var(--nl-success)" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--nl-border)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="label"
              interval={tickInterval}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--nl-text-muted)", fontSize: 11 }}
              dy={6}
            />
            <YAxis
              yAxisId="volume"
              tickLine={false}
              axisLine={false}
              width={42}
              tick={{ fill: "var(--nl-text-muted)", fontSize: 11 }}
              tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            />
            <YAxis
              yAxisId="rate"
              orientation="right"
              domain={[80, 100]}
              width={38}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--nl-text-muted)", fontSize: 11 }}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--nl-border-strong)", strokeWidth: 1 }} />
            <Area
              animationDuration={420}
              yAxisId="volume"
              type="monotone"
              stackId="volume"
              dataKey="onTime"
              stroke="var(--nl-success)"
              strokeWidth={1.4}
              fill="url(#nl-ontime)"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
            <Area
              animationDuration={420}
              yAxisId="volume"
              type="monotone"
              stackId="volume"
              dataKey="delayed"
              stroke="var(--nl-critical)"
              strokeWidth={1.4}
              fill="var(--nl-critical)"
              fillOpacity={0.5}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
            <Line
              animationDuration={420}
              yAxisId="rate"
              type="monotone"
              dataKey="rate"
              stroke="var(--nl-brand)"
              strokeWidth={1.8}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface TooltipPayload {
  name?: string;
  dataKey?: string | number;
  value?: number;
  color?: string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  suffix,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border-line rounded-control border px-2.5 py-1.5 shadow-md">
      <p className="text-ink text-caption font-semibold">{label}</p>
      <ul className="mt-1 space-y-0.5">
        {payload.map((entry) => {
          const key = String(entry.dataKey ?? entry.name ?? "");
          const meta = SERIES.find((s) => s.key === key);
          return (
            <li key={key} className="text-caption flex items-center gap-2 tabular-nums">
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color ?? meta?.color }}
                aria-hidden
              />
              <span className="text-ink-2 flex-1">{meta?.label ?? key}</span>
              <span className="text-ink font-semibold">
                {key === "rate"
                  ? `${entry.value}%`
                  : typeof entry.value === "number"
                    ? formatNumber(Math.round(entry.value))
                    : entry.value}
                {key === "rate" ? "" : suffix}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
