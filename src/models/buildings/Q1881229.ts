// MAXXI, National Museum of 21st Century Arts, Rome (Zaha Hadid, 2010). Long bands of
// fair-faced concrete that run side by side, bend, cross and stack, their roofs combed with
// skylight fins. On the piazza: a long band lifted over the glazed lobby on slender steel
// columns, with a ribbon window along it; a tall curved wall where the bands turn; and above,
// the topmost gallery thrust out over the piazza on a sloping underside, ending in a great
// window. The piazza is +z.
import { type Kit, type ModelInfo, type P2 } from '../kit';

/** Offset a path to both sides: the outline of a band of width w. */
function outline(path: P2[], w: number): P2[] {
  const left: P2[] = [];
  const right: P2[] = [];
  for (let i = 0; i < path.length; i++) {
    const a = path[Math.max(0, i - 1)];
    const b = path[Math.min(path.length - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const nx = -(b[1] - a[1]) / l;
    const nz = (b[0] - a[0]) / l;
    left.push([path[i][0] + nx * (w / 2), path[i][1] + nz * (w / 2)]);
    right.push([path[i][0] - nx * (w / 2), path[i][1] - nz * (w / 2)]);
  }
  return [...left, ...right.reverse()];
}

/** A smooth path through points (Catmull-Rom), n samples per segment. */
function curve(pts: P2[], n = 8): P2[] {
  const out: P2[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** A band with skylight fins combed across its roof. */
function band(k: Kit, pts: P2[], w: number, y: number, h: number, fins = true) {
  const path = curve(pts);
  k.prism(outline(path, w), y, h);
  if (!fins) return;
  for (let i = 1; i < path.length - 1; i += 1) {
    const [a, b] = [path[i - 1], path[i + 1]];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const nx = -(b[1] - a[1]) / l;
    const nz = (b[0] - a[0]) / l;
    const m = path[i];
    k.bar([m[0] - nx * (w / 2 - 0.8), m[1] - nz * (w / 2 - 0.8)], [m[0] + nx * (w / 2 - 0.8), m[1] + nz * (w / 2 - 0.8)], y + h, 0.45, 0.14);
  }
}

function build(k: Kit) {
  // ——— The galleries behind, running side by side and bending to the north-east ———
  band(k, [[-92, -34], [-50, -32], [-12, -26], [12, -40], [28, -66]], 13, 0, 13);
  band(k, [[-90, -18], [-48, -16], [-14, -12], [6, -22], [16, -48]], 12, 0, 9);

  // ——— On the piazza: the long band lifted over the lobby, its ribbon window ———
  const F0 = 6.6;
  const F1 = 14;
  band(k, [[-74, 3], [-40, 3.5], [-14, 4]], 15, F0, F1 - F0);
  k.glazing([-73, 10.9], [-15, 11.4], F0 + 1.6, 4.2, 2.6, { bar: 0.1, inset: 0.35 });
  // The lobby under it: glass set well back, and the slender columns.
  k.glazing([-72, 7], [-14, 7.5], 0, F0, 2.4, { bar: 0.12, inset: 0 });
  for (let i = 0; i < 7; i++) k.cyl(-24 + i * 1.6, 0, 10.2 + (i % 2) * 0.6, 0.16, F0, 10);
  for (const x of [-60, -48, -36]) k.cyl(x, 0, 9.6, 0.25, F0, 10);

  // ——— The tall curved wall where the bands turn ———
  band(k, [[-16, 4], [-5, 3], [5, -2.5], [11, -13], [13, -28]], 9, 0, 21);

  // ——— The top gallery: out over the piazza, on a sloping underside ———
  const G0 = 15;
  const G1 = 21.5;
  band(k, [[-4, -4], [10, 4], [22, 11], [33, 16]], 11, G0, G1 - G0);
  // The underside: a wedge that slopes from the curved wall up to the gallery's end.
  const tip: P2 = [33, 16];
  const root: P2 = [12, 5];
  const len = Math.hypot(tip[0] - root[0], tip[1] - root[1]);
  const ang = Math.atan2(tip[1] - root[1], tip[0] - root[0]);
  k.fin([[0, G0 - 5], [0, G0], [len, G0], [len, G0 - 0.6]], 10.6, ang, root);
  // The great window at its end.
  k.box(tip[0] + Math.cos(ang) * 0.3, G0 + 0.6, tip[1] + Math.sin(ang) * 0.3, 0.3, G1 - G0 - 1.2, 9.4, -ang);

  // ——— The old barracks kept on the site, and the piazza ———
  k.box(46, 0, -8, 18, 10, 30);
  k.box(-20, -0.3, -10, 150, 0.3, 74);
}

export default { title: 'MAXXI', build } satisfies ModelInfo;
