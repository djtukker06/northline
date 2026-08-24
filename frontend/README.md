# NORTHLINE frontend

The Next.js dashboard. See the repository root README for the full stack, and
`docs/backend-glossary.md` for the backend terminology.

## Running it

The API must be running first (`make setup` from the repository root).

```bash
cp .env.example .env.local
npm install
npm run dev
```

The app opens directly into the operation at `/dashboard`. There is no marketing surface.

## What is here

| Route | Purpose |
| --- | --- |
| `/dashboard` | Operations overview: KPIs, live network map, activity feed, performance, fleet, warehouses, alerts |
| `/shipments` | The consignment book, filterable and sortable across 1,924 records |
| `/shipments/[id]` | Single consignment: route, timeline, cargo, vehicle, driver, activity |
| `/fleet` | Vehicle availability, utilisation, driver hours, per-vehicle detail |
| `/routes` | Corridors on the map with stops, cost profile and assigned vehicles |
| `/warehouses` | Facility capacity, throughput, staffing and geography |
| `/planning` | Dispatch timeline with conflict detection and dock occupancy |
| `/analytics` | Delivery performance, cost, efficiency, carrier scorecard |
| `/alerts` | Every exception, filterable by severity, category, location and age |

Press `⌘K` (or `/`) anywhere for search across shipments, vehicles, routes, warehouses,
drivers and alerts.

## Architecture

```
src/
  app/
    (app)/            Route group carrying the application shell
  components/
    shell/            Sidebar, topbar, command search, theme
    ui/               Design-system primitives
    map/              Custom SVG map surfaces
    modules/          Composed product modules
  lib/
    data/             The mock dataset
    geo.ts            Generated map geometry (do not edit by hand)
    map-data.ts       Route geometry and marker placement
    search.ts         Cross-entity search index
```

### The map

The map is built from real geography rather than an embedded tile provider. Natural
Earth 1:50m country outlines are projected through a Lambert conformal conic projection
at build time by `tools/build-geo.mjs`, which writes `src/lib/geo.ts`. Hub coordinates
pass through the identical projection, so markers and coastlines cannot drift apart.

Regenerate after changing the hub list or the framing:

```bash
node tools/build-geo.mjs
```

The frame is fitted to the hubs themselves rather than to the country geometry. Several
network countries (Netherlands, France, Spain, Portugal) carry overseas territories that
would otherwise pull the frame across the Atlantic.

### The dataset

`src/lib/data/` generates 1,924 shipments, 184 vehicles, 70 drivers, 24 corridors, 18
facilities, 55 alerts and 90 days of history from seeded PRNGs, so the server and client
render identical output and hydration stays stable.

Relationships hold across the product. A shipment's vehicle exists in the fleet, its
route exists in the corridor list, and its origin and destination are real facilities.
Headline figures are calibrated rather than asserted: freight tonnage is normalised so
the in-transit total lands on 18,492 t, and per-vehicle utilisation is calibrated so
fleet utilisation resolves to 82.6%.

The dataset is pinned to a fixed clock (18 August 2026, 14:20 Europe/Amsterdam) exported
as `NOW`. Every relative time on screen is measured against it.

### Theming

Tokens live in `src/app/globals.css` as CSS custom properties, surfaced to Tailwind
through `@theme inline`. Light is the primary environment; dark is a separate
"night operations" palette, not an inversion. Both themes carry the same information
architecture.

Text colours are split from fill colours. `--nl-success` and friends are used for bars,
dots and map geometry; `--nl-success-text` and friends are used wherever the colour
carries type. Every text tier passes WCAG AA against every surface in both themes.

## Notes on the brand guide

The supplied guide was followed for typography, spacing, radii, elevation, brand colour
and the dark palette. Three greys were darkened from their guide values because the
guide's tier-3 grey (`#98A2B3`) and its status hues fail WCAG AA when used for the small
type this interface relies on. The original value is retained as `--nl-text-faint` for
non-text use such as chart axes and icon strokes.
