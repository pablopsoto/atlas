// Casa Milà, "La Pedrera", Barcelona (Antoni Gaudí, 1906–12). A corner block that turns from
// Passeig de Gràcia round the chamfer into Carrer de Provença in one continuous wave of
// stone: each floor's edge a band that swells and recedes, deep windows between, their iron
// balconies like tangled seaweed. Massive stone piers carry the ground floor. Above, the
// attic's undulating crest, and on the roof the "warriors" — chimneys in helmets — and the
// spiralling stair exits round the two light wells. Passeig de Gràcia faces +z.
import { type Kit, type ModelInfo, type P2, type P3 } from '../kit';

const GROUND = 4.6;
const FLOOR = 3.3;
const FLOORS = 6;
const EAVE = GROUND + FLOOR * FLOORS; // 24.4
const DEPTH = 19;

/** The façade line: along Passeig de Gràcia, round the chamfer, down Provença. */
function facade(n = 120): { p: P2; t: P2; s: number }[] {
  const pts: P2[] = [];
  const R = 15;
  for (let i = 0; i <= 30; i++) pts.push([-44 + (i / 30) * 32, 0]);
  for (let i = 1; i <= 30; i++) {
    const a = (i / 30) * (Math.PI / 2);
    pts.push([-12 + Math.sin(a) * R, -R + Math.cos(a) * R]);
  }
  for (let i = 1; i <= 30; i++) pts.push([3, -15 - (i / 30) * 30]);
  // Resample evenly by length.
  const len: number[] = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = len[len.length - 1];
  const out: { p: P2; t: P2; s: number }[] = [];
  for (let k = 0; k <= n; k++) {
    const s = (k / n) * total;
    let i = 1;
    while (i < len.length - 1 && len[i] < s) i++;
    const f = (s - len[i - 1]) / (len[i] - len[i - 1] || 1);
    const p: P2 = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f];
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    out.push({ p, t: [(pts[i][0] - pts[i - 1][0]) / l, (pts[i][1] - pts[i - 1][1]) / l], s });
  }
  return out;
}

/** How far the stone swells out at a point along the façade, on a given floor. */
const swell = (s: number, f: number) => 0.55 + 0.45 * Math.sin(s / 5.5 + f * 0.9) + 0.25 * Math.sin(s / 2.3 - f * 1.3);

function build(k: Kit) {
  const line = facade();
  const out = (q: { p: P2; t: P2 }, d: number): P2 => [q.p[0] - q.t[1] * d, q.p[1] + q.t[0] * d]; // outward, to the street

  // ——— The block behind the façade, with its two light wells ———
  const back = line.map((q) => out(q, -DEPTH));
  const front = line.map((q) => out(q, -0.6));
  k.prism([...front, ...back.reverse()], 0, EAVE);

  // ——— Ground floor: massive stone piers, the shop fronts set back between them ———
  for (let i = 4; i < line.length - 2; i += 9) {
    const [x, z] = out(line[i], 0.4);
    k.cyl(x, 0, z, 1.0 + 0.3 * Math.sin(i), GROUND, 12, 1.35);
  }

  // ——— Each floor's edge: a band of stone swelling and receding along the façade ———
  for (let f = 0; f <= FLOORS; f++) {
    const y = GROUND + f * FLOOR - 0.5;
    const rings: P3[][] = line.map((q) => {
      const d = swell(q.s, f) * 1.3;
      const a = out(q, -0.4);
      const b = out(q, d);
      // The band rises and falls as well as swelling out: it sags between the windows.
      const yy = y + 0.45 * Math.sin(q.s / 3.6 + f * 1.7) + 0.2 * Math.sin(q.s / 1.7);
      const lip = 1.15 + 0.3 * Math.sin(q.s / 3.1 + f);
      return [
        [a[0], yy - 0.2, a[1]],
        [b[0], yy + 0.1, b[1]],
        [b[0], yy + lip, b[1]],
        [a[0], yy + lip + 0.4, a[1]],
      ];
    });
    k.loft(rings.map((r) => r.slice()), true);
  }

  // ——— Windows: deep openings, every few metres, some wider, with seaweed balconies ———
  for (let f = 0; f < FLOORS; f++) {
    const y = GROUND + f * FLOOR + 0.6;
    for (let i = 2; i < line.length - 2; i += 4) {
      const q = line[i];
      const w = 1.3 + ((i * 7 + f * 3) % 5) * 0.18;
      const [x, z] = out(q, -0.55);
      const ang = -Math.atan2(q.t[1], q.t[0]);
      k.box(x, y, z, w, 2.0, 0.12, ang); // the dark of the opening
      // Its reveal: jambs and a head standing out from the wall, so the opening holds shadow.
      for (const side of [-1, 1]) {
        const [jx, jz] = out({ p: [q.p[0] + q.t[0] * side * (w / 2 + 0.15), q.p[1] + q.t[1] * side * (w / 2 + 0.15)], t: q.t }, -0.2);
        k.box(jx, y - 0.1, jz, 0.3, 2.3, 0.75, ang);
      }
      const [hx, hz] = out(q, -0.2);
      k.box(hx, y + 2.0, hz, w + 0.6, 0.35, 0.75, ang);
      // Iron balconies on some windows: a tangle of bars before the opening.
      if ((i + f * 2) % 3 === 0) {
        const d = swell(q.s, f) + 0.1;
        const pts: P3[] = Array.from({ length: 9 }, (_, j) => {
          const t = j / 8;
          const [px, pz] = out({ p: [q.p[0] + q.t[0] * (t - 0.5) * (w + 0.8), q.p[1] + q.t[1] * (t - 0.5) * (w + 0.8)], t: q.t }, d);
          return [px, y - 0.4 + 0.7 + Math.sin(t * 9 + f) * 0.25, pz];
        });
        k.tube(pts, 0.05, 24, 4);
        k.tube(pts.map(([px, py, pz]) => [px, py - 0.35 + Math.cos(px) * 0.1, pz] as P3), 0.05, 24, 4);
      }
    }
  }

  // ——— The attic: its crest rising and falling, highest over the chamfer ———
  const crest = line.map((q) => {
    const corner = Math.exp(-(((q.s - 40) / 14) ** 2));
    return EAVE + 2.2 + 1.3 * Math.sin(q.s / 6.2) + 0.5 * Math.sin(q.s / 2.1) + 2.6 * corner;
  });
  const attic: P3[][] = line.map((q, i) => {
    const a = out(q, -6);
    const b = out(q, swell(q.s, FLOORS) * 0.7);
    return [
      [a[0], EAVE, a[1]],
      [b[0], EAVE, b[1]],
      [b[0] * 0.98 + a[0] * 0.02, crest[i], b[1] * 0.98 + a[1] * 0.02],
      [a[0], crest[i] - 0.8, a[1]],
    ];
  });
  k.loft(attic, true);
  // The roof terrace behind the crest.
  k.prism([...line.map((q) => out(q, -5.5)), ...line.map((q) => out(q, -DEPTH)).reverse()], EAVE, 1.6);

  // ——— On the roof: warriors and the stair exits ———
  const roof = EAVE + 1.6;
  const warrior = (x: number, z: number, h: number) => {
    const prof: P2[] = [[0.55, 0], [0.42, h * 0.55], [0.36, h * 0.72], [0.62, h * 0.78], [0.58, h * 0.9], [0.3, h * 0.97], [0.01, h * 1.12]];
    k.lathe(prof.map(([r, y]): P2 => [r, roof + y]), x, z, 8);
  };
  const groups: [number, number][] = [[-30, -8], [-16, -10], [-6, -22], [-4, -34]];
  for (const [gx, gz] of groups) for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    warrior(gx + Math.cos(a) * 1.1, gz + Math.sin(a) * 1.1, 3.4 + (i % 2) * 0.6);
  }
  // Stair exits: spiralling cones with a ridge winding round them.
  for (const [x, z, h] of [[-22, -9, 6.5], [-8, -16, 7.5], [-14, -26, 5.5]] as [number, number, number][]) {
    k.lathe(([[2.2, 0], [1.8, h * 0.5], [1.1, h * 0.85], [0.6, h], [0.01, h * 1.05]] as P2[]).map(([r, y]): P2 => [r, roof + y]), x, z, 24);
    const ridge: P3[] = Array.from({ length: 40 }, (_, i) => {
      const t = i / 39;
      const r = 2.25 - t * 1.6;
      const a = t * Math.PI * 4;
      return [x + Math.cos(a) * r, roof + t * h * 0.95, z + Math.sin(a) * r];
    });
    k.tube(ridge, 0.14, 60, 5);
  }
}

export default { title: 'Casa Milà', build } satisfies ModelInfo;
