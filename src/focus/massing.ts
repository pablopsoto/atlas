import type { ExpressionSpecification, FilterSpecification, GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import type { Feature, MultiPolygon, Polygon, Position } from 'geojson';
import type { Work } from '../data';

type Shape = Feature<Polygon | MultiPolygon, { render_height?: number; render_min_height?: number }>;

/** The building at a work, read from the basemap's OpenStreetMap footprints. */
export interface Footprint {
  shapes: Shape[];
  /** Centre of the footprint (or the work itself when none was found). */
  center: [number, number];
  /** Metres from the centre to the furthest corner. */
  radius: number;
  /** Tallest part, in metres. */
  height: number;
}

const M_PER_DEG_LAT = 110_540;
const mPerDegLng = (lat: number) => 111_320 * Math.cos((lat * Math.PI) / 180);
const metres = (a: Position, b: Position) =>
  Math.hypot((a[0] - b[0]) * mPerDegLng(b[1]), (a[1] - b[1]) * M_PER_DEG_LAT);

function ringContains(ring: Position[], [x, y]: Position) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const polygons = (s: Shape) => (s.geometry.type === 'Polygon' ? [s.geometry.coordinates] : s.geometry.coordinates);
const contains = (s: Shape, p: Position) =>
  polygons(s).some(([outer, ...holes]) => ringContains(outer, p) && !holes.some((h) => ringContains(h, p)));
const vertices = (s: Shape) => polygons(s).flatMap((poly) => poly[0]);
const centroid = (pts: Position[]): Position => [
  pts.reduce((n, p) => n + p[0], 0) / pts.length,
  pts.reduce((n, p) => n + p[1], 0) / pts.length,
];

const DEFAULT_RADIUS = 40;
/** Metres; larger "buildings" in OSM are usually enclosures, not the work itself. */
const MAX_BUILDING = 250;
/** Metres; a containing shape wider than this may be an enclosure around the real building. */
const BUILDING_SIZED = 120;

export function findFootprint(map: MapLibreMap, work: Work): Footprint {
  const at: Position = [work.lng, work.lat];
  const seen = new Set<string>();
  const all = map
    .querySourceFeatures('omt', { sourceLayer: 'building' })
    .filter((f) => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
    // Outlines of buildings mapped in parts; the parts carry the real shape.
    .filter((f) => !f.properties.hide_3d)
    // Plain objects: the query returns tile-backed features that can't go back to the worker.
    .map((f): Shape => ({
      type: 'Feature',
      properties: { render_height: f.properties.render_height, render_min_height: f.properties.render_min_height },
      geometry: f.geometry as Polygon | MultiPolygon,
    }))
    .filter((f) => {
    // The same building comes back once per tile it touches.
    const key = JSON.stringify(vertices(f)[0]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const spread = (s: Shape) => {
    const v = vertices(s);
    const c = centroid(v);
    return Math.max(...v.map((p) => metres(p, c)));
  };
  // The smallest building containing the work — unless it's enclosure-sized (a park or
  // campus mapped as one "building") and a real building stands right next to the point.
  const limit = work.radius ?? MAX_BUILDING;
  const candidates = all.filter((s) => spread(s) <= limit);
  const containing = candidates.filter((s) => contains(s, at)).sort((a, b) => spread(a) - spread(b));
  let shapes: Shape[] = containing[0] && spread(containing[0]) <= BUILDING_SIZED ? [containing[0]] : [];
  if (!shapes.length) {
    // Coordinates often sit in a courtyard or on the street: take the nearest building.
    let best: Shape | null = null;
    let bestD = 45;
    for (const s of candidates) {
      if (spread(s) > BUILDING_SIZED && !work.radius) continue;
      const d = Math.min(...vertices(s).map((v) => metres(v, at)));
      if (d < bestD) [best, bestD] = [s, d];
    }
    // Failing that, an enclosure is still better than nothing only if the work is that big;
    // otherwise centre on the work's own coordinate.
    shapes = best ? [best] : work.radius ? containing.slice(0, 1) : [];
  }
  if (shapes.length) {
    // Tall buildings are mapped as several parts (podium, tower, roof): take every
    // part whose centre falls inside what we found.
    const pts = shapes.flatMap(vertices);
    const pad = 3 / M_PER_DEG_LAT;
    const [minX, maxX] = [Math.min(...pts.map((p) => p[0])) - pad, Math.max(...pts.map((p) => p[0])) + pad];
    const [minY, maxY] = [Math.min(...pts.map((p) => p[1])) - pad, Math.max(...pts.map((p) => p[1])) + pad];
    for (const s of all) {
      const [x, y] = centroid(vertices(s));
      if (!shapes.includes(s) && spread(s) <= limit && x > minX && x < maxX && y > minY && y < maxY) shapes.push(s);
    }
  }
  if (work.radius) {
    // Complexes (a campus, a park) span many buildings: keep the ones near the centre.
    const reach = work.radius * 0.6;
    for (const s of all) {
      if (!shapes.includes(s) && metres(centroid(vertices(s)), at) < reach) shapes.push(s);
    }
  }
  if (!shapes.length) return { shapes, center: [work.lng, work.lat], radius: work.radius ?? DEFAULT_RADIUS, height: 12 };

  const pts = shapes.flatMap(vertices);
  const c = centroid(pts);
  return {
    shapes,
    center: [c[0], c[1]],
    radius: work.radius ?? Math.max(18, ...pts.map((p) => metres(p, c))),
    height: Math.max(6, ...shapes.map((s) => s.properties?.render_height ?? 0)),
  };
}

/** Grow each footprint a little so `within` reliably matches the original building. */
function buffered(shapes: Shape[]): MultiPolygon {
  return {
    type: 'MultiPolygon',
    coordinates: shapes.flatMap(polygons).map((poly) => {
      const c = centroid(poly[0]);
      return [poly[0].map(([x, y]) => [c[0] + (x - c[0]) * 1.04, c[1] + (y - c[1]) * 1.04])];
    }),
  };
}

const GHOST_OPACITY = 0.1;
const BASE_FILTER: FilterSpecification = ['!=', ['get', 'hide_3d'], true];
let savedOpacity: unknown = null;

/** Solid building, ghosted city. */
export function showMassing(map: MapLibreMap, fp: Footprint) {
  (map.getSource('focus') as GeoJSONSource).setData({ type: 'FeatureCollection', features: fp.shapes });
  if (savedOpacity === null) savedOpacity = map.getPaintProperty('building-3d', 'fill-extrusion-opacity');
  map.setPaintProperty('building-3d', 'fill-extrusion-opacity', GHOST_OPACITY);
  if (fp.shapes.length)
    map.setFilter('building-3d', ['all', BASE_FILTER, ['!', ['within', buffered(fp.shapes)]]] as FilterSpecification);
}

export function clearMassing(map: MapLibreMap) {
  (map.getSource('focus') as GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features: [] });
  if (savedOpacity !== null) {
    map.setPaintProperty('building-3d', 'fill-extrusion-opacity', savedOpacity as ExpressionSpecification);
    savedOpacity = null;
  }
  map.setFilter('building-3d', BASE_FILTER);
}

/** Zoom at which a footprint of the given radius fills a comfortable share of the view. */
export function zoomFor(fp: Footprint, viewW: number, viewH: number) {
  const target = 0.3 * Math.min(viewW, viewH);
  // Towers need room for their height as much as their footprint.
  const extent = Math.max(fp.radius, fp.height * 0.55);
  const z = Math.log2((78_271.517 * Math.cos((fp.center[1] * Math.PI) / 180) * target) / extent);
  return Math.max(13.5, Math.min(19.2, z));
}

const OVERLAY_LAYERS = ['path', 'works-halo', 'icons-ring', 'works', 'works-label', 'selected'];

/** Hide the atlas overlay (dots, labels, career path) while a work is on stage. */
export function setOverlayVisible(map: MapLibreMap, visible: boolean) {
  for (const id of OVERLAY_LAYERS) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
}

/**
 * Orbit the map around its centre: drag turns bearing and pitch, the wheel zooms
 * around the centre, and it slowly turns by itself until the viewer takes over.
 */
export function createMapOrbit(map: MapLibreMap) {
  const el = map.getCanvasContainer();
  let active = false;
  let drag: { x: number; y: number; id: number } | null = null;
  let spin = 0;
  let spinning = false;

  const down = (e: PointerEvent) => {
    if (!active || e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
    el.setPointerCapture(e.pointerId);
    spinning = false;
  };
  const move = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    drag.x = e.clientX;
    drag.y = e.clientY;
    map.jumpTo({ bearing: map.getBearing() - dx * 0.35, pitch: Math.max(0, Math.min(80, map.getPitch() - dy * 0.25)) });
  };
  const up = (e: PointerEvent) => {
    if (drag?.id === e.pointerId) drag = null;
  };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', () => (spinning = false), { passive: true });

  const tick = () => {
    if (spinning && !drag) map.setBearing(map.getBearing() + 0.06);
    spin = requestAnimationFrame(tick);
  };

  return {
    enable(autoSpin: boolean) {
      if (!active) {
        active = true;
        map.dragPan.disable();
        map.dragRotate.disable();
        map.touchPitch.disable();
        map.keyboard.disable();
        map.doubleClickZoom.disable();
        map.scrollZoom.enable({ around: 'center' });
        map.touchZoomRotate.enable({ around: 'center' });
        map.touchZoomRotate.disableRotation();
        spin = requestAnimationFrame(tick);
      }
      spinning = autoSpin;
    },
    disable() {
      if (!active) return;
      active = false;
      drag = null;
      spinning = false;
      cancelAnimationFrame(spin);
      map.dragPan.enable();
      map.dragRotate.enable();
      map.touchPitch.enable();
      map.keyboard.enable();
      map.doubleClickZoom.enable();
      map.scrollZoom.enable();
      map.touchZoomRotate.enable();
      map.touchZoomRotate.enableRotation();
    },
    /** Pause while another view (the photoreal model) takes over input. */
    get active() {
      return active;
    },
  };
}
