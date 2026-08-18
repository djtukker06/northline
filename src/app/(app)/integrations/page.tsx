import type { Metadata } from "next";
import { Check, Plug } from "lucide-react";
import { PageHeader, Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/status";
import { relativeTime, NOW } from "@/lib/utils";

export const metadata: Metadata = { title: "Integrations" };

const INTEGRATIONS = [
  { name: "Webfleet Telematics", kind: "Telematics", state: "connected", syncedMinutesAgo: 2, detail: "184 vehicles reporting position and fuel every 30 seconds." },
  { name: "SAP Transportation Management", kind: "ERP", state: "connected", syncedMinutesAgo: 14, detail: "Order intake and freight settlement, two-way sync." },
  { name: "Descartes Customs", kind: "Customs", state: "connected", syncedMinutesAgo: 6, detail: "Declaration filing and clearance status for cross-border loads." },
  { name: "Manhattan WMS", kind: "Warehouse", state: "connected", syncedMinutesAgo: 3, detail: "Stock positions and dock appointments for all 18 sites." },
  { name: "Transporeon", kind: "Freight marketplace", state: "degraded", syncedMinutesAgo: 96, detail: "Spot tendering. The partner API is returning intermittent timeouts." },
  { name: "Project44 Visibility", kind: "Visibility", state: "connected", syncedMinutesAgo: 1, detail: "Carrier ETAs for loads moving on partner fleets." },
  { name: "Shell Fleet Cards", kind: "Fuel", state: "connected", syncedMinutesAgo: 42, detail: "Fuel transactions reconciled against vehicle odometer." },
  { name: "Microsoft Entra ID", kind: "Identity", state: "connected", syncedMinutesAgo: 8, detail: "Single sign-on and role provisioning for 148 users." },
  { name: "Snowflake", kind: "Data warehouse", state: "available", syncedMinutesAgo: 0, detail: "Push nightly shipment and cost extracts for reporting." },
  { name: "Slack", kind: "Notifications", state: "available", syncedMinutesAgo: 0, detail: "Route critical alerts to a duty channel." },
];

export default function IntegrationsPage() {
  const connected = INTEGRATIONS.filter((i) => i.state !== "available").length;

  return (
    <div className="mx-auto flex max-w-[112rem] flex-col gap-4 p-4 sm:p-5">
      <PageHeader
        title="Integrations"
        description={`${connected} systems connected to NORTHLINE.`}
        actions={
          <Button variant="primary">
            <Plug className="size-4" aria-hidden />
            Add integration
          </Button>
        }
      />

      <Panel>
        <PanelHeader title="Connected systems" description="Data flowing into the platform" />
        <ul className="grid grid-cols-1 md:grid-cols-2">
          {INTEGRATIONS.map((it) => (
            <li
              key={it.name}
              className="border-line flex items-start gap-3 border-b px-5 py-4 md:[&:nth-child(odd)]:border-r"
            >
              <span className="bg-surface-sunken text-ink-2 grid size-9 shrink-0 place-items-center rounded-well text-caption font-semibold">
                {it.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-ink text-body font-medium">{it.name}</p>
                  <Badge
                    tone={
                      it.state === "connected"
                        ? "success"
                        : it.state === "degraded"
                          ? "warning"
                          : "neutral"
                    }
                    dot={it.state !== "available"}
                  >
                    {it.state === "connected"
                      ? "Connected"
                      : it.state === "degraded"
                        ? "Degraded"
                        : "Available"}
                  </Badge>
                </div>
                <p className="text-ink-3 text-caption mt-0.5">{it.kind}</p>
                <p className="text-ink-2 text-small mt-1.5">{it.detail}</p>
                {it.state !== "available" && (
                  <p className="text-ink-3 text-caption mt-1.5 tabular-nums">
                    Last sync{" "}
                    {relativeTime(new Date(NOW.getTime() - it.syncedMinutesAgo * 60_000))}
                  </p>
                )}
              </div>
              {it.state === "available" ? (
                <Button variant="secondary" size="sm">
                  Connect
                </Button>
              ) : (
                <span className="text-success-text mt-1 shrink-0" aria-label="Connected">
                  <Check className="size-4" />
                </span>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
