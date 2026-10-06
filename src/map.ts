import type { AllPaintProperties } from '@maplibre/maplibre-gl-style-spec';
import {
  Map as MapLibreMap,
  NavigationControl,
  setWorkerUrl,
  type FilterSpecification,
  type GeoJSONSource,
  type MapMouseEvent,
  type PaddingOptions,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

setWorkerUrl(workerUrl);
import type { Atlas, Work } from './data';
import { distanceKm, geodesicPath, sphericalCentroid } from './geo';
import { buildStyle, LABEL_FILTER, type Theme } from './map-style';

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Handlers {
  onHover(work: Work | null, point: { x: number; y: number } | null): void;
  onClick(work: Work): void;
  /** True while a work is in focus: the map then orbits instead of picking. */
  locked(): boolean;
}

const WORK_LAYERS = ['works', 'icons-ring'];
const BASE_FILTERS: Record<string, FilterSpecification | null> = {
  works: null,
  'works-halo': null,
  'icons-ring': ['==', ['get', 'icon'], true],
  'works-label': LABEL_FILTER,
};

export function createMap(container: HTMLElement, atlas: Atlas, theme: Theme, handlers: Handlers) {
  const map = new MapLibreMap({
    container,
    style: buildStyle(theme),
    center: [-40, 28],
    zoom: 1.3,
    minZoom: 0.8,
    maxPitch: 70,
    attributionControl: false,
    canvasContextAttributes: { antialias: true },
  });
  map.addControl(new NavigationControl({ visualizePitch: true, showCompass: true }), 'top-right');

  const ready = new Promise<void>((resolve) => map.once('load', () => resolve()));
  let hovered: number | null = null;
  let pathAnimation = 0;

  ready.then(() => {
    (map.getSource('works') as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: atlas.works.map((w, i) => ({
        type: 'Feature',
        id: i,
        geometry: { type: 'Point', coordinates: [w.lng, w.lat] },
        properties: {
          id: w.id,
          name: w.name,
          icon: w.icon,
          arch: ',' + w.architects.join(',') + ',',
          ...(w.year !== null && { year: w.year }),
        },
      })),
    });
  });

  // Points are small at world scale, so picking is magnetic: the nearest work within a
  // generous radius wins (larger for touch).
  const coarse = matchMedia('(pointer: coarse)');
  const workAt = (e: MapMouseEvent) => {
    const r = coarse.matches ? 24 : 14;
    const { x, y } = e.point;
    let best: { index: number; work: Work } | null = null;
    let bestD = Infinity;
    for (const f of map.queryRenderedFeatures([[x - r, y - r], [x + r, y + r]], { layers: WORK_LAYERS })) {
      const work = atlas.works[f.id as number];
      const p = map.project([work.lng, work.lat]);
      const d = Math.hypot(p.x - x, p.y - y) - (work.icon ? 3 : 0);
      if (d < bestD && d <= r) [best, bestD] = [{ index: f.id as number, work }, d];
    }
    return best;
  };

  map.on('mousemove', (e: MapMouseEvent) => {
    const hit = handlers.locked() ? null : workAt(e);
    const index = hit?.index ?? null;
    if (index !== hovered) {
      if (hovered !== null) map.setFeatureState({ source: 'works', id: hovered }, { hover: false });
      if (index !== null) map.setFeatureState({ source: 'works', id: index }, { hover: true });
      hovered = index;
    }
    map.getCanvas().style.cursor = hit ? 'pointer' : '';
    handlers.onHover(hit?.work ?? null, hit ? e.point : null);
  });
  map.getCanvas().addEventListener('mouseleave', () => handlers.onHover(null, null));
  map.on('click', (e: MapMouseEvent) => {
    if (handlers.locked()) return;
    const hit = workAt(e);
    if (hit) handlers.onClick(hit.work);
  });

  /** Keep the camera's focus clear of the panels floating over the map. */
  function padding(): Required<PaddingOptions> {
    const focused = document.body.classList.contains('focus');
    const dock = focused ? 0 : (document.querySelector<HTMLElement>('.dock')?.offsetHeight ?? 0);
    const bar = focused ? (document.getElementById('focusbar')?.offsetHeight ?? 0) : 0;
    const sheet = document.querySelector<HTMLElement>('.sheet:not([hidden])');
    const stack = document.querySelector<HTMLElement>('.stack')!.getBoundingClientRect();
    const wide = innerWidth > 760;
    return {
      top: wide ? 60 : stack.bottom + 16,
      bottom: wide || !sheet ? Math.max(dock, bar) + 30 : sheet.offsetHeight + 16,
      left: wide ? (focused ? 40 : stack.right + 30) : 24,
      right: (sheet && wide ? sheet.offsetWidth + 24 : 0) + (wide ? 60 : 24),
    };
  }

  function stopPathAnimation() {
    cancelAnimationFrame(pathAnimation);
    pathAnimation = 0;
  }

  return {
    map,
    ready,
    padding,

    setTheme(theme: Theme) {
      const style = buildStyle(theme);
      for (const layer of style.layers) {
        if (!('paint' in layer) || !layer.paint || !map.getLayer(layer.id)) continue;
        for (const [k, v] of Object.entries(layer.paint)) {
          if (k === 'line-opacity' && layer.id === 'path') continue; // set per career in drawPath
          map.setPaintProperty(layer.id, k as keyof AllPaintProperties, v);
        }
      }
      if (style.sky) map.setSky(style.sky);
    },

    /** Limit the drawn works to the given set. */
    setVisible(works: Work[]) {
      const ids = works.map((w) => atlas.index.get(w.id)!);
      const only: FilterSpecification = ['in', ['id'], ['literal', ids]];
      for (const [layer, base] of Object.entries(BASE_FILTERS)) {
        map.setFilter(layer, base ? (['all', base, only] as FilterSpecification) : only);
      }
    },

    setArchitect(id: string | null) {
      map.setGlobalStateProperty('architect', id ?? '');
    },

    /** Draw an architect's career as a geodesic line through their works, in order. */
    drawPath(works: Work[], animate: boolean) {
      stopPathAnimation();
      const stops = works.map((w) => [w.lng, w.lat] as [number, number]);
      const parts = stops.length > 1 ? geodesicPath(stops) : [];
      const total = parts.reduce((n, p) => n + p.length, 0);
      const source = map.getSource('path') as GeoJSONSource;
      // Long careers become a dense web; thin it out so the works stay legible.
      map.setPaintProperty('path', 'line-opacity', stops.length > 80 ? 0.4 : stops.length > 30 ? 0.65 : 0.9);

      // Reveal the first `count` points, pen-stroke style.
      const show = (count: number) => {
        const coordinates: [number, number][][] = [];
        let left = count;
        for (const part of parts) {
          if (left <= 1) break;
          coordinates.push(part.slice(0, left));
          left -= part.length;
        }
        source.setData({
          type: 'FeatureCollection',
          features: coordinates.length
            ? [{ type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates } }]
            : [],
        });
      };
      if (!animate || reducedMotion() || !total) return show(total);
      const duration = Math.min(5200, 1400 + stops.length * 22);
      const start = performance.now();
      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        show(Math.ceil(total * (1 - (1 - t) ** 3)));
        if (t < 1) pathAnimation = requestAnimationFrame(frame);
      };
      pathAnimation = requestAnimationFrame(frame);
    },

    select(work: Work | null) {
      (map.getSource('selected') as GeoJSONSource | undefined)?.setData({
        type: 'FeatureCollection',
        features: work
          ? [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [work.lng, work.lat] } }]
          : [],
      });
    },

    fitWorks(all: Work[]) {
      if (!all.length) return;
      // Frame the core of the career: drop the furthest ~15% (a lone chapel in Chile
      // shouldn't zoom Gaudí out to the whole globe).
      const [cLng, cLat] = sphericalCentroid(all);
      const works =
        all.length < 8
          ? all
          : [...all]
              .sort((a, b) => distanceKm([cLng, cLat], [a.lng, a.lat]) - distanceKm([cLng, cLat], [b.lng, b.lat]))
              .slice(0, Math.ceil(all.length * 0.85));
      // Fit on unwrapped longitudes so a career spanning the Pacific frames correctly.
      const lngs = works.map((w) => w.lng).sort((a, b) => a - b);
      let gap = 360 - (lngs.at(-1)! - lngs[0]);
      let west = lngs[0];
      let east = lngs.at(-1)!;
      for (let i = 1; i < lngs.length; i++) {
        if (lngs[i] - lngs[i - 1] > gap) {
          gap = lngs[i] - lngs[i - 1];
          west = lngs[i];
          east = lngs[i - 1] + 360;
        }
      }
      const lats = works.map((w) => w.lat);
      if (east - west > 110 || Math.max(...lats) - Math.min(...lats) > 70) {
        // Bounds don't frame a globe well; face the career's centre of mass instead.
        const [lng, lat] = sphericalCentroid(works);
        map.flyTo({
          center: [lng, lat],
          zoom: innerWidth > 760 ? 2.1 : 1.4,
          pitch: 0,
          bearing: 0,
          padding: padding(),
          duration: reducedMotion() ? 0 : 2400,
          essential: true,
        });
        return;
      }
      // fitBounds plans in the projection it starts from (the globe) but lands on
      // the flat map, so fit in Web Mercator ourselves.
      const merc = (lat: number) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2;
      const unmerc = (y: number) => (360 / Math.PI) * Math.atan(Math.exp((1 - 2 * y) * Math.PI)) - 90;
      const [n, sth] = [merc(Math.max(...lats)), merc(Math.min(...lats))];
      const pad = padding();
      const w = innerWidth - pad.left - pad.right;
      const h = innerHeight - pad.top - pad.bottom;
      const zoom = Math.min(13, Math.log2(Math.min(w / (((east - west) / 360) * 512), h / ((sth - n) * 512))) - 0.15);
      map.flyTo({
        center: [(west + east) / 2, unmerc((n + sth) / 2)],
        zoom: Number.isFinite(zoom) ? zoom : 13,
        padding: pad,
        pitch: 0,
        bearing: 0,
        duration: reducedMotion() ? 0 : 2400,
        essential: true,
      });
    },

    overview() {
      map.flyTo({ center: [-40, 28], zoom: 1.6, pitch: 0, bearing: 0, duration: reducedMotion() ? 0 : 2000, essential: true });
    },
  };
}

export type AtlasMap = ReturnType<typeof createMap>;
