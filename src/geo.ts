type LngLat = [number, number];

const rad = Math.PI / 180;

/** Great-circle distance in km. */
export function distanceKm(a: LngLat, b: LngLat): number {
  const [l1, p1] = [a[0] * rad, a[1] * rad];
  const [l2, p2] = [b[0] * rad, b[1] * rad];
  const h = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin((l2 - l1) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Points along the great circle between a and b (spherical interpolation). */
function arc(a: LngLat, b: LngLat): LngLat[] {
  const d = distanceKm(a, b) / 6371;
  if (d < 1e-6) return [a];
  const steps = Math.min(96, Math.max(1, Math.ceil(d / (1.5 * rad))));
  const toV = ([lng, lat]: LngLat) => [
    Math.cos(lat * rad) * Math.cos(lng * rad),
    Math.cos(lat * rad) * Math.sin(lng * rad),
    Math.sin(lat * rad),
  ];
  const [va, vb] = [toV(a), toV(b)];
  const out: LngLat[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const ka = Math.sin((1 - t) * d) / Math.sin(d);
    const kb = Math.sin(t * d) / Math.sin(d);
    const [x, y, z] = [0, 1, 2].map((k) => ka * va[k] + kb * vb[k]);
    out.push([Math.atan2(y, x) / rad, Math.atan2(z, Math.hypot(x, y)) / rad]);
  }
  return out;
}

/**
 * Geodesic polyline through the stops, in order, split into parts wherever it crosses
 * the antimeridian or passes over a pole (both render as stray lines on the globe).
 */
export function geodesicPath(stops: LngLat[]): LngLat[][] {
  const pts: LngLat[] = [];
  for (let i = 0; i < stops.length - 1; i++) pts.push(...arc(stops[i], stops[i + 1]));
  if (stops.length) pts.push(stops.at(-1)!);
  const parts: LngLat[][] = [[]];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const prev = pts[i - 1];
    // Web Mercator stops at ~85°; polar stretches of an arc would render as stray lines.
    if (Math.abs(p[1]) > 84) {
      if (parts.at(-1)!.length) parts.push([]);
      continue;
    }
    if (prev && Math.abs(prev[1]) > 84) {
      parts.at(-1)!.push(p);
      continue;
    }
    if (prev && Math.abs(p[0] - prev[0]) > 180) {
      // Interpolate the latitude where the segment meets ±180°.
      const edge = prev[0] > 0 ? 180 : -180;
      const span = 360 - Math.abs(p[0] - prev[0]);
      const t = (edge - prev[0]) * Math.sign(edge) / span;
      const lat = prev[1] + (p[1] - prev[1]) * Math.abs(t);
      parts.at(-1)!.push([edge, lat]);
      parts.push([[-edge, lat]]);
    }
    parts.at(-1)!.push(p);
  }
  return parts.filter((part) => part.length > 1);
}

export function pathLengthKm(stops: LngLat[]): number {
  let km = 0;
  for (let i = 1; i < stops.length; i++) km += distanceKm(stops[i - 1], stops[i]);
  return km;
}

/** Mean position on the sphere, so works on both sides of the antimeridian average sensibly. */
export function sphericalCentroid(points: { lng: number; lat: number }[]): LngLat {
  let [x, y, z] = [0, 0, 0];
  for (const { lng, lat } of points) {
    x += Math.cos(lat * rad) * Math.cos(lng * rad);
    y += Math.cos(lat * rad) * Math.sin(lng * rad);
    z += Math.sin(lat * rad);
  }
  return [Math.atan2(y, x) / rad, Math.atan2(z, Math.hypot(x, y)) / rad];
}
