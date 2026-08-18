import fs from 'node:fs';
import * as topojson from 'topojson-client';
import { presimplify, simplify, quantile } from 'topojson-simplify';
import { geoConicConformal, geoPath } from 'd3-geo';

const raw = await fetch('https://unpkg.com/world-atlas@2/countries-50m.json').then(r => r.json());
// Weld shared borders, then drop sub-pixel detail. Countries inside the service area keep
// more coastline than the surrounding context, which only needs to read as land.
const pre = presimplify(raw);
const detailed = topojson.feature(simplify(pre, quantile(presimplify(raw), 0.80)), 'countries');
const coarse = topojson.feature(simplify(pre, quantile(presimplify(raw), 0.94)), 'countries');
const fc = detailed;

// Countries in the NORTHLINE service area (western + central Europe) plus surrounding context.
const CORE = new Set(['Netherlands','Belgium','Germany','France','Spain','Portugal','Italy','Poland','Czechia','Austria','Switzerland','Denmark','Luxembourg','Slovakia','Slovenia','Hungary','Croatia']);
const CONTEXT = new Set(['United Kingdom','Ireland','Norway','Sweden','Finland','Estonia','Latvia','Lithuania','Belarus','Ukraine','Romania','Bulgaria','Serbia','Bosnia and Herzegovina','Albania','North Macedonia','Montenegro','Kosovo','Greece','Turkey','Morocco','Algeria','Tunisia','Moldova','Russia','Iceland','Malta','Cyprus','Andorra','Monaco','San Marino','Liechtenstein']);

const W = 1000, H = 720;
const coarseByName = new Map(coarse.features.map(f => [f.properties.name, f]));
const wanted = fc.features
  .filter(f => CORE.has(f.properties.name) || CONTEXT.has(f.properties.name))
  .map(f => (CORE.has(f.properties.name) ? f : coarseByName.get(f.properties.name) ?? f));

// Lambert conformal conic, the standard projection for European operational charts.
// The frame is an explicit lon/lat window rather than the bounds of the core countries:
// several of them (Netherlands, France, Spain, Portugal) carry overseas territories that
// would otherwise drag the fit across the Atlantic.
// Hub coordinates. These drive both the map framing and the marker positions.
const CITIES = {
  rotterdam:[4.48,51.92], amsterdam:[4.90,52.37], antwerp:[4.40,51.22], berlin:[13.40,52.52],
  hamburg:[9.99,53.55], duisburg:[6.76,51.43], munich:[11.58,48.14], frankfurt:[8.68,50.11],
  paris:[2.35,48.86], lyon:[4.84,45.76], marseille:[5.37,43.30], lille:[3.06,50.63],
  madrid:[-3.70,40.42], barcelona:[2.17,41.39], valencia:[-0.38,39.47], zaragoza:[-0.89,41.65],
  lisbon:[-9.14,38.72], porto:[-8.61,41.15], milan:[9.19,45.46], bologna:[11.34,44.49],
  rome:[12.50,41.90], turin:[7.69,45.07], warsaw:[21.01,52.23], poznan:[16.93,52.41],
  prague:[14.42,50.09], vienna:[16.37,48.21], budapest:[19.04,47.50], zurich:[8.54,47.38],
  copenhagen:[12.57,55.68], london:[-0.13,51.51], manchester:[-2.24,53.48], dublin:[-6.26,53.35],
  brussels:[4.35,50.85], luxembourg:[6.13,49.61], gothenburg:[11.97,57.71], stockholm:[18.07,59.33],
  oslo:[10.75,59.91], bratislava:[17.11,48.15], ljubljana:[14.51,46.06], zagreb:[15.98,45.81],
  bremen:[8.80,53.08], stuttgart:[9.18,48.78], nuremberg:[11.08,49.45], cologne:[6.96,50.94],
  bordeaux:[-0.58,44.84], nantes:[-1.55,47.22], strasbourg:[7.75,48.57], bilbao:[-2.93,43.26],
  seville:[-5.98,37.39], naples:[14.27,40.85], venice:[12.32,45.44], genoa:[8.93,44.41],
  malmo:[13.00,55.60], gdansk:[18.65,54.35], krakow:[19.94,50.06], graz:[15.44,47.07],
  basel:[7.59,47.56], geneva:[6.14,46.20], toulouse:[1.44,43.60], calais:[1.86,50.95],
  dover:[1.31,51.13], hanover:[9.73,52.37], leipzig:[12.37,51.34], dresden:[13.74,51.05],
};

// Framed on the hubs themselves, with a margin, so the operation fills the view.
// Fitting to the country geometry instead would drag the frame across the Atlantic:
// the Netherlands, France, Spain and Portugal all carry overseas territories.
const projection = geoConicConformal().parallels([43, 62]).rotate([-10, 0]);
projection.fitExtent(
  [[92, 84], [W - 92, H - 84]],
  { type: 'MultiPoint', coordinates: Object.values(CITIES) },
);
// Anything outside the frame (Caribbean, Guiana, Azores, Canaries) is cut in screen space.
projection.clipExtent([[-40, -40], [W + 40, H + 40]]);

const pathGen = geoPath(projection).digits(0);

const out = [];
for (const f of wanted) {
  // Drop islands smaller than a few screen pixels; they read as noise at dashboard scale.
  const parts = (pathGen(f) || '').split('M').filter(Boolean).map((x) => 'M' + x);
  const kept = parts.filter((seg) => {
    const nums = seg.match(/-?\d+(?:\.\d+)?/g);
    if (!nums || nums.length < 8) return false;
    const xs = [], ys = [];
    for (let i = 0; i < nums.length - 1; i += 2) { xs.push(+nums[i]); ys.push(+nums[i + 1]); }
    return (Math.max(...xs) - Math.min(...xs)) > 4 && (Math.max(...ys) - Math.min(...ys)) > 4;
  });
  const d = kept.join('');
  if (!d) continue;
  out.push({ id: f.properties.name, core: CORE.has(f.properties.name), d });
}

// Project the hub coordinates through the identical projection so markers land correctly.
const pts = {};
for (const [k, ll] of Object.entries(CITIES)) {
  const p = projection(ll);
  pts[k] = [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
}

// Graticule for the operational grid overlay.
const grat = [];
for (let lon = -15; lon <= 30; lon += 5) {
  const line = { type: 'LineString', coordinates: [] };
  for (let lat = 32; lat <= 68; lat += 1) line.coordinates.push([lon, lat]);
  grat.push(pathGen(line));
}
for (let lat = 35; lat <= 65; lat += 5) {
  const line = { type: 'LineString', coordinates: [] };
  for (let lon = -15; lon <= 30; lon += 1) line.coordinates.push([lon, lat]);
  grat.push(pathGen(line));
}

const ts = `// Generated by tools/build-geo.mjs. Lambert conformal conic projection of Natural Earth 1:50m data.
// Do not edit by hand. Regenerate with: node tools/build-geo.mjs
export const MAP_WIDTH = ${W};
export const MAP_HEIGHT = ${H};

export type Landmass = { id: string; core: boolean; d: string };

export const LANDMASSES: Landmass[] = ${JSON.stringify(out)};

export const GRATICULE: string[] = ${JSON.stringify(grat.filter(Boolean))};

/** Screen-space coordinates for every hub, projected identically to the landmasses. */
export const GEO_POINTS: Record<string, [number, number]> = ${JSON.stringify(pts)};
`;
fs.mkdirSync('src/lib', { recursive: true });
fs.writeFileSync('src/lib/geo.ts', ts);
console.log('countries:', out.length, 'graticule:', grat.length, 'points:', Object.keys(pts).length);
console.log('bytes:', ts.length);
