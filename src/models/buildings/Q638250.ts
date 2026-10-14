// Notre-Dame du Haut, Ronchamp (Le Corbusier, 1955). White rendered walls under a great dark
// roof like an upturned crab shell: it sags between the walls and sweeps up to a prow at the
// south-east corner, held a hand's breadth above the walls by a strip of light. The south
// wall is thick and battered, pierced by deep windows of every size; the east wall curves in
// to shelter the outdoor altar; three towers with rounded hoods catch light for the side
// chapels, the tallest at the south-west by the door. South is +z.
import { type Kit, type ModelInfo, type P2, type P3 } from '../kit';

const X0 = -12;
const X1 = 14;
const Z0 = -7;
const Z1 = 8.5;

/** The roof's underside at a plan point: low along the north and west, high at the south-east. */
function under(x: number, z: number) {
  const u = Math.min(1, Math.max(0, (x - X0) / (X1 - X0)));
  const v = Math.min(1, Math.max(0, (z - Z0) / (Z1 - Z0)));
  return 8.6 + 4.2 * u ** 2.2 + 1.6 * v ** 1.5 + 3.4 * (u * v) ** 3 - 1.1 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
}

/**
 * A wall along a path, its top following the roof less a strip of light; battered, thick at
 * the foot and thin at the top, in one continuous piece. `side` sets which way it thickens.
 */
function wall(k: Kit, path: P2[], foot: number, top: number, side = 1, gap = 0.35) {
  const rings: P3[][] = path.map((p, i) => {
    const a = path[Math.max(0, i - 1)];
    const b = path[Math.min(path.length - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const nx = (-(b[1] - a[1]) / l) * side;
    const nz = ((b[0] - a[0]) / l) * side;
    const h = under(p[0], p[1]) - gap;
    return [
      [p[0], 0, p[1]],
      [p[0] + nx * foot, 0, p[1] + nz * foot],
      [p[0] + nx * top, h, p[1] + nz * top],
      [p[0], h, p[1]],
    ];
  });
  k.loft(rings, true, false);
}

/** A tower: a half-cylinder of wall with a hood curling over towards the light. */
function tower(k: Kit, cx: number, cz: number, r: number, h: number, facing: number) {
  k.cyl(cx, 0, cz, r, h, 40);
  // The hood: a quarter sphere tipped towards `facing`, over a rounded top.
  k.sphere([cx, h, cz], r, 32, Math.PI / 2);
  const rings: P3[][] = [];
  for (let j = 0; j <= 6; j++) {
    const t = j / 6;
    const rr = r * (1 - t * 0.15);
    rings.push(Array.from({ length: 24 }, (_, i) => {
      const a = (i / 24) * Math.PI * 2;
      return [cx + Math.cos(a) * rr + Math.cos(facing) * t * r * 0.9, h + t * r * 0.9, cz + Math.sin(a) * rr + Math.sin(facing) * t * r * 0.9] as P3;
    }));
  }
  k.loft(rings);
}

function build(k: Kit) {

  // ——— Walls ———
  // South: long, thick and battered, bowing gently outwards.
  const south: P2[] = Array.from({ length: 25 }, (_, i) => {
    const t = i / 24;
    return [X0 + 1.5 + t * (X1 - X0 - 1.5), Z1 - 0.4 + Math.sin(t * Math.PI) * 0.9 - t * 0.6];
  });
  wall(k, south, 3.4, 1.2, -1);
  // The deep windows of the south wall, scattered: their reveals as sunken frames.
  const holes: [number, number, number, number][] = [
    [-7, 2.2, 0.8, 1.0], [-5.6, 4.6, 0.5, 0.7], [-4, 1.4, 1.2, 0.8], [-2.2, 3.4, 0.6, 1.4], [-0.4, 5.8, 0.4, 0.5],
    [1.2, 1.8, 0.9, 1.2], [2.8, 4.0, 1.4, 0.7], [4.6, 2.6, 0.5, 0.9], [6.0, 5.2, 0.8, 0.6], [7.6, 1.6, 1.1, 1.5],
    [9.2, 3.8, 0.6, 0.8], [10.6, 6.4, 0.4, 0.4], [-6.2, 6.6, 0.4, 0.5], [3.6, 7.0, 0.5, 0.5], [11.4, 2.4, 0.7, 1.0],
  ];
  for (const [x, y, w, h] of holes) {
    const t = (x - X0 - 1.5) / (X1 - X0 - 1.5);
    const z = Z1 - 0.4 + Math.sin(t * Math.PI) * 0.9 - t * 0.6;
    // A deep reveal reads as a frame of shadow on the white wall.
    const face = z + 3.4 * (1 - y / under(x, z)) + 0.02;
    k.box(x, y, face, w * 0.8, h * 0.8, 0.05);
  }
  // East: curving inwards under the roof's prow, sheltering the outdoor altar.
  const east: P2[] = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    return [X1 - 1.8 - Math.sin(t * Math.PI) * 2.2, Z1 - 1.0 - t * (Z1 - Z0 - 1.5)];
  });
  wall(k, east, 1.0, 0.7, 1);
  // North and west: plainer, the west bulging out in a long curve.
  wall(k, [[X1 - 1.8, Z0 + 0.5], [2, Z0 + 0.2], [-6, Z0 + 0.6], [X0 + 1.2, Z0 + 1.6]], 1.2, 0.8, 1);
  const west: P2[] = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    return [X0 + 1.2 - Math.sin(t * Math.PI) * 1.6, Z0 + 1.6 + t * (Z1 - Z0 - 2.0)];
  });
  wall(k, west, 1.0, 0.7, 1);

  // ——— The roof: a thick shell with an upturned rim ———
  k.surface((u, v) => {
    const x = X0 - 0.6 + u * (X1 - X0 + 2.4);
    const z = Z0 - 0.6 + v * (Z1 - Z0 + 2.2);
    // The top surface: the underside plus the shell's depth, which thickens at the rim.
    const rim = Math.max(Math.abs(2 * u - 1), Math.abs(2 * v - 1)) ** 6;
    return [x, under(Math.min(X1, x), Math.min(Z1, z)) + 1.2 + rim * 0.9, z];
  }, 40, 24, 1.6);

  // ——— Towers: the tall one by the south door, two smaller to the north ———
  tower(k, X0 + 0.6, Z1 - 1.2, 3.0, 20, Math.PI * 0.75);
  tower(k, -5, Z0 - 0.4, 2.2, 13.5, -Math.PI / 2);
  tower(k, -1, Z0 - 0.6, 2.2, 13.5, Math.PI * 0.15);

  // ——— The outdoor chapel on the east: altar, pulpit and the pilgrims' ground ———
  k.box(X1 + 1.6, 0, 0.5, 2.6, 1.0, 1.0);
  k.cyl(X1 + 0.8, 0, 4.4, 0.6, 2.4, 16);
  k.cyl(X1 - 1.2, 0, Z1 - 0.8, 0.5, under(X1 - 1.2, Z1 - 0.8) - 0.2, 12); // the column under the prow
}

export default { title: 'Notre Dame du Haut', build } satisfies ModelInfo;
