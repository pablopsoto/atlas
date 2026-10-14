// Barcelona Pavilion (Mies van der Rohe, 1929; rebuilt 1986). A travertine podium about
// 53 × 17.5 m; the roof, a thin slab of about 24 × 14 m on eight cruciform chrome columns;
// free-standing walls of onyx, marble and glass that slide past one another. The large pool
// lies under the long travertine wall; the small one, with Kolbe's Morning, in the court at
// the west end.
import { rect, type Kit, type ModelInfo, type P2 } from '../kit';

const P = 1.1; // podium top
const H = 3.1; // floor to roof

function cruciform(k: Kit, x: number, z: number, y: number, h: number) {
  k.box(x, y, z, 0.32, h, 0.07);
  k.box(x, y, z, 0.07, h, 0.32);
}

function build(k: Kit) {
  // Podium, with the two pools cut into it.
  const bigPool = rect(21.5, 9.0, 12.8, 1.0);
  const smallPool = rect(6.8, 4.6, -21.3, -5.0);
  k.prism(rect(53, 17.5), 0, P - 0.35, []);
  k.prism(rect(53, 17.5), P - 0.35, 0.35, [bigPool, smallPool]);
  k.prism(bigPool, P - 0.35, 0.05);
  k.prism(smallPool, P - 0.35, 0.05);
  // Steps up on the south side, by the big pool.
  k.stairs([16, 11.8], [16, 8.75], 0, P, 7);

  // The long travertine wall behind the big pool, with its bench.
  k.bar([0.6, -4.4], [26.3, -4.4], P, H, 0.3);
  k.box(13, P, -3.95, 9, 0.45, 0.6);
  // The office at the east end, under its own small roof.
  k.wall([[21.5, -4.4], [21.5, -8.6], [26.3, -8.6], [26.3, -4.4]], P, H, 0.25);
  k.prism([[19.8, -9.0], [26.5, -9.0], [26.5, -3.7], [19.8, -3.7]], P + H, 0.3);

  // The main roof and its eight columns.
  k.prism([[-13.2, -7.2], [11.2, -7.2], [11.2, 7.0], [-13.2, 7.0]], P + H, 0.35);
  for (const x of [-9.3, -2.8, 3.7]) for (const z of [-3.4, 3.3]) cruciform(k, x, z, P, H);
  for (const z of [-3.4, 3.3]) cruciform(k, 9.4, z, P, H);
  // Free-standing walls under it: the onyx wall, the green marble, and glass between.
  k.bar([-6.6, 0.6], [-0.6, 0.6], P, H, 0.3); // onyx
  k.bar([-13, 6.3], [-4.6, 6.3], P, H, 0.25); // green marble, south
  k.bar([-12.9, -6.6], [-12.9, 6.3], P, H, 0.25); // west wall of the hall
  k.glazing([-12.6, -6.7], [-3.6, -6.7], P, H, 1.6, { bar: 0.05, inset: 0 });
  k.glazing([-0.4, -6.0], [-0.4, -1.6], P, H, 1.5, { bar: 0.05, inset: 0 });
  k.glazing([3.6, -3.2], [10.6, -3.2], P, H, 1.75, { bar: 0.05, inset: 0 });

  // The court at the west end: walls round the small pool and the statue.
  const court: P2[] = [[-13.4, -8.6], [-26.3, -8.6], [-26.3, 0.6], [-19.6, 0.6]];
  k.wall(court, P, H, 0.3);
  k.bar([-13.4, -8.6], [-13.4, -6.0], P, H, 0.3);
  // Georg Kolbe's Morning, on its plinth in the pool.
  k.box(-21.6, P - 0.3, -7.2, 0.7, 0.9, 0.7);
  k.cyl(-21.6, P + 0.6, -7.2, 0.2, 1.1, 10, 0.16);
  k.sphere([-21.6, P + 1.85, -7.2], 0.16, 12);
  // The travertine wall closing the north side between the court and the hall.
  k.bar([-13.2, -8.6], [-3.6, -8.6], P, H, 0.3);
}

export default { title: 'Barcelona Pavilion', build } satisfies ModelInfo;
