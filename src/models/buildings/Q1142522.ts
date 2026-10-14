// Finlandia Hall, Helsinki (Alvar Aalto, 1971; congress wing 1975). A long building in white
// Carrara marble between Mannerheimintie and the Töölönlahti bay. Its ground floor sits back
// in shadow under a deep white canopy; above, the foyer and office floors are ribbed with
// close-set vertical fins and tall slot windows; behind them rises the concert hall, a tower
// of white slabs stepping up side by side to sloping tops, so the hall's sound can climb.
// On the bay side the walls curve. The street (east) front faces +z; north is +x.
import { type Kit, type ModelInfo, type P2 } from '../kit';

const G = 3.8; // canopy underside
const C = 4.7; // canopy top: the main floors begin
const TOP = 13.6; // the ribbed body

/** A ribbed face from a to b along z = zf: fins every `every`, slot windows between. */
function ribbed(k: Kit, x0: number, x1: number, zf: number, y0: number, y1: number, every = 1.45) {
  // Broad marble piers with narrow slot windows between them, the glass set deep.
  for (let x = x0 + every / 2; x < x1; x += every) {
    k.box(x, y0, zf + 0.4, every - 0.42, y1 - y0, 0.8);
  }
  // A smooth band at the top and at the foot, the marble's edge.
  k.box((x0 + x1) / 2, y1 - 0.9, zf + 0.35, x1 - x0, 0.9, 0.72);
  k.box((x0 + x1) / 2, y0, zf + 0.35, x1 - x0, 0.6, 0.72);
}

function build(k: Kit) {
  // ——— The ground floor, recessed under the canopy, and the canopy itself ———
  k.box(15, 0, -3, 150, G, 22);
  k.box(15, G, 1.6, 156, C - G, 31);
  for (let x = -60; x <= 90; x += 7.2) k.cyl(x, 0, 14.5, 0.25, G, 10);

  // ——— The main body: foyers and offices, ribbed on the street ———
  const body: P2[] = [[-62, 13], [42, 13], [42, -12], [10, -14], ...Array.from({ length: 12 }, (_, i): P2 => {
    // The bay side bows out in a long curve.
    const t = (i + 1) / 13;
    return [10 - t * 72, -14 - Math.sin(t * Math.PI) * 6];
  }), [-62, -14]];
  k.prism(body, C, TOP - C);
  ribbed(k, -62, 42, 13, C, TOP);
  // The top floor steps back a little and is ribbed again.
  k.box(-14, TOP, 3, 64, 3.2, 18);
  ribbed(k, -46, 18, 12, TOP, TOP + 3.2, 1.6);

  // ——— The concert hall: great white blocks rising behind, their tops gently sloped ———
  const block = (x0: number, x1: number, z0: number, z1: number, lo: number, hi: number) => {
    k.fin([[x0, C], [x1, C], [x1, lo], [x0, hi]], z1 - z0, 0, [0, (z0 + z1) / 2]);
    // The marble's vertical panel joints on the street face.
    for (let x = x0 + 2.4; x < x1 - 0.5; x += 2.4) k.box(x, C, z1 + 0.02, 0.06, Math.min(lo, hi) - C, 0.04);
  };
  block(-34, -12, -12, 7, 31.5, 33.5); // the hall itself, highest
  block(-12, -2, -10, 5, 25, 26.5); // the stepping-down front
  block(-44, -34, -12, 3, 27, 29); // the stage house behind
  block(-50, -44, -10, 0, 22, 22.5);
  // The chamber music hall's lower slope to the north.
  block(8, 22, -8, 6, TOP + 4, TOP + 6.5);

  // ——— The congress wing to the north (1975): lower, ribbed the same way ———
  k.box(68, C, -1, 52, 7.2, 26);
  ribbed(k, 42, 94, 12, C, C + 7.2);
  k.box(68, C + 7.2, -1, 52.4, 0.5, 26.4);

  // The terrace towards the bay, and the shore.
  k.box(-20, -0.4, -26, 100, 0.4, 16);
}

export default { title: 'Finlandia Hall', build } satisfies ModelInfo;
