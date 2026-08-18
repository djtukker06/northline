import { makeRng, clamp, NOW } from "../utils";
import type { SeriesPoint } from "./types";

/**
 * 90 days of network history ending today. Volume follows a weekly rhythm with a
 * midsummer dip, and the on-time rate is anti-correlated with volume spikes.
 */
function build(): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  for (let i = 89; i >= 0; i--) {
    const rng = makeRng(12_000 + i * 89);
    const date = new Date(NOW.getTime() - i * 86_400_000);
    const dow = date.getUTCDay();
    const weekend = dow === 0 || dow === 6;

    const seasonal = Math.sin(((89 - i) / 90) * Math.PI * 1.6) * 84;
    const weekly = weekend ? -420 : dow === 1 || dow === 4 ? 96 : 0;
    const volume = Math.round(clamp(1_180 + seasonal + weekly + (rng() - 0.5) * 130, 520, 1_520));

    // Heavier days push more loads outside their window.
    const load = (volume - 900) / 620;
    const onTimePct = clamp(96.4 - load * 3.1 - (rng() - 0.5) * 1.4, 88.2, 98.6);
    const completed = Math.round(volume * (weekend ? 0.72 : 0.94));
    const onTime = Math.round(completed * (onTimePct / 100));
    const delayed = completed - onTime;

    points.push({
      date: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }).format(date),
      onTime,
      delayed,
      completed,
      volume,
      costPerShipment: Number(clamp(184 + load * 22 + (rng() - 0.5) * 14, 152, 246).toFixed(2)),
      utilisation: Number(clamp(78 + load * 9 + (rng() - 0.5) * 4.5, 62, 94).toFixed(1)),
      throughput: Math.round(volume * (2.6 + rng() * 0.5)),
    });
  }
  return points;
}

export const SERIES: SeriesPoint[] = build();

export function seriesForRange(days: 7 | 30 | 90): SeriesPoint[] {
  return SERIES.slice(-days);
}

/** Percentage change between the two halves of a window, used by the KPI deltas. */
export function trendOver(days: number, key: keyof SeriesPoint): number {
  const window = SERIES.slice(-days);
  const half = Math.floor(window.length / 2);
  const avg = (arr: SeriesPoint[]) =>
    arr.reduce((s, p) => s + (p[key] as number), 0) / Math.max(arr.length, 1);
  const before = avg(window.slice(0, half));
  const after = avg(window.slice(half));
  return Number((((after - before) / before) * 100).toFixed(1));
}

/** Hourly despatch and receipt counts for the current shift. */
export const HOURLY_FLOW = Array.from({ length: 24 }, (_, h) => {
  const rng = makeRng(3_300 + h * 41);
  const peak = Math.exp(-Math.pow(h - 9, 2) / 26) + Math.exp(-Math.pow(h - 16, 2) / 30) * 0.86;
  return {
    hour: `${String(h).padStart(2, "0")}:00`,
    despatched: Math.round(14 + peak * 74 + rng() * 9),
    received: Math.round(11 + peak * 61 + rng() * 8),
  };
});
