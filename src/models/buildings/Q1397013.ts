// Farnsworth House, Plano, Illinois (Mies van der Rohe, 1951). A glass room between two
// white slabs, 77 × 28 ft (23.5 × 8.5 m), held 5 ft 3 in (1.6 m) above the flood plain by
// eight steel columns welded to the slabs' edges; the open porch at the west end and a
// lower terrace, offset, with steps up to each.
import { type Kit, type ModelInfo } from '../kit';

const L = 23.5;
const D = 8.5;
const FLOOR = 1.6; // underside of the floor slab
const SLAB = 0.42;
const CEIL = 2.9;

function column(k: Kit, x: number, z: number, h: number) {
  // A wide-flange column: web and two flanges.
  k.box(x, 0, z, 0.21, h, 0.03);
  k.box(x - 0.1, 0, z, 0.02, h, 0.2);
  k.box(x + 0.1, 0, z, 0.02, h, 0.2);
}

function build(k: Kit) {
  const top = FLOOR + SLAB;
  const roof = top + CEIL;
  // The two slabs.
  k.box(0, FLOOR, 0, L, SLAB, D);
  k.box(0, roof, 0, L, SLAB, D);
  // Eight columns on the long faces, 22 ft (6.7 m) apart, the slabs cantilevered past.
  for (const x of [-10.05, -3.35, 3.35, 10.05]) for (const z of [-D / 2 - 0.12, D / 2 + 0.12]) column(k, x, z, roof + SLAB);

  // The glass room fills the eastern three bays; the western one is the open porch.
  const x0 = -5.6;
  const x1 = L / 2 - 0.25;
  const z0 = -D / 2 + 0.25;
  const z1 = D / 2 - 0.25;
  const g = { bar: 0.06, inset: 0, depth: 0.08 };
  k.glazing([x0, z1], [x1, z1], top, CEIL, 1.68, g);
  k.glazing([x1, z1], [x1, z0], top, CEIL, 1.7, g);
  k.glazing([x1, z0], [x0, z0], top, CEIL, 1.68, g);
  k.glazing([x0, z0], [x0, z1], top, CEIL, 1.6, g);
  // The core: kitchen, baths and the fireplace, in a wooden block short of the ceiling.
  k.box(3.2, top, -0.3, 7.4, 2.4, 3.6);
  k.box(-0.2, top, -0.3, 0.6, CEIL, 0.6); // the flue

  // The terrace, a step lower, offset to the south-west, on its own short columns.
  const T = 0.95;
  k.box(-6.2, T - 0.36, 3.7, 16.8, 0.36, 6.7);
  for (const x of [-13.9, -7.2, -0.5]) for (const z of [0.6, 7.0]) column(k, x, z, T - 0.36);
  // Steps: ground to terrace at its south-east corner, terrace up to the porch.
  k.stairs([1.6, 6.4], [-0.6, 6.4], 0, T - 0.02, 2.9, 5);
  k.stairs([-8.5, 2.9], [-8.5, D / 2 + 0.05], T, top - T, 3.4, 5);
}

export default { title: 'Farnsworth House', build } satisfies ModelInfo;
