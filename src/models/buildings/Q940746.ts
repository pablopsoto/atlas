// Villa Savoye, Poissy (Le Corbusier, 1931). The five points in one box: pilotis, a free
// plan, a free façade, the ribbon window and a roof garden. Main floor about 19 × 21.5 m
// on a 4.75 m grid of slender round columns; the open terrace takes the north-east of the
// floor, and the solarium's curved screens stand on the roof.
import { circle, type Kit, type ModelInfo, type P2 } from '../kit';

const W = 19; // east–west
const D = 21.5; // north–south (north is -z)
const X = W / 2;
const Z = D / 2;
const SLAB = 3.0; // underside of the main floor
const FLOOR = SLAB + 0.35;
const SILL = 4.05;
const HEAD = 5.15;
const ROOF = 6.6;

function build(k: Kit) {
  // ——— Pilotis: the 4.75 m grid, with the box cantilevered 1 m past the end columns ———
  const xs = [-9.25, -4.75, 0, 4.75, 9.25];
  const zs = [-9.5, -4.75, 0, 4.75, 9.5];
  for (const x of xs) for (const z of zs) k.cyl(x, 0, z, 0.15, SLAB, 16);

  // ——— Ground floor: set back, its north end curved to the turning circle of a car ———
  const ground: P2[] = [[-6.5, 8.6], [6.5, 8.6], [6.5, -3.4], ...circle(6.5, 28, 0, -3.4, 0, -Math.PI), [-6.5, -3.4]];
  k.prism(ground, 0, 0.12); // the ground-floor slab
  k.wall([[-6.5, 8.6], [6.5, 8.6], [6.5, -3.4]], 0, SLAB, 0.25);
  k.wall([[-6.5, -3.4], [-6.5, 8.6]], 0, SLAB, 0.25);
  // The curved hall: glazed, with mullions following the arc.
  const arc = circle(6.5, 28, 0, -3.4, 0, -Math.PI);
  for (let i = 1; i < arc.length; i++) k.bar(arc[i - 1], arc[i], 0, SLAB, 0.04);
  for (const p of arc) k.box(p[0], 0, p[1], 0.08, SLAB, 0.08);

  // ——— The main floor: a box with the ribbon window wrapped around it ———
  k.box(0, SLAB, 0, W, FLOOR - SLAB, D);
  const sw: P2 = [-X, Z];
  const se: P2 = [X, Z];
  const ne: P2 = [X, -Z];
  const nw: P2 = [-X, -Z];
  const T = 0.25;
  // Parapet below the window and fascia above it, all the way round.
  k.wall([sw, se, ne, nw, sw], FLOOR, SILL - FLOOR, T);
  k.wall([sw, se, ne, nw, sw], HEAD, ROOF - 0.25 - HEAD, T);
  // Glazed lengths of the window band (inset from the face). The east façade is glazed only
  // over the rooms at its south end; beyond, the band opens onto the terrace.
  const band = (a: P2, b: P2) => k.glazing(a, b, SILL, HEAD - SILL, 1.15, { bar: 0.06, depth: 0.3, inset: 0.32 });
  band([-X + 0.5, Z], [X - 0.5, Z]); // south
  band([-X, -Z + 0.5], [-X, Z - 0.5]); // west
  band([X, Z - 0.5], [X, Z - 5.2]); // east, rooms
  band([-X + 0.5, -Z], [-0.5, -Z]); // north, rooms
  // Short piers in the open band, so the fascia reads as carried.
  for (const z of [Z - 5.2, 2, -2.6, -7.2, -Z + 0.3]) k.box(X - 0.12, SILL, z, T, HEAD - SILL, 0.25);
  for (const x of [0.2, 4.6, X - 0.3]) k.box(x, SILL, -Z + 0.12, 0.25, HEAD - SILL, T);

  // ——— Roof over the rooms; the terrace (north-east) is open to the sky ———
  const roof: P2[] = [[-X, -Z], [0.5, -Z], [0.5, 5.4], [X, 5.4], [X, Z], [-X, Z]];
  k.prism(roof, ROOF - 0.25, 0.25);
  // The terrace's own glass wall into the living room.
  k.glazing([0.5, 5.4], [X - T, 5.4], FLOOR, ROOF - 0.25 - FLOOR, 1.2, { bar: 0.07, inset: 0 });
  k.glazing([0.5, -Z + T], [0.5, 5.4], FLOOR, ROOF - 0.25 - FLOOR, 1.2, { bar: 0.07, inset: 0 });
  // The ramp climbs from the terrace to the roof garden.
  k.ramp([2.2, -6.5], [2.2, 3.8], FLOOR, ROOF, 1.4, 0.2);
  k.bar([1.45, -6.5], [1.45, 3.8], FLOOR, 1.0, 0.08);

  // ——— Solarium: the curved screens on the roof ———
  const top = ROOF;
  k.wall([[-X + 0.2, 3.6], [-3.4, 3.6]], top, 2.4, 0.18); // straight screen, with a window cut below
  k.wall([[-X + 0.2, 3.6], [-X + 0.2, Z - 0.2]], top, 1.1, 0.18);
  // The tall drum and the long S of the screen walls.
  const drum = circle(2.6, 24, -0.8, 3.6, Math.PI, Math.PI * 2);
  for (let i = 1; i < drum.length; i++) k.bar(drum[i - 1], drum[i], top, 3.1, 0.18);
  const s = circle(3.2, 24, 4.6, 6.8, Math.PI, Math.PI * 1.55);
  for (let i = 1; i < s.length; i++) k.bar(s[i - 1], s[i], top, 2.4, 0.18);
  k.wall([[-3.4, 3.6], [-3.4, 6.6]], top, 2.4, 0.18);
  // A window through the straight screen, as on the building.
  k.box(-6.3, top + 1.3, 3.6, 1.1, 0.06, 0.24);
  // Parapet round the roof garden.
  k.wall([[-X, Z], [X, Z], [X, 5.4]], top, 0.95, 0.12);
}

export default { title: 'Villa Savoye', build } satisfies ModelInfo;
