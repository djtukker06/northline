# NORTHLINE

A logistics intelligence platform. One view of shipments, fleet, warehouses and
routes across a European road-freight network.

A Next.js frontend and a Laravel API, each in its own container, sharing MySQL and
Redis.

```
northline/
  frontend/        Next.js 16, React 19, TypeScript, Tailwind v4
  api/             Laravel 12, PHP 8.3
  docs/            backend-glossary.md
  docker-compose.yml
  Makefile
```

---

## Running it

You need **Docker Desktop** for the backend, and **Node 22** for the frontend.

```bash
# 1. Backend: builds the images, starts the containers, migrates and seeds.
make setup

# 2. Frontend, in a second terminal.
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The dashboard is on http://localhost:3000 and the API on http://localhost:8080.

Check the API is alive:

```bash
curl http://localhost:8080/api/v1/health
```

Fetch something real:

```bash
curl -H "X-API-Key: nl_dev_dashboard_2f8c41d9b7e64a05" http://localhost:8080/api/v1/kpis
```

`make help` lists every other command.

---

## What is where

### Frontend

| Route | Data source |
| --- | --- |
| `/shipments` | **Live API**, server-side filtering, sorting and pagination |
| `/shipments/[id]` | **Live API**, with relations and timeline |
| `/dashboard`, `/fleet`, `/routes`, `/warehouses`, `/planning`, `/analytics`, `/alerts` | Local generator in `src/lib/data/`, migration pending |

The migration is deliberately incremental. Shipments proves the whole stack; the
remaining pages move over one at a time, which is how this is done in practice
rather than in one commit that cannot be reviewed.

`src/lib/api/` holds the client, the contract types and one function per query.

### API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/v1/health` | Readiness probe, no key required |
| `GET /api/v1/kpis` | Headline network metrics, cached in Redis |
| `GET /api/v1/history?days=7\|30\|90` | Daily performance series |
| `GET /api/v1/shipments` | Paginated, filterable, sortable |
| `GET /api/v1/shipments/{ref}` | One shipment with its timeline |
| `GET /api/v1/vehicles` · `/{ref}` | Fleet |
| `GET /api/v1/drivers` | Drivers, optionally those near their driving limit |
| `GET /api/v1/routes` · `/{ref}` | Corridors and their stops |
| `GET /api/v1/facilities` · `/{code}` | Warehouses and hubs |
| `GET /api/v1/alerts` · `/{ref}` | Alerts |
| `GET /api/v1/events` | Live operations feed |

Everything except `/health` needs `X-API-Key` and is rate limited.

---

## The data

The database holds 1,924 shipments, 9,557 timeline events, 184 vehicles, 70
drivers, 24 corridors, 18 facilities, 55 alerts and 90 days of history.

It comes from JSON fixtures in `api/database/data/`, generated once from the
frontend's original generator:

```bash
cd frontend && npx tsx tools/export-dataset.ts
```

Seeding from committed fixtures means every developer, every CI run and every demo
shows identical numbers, which is what you want when a screenshot has to match a
bug report.

Headline figures are calibrated rather than asserted: freight tonnage normalises to
18,492 t in transit, and per-vehicle utilisation to 82.6% fleet-wide.

---

## Learning the backend vocabulary

`docs/backend-glossary.md` explains every backend term this project uses: what it
is, what it does, and what it means for the frontend. Containers, migrations,
indexes, the N+1 problem, API keys versus JWTs, CORS, rate limiting, caching
layers, health checks, CI. It ends with five questions worth asking a backend
developer whenever you get a new endpoint to build against.

The source is commented in the same spirit. `api/app/Http/Middleware/RequireApiKey.php`
and `api/app/Models/Shipment.php` are good places to start reading.

---

## Testing

```bash
make test           # PHPUnit, against in-memory SQLite
cd frontend && npx tsc --noEmit && npx eslint .
```

CI runs both on every push, plus a check that the migrations also apply cleanly to
a real MySQL: SQLite is forgiving about things MySQL is not.

---

## The map

The map is built from real geography, not an embedded tile provider. Natural Earth
1:50m outlines are projected through a Lambert conformal conic projection at build
time by `frontend/tools/build-geo.mjs`. Hub coordinates pass through the identical
projection, so markers cannot drift from coastlines.

---

## Notes on the brand guide

The supplied guide was followed for typography, spacing, radii, elevation, brand
colour and the dark palette. Three greys were darkened from their guide values
because the guide's tier-3 grey (`#98A2B3`) and its status hues fail WCAG AA at the
small type this interface relies on. The original is kept as `--nl-text-faint` for
non-text use such as chart axes.
