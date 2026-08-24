export * from "./types";
export * from "./network";
export * from "./fleet";
export * from "./routes";
export * from "./shipments";
export * from "./alerts";
export * from "./events";
export * from "./series";
export * from "./planning";

import { FLEET_UTILISATION } from "./fleet";
import {
  ACTIVE_SHIPMENT_COUNT,
  FREIGHT_IN_TRANSIT,
  ON_TIME_RATE,
} from "./shipments";
import { trendOver } from "./series";
import { makeRng } from "../utils";

export interface Kpi {
  id: string;
  label: string;
  value: string;
  raw: number;
  /** Percentage change of this week against the week before. */
  delta: number;
  comparison: string;
  /** Sparkline colour, derived from the delta so the two can never disagree. */
  tone: "positive" | "negative";
  series: number[];
  href: string;
}

import { SERIES } from "./series";

const WINDOW = 14;
const last14 = SERIES.slice(-WINDOW);

/**
 * Tonnage on the road is shipment count times the average load, and the average load
 * moves independently of the count: a light day of parcel freight and a heavy day of
 * building materials can carry the same number of consignments. Modelling that second
 * driver keeps the freight line from tracing the shipment line at a different scale.
 */
const AVERAGE_LOAD = (() => {
  const rng = makeRng(51_207);
  let level = 14.4;
  return last14.map(() => {
    // Random walk with pull back to the mean, so the series drifts rather than jitters.
    level += (rng() - 0.5) * 1.9 + (14.4 - level) * 0.22;
    return level;
  });
})();

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/**
 * Tilts a series so the second half averages `delta` percent above the first. The
 * headline figures are fixed by the brief, so rather than printing a number beside an
 * unrelated line, the line is shaped to the number: a reader can now see the rise or
 * fall that the label claims.
 *
 * The tilt is a multiplicative linear ramp about the midpoint. Its slope is solved by
 * bisection rather than in closed form, because the source series carries its own
 * weekly rhythm and a formula derived from a flat series lands wide of the target.
 */
function tilt(series: number[], slope: number): number[] {
  const mid = (series.length - 1) / 2;
  return series.map((v, i) => v * (1 + slope * (i - mid)));
}

function halfRatio(series: number[]): number {
  const half = series.length / 2;
  return mean(series.slice(half)) / mean(series.slice(0, half));
}

/**
 * Light three-point smoothing. The raw series swings hard at weekends, enough that a
 * declining metric can still end higher than it started. Damping the swing lets the
 * trend carry the shape without flattening the line into a straight rule.
 */
function damp(series: number[]): number[] {
  return series.map((v, i) => {
    const prev = series[i - 1] ?? v;
    const next = series[i + 1] ?? v;
    return v * 0.5 + prev * 0.25 + next * 0.25;
  });
}

/**
 * Settles the tail toward the trend and forces the closing step to follow the delta.
 * A metric labelled as falling must be seen to fall at the right-hand edge, which is
 * where the eye lands; residual weekend wobble was leaving the last step ambiguous.
 */
function settleTail(series: number[], direction: number): number[] {
  const n = series.length;
  // Least-squares trend through the shaped series.
  const xs = series.map((_, i) => i);
  const mx = mean(xs);
  const my = mean(series);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (series[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const at = (i: number) => my + slope * (i - mx);

  const out = [...series];
  // Keep progressively less of the raw wobble over the final three points.
  const keep = [0.5, 0.26, 0.08];
  for (let k = 0; k < keep.length; k++) {
    const i = n - keep.length + k;
    out[i] = at(i) + (series[i] - at(i)) * keep[k];
  }

  // Guarantee the closing segment moves the way the label claims.
  const step = out[n - 1] - out[n - 2];
  const wanted = Math.abs(slope) || Math.abs(my) * 0.004;
  if (direction !== 0 && Math.sign(step) !== direction) {
    out[n - 1] = out[n - 2] + direction * wanted;
  }
  return out;
}

function shapeToDelta(input: number[], delta: number): number[] {
  const series = damp(damp(input));
  const target = 1 + delta / 100;
  const direction = Math.sign(delta);
  // Tail settling shifts the averages, so it sits inside the objective rather than
  // being applied afterwards. Otherwise the printed delta drifts off the target.
  const shape = (slope: number) => settleTail(tilt(series, slope), direction);

  let lo = -0.35;
  let hi = 0.35;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (halfRatio(shape(mid)) < target) lo = mid;
    else hi = mid;
  }
  return shape((lo + hi) / 2);
}

/** The realised change across the shaped series, which is what the label reports. */
function realisedDelta(series: number[]): number {
  const half = series.length / 2;
  const before = mean(series.slice(0, half));
  return Number(((mean(series.slice(half)) - before) / before * 100).toFixed(1));
}

function buildKpi(
  id: string,
  label: string,
  value: string,
  raw: number,
  targetDelta: number,
  source: number[],
  href: string,
): Kpi {
  const series = shapeToDelta(source, targetDelta);
  const delta = realisedDelta(series);
  return {
    id,
    label,
    value,
    raw,
    delta,
    // Every headline metric is compared over the same window.
    comparison: "vs last week",
    tone: delta >= 0 ? "positive" : "negative",
    series,
    href,
  };
}

export const KPIS: Kpi[] = [
  buildKpi(
    "active-shipments",
    "Active shipments",
    ACTIVE_SHIPMENT_COUNT.toLocaleString("en-GB"),
    ACTIVE_SHIPMENT_COUNT,
    8.4,
    last14.map((p) => p.volume),
    "/shipments",
  ),
  buildKpi(
    "on-time",
    "On-time delivery",
    `${ON_TIME_RATE}%`,
    ON_TIME_RATE,
    2.1,
    last14.map((p) => (p.onTime / p.completed) * 100),
    "/analytics",
  ),
  buildKpi(
    "fleet-utilisation",
    "Fleet utilisation",
    `${FLEET_UTILISATION}%`,
    FLEET_UTILISATION,
    4.7,
    last14.map((p) => p.utilisation),
    "/fleet",
  ),
  buildKpi(
    "freight",
    "Freight in transit",
    `${FREIGHT_IN_TRANSIT.toLocaleString("en-GB")} t`,
    FREIGHT_IN_TRANSIT,
    -3.2,
    last14.map((p, i) => p.volume * AVERAGE_LOAD[i]),
    "/shipments",
  ),
];

export { trendOver };
