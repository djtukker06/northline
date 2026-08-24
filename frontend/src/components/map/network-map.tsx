"use client";

import * as React from "react";
import { GRATICULE, LANDMASSES, MAP_HEIGHT, MAP_WIDTH } from "@/lib/geo";
import { MAP_HUBS, MAP_VEHICLES, pointAlong, routeGeometry, type Pt } from "@/lib/map-data";
import { ROUTES } from "@/lib/data";
import { cn } from "@/lib/utils";

export type MapSelection =
  | { kind: "route"; id: string }
  | { kind: "hub"; id: string }
  | { kind: "vehicle"; id: string }
  | null;

export interface MapFilters {
  statuses: Set<"on-schedule" | "at-risk" | "delayed">;
  regions: Set<string>;
  vehicleClasses: Set<string>;
}

const STATUS_STROKE = {
  "on-schedule": "var(--nl-success)",
  "at-risk": "var(--nl-warning)",
  delayed: "var(--nl-critical)",
} as const;

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

interface View {
  x: number;
  y: number;
  k: number;
}

export function NetworkMap({
  selection,
  onSelect,
  filters,
  className,
  showVehicles = true,
  focusRouteId,
}: {
  selection: MapSelection;
  onSelect: (s: MapSelection) => void;
  filters: MapFilters;
  className?: string;
  showVehicles?: boolean;
  focusRouteId?: string | null;
}) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [view, setView] = React.useState<View>({ x: 0, y: 0, k: 1 });
  const [hover, setHover] = React.useState<MapSelection>(null);
  const drag = React.useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const visibleRoutes = React.useMemo(
    () =>
      ROUTES.filter(
        (r) =>
          filters.statuses.has(r.status) &&
          (filters.regions.size === 0 ||
            filters.regions.has(hubRegion(r.originId)) ||
            filters.regions.has(hubRegion(r.destinationId))),
      ),
    [filters],
  );

  const visibleRouteIds = React.useMemo(
    () => new Set(visibleRoutes.map((r) => r.id)),
    [visibleRoutes],
  );

  const vehicles = React.useMemo(
    () =>
      MAP_VEHICLES.filter(
        (v) =>
          visibleRouteIds.has(v.routeId) &&
          (filters.vehicleClasses.size === 0 || filters.vehicleClasses.has(v.vehicleClass)),
      ),
    [visibleRouteIds, filters.vehicleClasses],
  );

  const hubs = React.useMemo(
    () =>
      MAP_HUBS.filter(
        (h) => filters.regions.size === 0 || filters.regions.has(h.region),
      ),
    [filters.regions],
  );

  /**
   * Frame a route selected from outside the map. Applied during render rather than in
   * an effect so the map never paints at the old zoom first, and so panning afterwards
   * is not fought by a re-running effect.
   */
  // Starts unset so a route already selected on first load still gets framed.
  const [framedRouteId, setFramedRouteId] = React.useState<string | null | undefined>(undefined);
  if (framedRouteId === undefined || (focusRouteId ?? null) !== framedRouteId) {
    setFramedRouteId(focusRouteId ?? null);
    const route = focusRouteId ? ROUTES.find((r) => r.id === focusRouteId) : null;
    if (route) setView(frameRoute(route));
  }

  const zoomBy = React.useCallback((factor: number, origin?: Pt) => {
    setView((v) => {
      const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.k * factor));
      if (k === v.k) return v;
      const [ox, oy] = origin ?? [MAP_WIDTH / 2, MAP_HEIGHT / 2];
      // Keep the point under the cursor fixed while scaling.
      return {
        k,
        x: ox - ((ox - v.x) / v.k) * k,
        y: oy - ((oy - v.y) / v.k) * k,
      };
    });
  }, []);

  const toSvg = (clientX: number, clientY: number): Pt => {
    const rect = svgRef.current!.getBoundingClientRect();
    return [
      ((clientX - rect.left) / rect.width) * MAP_WIDTH,
      ((clientY - rect.top) / rect.height) * MAP_HEIGHT,
    ];
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 1.14 : 1 / 1.14, toSvg(e.clientX, e.clientY));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const dx = ((e.clientX - drag.current.x) / rect.width) * MAP_WIDTH;
    const dy = ((e.clientY - drag.current.y) / rect.height) * MAP_HEIGHT;
    if (!isDragging && Math.hypot(dx, dy) > 3) setIsDragging(true);
    setView((v) => ({ ...v, x: drag.current!.vx + dx, y: drag.current!.vy + dy }));
  };

  const endDrag = () => {
    drag.current = null;
    // Let the click handler run first, then clear the flag.
    requestAnimationFrame(() => setIsDragging(false));
  };

  const selectedRouteId =
    selection?.kind === "route"
      ? selection.id
      : selection?.kind === "vehicle"
        ? MAP_VEHICLES.find((v) => v.id === selection.id)?.routeId
        : null;

  // Marker geometry is drawn in screen units, so counter-scale it as the map zooms.
  const inv = 1 / view.k;

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        className={cn("h-full w-full touch-none select-none", isDragging ? "cursor-grabbing" : "cursor-grab")}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        role="application"
        aria-label="Network map. Use the zoom controls or arrow keys to explore."
      >
        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="var(--nl-map-water)" />

        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          <g stroke="var(--nl-map-graticule)" strokeWidth={inv * 0.6} fill="none">
            {GRATICULE.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>

          <g>
            {LANDMASSES.filter((l) => !l.core).map((l) => (
              <path
                key={l.id}
                d={l.d}
                fill="var(--nl-map-land-context)"
                stroke="var(--nl-map-stroke)"
                strokeWidth={inv * 0.5}
                strokeLinejoin="round"
              />
            ))}
            {LANDMASSES.filter((l) => l.core).map((l) => (
              <path
                key={l.id}
                d={l.d}
                fill="var(--nl-map-land)"
                stroke="var(--nl-map-stroke)"
                strokeWidth={inv * 0.8}
                strokeLinejoin="round"
              />
            ))}
          </g>

          {/* Corridors. Drawn under the markers so hubs always stay readable. */}
          <g fill="none" strokeLinecap="round">
            {visibleRoutes.map((r) => {
              const geometry = routeGeometry(r);
              const isSelected = selectedRouteId === r.id;
              const isHovered = hover?.kind === "route" && hover.id === r.id;
              const dimmed = selectedRouteId !== null && !isSelected;
              return (
                <g key={r.id}>
                  <path
                    d={geometry.d}
                    stroke="transparent"
                    strokeWidth={inv * 14}
                    className="cursor-pointer"
                    onPointerEnter={() => setHover({ kind: "route", id: r.id })}
                    onPointerLeave={() => setHover(null)}
                    onClick={() => !isDragging && onSelect({ kind: "route", id: r.id })}
                  />
                  <path
                    d={geometry.d}
                    stroke={isSelected ? "var(--nl-brand)" : STATUS_STROKE[r.status]}
                    strokeWidth={inv * (isSelected ? 2.6 : isHovered ? 2.2 : 1.4)}
                    strokeOpacity={dimmed ? 0.2 : isSelected ? 1 : 0.68}
                    strokeDasharray={isSelected ? `${inv * 7} ${inv * 5}` : undefined}
                    className={cn(
                      "pointer-events-none transition-[stroke-width,stroke-opacity] duration-200",
                      isSelected && "animate-[nl-route-flow_1.1s_linear_infinite]",
                    )}
                  />
                </g>
              );
            })}
          </g>

          {showVehicles && (
            <g>
              {vehicles.map((v) => {
                const route = ROUTES.find((r) => r.id === v.routeId)!;
                const { p, angle } = pointAlong(routeGeometry(route), v.t);
                const isSelected = selection?.kind === "vehicle" && selection.id === v.id;
                const dimmed = selectedRouteId !== null && selectedRouteId !== v.routeId;
                const color = isSelected ? "var(--nl-brand)" : STATUS_STROKE[v.status];
                return (
                  <g
                    key={v.id}
                    transform={`translate(${p[0]} ${p[1]}) scale(${inv})`}
                    opacity={dimmed ? 0.25 : 1}
                    className="cursor-pointer transition-opacity duration-200"
                    onPointerEnter={() => setHover({ kind: "vehicle", id: v.id })}
                    onPointerLeave={() => setHover(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDragging) onSelect({ kind: "vehicle", id: v.id });
                    }}
                  >
                    <circle r={7} fill="transparent" />
                    {isSelected && (
                      <circle r={4} fill={color} opacity={0.3} className="animate-[nl-pulse-ring_1.8s_ease-out_infinite]" />
                    )}
                    <g transform={`rotate(${angle})`}>
                      <path
                        d="M-2.6,-2.4 L3.4,0 L-2.6,2.4 Z"
                        fill={color}
                        stroke="var(--nl-map-land)"
                        strokeWidth={0.7}
                        strokeLinejoin="round"
                      />
                    </g>
                  </g>
                );
              })}
            </g>
          )}

          <g>
            {hubs.map((h) => {
              const isSelected = selection?.kind === "hub" && selection.id === h.id;
              const isHovered = hover?.kind === "hub" && hover.id === h.id;
              const critical = h.capacityPct >= 88;
              return (
                <g
                  key={h.id}
                  transform={`translate(${h.point[0]} ${h.point[1]}) scale(${inv})`}
                  className="cursor-pointer"
                  onPointerEnter={() => setHover({ kind: "hub", id: h.id })}
                  onPointerLeave={() => setHover(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isDragging) onSelect({ kind: "hub", id: h.id });
                  }}
                >
                  {critical && (
                    <circle
                      r={h.radius}
                      fill="var(--nl-critical)"
                      opacity={0.35}
                      className="animate-[nl-pulse-ring_2.6s_ease-out_infinite]"
                    />
                  )}
                  <circle r={h.radius + 5} fill="transparent" />
                  <circle
                    r={h.radius}
                    fill={
                      isSelected
                        ? "var(--nl-brand)"
                        : critical
                          ? "var(--nl-critical)"
                          : "var(--nl-text)"
                    }
                    stroke="var(--nl-map-land)"
                    strokeWidth={1.8}
                    className="transition-[r] duration-200"
                  />
                  {(isHovered || isSelected || h.radius > 6.4) && (
                    <text
                      x={h.radius + 4}
                      y={3.2}
                      className="pointer-events-none font-semibold"
                      style={{ fontSize: 9 }}
                      fill="var(--nl-text)"
                      stroke="var(--nl-map-land)"
                      strokeWidth={2.4}
                      paintOrder="stroke"
                    >
                      {h.city}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      <MapControls
        onZoomIn={() => zoomBy(1.35)}
        onZoomOut={() => zoomBy(1 / 1.35)}
        onReset={() => setView({ x: 0, y: 0, k: 1 })}
        zoom={view.k}
      />

      <HoverCard hover={hover} />
    </div>
  );
}

/** Zoom and offset that fit a route inside the frame with a margin. */
function frameRoute(route: (typeof ROUTES)[number]): View {
  const geometry = routeGeometry(route);
  const xs = geometry.nodes.map((n) => n[0]);
  const ys = geometry.nodes.map((n) => n[1]);
  const pad = 120;
  const w = Math.max(...xs) - Math.min(...xs) + pad * 2;
  const h = Math.max(...ys) - Math.min(...ys) + pad * 2;
  const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(MAP_WIDTH / w, MAP_HEIGHT / h)));
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  return { k, x: MAP_WIDTH / 2 - cx * k, y: MAP_HEIGHT / 2 - cy * k };
}

function hubRegion(facilityId: string) {
  return MAP_HUBS.find((h) => h.id === facilityId)?.region ?? "";
}

function MapControls({
  onZoomIn,
  onZoomOut,
  onReset,
  zoom,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  zoom: number;
}) {
  return (
    <div className="absolute right-3 bottom-3 flex flex-col gap-1">
      <div className="bg-surface/95 border-line flex flex-col overflow-hidden rounded-control border shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={onZoomIn}
          aria-label="Zoom in"
          disabled={zoom >= MAX_ZOOM}
          className="text-ink-2 hover:bg-neutral-soft hover:text-ink grid size-7 place-items-center text-body transition-colors disabled:opacity-35"
        >
          +
        </button>
        <span className="bg-line h-px" />
        <button
          type="button"
          onClick={onZoomOut}
          aria-label="Zoom out"
          disabled={zoom <= MIN_ZOOM}
          className="text-ink-2 hover:bg-neutral-soft hover:text-ink grid size-7 place-items-center text-body transition-colors disabled:opacity-35"
        >
          −
        </button>
      </div>
      <button
        type="button"
        onClick={onReset}
        aria-label="Reset view"
        className="bg-surface/95 border-line text-ink-2 hover:text-ink grid size-7 place-items-center rounded-control border text-caption font-medium shadow-sm backdrop-blur transition-colors"
      >
        {zoom.toFixed(1)}×
      </button>
    </div>
  );
}

function HoverCard({ hover }: { hover: MapSelection }) {
  if (!hover) return null;
  let title = "";
  let detail = "";

  if (hover.kind === "route") {
    const r = ROUTES.find((x) => x.id === hover.id);
    if (!r) return null;
    title = `${r.id} · ${r.name}`;
    detail = `${r.shipmentCount} loads · ${r.distanceKm} km${r.delayMinutes ? ` · ${r.delayMinutes} min late` : ""}`;
  } else if (hover.kind === "hub") {
    const h = MAP_HUBS.find((x) => x.id === hover.id);
    if (!h) return null;
    title = h.name;
    detail = `${h.capacityPct}% capacity · ${h.throughput} movements today`;
  } else {
    const v = MAP_VEHICLES.find((x) => x.id === hover.id);
    if (!v) return null;
    title = v.id;
    detail = `${v.label} · ${v.loadTonnes.toFixed(1)} t · ${v.speed} km/h`;
  }

  return (
    <div className="bg-surface/95 border-line pointer-events-none absolute top-3 left-3 max-w-64 rounded-control border px-2.5 py-1.5 shadow-sm backdrop-blur">
      <p className="text-ink text-small font-semibold">{title}</p>
      <p className="text-ink-2 text-caption mt-0.5 tabular-nums">{detail}</p>
    </div>
  );
}
