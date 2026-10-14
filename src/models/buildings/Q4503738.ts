// Row House in Sumiyoshi (Azuma House), Osaka (Tadao Ando, 1976). A concrete box 14.1 m
// deep and 3.45 m wide squeezed between neighbours, blank to the street but for its
// recessed door, cut into three equal parts: two two-storey rooms either side of an open
// courtyard, crossed by a bridge at the upper floor.
import { type Kit, type ModelInfo } from '../kit';

const W = 3.45;
const D = 14.1;
const H = 6.0;
const T = 0.2;

function build(k: Kit) {
  // The shell: long side walls the full depth, a roof over the front and back thirds only.
  k.box(-W / 2 + T / 2, 0, 0, T, H, D);
  k.box(W / 2 - T / 2, 0, 0, T, H, D);
  k.box(0, -0.2, 0, W, 0.2, D);
  const third = D / 3;
  for (const z of [-third, third]) k.box(0, H - T, z, W, T, third);
  // The street front: a blank wall with the door set into a deep recess.
  k.box(-W / 2 + 0.75, 0, -D / 2 + T / 2, 1.5 - 0.05, H, T);
  k.box(W / 2 - 0.75, 0, -D / 2 + T / 2, 1.5 - 0.05, H, T);
  k.box(0, 2.5, -D / 2 + T / 2, 0.5, H - 2.5, T);
  k.box(0, 0, -D / 2 + 0.9, 0.5, 2.5, T); // the door, set back
  k.box(0, 0, D / 2 - T / 2, W, H, T); // the back wall
  // Upper floors of the front and back rooms, and the glass walls facing the court.
  for (const z of [-third, third]) k.box(0, 2.85, z, W - 2 * T, 0.2, third);
  for (const z of [-third / 2, third / 2]) k.box(0, 0, z, W - 2 * T, H - T, 0.06);
  // The courtyard: the bridge across at the upper level and the stair up to it.
  k.box(0, 2.85, 0, 1.0, 0.2, third);
  k.stairs([W / 2 - 0.55, third / 2 - 0.2], [W / 2 - 0.55, -third / 2 + 0.6], 0, 2.85, 0.9, 14);
  // The panel grid and tie holes on every outside face.
  k.formwork([W / 2, -D / 2], [-W / 2, -D / 2], 0, H);
  k.formwork([-W / 2, -D / 2], [-W / 2, D / 2], 0, H);
  k.formwork([W / 2, D / 2], [W / 2, -D / 2], 0, H);
  k.formwork([-W / 2, D / 2], [W / 2, D / 2], 0, H);
}

export default { title: 'Row House in Sumiyoshi', build } satisfies ModelInfo;
