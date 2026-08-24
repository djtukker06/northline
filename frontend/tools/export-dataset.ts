/**
 * Exports the generated dataset to JSON so the Laravel seeders can import it.
 *
 * The generator stays here because this is where it was written, but the frontend
 * no longer reads it at runtime: the API is the source of truth. Committing the
 * exported JSON lets anyone rebuild an identical database without running Node.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ALERTS,
  DRIVERS,
  FACILITIES,
  OPS_EVENTS,
  ROUTES,
  SERIES,
  SHIPMENTS,
  VEHICLES,
  buildTimeline,
} from "../src/lib/data";

const OUT = join(import.meta.dirname, "../../api/database/data");
mkdirSync(OUT, { recursive: true });

function write(name: string, rows: unknown[]) {
  const file = join(OUT, `${name}.json`);
  writeFileSync(file, JSON.stringify(rows, null, 0) + "\n");
  const kb = (JSON.stringify(rows).length / 1024).toFixed(0);
  console.log(`${name.padEnd(16)} ${String(rows.length).padStart(5)} rows  ${kb.padStart(5)} KB`);
}

write("facilities", FACILITIES);
write("drivers", DRIVERS);
write("vehicles", VEHICLES);
write("routes", ROUTES);
write("shipments", SHIPMENTS);
write("alerts", ALERTS);
write("ops_events", OPS_EVENTS);
write("daily_metrics", SERIES);

// Timelines are derived rather than stored in the frontend model, so they are
// flattened here into rows the shipment_events table can hold.
const timelines = SHIPMENTS.flatMap((s) =>
  buildTimeline(s).map((e) => ({
    shipmentRef: s.id,
    at: e.at,
    label: e.label,
    detail: e.detail ?? null,
    facilityId: e.facilityId ?? null,
    state: e.state,
  })),
);
write("shipment_events", timelines);

console.log("\nwritten to api/database/data/");
