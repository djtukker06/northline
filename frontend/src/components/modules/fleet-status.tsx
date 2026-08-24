import Link from "next/link";
import { ArrowRight, Fuel, Gauge as GaugeIcon, HeartPulse } from "lucide-react";
import {
  AVG_FUEL,
  AVG_HEALTH,
  AVG_SPEED,
  FLEET_SIZE,
  FLEET_STATUS_COUNTS,
  FLEET_UTILISATION,
  VEHICLES,
} from "@/lib/data";
import { CapacityBar } from "@/components/ui/metric";
import { VehicleStatusBadge } from "@/components/ui/status";
import { StackedBar } from "@/components/ui/metric";
import { formatNumber } from "@/lib/utils";

const STATES = [
  { key: "in-transit", label: "In transit", color: "var(--nl-success)" },
  { key: "loading", label: "Loading", color: "var(--nl-warning)" },
  { key: "idle", label: "Idle", color: "var(--nl-text-muted)" },
  { key: "maintenance", label: "Maintenance", color: "var(--nl-critical)" },
] as const;

export function FleetStatus() {
  const segments = STATES.map((s) => ({
    label: s.label,
    value: FLEET_STATUS_COUNTS[s.key],
    color: s.color,
  }));

  return (
    <div className="flex h-full flex-col">
      <header className="border-line flex items-center justify-between gap-3 border-b px-5 py-3">
        <div>
          <h2 className="text-ink text-body-lg font-semibold">Fleet status</h2>
          <p className="text-ink-2 text-small mt-0.5 tabular-nums">
            {FLEET_SIZE} vehicles · {FLEET_UTILISATION}% utilisation
          </p>
        </div>
        <Link
          href="/fleet"
          className="text-ink-3 hover:text-ink transition-colors"
          aria-label="Open fleet"
        >
          <ArrowRight className="size-4" />
        </Link>
      </header>

      <div className="px-5 pt-4">
        <StackedBar segments={segments} height={8} />
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
          {STATES.map((s) => (
            <div key={s.key} className="flex items-baseline gap-2">
              <span
                className="mt-1 size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
                aria-hidden
              />
              <dt className="text-ink-2 text-small flex-1">{s.label}</dt>
              <dd className="text-ink text-small font-semibold tabular-nums">
                {formatNumber(FLEET_STATUS_COUNTS[s.key])}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="border-line mt-4 grid grid-cols-3 divide-x divide-[var(--nl-border)] border-y">
        <Readout icon={GaugeIcon} label="Avg speed" value={`${AVG_SPEED}`} unit="km/h" />
        <Readout icon={Fuel} label="Avg fuel" value={`${AVG_FUEL}`} unit="L/100km" />
        <Readout icon={HeartPulse} label="Health" value={`${AVG_HEALTH}`} unit="of 100" />
      </div>

      <div className="min-h-0 flex-1">
        <h3 className="label-eyebrow px-5 pt-3.5 pb-1">Lowest vehicle health</h3>
        <ul>
          {ATTENTION.map((v) => (
            <li
              key={v.id}
              className="border-line flex items-center gap-3 border-b px-5 py-2 last:border-b-0"
            >
              <span className="min-w-0 flex-1">
                <span className="text-ink block text-small font-medium">{v.id}</span>
                <span className="text-ink-3 block truncate text-caption">{v.model}</span>
              </span>
              <span className="w-16 shrink-0">
                <CapacityBar
                  value={v.healthScore}
                  height={4}
                  tone={v.healthScore < 50 ? "critical" : "warning"}
                />
                <span className="text-ink-3 mt-1 block text-right text-caption tabular-nums">
                  {v.healthScore}
                </span>
              </span>
              <span className="shrink-0">
                <VehicleStatusBadge status={v.status} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** The vehicles a fleet manager would book in next. */
const ATTENTION = [...VEHICLES]
  .sort((a, b) => a.healthScore - b.healthScore)
  .slice(0, 4);

function Readout({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="px-4 py-3">
      <p className="text-ink-3 text-caption flex items-center gap-1.5">
        <Icon className="size-3" />
        {label}
      </p>
      <p className="text-ink mt-1 text-body-lg font-semibold tabular-nums">{value}</p>
      <p className="text-ink-3 text-caption">{unit}</p>
    </div>
  );
}
