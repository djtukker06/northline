"use client";

import * as React from "react";
import { GRATICULE, LANDMASSES, MAP_HEIGHT, MAP_WIDTH } from "@/lib/geo";
import { MAP_HUBS } from "@/lib/map-data";
import { cn } from "@/lib/utils";

/**
 * Static network view used where the reading is geographic distribution rather than
 * live movement. Marker area tracks throughput; colour tracks capacity pressure.
 */
export function FacilityMap({
  selectedId,
  onSelect,
  className,
  height,
}: {
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
  /** Fallback height. Omit when the caller sizes the map through `className`. */
  height?: number;
}) {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState({ w: 900, h: height ?? 300 });

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

  const unit = 1 / Math.min(box.w / MAP_WIDTH, box.h / MAP_HEIGHT);

  return (
    <div
      ref={hostRef}
      className={cn("bg-map-water relative overflow-hidden", className)}
      style={height !== undefined ? { height } : undefined}
    >
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        role="img"
        aria-label="Facility locations across the network"
      >
        <g stroke="var(--nl-map-graticule)" strokeWidth={unit * 0.6} fill="none">
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
            strokeWidth={unit * 0.7}
            strokeLinejoin="round"
          />
        ))}

        {MAP_HUBS.map((h) => {
          const selected = selectedId === h.id;
          const pressure =
            h.capacityPct >= 88
              ? "var(--nl-critical)"
              : h.capacityPct >= 78
                ? "var(--nl-warning)"
                : "var(--nl-success)";
          const r = unit * (6 + (h.throughput / 170) * 7);
          return (
            <g
              key={h.id}
              transform={`translate(${h.point[0]} ${h.point[1]})`}
              className={onSelect ? "cursor-pointer" : undefined}
              onClick={() => onSelect?.(h.id)}
            >
              <circle r={r + unit * 5} fill="transparent" />
              <circle r={r} fill={selected ? "var(--nl-brand)" : pressure} fillOpacity={0.22} />
              <circle
                r={r * 0.42}
                fill={selected ? "var(--nl-brand)" : pressure}
                stroke="var(--nl-map-land)"
                strokeWidth={unit * 1.4}
              />
              <text
                x={r + unit * 4}
                y={unit * 3.6}
                style={{ fontSize: unit * 10.5 }}
                className="pointer-events-none font-semibold"
                fill="var(--nl-text)"
                stroke="var(--nl-map-land)"
                strokeWidth={unit * 2.8}
                paintOrder="stroke"
              >
                {h.city}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="bg-surface/90 border-line text-caption absolute bottom-3 left-3 flex items-center gap-3 rounded-control border px-2.5 py-1.5 backdrop-blur">
        {[
          ["Under 78%", "var(--nl-success)"],
          ["78 to 88%", "var(--nl-warning)"],
          ["Over 88%", "var(--nl-critical)"],
        ].map(([label, color]) => (
          <span key={label} className="text-ink-2 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
