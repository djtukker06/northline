import { AppShell } from "@/components/shell/app-shell";
import { ACTIVE_SHIPMENT_COUNT, OPEN_ALERTS } from "@/lib/data";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      alerts={OPEN_ALERTS.slice(0, 6)}
      counts={{ alerts: OPEN_ALERTS.length, shipments: ACTIVE_SHIPMENT_COUNT }}
    >
      {children}
    </AppShell>
  );
}
