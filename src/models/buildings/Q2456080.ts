// Säynätsalo Town Hall, Finland (Alvar Aalto, 1952). Red brick round a raised courtyard:
// a ring of offices and the library, lifted a storey on the slope, with the council
// chamber rising above it as a tall block under a single-pitch roof. Grassed steps climb
// to the courtyard on the west; stone steps on the east.
import { rect, type Kit, type ModelInfo, type P2 } from '../kit';

const C = 3.4; // courtyard level

function build(k: Kit) {
  // The ring round the courtyard (about 22 × 20 m inside).
  const ring: P2[] = rect(36, 33);
  const court: P2[] = rect(22, 19.5, 1, 0.5);
  k.prism(ring, 0, C + 0.3, []);
  k.prism(ring, C + 0.3, 3.4, [court]);
  k.prism(rect(37, 34), C + 3.7, 0.35, [rect(21.6, 19.1, 1, 0.5)]);
  // The library wing to the south-west is a storey lower at the courtyard's open corner.
  k.prism(rect(12, 7, -8, 13), C + 0.3, 0.01);
  // Window bands and the timber louvres of the library.
  for (let x = -16; x <= 16; x += 1.4) k.box(x, 0.9, 16.6, 0.12, 1.8, 0.3);
  for (let z = -14; z <= 14; z += 2.2) k.box(18.1, C + 1.1, z, 0.2, 1.5, 1.5);

  // The council chamber: a brick block rising above the north-east corner, its roof
  // pitched up towards the corner.
  const cx = 9;
  const cz = -9;
  k.prism(rect(13.5, 13.5, cx, cz), C + 3.7, 6.2);
  const eave = C + 9.9;
  k.fin([[-6.75, eave], [6.75, eave], [6.75, eave + 4.6], [-6.75, eave + 1.4]], 13.5, 0, [cx, cz]);
  // Clerestory: a band of windows under the high eave.
  k.box(cx + 6.8, C + 8.6, cz, 0.15, 1.1, 10);
  // The grass steps on the west side, and the timber-framed stair on the east.
  k.stairs([-28, -2], [-18, -2], 0, C, 5.4, 8);
  k.stairs([26, 9], [18, 9], 0, C, 3, 10);
}

export default { title: 'Säynätsalo Town Hall', build } satisfies ModelInfo;
