// Unité d'Habitation, Marseille (Le Corbusier, 1952). A slab of 337 flats, about 137 m
// long, 24 m deep and 56 m high, lifted on massive tapered pilotis. Its long faces are
// a grid of deep loggias with brise-soleil; the shopping street halfway up shows as a
// band of finer louvres; on the roof, the running track, the gym and the ventilation
// stacks shaped like sculpture.
import { rect, type Kit, type ModelInfo } from '../kit';

const L = 137;
const D = 24.4;
const PIL = 8.2; // underside of the artificial ground
const BODY = PIL + 2.4;
const TOP = 54.5;

function build(k: Kit) {
  // ——— Pilotis: two rows, splayed and tapering down to the ground ———
  for (let i = 0; i < 17; i++) {
    const x = -L / 2 + 6 + (i * (L - 12)) / 16;
    for (const z of [-6.2, 6.2]) {
      // A tapered pier: narrow at the foot, wide where it carries the slab.
      k.fin([[-1.6, 0], [1.6, 0], [2.9, PIL], [-2.9, PIL]], 1.6, Math.PI / 2, [x, z]);
    }
  }
  // The artificial ground: a deep slab carrying the whole building.
  k.box(0, PIL, 0, L, BODY - PIL, D);

  // ——— The body: blank end walls, the loggia grid on the long faces ———
  k.box(0, BODY, 0, L - 0.6, TOP - BODY, D - 3.2); // the volume behind the loggias
  k.box(-L / 2 + 0.3, BODY, 0, 0.6, TOP - BODY, D);
  k.box(L / 2 - 0.3, BODY, 0, 0.6, TOP - BODY, D);
  const BAY = 4.19; // flat width
  const ROW = 2.26; // one storey of loggias
  const bays = Math.round((L - 1.2) / BAY);
  for (const side of [-1, 1]) {
    const z = side * (D / 2 - 0.8);
    // Vertical fins between the flats.
    for (let i = 0; i <= bays; i++) k.box(-L / 2 + 0.6 + i * ((L - 1.2) / bays), BODY, z, 0.25, TOP - BODY, 1.6);
    // Horizontal shelves: loggia floors and the sun-breakers between them.
    for (let y = BODY; y <= TOP + 0.01; y += ROW) k.box(0, y, z, L - 1.2, 0.22, 1.6);
    // The shopping street (levels 7–8): finer vertical louvres across the band.
    const y0 = BODY + ROW * 6;
    for (let x = -L / 2 + 1; x < L / 2 - 1; x += 0.75) k.box(x, y0, side * (D / 2 - 0.4), 0.1, ROW * 2, 0.6);
  }
  // The fire stair at the north end, standing proud of the gable.
  k.box(-L / 2 - 2.2, PIL, 4, 4.4, TOP - PIL + 3, 5.5);

  // ——— The roof: parapet, the gym, the stacks and the nursery ———
  k.prism(rect(L, D), TOP, 0.3);
  k.wall([[-L / 2, -D / 2], [L / 2, -D / 2], [L / 2, D / 2], [-L / 2, D / 2], [-L / 2, -D / 2]], TOP + 0.3, 1.6, 0.3);
  // The gymnasium: a long block with a curved roof like an upturned hull.
  k.box(46, TOP + 0.3, 0, 22, 4.2, 12);
  k.fin([[-11, 0], [11, 0], [11, 1.2], [5, 2.6], [-5, 2.6], [-11, 1.2]], 12, 0, [46, 0]);
  // Ventilation stacks: two truncated, flaring cones.
  for (const x of [-18, -6]) k.lathe([[2.4, TOP + 0.3], [2.0, TOP + 3], [2.8, TOP + 7.2], [0.01, TOP + 7.2]], x, 0, 32);
  // The lift and stair head, a tall slab on the roof.
  k.box(14, TOP + 0.3, 0, 5, 8, 9);
  // Nursery and its ramp at the south end.
  k.box(-48, TOP + 0.3, -2, 20, 3.4, 10);
  k.ramp([-36, 6], [-26, 6], TOP + 3.7, TOP + 0.3, 2.2, 0.25);
}

export default { title: "Unité d'Habitation", build } satisfies ModelInfo;
