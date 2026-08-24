import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  MessageSquare,
  Package,
  Printer,
  Snowflake,
  Thermometer,
  Truck,
  UserRound,
} from "lucide-react";
import { DetailRow, Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge, PriorityTag, SeverityBadge, StatusBadge } from "@/components/ui/status";
import { Timeline } from "@/components/ui/timeline";
import { CapacityBar } from "@/components/ui/metric";
import { RouteStrip } from "@/components/map/route-strip";
import { ApiErrorState } from "@/components/modules/api-error-state";
import { ApiError } from "@/lib/api/client";
import { getAlerts, getShipment } from "@/lib/api/queries";
import type { Shipment } from "@/lib/api/types";
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
  formatTime,
  formatTonnes,
  relativeTime,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/shipments/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `Shipment ${id}` };
}

export default async function ShipmentDetailPage(props: PageProps<"/shipments/[id]">) {
  const { id } = await props.params;

  let shipment: Shipment;
  let alerts: Awaited<ReturnType<typeof getAlerts>> = [];

  try {
    // The alert lookup is allowed to fail on its own: a missing sidebar is a far
    // better outcome than a blank page because a secondary query timed out.
    const [loaded, related] = await Promise.all([
      getShipment(id),
      getAlerts({ state: "all", limit: 50 }).catch(() => []),
    ]);
    shipment = loaded;
    alerts = related.filter((a) => a.entityId === id);
  } catch (error) {
    // A 404 from the API is a genuinely missing record, so hand it to Next.js and
    // let not-found.tsx render. Anything else is an infrastructure problem and
    // should say so rather than claiming the shipment does not exist.
    if (error instanceof ApiError && error.status === 404) notFound();

    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-5">
        <Panel>
          <ApiErrorState error={error} what={`shipment ${id}`} />
        </Panel>
      </div>
    );
  }

  const timeline = shipment.timeline ?? [];
  const mapStatus =
    shipment.status === "delayed"
      ? "delayed"
      : shipment.status === "at-risk" || shipment.status === "customs"
        ? "at-risk"
        : "on-schedule";

  return (
    <div className="mx-auto flex max-w-[112rem] flex-col gap-4 p-4 sm:p-5">
      <div>
        <Link
          href="/shipments"
          className="text-ink-2 hover:text-ink mb-3 inline-flex items-center gap-1.5 text-small font-medium transition-colors"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          All shipments
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-ink text-h1 font-semibold">{shipment.id}</h1>
              <StatusBadge status={shipment.status} />
              <PriorityTag priority={shipment.priority} />
              {shipment.temperatureControlled && (
                <Badge tone="info">
                  <Snowflake className="size-3" aria-hidden />
                  Temperature controlled
                </Badge>
              )}
            </div>
            <p className="text-ink-2 text-body-lg mt-1.5 flex flex-wrap items-center gap-1.5">
              {shipment.origin.name}
              <ArrowRight className="text-ink-3 size-3.5" aria-hidden />
              {shipment.destination.name}
              <span className="text-ink-3">· {shipment.customer}</span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="secondary">
              <Printer className="size-4" aria-hidden />
              Documents
            </Button>
            <Button variant="secondary">
              <MessageSquare className="size-4" aria-hidden />
              Contact driver
            </Button>
            <Button variant="primary">Update status</Button>
          </div>
        </div>
      </div>

      {shipment.delayMinutes > 0 && (
        <div className="border-warning-border bg-warning-soft rounded-panel flex flex-wrap items-center gap-x-3 gap-y-1 border px-4 py-3">
          <Thermometer className="text-warning size-4 shrink-0" aria-hidden />
          <p className="text-ink text-small font-medium">
            Running {formatDuration(shipment.delayMinutes)} behind schedule.
          </p>
          <p className="text-ink-2 text-small">
            Planned arrival {formatTime(shipment.plannedEta)}, now expected{" "}
            {formatTime(shipment.eta)} at {shipment.destination.name}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <Panel>
            <PanelHeader
              title="Route"
              description={shipment.routeId ? `${shipment.routeId} corridor` : undefined}
              actions={
                shipment.routeId ? (
                  <Link
                    href={`/routes?route=${shipment.routeId}`}
                    className="text-brand text-small font-medium hover:underline"
                  >
                    Open route
                  </Link>
                ) : undefined
              }
            />
            {shipment.routeId && (
              <RouteStrip
                routeId={shipment.routeId}
                progress={shipment.progress}
                status={mapStatus}
                height={220}
              />
            )}
            <div className="px-5 py-3">
              <div className="mb-2 flex items-baseline justify-between text-small">
                <span className="text-ink-2">Journey progress</span>
                <span className="text-ink font-semibold tabular-nums">
                  {Math.round(shipment.progress)}%
                </span>
              </div>
              <CapacityBar
                value={shipment.progress}
                tone={mapStatus === "delayed" ? "critical" : mapStatus === "at-risk" ? "warning" : "success"}
              />
              <div className="text-ink-3 text-caption mt-2 flex justify-between tabular-nums">
                <span>
                  Departed {formatTime(shipment.departedAt)} · {shipment.origin.city}
                </span>
                <span>{formatTonnes(shipment.weightTonnes)} · {shipment.pallets} pallets</span>
              </div>
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Panel>
              <PanelHeader title="Cargo" dense />
              <dl className="px-5 py-1.5">
                <DetailRow label="Description">{shipment.cargo}</DetailRow>
                <DetailRow label="Gross weight">{formatTonnes(shipment.weightTonnes)}</DetailRow>
                <DetailRow label="Pallets">{shipment.pallets}</DetailRow>
                <DetailRow label="Declared value">{formatCurrency(shipment.valueEur)}</DetailRow>
                <DetailRow label="Customer reference">{shipment.reference}</DetailRow>
                <DetailRow label="Carrier">{shipment.carrier}</DetailRow>
              </dl>
            </Panel>

            <Panel>
              <PanelHeader title="Vehicle and driver" dense />
              {shipment.vehicleId ? (
                <dl className="px-5 py-1.5">
                  <DetailRow label="Vehicle">
                    <Link
                      href={`/fleet?vehicle=${shipment.vehicleId}`}
                      className="text-brand hover:underline"
                    >
                      {shipment.vehicleId}
                    </Link>
                  </DetailRow>
                  <DetailRow label="Driver">{shipment.driverName ?? "Unassigned"}</DetailRow>
                  <DetailRow label="Route">{shipment.routeId ?? "Not assigned"}</DetailRow>
                  <DetailRow label="Expected arrival">{formatDateTime(shipment.eta)}</DetailRow>
                </dl>
              ) : (
                <div className="px-5 py-6 text-center">
                  <Truck className="text-ink-3 mx-auto size-5" aria-hidden />
                  <p className="text-ink text-small mt-2 font-medium">No vehicle assigned</p>
                  <p className="text-ink-2 text-caption mt-0.5">
                    This load is booked but not yet allocated to a run.
                  </p>
                </div>
              )}
            </Panel>
          </div>

          <Panel>
            <PanelHeader title="Facilities" dense />
            <div className="grid grid-cols-1 divide-y divide-[var(--nl-border)] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {[
                { label: "Origin", f: shipment.origin },
                { label: "Destination", f: shipment.destination },
              ].map(({ label, f }) => (
                <div key={label} className="px-5 py-3.5">
                  <p className="label-eyebrow">{label}</p>
                  <Link
                    href={`/warehouses?facility=FAC-${f.id}`}
                    className="text-ink hover:text-brand mt-1 flex items-center gap-2 text-body font-medium transition-colors"
                  >
                    <Building2 className="text-ink-3 size-4" aria-hidden />
                    {f.name}
                  </Link>
                  <p className="text-ink-2 text-small mt-0.5">
                    {f.city} · {f.id}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel>
            <PanelHeader
              title="Timeline"
              description={`Expected ${formatDateTime(shipment.eta)}`}
              dense
            />
            <div className="px-5 py-4">
              {timeline.length > 0 ? (
                <Timeline
                  events={timeline.map((e) => ({
                    at: e.at,
                    label: e.label,
                    detail: e.detail ?? undefined,
                    facilityId: e.facilityId,
                    state: e.state,
                  }))}
                />
              ) : (
                <p className="text-ink-3 text-small">No milestones recorded yet.</p>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Linked alerts" dense />
            {alerts.length > 0 ? (
              <ul>
                {alerts.map((a) => (
                  <li key={a.id} className="border-line border-b px-5 py-3 last:border-b-0">
                    <p className="text-ink text-small font-medium">{a.title}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <SeverityBadge severity={a.severity} />
                      <span className="text-ink-3 text-caption">{relativeTime(a.raisedAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-6 text-center">
                <Package className="text-ink-3 mx-auto size-5" aria-hidden />
                <p className="text-ink text-small mt-2 font-medium">No open alerts</p>
                <p className="text-ink-2 text-caption mt-0.5">
                  Nothing on this consignment needs attention.
                </p>
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Handling" dense />
            <dl className="px-5 py-1.5">
              <DetailRow label="Customer">
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="text-ink-3 size-3.5" aria-hidden />
                  {shipment.customer}
                </span>
              </DetailRow>
              <DetailRow label="Cold chain">
                {shipment.temperatureControlled ? "2 to 6°C" : "Ambient"}
              </DetailRow>
              <DetailRow label="Booked">{formatDateTime(shipment.departedAt)}</DetailRow>
              {shipment.deliveredAt && (
                <DetailRow label="Delivered">{formatDateTime(shipment.deliveredAt)}</DetailRow>
              )}
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
