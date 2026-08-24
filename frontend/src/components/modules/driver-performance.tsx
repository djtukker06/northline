import { DRIVERS } from "@/lib/data";
import { CapacityBar } from "@/components/ui/metric";
import { Badge } from "@/components/ui/status";
import { formatDuration, formatNumber } from "@/lib/utils";

const STATUS_TONE = {
  driving: "success",
  loading: "brand",
  rest: "neutral",
  "off-duty": "neutral",
} as const;

const STATUS_LABEL = {
  driving: "Driving",
  loading: "Loading",
  rest: "On break",
  "off-duty": "Off duty",
} as const;

/**
 * Drivers closest to their Regulation 561/2006 limit, since those are the runs a
 * planner has to cover before anything else on the board.
 */
export function DriverPerformance() {
  const atLimit = DRIVERS.filter((d) => d.status === "driving")
    .sort((a, b) => a.drivingMinutesLeft - b.drivingMinutesLeft)
    .slice(0, 5);

  const avgOnTime =
    DRIVERS.reduce((s, d) => s + d.onTimeRate, 0) / DRIVERS.length;

  return (
    <div className="flex h-full flex-col">
      <header className="border-line flex items-center justify-between gap-3 border-b px-5 py-3">
        <div>
          <h2 className="text-ink text-body-lg font-semibold">Driver hours</h2>
          <p className="text-ink-2 text-small mt-0.5 tabular-nums">
            {DRIVERS.length} drivers · {avgOnTime.toFixed(1)}% average on-time
          </p>
        </div>
        <Badge tone={atLimit[0] && atLimit[0].drivingMinutesLeft < 60 ? "warning" : "neutral"}>
          {atLimit.filter((d) => d.drivingMinutesLeft < 60).length} near limit
        </Badge>
      </header>

      <ul className="min-h-0 flex-1">
        {atLimit.map((d) => (
          <li key={d.id} className="border-line border-b px-5 py-2.5 last:border-b-0">
            <div className="flex items-center gap-2.5">
              <span className="bg-surface-sunken text-ink-2 grid size-7 shrink-0 place-items-center rounded-full text-caption font-semibold">
                {d.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-ink block text-small font-medium">{d.name}</span>
                <span className="text-ink-3 block truncate text-caption">
                  {d.base} · {formatNumber(d.deliveries)} deliveries
                </span>
              </span>
              <Badge tone={STATUS_TONE[d.status]}>{STATUS_LABEL[d.status]}</Badge>
            </div>
            <div className="mt-2 flex items-center gap-2.5">
              <CapacityBar
                value={(d.drivingMinutesLeft / 540) * 100}
                height={4}
                className="flex-1"
                tone={d.drivingMinutesLeft < 60 ? "critical" : d.drivingMinutesLeft < 150 ? "warning" : "success"}
              />
              <span className="text-ink-2 w-16 shrink-0 text-right text-caption tabular-nums">
                {formatDuration(d.drivingMinutesLeft)} left
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
