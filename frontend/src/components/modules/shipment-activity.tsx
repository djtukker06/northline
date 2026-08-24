import { FileCheck2, MessageSquare, PenLine, ShieldCheck, UserRound } from "lucide-react";
import { FACILITY_BY_ID, DRIVER_BY_ID } from "@/lib/data";
import type { Shipment } from "@/lib/data/types";
import { makeRng, randInt, relativeTime, NOW } from "@/lib/utils";

const KINDS = [
  { icon: PenLine, label: "updated the delivery window" },
  { icon: FileCheck2, label: "attached the CMR consignment note" },
  { icon: ShieldCheck, label: "cleared the customs declaration" },
  { icon: MessageSquare, label: "added a note for the receiving site" },
  { icon: UserRound, label: "reassigned the run" },
] as const;

const NOTES = [
  "Receiving site confirmed the bay will be free on arrival.",
  "Customer asked for a call 30 minutes before delivery.",
  "Tail lift required at the destination.",
  "Documentation checked against the manifest, no discrepancies.",
  "Driver briefed on the revised gate procedure.",
];

/** Audit trail for the consignment. Derived so it stays consistent per shipment. */
export function ShipmentActivity({ shipment }: { shipment: Shipment }) {
  const rng = makeRng(Number(shipment.id.replace(/\D/g, "")) || 7);
  const origin = FACILITY_BY_ID.get(shipment.originId)!;
  const destination = FACILITY_BY_ID.get(shipment.destinationId)!;
  const driver = shipment.driverId ? DRIVER_BY_ID.get(shipment.driverId) : null;

  const people = [origin.manager, destination.manager, driver?.name ?? origin.manager];

  const entries = Array.from({ length: 4 }, (_, i) => {
    const kind = KINDS[(i + shipment.pallets) % KINDS.length];
    return {
      id: i,
      icon: kind.icon,
      person: people[i % people.length],
      action: kind.label,
      note: i === 1 ? NOTES[shipment.pallets % NOTES.length] : undefined,
      at: new Date(NOW.getTime() - randInt(rng, 25, 700) * 60_000).toISOString(),
    };
  }).sort((a, b) => +new Date(b.at) - +new Date(a.at));

  return (
    <ul className="px-5 py-1">
      {entries.map((e) => {
        const Icon = e.icon;
        return (
          <li key={e.id} className="border-line flex gap-3 border-b py-3 last:border-b-0">
            <span className="bg-surface-sunken text-ink-2 mt-0.5 grid size-7 shrink-0 place-items-center rounded-full">
              <Icon className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-small leading-snug">
                <span className="text-ink font-medium">{e.person}</span>{" "}
                <span className="text-ink-2">{e.action}</span>
              </p>
              {e.note && <p className="text-ink-3 text-caption mt-0.5">{e.note}</p>}
              <p className="text-ink-3 text-caption mt-0.5 tabular-nums">
                {relativeTime(e.at)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
