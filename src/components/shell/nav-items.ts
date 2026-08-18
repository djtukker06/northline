import {
  Blocks,
  CalendarRange,
  ChartLine,
  LayoutDashboard,
  Package,
  Route,
  Settings,
  TriangleAlert,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof Package;
  /** Live count shown against the item. */
  badge?: "alerts" | "shipments";
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/shipments", label: "Shipments", icon: Package, badge: "shipments" },
  { href: "/fleet", label: "Fleet", icon: Truck },
  { href: "/routes", label: "Routes", icon: Route },
  { href: "/warehouses", label: "Warehouses", icon: Warehouse },
  { href: "/planning", label: "Planning", icon: CalendarRange },
  { href: "/analytics", label: "Analytics", icon: ChartLine },
  { href: "/alerts", label: "Alerts", icon: TriangleAlert, badge: "alerts" },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/team", label: "Team", icon: Users },
  { href: "/integrations", label: "Integrations", icon: Blocks },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];

export function sectionTitle(pathname: string): string {
  if (pathname.startsWith("/shipments/")) return "Shipment detail";
  const match = ALL_NAV.find((n) => pathname.startsWith(n.href));
  return match?.label ?? "Overview";
}
