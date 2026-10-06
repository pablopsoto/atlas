import type { ExpressionSpecification, FilterSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl';

export type Theme = 'light' | 'dark';

export interface Palette {
  paper: string;
  water: string;
  park: string;
  building: string;
  buildingEdge: string;
  extrusion: string;
  roadMinor: string;
  roadMajor: string;
  motorway: string;
  rail: string;
  boundary: string;
  label: string;
  ink: string;
  inkFaint: string;
  /** The building in focus, drawn solid among ghosted neighbours. */
  solid: string;
}

export const PALETTES: Record<Theme, Palette> = {
  light: {
    paper: '#f3f2ee',
    water: '#e2e1dc',
    park: '#efeee9',
    building: '#e8e6e0',
    buildingEdge: '#d4d2cb',
    extrusion: '#e6e4de',
    roadMinor: '#e3e1db',
    roadMajor: '#d6d4cd',
    motorway: '#cac7bf',
    rail: '#d0cec7',
    boundary: '#b7b4ac',
    label: '#8e8b84',
    ink: '#121211',
    inkFaint: 'rgba(18,18,17,0.16)',
    solid: '#9d9a92',
  },
  dark: {
    paper: '#0f0f0e',
    water: '#181817',
    park: '#121211',
    building: '#1b1b1a',
    buildingEdge: '#262624',
    extrusion: '#222220',
    roadMinor: '#1d1d1b',
    roadMajor: '#272725',
    motorway: '#31312e',
    rail: '#2a2a28',
    boundary: '#3d3c39',
    label: '#6f6d68',
    ink: '#efeee9',
    inkFaint: 'rgba(239,238,233,0.16)',
    solid: '#8d8b85',
  },
};

const FONT = ['Noto Sans Regular'];
const zoomInterp = (...stops: number[]): ExpressionSpecification =>
  ['interpolate', ['exponential', 1.6], ['zoom'], ...stops] as ExpressionSpecification;

const isLine: ExpressionSpecification = ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false];
const isPoly: ExpressionSpecification = ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false];

/** Base cartography: paper, water, hairline roads, faint labels. */
function baseLayers(p: Palette): LayerSpecification[] {
  return [
    { id: 'background', type: 'background', paint: { 'background-color': p.paper } },
    {
      id: 'park',
      type: 'fill',
      source: 'omt',
      'source-layer': 'park',
      filter: isPoly,
      paint: { 'fill-color': p.park },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'omt',
      'source-layer': 'water',
      filter: ['all', isPoly, ['!=', ['get', 'brunnel'], 'tunnel']],
      paint: { 'fill-color': p.water },
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'omt',
      'source-layer': 'waterway',
      minzoom: 8,
      filter: isLine,
      paint: { 'line-color': p.water, 'line-width': zoomInterp(8, 0.5, 16, 3) },
    },
    {
      id: 'building',
      type: 'fill',
      source: 'omt',
      'source-layer': 'building',
      minzoom: 13,
      maxzoom: 15,
      paint: { 'fill-color': p.building, 'fill-outline-color': p.buildingEdge },
    },
    {
      id: 'road-minor',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      minzoom: 12,
      filter: ['all', isLine, ['match', ['get', 'class'], ['minor', 'service', 'track'], true, false]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': p.roadMinor, 'line-width': zoomInterp(12, 0.4, 18, 8) },
    },
    {
      id: 'road-major',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      minzoom: 6,
      filter: ['all', isLine, ['match', ['get', 'class'], ['primary', 'secondary', 'tertiary', 'trunk'], true, false]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': p.roadMajor, 'line-width': zoomInterp(6, 0.3, 18, 12) },
    },
    {
      id: 'road-motorway',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      minzoom: 4,
      filter: ['all', isLine, ['==', ['get', 'class'], 'motorway']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': p.motorway, 'line-width': zoomInterp(4, 0.3, 18, 14) },
    },
    {
      id: 'rail',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      minzoom: 10,
      filter: ['all', isLine, ['==', ['get', 'class'], 'rail']],
      paint: { 'line-color': p.rail, 'line-width': 0.6, 'line-dasharray': [4, 3] },
    },
    {
      id: 'building-3d',
      type: 'fill-extrusion',
      source: 'omt',
      'source-layer': 'building',
      minzoom: 14.5,
      filter: ['!=', ['get', 'hide_3d'], true],
      paint: {
        'fill-extrusion-color': p.extrusion,
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 14.5, 0, 15.5, 0.92],
        'fill-extrusion-opacity-transition': { duration: 700 },
        'fill-extrusion-vertical-gradient': true,
      },
    },
    {
      id: 'focus-building',
      type: 'fill-extrusion',
      source: 'focus',
      paint: {
        'fill-extrusion-color': p.solid,
        'fill-extrusion-height': ['+', ['coalesce', ['get', 'render_height'], 10], 0.3],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 1,
        'fill-extrusion-vertical-gradient': true,
      },
    },
    {
      id: 'focus-outline',
      type: 'line',
      source: 'focus',
      paint: { 'line-color': p.ink, 'line-width': 1.2 },
    },
    {
      id: 'boundary-country',
      type: 'line',
      source: 'omt',
      'source-layer': 'boundary',
      filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]],
      paint: {
        'line-color': p.boundary,
        'line-width': zoomInterp(0, 0.4, 8, 1),
        'line-dasharray': [3, 2],
      },
    },
    {
      id: 'label-country',
      type: 'symbol',
      source: 'omt',
      'source-layer': 'place',
      minzoom: 2,
      maxzoom: 6,
      filter: ['all', ['==', ['get', 'class'], 'country'], ['<=', ['get', 'rank'], 2]],
      layout: {
        'text-field': ['upcase', ['coalesce', ['get', 'name:en'], ['get', 'name']]],
        'text-font': FONT,
        'text-size': 9,
        'text-letter-spacing': 0.3,
        'text-max-width': 8,
      },
      paint: { 'text-color': p.label, 'text-halo-color': p.paper, 'text-halo-width': 1.2 },
    },
    {
      id: 'label-city',
      type: 'symbol',
      source: 'omt',
      'source-layer': 'place',
      minzoom: 5,
      filter: ['match', ['get', 'class'], ['city', 'town'], true, false],
      layout: {
        'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
        'text-font': FONT,
        'text-size': zoomInterp(5, 9, 12, 12),
        'text-letter-spacing': 0.05,
      },
      paint: { 'text-color': p.label, 'text-halo-color': p.paper, 'text-halo-width': 1.4 },
    },
  ];
}

/** Masterworks are always labelled; with an architect selected, all of their works are. */
export const LABEL_FILTER: FilterSpecification = [
  'any',
  ['all', ['==', ['get', 'icon'], true], ['==', ['global-state', 'architect'], '']],
  ['all', ['>=', ['zoom'], 4], ['in', ['concat', ',', ['global-state', 'architect'], ','], ['get', 'arch']]],
];

/** ATLAS overlay: career path, works, masterwork rings, labels, selection. */
function overlayLayers(p: Palette): LayerSpecification[] {
  // Dim everything not belonging to the highlighted architect (if any).
  const emphasis: ExpressionSpecification = [
    'case',
    ['==', ['global-state', 'architect'], ''],
    1,
    ['in', ['concat', ',', ['global-state', 'architect'], ','], ['get', 'arch']],
    1,
    0.1,
  ];
  const hoverScale: ExpressionSpecification = ['case', ['boolean', ['feature-state', 'hover'], false], 1.7, 1];
  return [
    {
      id: 'path',
      type: 'line',
      source: 'path',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-width': zoomInterp(1, 0.8, 10, 1.4),
        'line-color': p.ink,
        'line-opacity': 0.9,
      },
    },
    {
      id: 'works-halo',
      type: 'circle',
      source: 'works',
      paint: {
        'circle-color': p.paper,
        'circle-radius': zoomInterp(1, 3.4, 6, 4.6, 12, 6.8, 17, 9),
        'circle-opacity': emphasis,
        'circle-pitch-alignment': 'map',
      },
    },
    {
      id: 'icons-ring',
      type: 'circle',
      source: 'works',
      filter: ['==', ['get', 'icon'], true],
      paint: {
        'circle-color': 'rgba(0,0,0,0)',
        'circle-radius': zoomInterp(1, 5, 6, 7, 12, 10, 17, 14),
        'circle-stroke-color': p.ink,
        'circle-stroke-width': 1,
        'circle-stroke-opacity': emphasis,
        'circle-pitch-alignment': 'map',
      },
    },
    {
      id: 'works',
      type: 'circle',
      source: 'works',
      paint: {
        'circle-color': p.ink,
        // zoom must be the top-level input, so the hover scale goes inside each stop.
        'circle-radius': [
          'interpolate',
          ['exponential', 1.6],
          ['zoom'],
          ...[1, 2.2, 6, 3, 12, 4.4, 17, 5.5].map((v, i) => (i % 2 ? ['*', hoverScale, v] : v)),
        ] as ExpressionSpecification,
        'circle-opacity': emphasis,
        'circle-pitch-alignment': 'map',
      },
    },
    {
      id: 'works-label',
      type: 'symbol',
      source: 'works',
      filter: LABEL_FILTER,
      layout: {
        'text-field': [
          'format',
          ['upcase', ['get', 'name']],
          { 'font-scale': 1 },
          ['case', ['has', 'year'], ['concat', '  ', ['to-string', ['get', 'year']]], ''],
          { 'font-scale': 0.9 },
        ],
        'text-font': FONT,
        'text-size': zoomInterp(2, 8.5, 12, 10.5),
        'text-letter-spacing': 0.12,
        'text-anchor': 'left',
        'text-offset': [1.3, 0],
        'text-max-width': 14,
        'text-optional': true,
        'symbol-sort-key': ['case', ['==', ['get', 'icon'], true], 0, 1],
      },
      paint: { 'text-color': p.ink, 'text-halo-color': p.paper, 'text-halo-width': 1.6 },
    },
    {
      id: 'selected',
      type: 'circle',
      source: 'selected',
      paint: {
        'circle-color': 'rgba(0,0,0,0)',
        'circle-radius': 16,
        'circle-stroke-color': p.ink,
        'circle-stroke-width': 1.5,
        'circle-pitch-alignment': 'map',
      },
    },
  ];
}

export function buildStyle(theme: Theme): StyleSpecification {
  const p = PALETTES[theme];
  const empty = { type: 'FeatureCollection' as const, features: [] };
  return {
    version: 8,
    projection: { type: ['interpolate', ['linear'], ['zoom'], 4, 'vertical-perspective', 6, 'mercator'] },
    sky: {
      'sky-color': p.paper,
      'horizon-color': p.paper,
      'fog-color': p.paper,
      'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.6, 6, 0],
    },
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    state: { architect: { default: '' } },
    sources: {
      omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' },
      works: { type: 'geojson', data: empty },
      path: { type: 'geojson', data: empty },
      selected: { type: 'geojson', data: empty },
      focus: { type: 'geojson', data: empty },
    },
    layers: [...baseLayers(p), ...overlayLayers(p)],
  };
}
