"use client";

import * as React from "react";
import { Panel } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { DeliveryPerformance } from "./delivery-performance";
import {
  CarrierPerformance,
  CostTrend,
  DelayCauses,
  RouteEfficiency,
  ThroughputByFacility,
  UtilisationTrend,
} from "./analytics-charts";
import { seriesForRange, ON_TIME_RATE, FLEET_UTILISATION } from "@/lib/data";
import { TrendIndicator } from "@/components/ui/metric";
import { formatCurrency, formatNumber } from "@/lib/utils";

type Range = "7" | "30" | "90";

export function AnalyticsView() {
  const [range, setRange] = React.useState<Range>("30");
  const days = Number(range) as 7 | 30 | 90;
  const data = seriesForRange(days);

  const completed = data.reduce((s, p) => s + p.completed, 0);
  const avgCost = data.reduce((s, p) => s + p.costPerShipment, 0) / data.length;
  const onTime = (data.reduce((s, p) => s + p.onTime, 0) / completed) * 100;
  const spend = data.reduce((s, p) => s + p.costPerShipment * p.completed, 0);

  // Compare the two halves of the window to get a directional read.
  const half = Math.floor(data.length / 2);
  const delta = (key: "costPerShipment" | "utilisation" | "completed") => {
    const avg = (arr: typeof data) => arr.reduce((s, p) => s + p[key], 0) / arr.length;
    const before = avg(data.slice(0, half));
    return ((avg(data.slice(half)) - before) / before) * 100;
  };

  const summary = [
    {
      label: "Shipments completed",
      value: formatNumber(completed),
      delta: delta("completed"),
      good: true,
    },
    { label: "On-time rate", value: `${onTime.toFixed(1)}%`, delta: onTime - ON_TIME_RATE, good: true },
    {
      label: "Average cost",
      value: formatCurrency(avgCost, 2),
      delta: delta("costPerShipment"),
      good: false,
    },
    {
      label: "Fleet utilisation",
      value: `${FLEET_UTILISATION}%`,
      delta: delta("utilisation"),
      good: true,
    },
    { label: "Total spend", value: formatCurrency(spend), delta: delta("completed"), good: false },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-2 text-small">
          Comparing the most recent {Math.ceil(days / 2)} days against the {Math.floor(days / 2)} before.
        </p>
        <Segmented
          label="Reporting period"
          value={range}
          onChange={setRange}
          options={[
            { value: "7", label: "7 days" },
            { value: "30", label: "30 days" },
            { value: "90", label: "90 days" },
          ]}
        />
      </div>

      <section
        aria-label="Reporting summary"
        className="bg-surface border-line rounded-panel grid grid-cols-2 overflow-hidden border sm:grid-cols-3 lg:grid-cols-5"
      >
        {summary.map((s, i) => (
          <div
            key={s.label}
            className={
              "border-line px-4 py-3.5 " +
              (i % 2 === 1 ? "border-l " : "") +
              "sm:border-l sm:[&:nth-child(3n+1)]:border-l-0 lg:[&:nth-child(3n+1)]:border-l lg:first:border-l-0 " +
              (i >= 2 ? "border-t sm:[&:nth-child(-n+3)]:border-t-0 " : "") +
              "lg:border-t-0"
            }
          >
            <p className="text-ink-2 text-small">{s.label}</p>
            <p className="text-ink mt-1 text-h2 font-semibold tabular-nums">{s.value}</p>
            <TrendIndicator delta={s.delta} positiveIsGood={s.good} className="mt-1" />
          </div>
        ))}
      </section>

      <Panel>
        <DeliveryPerformance />
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <CostTrend days={days} />
        </Panel>
        <Panel>
          <UtilisationTrend days={days} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <RouteEfficiency />
        </Panel>
        <Panel>
          <DelayCauses />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <ThroughputByFacility />
        </Panel>
        <Panel>
          <CarrierPerformance />
        </Panel>
      </div>
    </>
  );
}
