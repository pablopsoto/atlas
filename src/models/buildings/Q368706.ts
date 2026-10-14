// Paimio Sanatorium, Finland (Alvar Aalto, 1933). The patients' wing, seven storeys of
// rooms facing south-south-east, ends in the sun-balcony wing: a tall slender slab of
// open decks, cantilevered from a single row of columns, its ends rounded. Lower wings
// for the common rooms and the service court run off behind.
import { roundRect, rect, type Kit, type ModelInfo, type P2 } from '../kit';

function build(k: Kit) {
  // ——— Patients' wing ———
  const L = 92;
  const D = 11.5;
  const FL = 3.25;
  const N = 7;
  k.box(0, 0, 0, L, FL * N, D);
  k.box(0, FL * N, 0, L + 0.4, 0.5, D + 0.4); // roof edge
  // Windows: a row of openings per storey on the south face, set back in the white render.
  for (let f = 0; f < N; f++) {
    const y = f * FL + 1.0;
    for (let x = -L / 2 + 2; x < L / 2 - 1.5; x += 2.75) k.box(x, y, D / 2 + 0.02, 1.7, 1.45, 0.1);
  }
  // The stair tower at the west end.
  k.box(-L / 2 - 2.5, 0, -1.5, 5, FL * N + 2.4, 7);

  // ——— Sun-balcony wing, at the east end, turned a little towards the sun ———
  const turn = -0.33;
  const bx = L / 2 + 9;
  const bz = 4;
  const decks = 8;
  for (let f = 0; f <= decks; f++) {
    const y = f * FL;
    const deck = roundRect(26, 6.6, 3.0, 0, 0, 8).map(([x, z]): P2 => {
      const c = Math.cos(turn);
      const s = Math.sin(turn);
      return [bx + x * c - z * s, bz + x * s + z * c];
    });
    k.prism(deck, y, f === decks ? 0.5 : 0.28);
    // Railing bands: the white parapet at each deck.
    if (f > 0 && f < decks) {
      const rail = roundRect(26, 6.6, 3.0, 0, 0, 8).map(([x, z]): P2 => [bx + x * Math.cos(turn) - z * Math.sin(turn), bz + x * Math.sin(turn) + z * Math.cos(turn)]);
      const inner = roundRect(25.6, 6.2, 2.8, 0, 0, 8).map(([x, z]): P2 => [bx + x * Math.cos(turn) - z * Math.sin(turn), bz + x * Math.sin(turn) + z * Math.cos(turn)]);
      k.prism(rail, y + 0.28, 0.9, [inner]);
    }
  }
  // The spine: one row of columns along the back of the decks, and the link to the wing.
  for (let i = -3; i <= 3; i++) {
    const x = i * 3.6;
    const z = -2.4;
    k.box(bx + x * Math.cos(turn) - z * Math.sin(turn), 0, bz + x * Math.sin(turn) + z * Math.cos(turn), 0.5, decks * FL, 0.5, -turn);
  }
  k.box(L / 2 + 1.5, 0, -2.5, 6, FL * N, 6);

  // ——— Lower wings behind: common rooms, dining hall, and the service court ———
  k.prism([[-12, -D / 2], [10, -D / 2], [14, -24], [-8, -26]], 0, FL * 2);
  k.prism(rect(28, 12, -28, -16), 0, FL * 3);
  k.prism(rect(34, 9, 24, -20), 0, FL);
  k.box(24, FL, -20, 34.4, 0.4, 9.4);
}

export default { title: 'Paimio Sanatorium', build } satisfies ModelInfo;
