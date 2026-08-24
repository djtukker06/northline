import {
  ALERTS,
  FACILITIES,
  ROUTES,
  SHIPMENTS,
  VEHICLES,
  DRIVERS,
} from "./data";

export type ResultKind =
  | "shipment"
  | "vehicle"
  | "route"
  | "warehouse"
  | "alert"
  | "driver"
  | "page";

export interface SearchResult {
  id: string;
  kind: ResultKind;
  title: string;
  subtitle: string;
  meta?: string;
  href: string;
  /** Lower-cased haystack, built once at module load. */
  haystack: string;
  /** Nudges frequently-needed records above bulk records at equal match quality. */
  boost: number;
}

const PAGES: SearchResult[] = [
  ["Overview", "Operations dashboard", "/dashboard"],
  ["Shipments", "All consignments", "/shipments"],
  ["Fleet", "Vehicles and drivers", "/fleet"],
  ["Routes", "Line-haul corridors", "/routes"],
  ["Warehouses", "Facilities and capacity", "/warehouses"],
  ["Planning", "Dispatch schedule", "/planning"],
  ["Analytics", "Network performance", "/analytics"],
  ["Alerts", "Attention required", "/alerts"],
].map(([title, subtitle, href]) => ({
  id: `page-${href}`,
  kind: "page" as const,
  title,
  subtitle,
  href,
  haystack: `${title} ${subtitle}`.toLowerCase(),
  boost: 3,
}));

let cache: SearchResult[] | null = null;

function buildIndex(): SearchResult[] {
  const facilityName = new Map(FACILITIES.map((f) => [f.id, f]));

  const shipments: SearchResult[] = SHIPMENTS.map((s) => {
    const from = facilityName.get(s.originId)!;
    const to = facilityName.get(s.destinationId)!;
    return {
      id: s.id,
      kind: "shipment" as const,
      title: s.id,
      subtitle: `${from.city} to ${to.city}`,
      meta: s.customer,
      href: `/shipments/${s.id}`,
      haystack: `${s.id} ${from.city} ${to.city} ${s.customer} ${s.reference} ${s.cargo} ${s.carrier}`.toLowerCase(),
      boost: s.status === "delivered" ? 0 : 1,
    };
  });

  const vehicles: SearchResult[] = VEHICLES.map((v) => ({
    id: v.id,
    kind: "vehicle" as const,
    title: v.id,
    subtitle: v.model,
    meta: v.locationLabel,
    href: `/fleet?vehicle=${v.id}`,
    haystack: `${v.id} ${v.plate} ${v.model} ${v.locationLabel} ${v.homeBase}`.toLowerCase(),
    boost: 1,
  }));

  const routes: SearchResult[] = ROUTES.map((r) => ({
    id: r.id,
    kind: "route" as const,
    title: r.id,
    subtitle: r.name,
    meta: `${r.corridor} corridor`,
    href: `/routes?route=${r.id}`,
    haystack: `${r.id} ${r.name} ${r.corridor}`.toLowerCase(),
    boost: 2,
  }));

  const warehouses: SearchResult[] = FACILITIES.map((f) => ({
    id: f.id,
    kind: "warehouse" as const,
    title: f.name,
    subtitle: `${f.city}, ${f.country}`,
    meta: `${f.capacityPct}% capacity`,
    href: `/warehouses?facility=${f.id}`,
    haystack: `${f.name} ${f.code} ${f.city} ${f.country}`.toLowerCase(),
    boost: 2,
  }));

  const alerts: SearchResult[] = ALERTS.map((a) => ({
    id: a.id,
    kind: "alert" as const,
    title: a.title,
    subtitle: a.entityLabel,
    meta: a.severity,
    href: `/alerts?alert=${a.id}`,
    haystack: `${a.id} ${a.title} ${a.entityLabel} ${a.category}`.toLowerCase(),
    boost: a.severity === "critical" ? 2 : 1,
  }));

  const drivers: SearchResult[] = DRIVERS.map((d) => ({
    id: d.id,
    kind: "driver" as const,
    title: d.name,
    subtitle: `${d.id} · ${d.base}`,
    meta: `${d.onTimeRate}% on time`,
    href: `/fleet?driver=${d.id}`,
    haystack: `${d.name} ${d.id} ${d.base}`.toLowerCase(),
    boost: 1,
  }));

  return [...PAGES, ...routes, ...warehouses, ...alerts, ...vehicles, ...drivers, ...shipments];
}

export function searchIndex(): SearchResult[] {
  cache ??= buildIndex();
  return cache;
}

/**
 * Prefix and substring matching with a small ranking model. Exact and prefix hits on
 * the title win, which matters when an operator types a shipment number in full.
 */
export function search(query: string, limit = 24): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored: Array<{ item: SearchResult; score: number }> = [];
  for (const item of searchIndex()) {
    const title = item.title.toLowerCase();
    let score = 0;
    if (title === q) score = 100;
    else if (title.startsWith(q)) score = 80;
    else if (title.includes(q)) score = 60;
    else if (item.haystack.includes(q)) score = 30;
    else continue;

    scored.push({ item, score: score + item.boost });
    // The index is large; stop once there is plenty to rank.
    if (scored.length > 900) break;
  }

  return scored
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, limit)
    .map((s) => s.item);
}

export const KIND_LABEL: Record<ResultKind, string> = {
  shipment: "Shipments",
  vehicle: "Vehicles",
  route: "Routes",
  warehouse: "Warehouses",
  alert: "Alerts",
  driver: "Drivers",
  page: "Go to",
};
