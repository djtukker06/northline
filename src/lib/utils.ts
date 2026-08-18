import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The theme defines custom names in both the font-size namespace (text-body) and the
 * colour namespace (text-on-brand). tailwind-merge cannot tell them apart on its own
 * and drops one as a conflict, which silently strips button label colours. Declaring
 * both groups keeps a size and a colour on the same element.
 */
const FONT_SIZES = [
  "display",
  "h1",
  "h2",
  "metric",
  "body-lg",
  "body",
  "small",
  "caption",
] as const;

const TEXT_COLORS = [
  "ink",
  "ink-2",
  "ink-3",
  "ink-faint",
  "brand",
  "brand-hover",
  "brand-solid",
  "brand-solid-hover",
  "on-brand",
  "success",
  "success-text",
  "warning",
  "warning-text",
  "critical",
  "critical-text",
  "info",
  "info-text",
  "surface",
  "surface-soft",
  "elevated",
  "line",
  "line-strong",
  "neutral-soft",
] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...FONT_SIZES] }],
      "text-color": [{ text: [...TEXT_COLORS] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Fixed clock for the demo dataset so every screen agrees on "now". 14:20 in Amsterdam. */
export const NOW = new Date("2026-08-18T12:20:00Z");

const TZ = "Europe/Amsterdam";

export function formatTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).format(date);
}

export function formatDay(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: TZ,
  }).format(date);
}

export function formatDateTime(d: Date | string) {
  return `${formatDay(d)} · ${formatTime(d)}`;
}

function dayKey(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

/**
 * Time alone for today, time plus day otherwise. A bare "21:31" against a timestamp
 * from yesterday reads as tonight, which is how schedules get misread.
 */
export function formatWhen(d: Date | string, from: Date = NOW) {
  const date = typeof d === "string" ? new Date(d) : d;
  if (dayKey(date) === dayKey(from)) return formatTime(date);
  const yesterday = new Date(from.getTime() - 86_400_000);
  const tomorrow = new Date(from.getTime() + 86_400_000);
  if (dayKey(date) === dayKey(yesterday)) return `Yst ${formatTime(date)}`;
  if (dayKey(date) === dayKey(tomorrow)) return `Tmr ${formatTime(date)}`;
  return `${formatDay(date)} ${formatTime(date)}`;
}

export function formatFullDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  }).format(date);
}

/** "12 min ago", "3 h ago". Relative to the fixed demo clock. */
export function relativeTime(d: Date | string, from: Date = NOW) {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Math.round((from.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  return `${Math.floor(diff / 86400)} d ago`;
}

const numberFormat = new Intl.NumberFormat("en-GB");

export function formatNumber(n: number) {
  return numberFormat.format(n);
}

export function formatTonnes(t: number) {
  return `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(t)} t`;
}

export function formatPercent(n: number, digits = 1) {
  return `${n.toFixed(digits)}%`;
}

export function formatCurrency(n: number, digits = 0) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function formatDelta(n: number, digits = 1) {
  return `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`;
}

/** Minutes rendered as "18 min" or "2 h 05". */
export function formatDuration(minutes: number) {
  const abs = Math.abs(Math.round(minutes));
  if (abs < 60) return `${abs} min`;
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

export function formatDistance(km: number) {
  return `${formatNumber(Math.round(km))} km`;
}

/**
 * Mulberry32. Deterministic so the dataset is identical on server and client,
 * which keeps Next.js hydration stable.
 */
export function makeRng(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function randInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Catmull-Rom through the given points, emitted as a smooth cubic SVG path. */
export function smoothPath(points: [number, number][], tension = 0.5) {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M${points[0][0]},${points[0][1]}L${points[1][0]},${points[1][1]}`;
  }
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension * 2;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension * 2;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension * 2;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension * 2;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Point on a quadratic bezier, used to place vehicles along their route arc. */
export function quadPoint(
  a: [number, number],
  c: [number, number],
  b: [number, number],
  t: number,
): [number, number] {
  const mt = 1 - t;
  return [
    mt * mt * a[0] + 2 * mt * t * c[0] + t * t * b[0],
    mt * mt * a[1] + 2 * mt * t * c[1] + t * t * b[1],
  ];
}

/** Control point that bows a route arc perpendicular to its direction of travel. */
export function arcControl(
  a: [number, number],
  b: [number, number],
  bow = 0.16,
): [number, number] {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return [mx - dy * bow, my + dx * bow];
}
