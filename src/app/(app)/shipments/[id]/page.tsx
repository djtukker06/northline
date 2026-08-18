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
import {
  ALERTS,
  DRIVER_BY_ID,
  FACILITY_BY_ID,
  ROUTE_BY_ID,
  SHIPMENTS,
  VEHICLE_BY_ID,
  buildTimeline,
  shipment as findShipment,
} from "@/lib/data";
import { DetailRow, Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge, PriorityTag, SeverityBadge, StatusBadge } from "@/components/ui/status";
import { Timeline } from "@/components/ui/timeline";
import { CapacityBar } from "@/components/ui/metric";
import { RouteStrip } from "@/components/map/route-strip";
import { ShipmentActivity } from "@/components/modules/shipment-activity";
import {
  formatCurrency,
  formatDateTime,
  formatDistance,
  formatDuration,
  formatTime,
  formatTonnes,
  relativeTime,
} from "@/lib/utils";

export async function generateMetadata(props: PageProps<"/shipments/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `Shipment ${id}` };
}

// Only the shipments that are actually reachable from the UI get prerendered.
export function generateStaticParams() {
  return SHIPMENTS.slice(0, 60).map((s) => ({ id: s.id }));
}

export default async function ShipmentDetailPage(props: PageProps<"/shipments/[id]">) {
  const { id } = await props.params;
  const shipment = findShipment(id);
  if (!shipment) notFound();

  const origin = FACILITY_BY_ID.get(shipment.originId)!;
  const destination = FACILITY_BY_ID.get(shipment.destinationId)!;
  const route = ROUTE_BY_ID.get(shipment.routeId)!;
  const vehicle = shipment.vehicleId ? VEHICLE_BY_ID.get(shipment.vehicleId) : null;
  const driver = shipment.driverId ? DRIVER_BY_ID.get(shipment.driverId) : null;
  const timeline = buildTimeline(shipment);
  const related = ALERTS.filter((a) => a.entityId === shipment.id);

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
              {origin.name}
              <ArrowRight className="text-ink-3 size-3.5" aria-hidden />
              {destination.name}
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

      {/* The delay is the single most important fact on this page, so it leads. */}
      {shipment.delayMinutes > 0 && (
        <div className="border-warning-border bg-warning-soft rounded-panel flex flex-wrap items-center gap-x-3 gap-y-1 border px-4 py-3">
          <Thermometer className="text-warning size-4 shrink-0" aria-hidden />
          <p className="text-ink text-small font-medium">
            Running {formatDuration(shipment.delayMinutes)} behind schedule.
          </p>
          <p className="text-ink-2 text-small">
            Planned arrival {formatTime(shipment.plannedEta)}, now expected{" "}
            {formatTime(shipment.eta)} at {destination.name}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <Panel>
            <PanelHeader
              title="Route"
              description={`${route.id} · ${route.corridor} corridor`}
              actions={
                <Link
                  href={`/routes?route=${route.id}`}
                  className="text-brand text-small font-medium hover:underline"
                >
                  Open route
                </Link>
              }
            />
            <RouteStrip
              routeId={route.id}
              progress={shipment.progress}
              status={mapStatus}
              height={220}
            />
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
                  Departed {formatTime(shipment.departedAt)} · {origin.city}
                </span>
                <span>
                  {formatDistance(route.distanceKm)} · {formatDuration(route.plannedMinutes)}
                </span>
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
              {vehicle ? (
                <dl className="px-5 py-1.5">
                  <DetailRow label="Vehicle">
                    <Link href={`/fleet?vehicle=${vehicle.id}`} className="text-brand hover:underline">
                      {vehicle.id}
                    </Link>
                  </DetailRow>
                  <DetailRow label="Model">{vehicle.model}</DetailRow>
                  <DetailRow label="Position">{vehicle.locationLabel}</DetailRow>
                  <DetailRow label="Speed">{vehicle.telemetrySpeed} km/h</DetailRow>
                  <DetailRow label="Driver">{driver?.name ?? "Unassigned"}</DetailRow>
                  {driver && (
                    <DetailRow label="Driving time left">
                      {formatDuration(driver.drivingMinutesLeft)}
                    </DetailRow>
                  )}
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
              {[origin, destination].map((f, i) => (
                <div key={f.id} className="px-5 py-3.5">
                  <p className="label-eyebrow">{i === 0 ? "Origin" : "Destination"}</p>
                  <Link
                    href={`/warehouses?facility=${f.id}`}
                    className="text-ink hover:text-brand mt-1 flex items-center gap-2 text-body font-medium transition-colors"
                  >
                    <Building2 className="text-ink-3 size-4" aria-hidden />
                    {f.name}
                  </Link>
                  <p className="text-ink-2 text-small mt-0.5">
                    {f.city}, {f.country} · {f.code}
                  </p>
                  <div className="mt-2.5 flex items-baseline justify-between text-caption">
                    <span className="text-ink-2">Capacity</span>
                    <span className="text-ink font-semibold tabular-nums">{f.capacityPct}%</span>
                  </div>
                  <CapacityBar value={f.capacityPct} threshold={88} className="mt-1" height={4} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Activity" dense />
            <ShipmentActivity shipment={shipment} />
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
              <Timeline events={timeline} />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Linked alerts" dense />
            {related.length > 0 ? (
              <ul>
                {related.map((a) => (
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
              <DetailRow label="Booked by">
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="text-ink-3 size-3.5" aria-hidden />
                  {origin.manager}
                </span>
              </DetailRow>
              <DetailRow label="Origin dwell">{formatDuration(origin.dwellMinutes)}</DetailRow>
              <DetailRow label="Destination dwell">
                {formatDuration(destination.dwellMinutes)}
              </DetailRow>
              <DetailRow label="Cold chain">
                {shipment.temperatureControlled ? "2 to 6°C" : "Ambient"}
              </DetailRow>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
