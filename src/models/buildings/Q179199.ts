// Guggenheim Museum Bilbao (Frank Gehry, 1997). On the south bank of the Nervión: round-
// shouldered galleries clad in titanium, like hulls, gather round the atrium's "flower" of
// curved metal petals and its glass roof; rectilinear blocks of limestone with punched
// windows face the city; the longest gallery runs east under the La Salve bridge to the
// tower that clasps it. The river (north) is -z.
import { type Kit, type ModelInfo, type P3 } from '../kit';

const N = 40;

/**
 * A hull: a rounded plan (superellipse rx × rz, turned) whose walls swell out and then
 * curl in to a gently domed roof. Stations are [height, scale] up the wall.
 */
function hull(k: Kit, cx: number, cz: number, rx: number, rz: number, h: number, turn = 0, lean: [number, number] = [0, 0]) {
  const plan = (s: number, dy: number): P3[] =>
    Array.from({ length: N }, (_, i) => {
      const a = (i / N) * Math.PI * 2;
      const c = Math.cos(a);
      const sn = Math.sin(a);
      // Superellipse: squarer than an ellipse, rounder than a box.
      const x = Math.sign(c) * Math.abs(c) ** 0.6 * rx * s;
      const z = Math.sign(sn) * Math.abs(sn) ** 0.6 * rz * s;
      const t = dy / h;
      return [cx + x * Math.cos(turn) - z * Math.sin(turn) + lean[0] * t, dy, cz + x * Math.sin(turn) + z * Math.cos(turn) + lean[1] * t];
    });
  // Walls that swell a little, a crisp shoulder, then a nearly flat roof.
  const rings = [plan(1, 0), plan(1.05, h * 0.4), plan(1.06, h * 0.78), plan(1.03, h * 0.95), plan(0.97, h), plan(0.6, h * 1.015), plan(0.05, h * 1.025)];
  k.loft(rings);
}

/** A petal: a curved sheet of metal on an arc round the atrium, twisting and opening as it rises. */
function petal(k: Kit, a0: number, a1: number, r0: number, h: number, twist: number, flare: number) {
  const rings: P3[][] = [];
  const M = 12;
  for (let j = 0; j <= 8; j++) {
    const t = j / 8;
    const y = t * h;
    const r = r0 + flare * t ** 1.6;
    const da = twist * t;
    const outer: P3[] = [];
    const inner: P3[] = [];
    for (let i = 0; i <= M; i++) {
      const a = a0 + da + ((a1 - a0) * i) / M;
      // The sheet bows outward in the middle of the petal.
      const bow = Math.sin((i / M) * Math.PI) * 2.4 * (0.4 + t);
      outer.push([Math.cos(a) * (r + bow + 0.5), y, Math.sin(a) * (r + bow + 0.5) - 8]);
      inner.push([Math.cos(a) * (r + bow), y, Math.sin(a) * (r + bow) - 8]);
    }
    rings.push([...outer, ...inner.reverse()]);
  }
  k.loft(rings);
}

/** A limestone block with its punched windows on the street faces. */
function stone(k: Kit, x0: number, x1: number, z0: number, z1: number, h: number) {
  k.box((x0 + x1) / 2, 0, (z0 + z1) / 2, x1 - x0, h, z1 - z0);
  for (let y = 3; y < h - 1.5; y += 3.4) {
    for (let x = x0 + 2; x < x1 - 1; x += 3) k.box(x, y, z1 + 0.02, 1.1, 1.5, 0.12);
    for (let z = z0 + 2; z < z1 - 1; z += 3) k.box(x0 - 0.02, y, z, 0.12, 1.5, 1.1);
  }
}

function build(k: Kit) {
  // ——— Limestone to the south and west, facing the city ———
  stone(k, -52, -24, 8, 34, 16);
  stone(k, -24, -4, 16, 30, 12);
  stone(k, -10, 2, 6, 16, 26); // the tall block by the entrance
  stone(k, -64, -52, -14, 10, 20);

  // ——— Titanium: the hull-shaped galleries round the atrium ———
  hull(k, -40, -14, 22, 9, 15, -0.08);
  hull(k, -18, -24, 13, 9, 22, 0.3, [-3, -2]);
  hull(k, 14, -22, 14, 10, 24, -0.4, [2, -3]);
  hull(k, 16, 4, 11, 10, 20, 0.5, [3, 1]);
  hull(k, -22, 0, 10, 8, 18, -0.3);
  // The long gallery east, under the bridge: the "fish", 130 m long.
  hull(k, 54, -10, 40, 13, 18, 0.03, [0, -1]);

  // ——— The atrium: petals of metal round its glass roof ———
  // Irregular on purpose: each petal its own height, twist and lean.
  petal(k, -0.3, 1.0, 7, 52, 0.7, 12);
  petal(k, 0.9, 2.0, 8.5, 31, -0.4, 9);
  petal(k, 1.9, 3.2, 7, 44, 0.9, 14);
  petal(k, 3.0, 3.9, 9, 27, -0.6, 7);
  petal(k, 3.8, 5.1, 7.5, 39, 0.5, 13);
  petal(k, 5.0, 6.2, 8, 35, -0.8, 10);
  // The glass roof over the atrium, a low dome between the petals.
  k.lathe([[8, 28], [6, 31], [3, 32.5], [0.01, 33]], 0, -8, 32);
  k.cyl(0, 0, -8, 8.4, 28, 32);

  // ——— La Salve bridge over the long gallery, and the tower that clasps it ———
  k.box(78, 25, -10, 14, 1.4, 64);
  for (const z of [-36, 16]) k.box(78, 0, z, 6, 25, 4);
  k.box(96, 0, -4, 8, 34, 7);
  k.box(96, 30, -4, 4, 10, 4);

  // ——— The water: the pool along the river front, and the quay ———
  k.box(10, -0.2, -40, 110, 0.2, 10);
  k.box(10, 0, -46, 120, 1.4, 2.5);
}

export default { title: 'Guggenheim Museum Bilbao', build } satisfies ModelInfo;
