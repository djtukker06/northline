"use client";

import * as React from "react";
import { GRATICULE, LANDMASSES } from "@/lib/geo";
import { pointAlong, routeGeometry } from "@/lib/map-data";
import { FACILITY_BY_ID, ROUTE_BY_ID } from "@/lib/data";
import { cn } from "@/lib/utils";

const STATUS_STROKE = {
  "on-schedule": "var(--nl-success)",
  "at-risk": "var(--nl-warning)",
  delayed: "var(--nl-critical)",
} as const;

/**
 * A single route, framed to its own extent. Used on detail screens where the whole
 * network would be noise and only this run matters.
 */
export function RouteStrip({
  routeId,
  progress,
  status = "on-schedule",
  className,
  height = 190,
}: {
  routeId: string;
  progress?: number;
  status?: keyof typeof STATUS_STROKE;
  className?: string;
  height?: number;
}) {
  const route = ROUTE_BY_ID.get(routeId);
  const geometry = React.useMemo(() => (route ? routeGeometry(route) : null), [route]);

  // Markers and labels are specified in screen pixels, so the rendered size of the
  // frame has to be measured. Deriving it from the viewBox alone makes the type
  // balloon on short, wide crops.
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState({ w: 640, h: height });

  React.useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height: h } = entry.contentRect;
      if (width > 0 && h > 0) setBox({ w: width, h });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!route || !geometry) return null;

  const xs = geometry.nodes.map((n) => n[0]);
  const ys = geometry.nodes.map((n) => n[1]);
  const padX = 150;
  const padY = 110;
  const minX = Math.min(...xs) - padX;
  const minY = Math.min(...ys) - padY;
  const w = Math.max(...xs) - Math.min(...xs) + padX * 2;
  const h = Math.max(...ys) - Math.min(...ys) + padY * 2;

  // preserveAspectRatio="slice" scales by the larger of the two ratios, so one
  // viewBox unit covers this many screen pixels.
  const pxPerUnit = Math.max(box.w / w, box.h / h);
  const unit = 1 / pxPerUnit;

  const marker = progress !== undefined ? pointAlong(geometry, progress / 100) : null;
  const stroke = STATUS_STROKE[status];

  return (
    <div
      ref={hostRef}
      className={cn("bg-map-water relative overflow-hidden", className)}
      style={{ height }}
    >
      <svg
        viewBox={`${minX} ${minY} ${w} ${h}`}
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        role="img"
        aria-label={`Route ${route.id}, ${route.name}`}
      >
        <g stroke="var(--nl-map-graticule)" strokeWidth={unit * 0.7} fill="none">
          {GRATICULE.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        {LANDMASSES.map((l) => (
          <path
            key={l.id}
            d={l.d}
            fill={l.core ? "var(--nl-map-land)" : "var(--nl-map-land-context)"}
            stroke="var(--nl-map-stroke)"
            strokeWidth={unit * 0.8}
            strokeLinejoin="round"
          />
        ))}

        <path
          d={geometry.d}
          fill="none"
          stroke="var(--nl-border-strong)"
          strokeWidth={unit * 3}
          strokeLinecap="round"
        />
        {progress !== undefined && (
          <path
            d={geometry.d}
            fill="none"
            stroke={stroke}
            strokeWidth={unit * 3}
            strokeLinecap="round"
            // Draw only the completed portion of the run.
            strokeDasharray={`${(geometry.totalLength * progress) / 100} ${geometry.totalLength}`}
            pathLength={geometry.totalLength}
          />
        )}

        {geometry.nodes.map((n, i) => {
          const facilityId = [route.originId, ...route.viaIds, route.destinationId][i];
          const f = FACILITY_BY_ID.get(facilityId);
          return (
            <g key={facilityId ?? i} transform={`translate(${n[0]} ${n[1]})`}>
              <circle
                r={unit * 4.5}
                fill="var(--nl-text)"
                stroke="var(--nl-map-land)"
                strokeWidth={unit * 2}
              />
              {f && (
                <text
                  y={-unit * 10}
                  textAnchor="middle"
                  style={{ fontSize: unit * 11.5 }}
                  className="font-semibold"
                  fill="var(--nl-text)"
                  stroke="var(--nl-map-land)"
                  strokeWidth={unit * 3}
                  paintOrder="stroke"
                >
                  {f.city}
                </text>
              )}
            </g>
          );
        })}

        {marker && (
          <g transform={`translate(${marker.p[0]} ${marker.p[1]})`}>
            <circle r={unit * 9} fill={stroke} opacity={0.22} />
            <g transform={`rotate(${marker.angle})`}>
              <path
                d={`M${-unit * 4},${-unit * 3.8} L${unit * 5.2},0 L${-unit * 4},${unit * 3.8} Z`}
                fill={stroke}
                stroke="var(--nl-map-land)"
                strokeWidth={unit * 1.1}
                strokeLinejoin="round"
              />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
