"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CARRIERS, FACILITIES, ROUTES, SERIES, seriesForRange } from "@/lib/data";
import { CapacityBar } from "@/components/ui/metric";
import { cn, formatCurrency, formatNumber, makeRng } from "@/lib/utils";

const AXIS = { fill: "var(--nl-text-muted)", fontSize: 11 } as const;

function Frame({
  children,
  label,
}: {
  children: React.ReactElement;
  label: string;
}) {
  return (
    <div className="h-[15rem] px-1 pt-3 pb-3" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

interface Entry {
  name?: string;
  dataKey?: string | number;
  value?: number;
  color?: string;
  payload?: Record<string, unknown>;
}

function Tip({
  active,
  payload,
  label,
  format = (v: number) => formatNumber(Math.round(v)),
  names,
}: {
  active?: boolean;
  payload?: Entry[];
  label?: string | number;
  format?: (v: number) => string;
  names?: Record<string, string>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border-line rounded-control border px-2.5 py-1.5 shadow-md">
      <p className="text-ink text-caption font-semibold">{label}</p>
      <ul className="mt-1 space-y-0.5">
        {payload.map((e, i) => {
          const key = String(e.dataKey ?? e.name ?? i);
          return (
            <li key={key} className="text-caption flex items-center gap-2 tabular-nums">
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: e.color }}
                aria-hidden
              />
              <span className="text-ink-2 flex-1">{names?.[key] ?? key}</span>
              <span className="text-ink font-semibold">
                {typeof e.value === "number" ? format(e.value) : e.value}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Cost per shipment, the metric the finance side of the operation is judged on. */
export function CostTrend({ days }: { days: 7 | 30 | 90 }) {
  const data = seriesForRange(days);
  const latest = data[data.length - 1].costPerShipment;
  const first = data[0].costPerShipment;
  const change = ((latest - first) / first) * 100;

  return (
    <div className="flex h-full flex-col">
      <header className="border-line border-b px-5 py-3">
        <h2 className="text-ink text-body-lg font-semibold">Cost per shipment</h2>
        <p className="text-ink-2 text-small mt-0.5 tabular-nums">
          {formatCurrency(latest, 2)} now ·{" "}
          <span className={change > 0 ? "text-critical-text" : "text-success-text"}>
            {change > 0 ? "+" : ""}
            {change.toFixed(1)}% over {days} days
          </span>
        </p>
      </header>
      <Frame label={`Cost per shipment over ${days} days`}>
        <AreaChart data={data} margin={{ top: 6, right: 14, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="nl-cost" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--nl-brand)" stopOpacity={0.24} />
              <stop offset="100%" stopColor="var(--nl-brand)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--nl-border)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="label"
            interval={days === 7 ? 0 : days === 30 ? 5 : 16}
            tickLine={false}
            axisLine={false}
            tick={AXIS}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={46}
            domain={["dataMin - 10", "dataMax + 10"]}
            tick={AXIS}
            tickFormatter={(v: number) => `€${Math.round(v)}`}
          />
          <Tooltip
            content={
              <Tip
                format={(v) => formatCurrency(v, 2)}
                names={{ costPerShipment: "Cost per shipment" }}
              />
            }
            cursor={{ stroke: "var(--nl-border-strong)" }}
          />
          <Area
              animationDuration={420}
            type="monotone"
            dataKey="costPerShipment"
            stroke="var(--nl-brand)"
            strokeWidth={1.8}
            fill="url(#nl-cost)"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </AreaChart>
      </Frame>
    </div>
  );
}

/** Fleet utilisation against the 85% planning target. */
export function UtilisationTrend({ days }: { days: 7 | 30 | 90 }) {
  const data = seriesForRange(days);
  const avg = data.reduce((s, p) => s + p.utilisation, 0) / data.length;

  return (
    <div className="flex h-full flex-col">
      <header className="border-line border-b px-5 py-3">
        <h2 className="text-ink text-body-lg font-semibold">Fleet utilisation</h2>
        <p className="text-ink-2 text-small mt-0.5 tabular-nums">
          {avg.toFixed(1)}% average over {days} days
        </p>
      </header>
      <Frame label={`Fleet utilisation over ${days} days`}>
        <AreaChart data={data} margin={{ top: 6, right: 14, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="nl-util" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--nl-info)" stopOpacity={0.26} />
              <stop offset="100%" stopColor="var(--nl-info)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--nl-border)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="label"
            interval={days === 7 ? 0 : days === 30 ? 5 : 16}
            tickLine={false}
            axisLine={false}
            tick={AXIS}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            domain={[55, 100]}
            tick={AXIS}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            content={<Tip format={(v) => `${v.toFixed(1)}%`} names={{ utilisation: "Utilisation" }} />}
            cursor={{ stroke: "var(--nl-border-strong)" }}
          />
          <Area
              animationDuration={420}
            type="monotone"
            dataKey="utilisation"
            stroke="var(--nl-info)"
            strokeWidth={1.8}
            fill="url(#nl-util)"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </AreaChart>
      </Frame>
    </div>
  );
}

/** Throughput against target, by site. A grouped bar reads plan versus actual directly. */
export function ThroughputByFacility() {
  const data = [...FACILITIES]
    .sort((a, b) => b.throughputToday - a.throughputToday)
    .slice(0, 9)
    .map((f) => ({ name: f.city, actual: f.throughputToday, target: f.throughputTarget }));

  return (
    <div className="flex h-full flex-col">
      <header className="border-line border-b px-5 py-3">
        <h2 className="text-ink text-body-lg font-semibold">Warehouse throughput</h2>
        <p className="text-ink-2 text-small mt-0.5">Movements today against plan</p>
      </header>
      <Frame label="Warehouse throughput against target">
        <BarChart data={data} margin={{ top: 6, right: 14, bottom: 0, left: 0 }} barGap={2}>
          <CartesianGrid stroke="var(--nl-border)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={AXIS} dy={6} interval={0} />
          <YAxis tickLine={false} axisLine={false} width={36} tick={AXIS} />
          <Tooltip
            content={<Tip names={{ actual: "Actual", target: "Target" }} />}
            cursor={{ fill: "var(--nl-neutral-soft)" }}
          />
          <Legend
            verticalAlign="top"
            align="left"
            height={24}
            iconType="circle"
            iconSize={7}
            formatter={(v) => (
              <span className="text-ink-2 text-caption">{v === "actual" ? "Actual" : "Target"}</span>
            )}
          />
          <Bar
              animationDuration={420} dataKey="target" fill="var(--nl-neutral-soft)" radius={[3, 3, 0, 0]} />
          <Bar
              animationDuration={420} dataKey="actual" fill="var(--nl-brand)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </Frame>
    </div>
  );
}

const DELAY_CAUSES = [
  { name: "Road congestion", value: 34, color: "var(--nl-critical)" },
  { name: "Customs clearance", value: 22, color: "var(--nl-warning)" },
  { name: "Dock waiting", value: 19, color: "var(--nl-info)" },
  { name: "Vehicle fault", value: 13, color: "var(--nl-brand)" },
  { name: "Weather", value: 12, color: "var(--nl-text-muted)" },
];

/** Composition of lost time. A part-to-whole reading is the one case a ring earns. */
export function DelayCauses() {
  // Lost hours across the reporting window, which is what the shares are shares of.
  const lostHours = 1_842;

  return (
    <div className="flex h-full flex-col">
      <header className="border-line border-b px-5 py-3">
        <h2 className="text-ink text-body-lg font-semibold">Where time is lost</h2>
        <p className="text-ink-2 text-small mt-0.5">Share of delayed minutes, last 30 days</p>
      </header>
      <div className="flex flex-1 flex-col items-center gap-4 px-5 py-4 sm:flex-row">
        <div className="relative h-[9.5rem] w-[9.5rem] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
              animationDuration={420}
                data={DELAY_CAUSES}
                dataKey="value"
                innerRadius="62%"
                outerRadius="100%"
                paddingAngle={2}
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {DELAY_CAUSES.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip content={<Tip format={(v) => `${v}%`} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="text-ink text-h2 font-semibold tabular-nums">
                {formatNumber(lostHours)}
              </p>
              <p className="text-ink-3 text-caption">hours lost</p>
            </div>
          </div>
        </div>
        <ul className="w-full flex-1 space-y-2">
          {DELAY_CAUSES.map((d) => (
            <li key={d.name} className="flex items-center gap-2.5">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: d.color }}
                aria-hidden
              />
              <span className="text-ink-2 flex-1 text-small">{d.name}</span>
              <span className="text-ink text-small font-semibold tabular-nums">{d.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Route efficiency ranking. A ranked list beats a chart when the labels carry meaning. */
export function RouteEfficiency() {
  const ranked = [...ROUTES].sort((a, b) => b.efficiency - a.efficiency);
  const best = ranked.slice(0, 5);
  const worst = ranked.slice(-5).reverse();

  return (
    <div className="flex h-full flex-col">
      <header className="border-line border-b px-5 py-3">
        <h2 className="text-ink text-body-lg font-semibold">Route efficiency</h2>
        <p className="text-ink-2 text-small mt-0.5">Schedule adherence by corridor</p>
      </header>
      <div className="grid flex-1 grid-cols-1 divide-y divide-[var(--nl-border)] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {[
          { title: "Best performing", rows: best },
          { title: "Needs attention", rows: worst },
        ].map((group) => (
          <div key={group.title} className="px-5 py-3.5">
            <h3 className="label-eyebrow mb-2.5">{group.title}</h3>
            <ul className="space-y-2.5">
              {group.rows.map((r) => (
                <li key={r.id}>
                  <div className="flex items-baseline justify-between gap-2 text-small">
                    <span className="text-ink truncate font-medium">
                      {r.id}
                      <span className="text-ink-3 ml-1.5 font-normal">{r.name}</span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-semibold tabular-nums",
                        r.efficiency >= 90 ? "text-success-text" : r.efficiency >= 78 ? "text-ink" : "text-critical-text",
                      )}
                    >
                      {r.efficiency}%
                    </span>
                  </div>
                  <CapacityBar
                    value={r.efficiency}
                    height={4}
                    className="mt-1.5"
                    tone={r.efficiency >= 90 ? "success" : r.efficiency >= 78 ? "brand" : "critical"}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Carrier scorecard. Values are derived so they stay stable between renders. */
export function CarrierPerformance() {
  const rows = CARRIERS.map((carrier, i) => {
    const rng = makeRng(4_400 + i * 97);
    const onTime = 90 + rng() * 8.6;
    return {
      carrier,
      onTime,
      loads: Math.round(120 + rng() * 380),
      costPerKm: 1.02 + rng() * 0.4,
      damageRate: rng() * 0.9,
    };
  }).sort((a, b) => b.onTime - a.onTime);

  return (
    <div className="flex h-full flex-col">
      <header className="border-line border-b px-5 py-3">
        <h2 className="text-ink text-body-lg font-semibold">Carrier performance</h2>
        <p className="text-ink-2 text-small mt-0.5">Last 30 days across all corridors</p>
      </header>
      <div className="scrollbar-thin flex-1 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left">
          <caption className="sr-only">Carrier performance over the last 30 days</caption>
          <thead>
            <tr className="border-line border-b">
              <th scope="col" className="label-eyebrow px-5 py-2">Carrier</th>
              <th scope="col" className="label-eyebrow px-3 py-2 text-right">Loads</th>
              <th scope="col" className="label-eyebrow px-3 py-2">On time</th>
              <th scope="col" className="label-eyebrow px-3 py-2 text-right">€/km</th>
              <th scope="col" className="label-eyebrow px-5 py-2 text-right">Damage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.carrier} className="border-line border-b last:border-b-0">
                <td className="text-ink px-5 py-2.5 text-small font-medium">{r.carrier}</td>
                <td className="text-ink-2 px-3 py-2.5 text-right text-small tabular-nums">
                  {formatNumber(r.loads)}
                </td>
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-2">
                    <CapacityBar
                      value={r.onTime}
                      height={4}
                      className="w-16"
                      tone={r.onTime >= 95 ? "success" : r.onTime >= 92 ? "brand" : "warning"}
                    />
                    <span className="text-ink w-11 text-right text-small tabular-nums">
                      {r.onTime.toFixed(1)}%
                    </span>
                  </span>
                </td>
                <td className="text-ink-2 px-3 py-2.5 text-right text-small tabular-nums">
                  €{r.costPerKm.toFixed(2)}
                </td>
                <td className="px-5 py-2.5 text-right text-small tabular-nums">
                  <span className={r.damageRate > 0.6 ? "text-warning-text" : "text-ink-2"}>
                    {r.damageRate.toFixed(2)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const ANALYTICS_TOTALS = {
  avgCost: SERIES.slice(-30).reduce((s, p) => s + p.costPerShipment, 0) / 30,
};
