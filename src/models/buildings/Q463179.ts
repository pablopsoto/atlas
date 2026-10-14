// Fallingwater, Mill Run, Pennsylvania (Frank Lloyd Wright, 1936–39). Concrete terraces with
// deep, round-cornered parapets cantilevered from the boulders out over the falls of Bear
// Run; between them, bands of steel-framed glass in shadow; behind, the sandstone tower and
// chimney that anchor it all. A stair hangs from the living room down to the stream.
// South (the falls, and the famous view) is +z.
import { roundRect, type Kit, type ModelInfo } from '../kit';

/** A terrace: thin slab with a thick solid parapet, rounded at the corners. */
function terrace(k: Kit, x0: number, x1: number, z0: number, z1: number, y: number, parapet = 1.0) {
  const w = x1 - x0;
  const d = z1 - z0;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  k.prism(roundRect(w, d, 0.55, cx, cz), y, 0.45);
  k.prism(roundRect(w, d, 0.55, cx, cz), y + 0.45, parapet, [roundRect(w - 0.5, d - 0.5, 0.3, cx, cz)]);
}

/** A storey of glass between floors: recessed, mullioned, in shadow under the slab above. */
function glass(k: Kit, a: [number, number], b: [number, number], y: number, h: number) {
  k.glazing(a, b, y, h, 0.75, { bar: 0.07, depth: 0.12, inset: 0.35, transoms: [h * 0.62] });
}

function build(k: Kit) {
  // ——— The stream: the rock shelf the house stands on, the falls, the pool below ———
  const LEDGE = 1.0; // top of the boulders
  k.box(-1, -5.4, -5, 26, LEDGE + 5.4, 14); // the shelf, its south face the lip of the falls
  k.box(0, -5.6, 8, 28, 0.3, 12); // the pool
  k.box(2, -5.6, 4.6, 12, 1.4, 3.4); // a lower step in the falls
  k.box(-9, -5.6, 5, 7, 2.6, 4); // a boulder at the foot
  // The falls: sheets of water off the lip.
  for (const [x, w] of [[-3.5, 2.2], [-0.4, 1.4], [2.4, 2.6], [5.6, 1.2]] as [number, number][]) k.box(x, -4.3, 2.1, w, LEDGE + 4.2, 0.12);

  // ——— Living room level, on the boulders, and its terraces over the falls ———
  const L = 1.6;
  k.box(-0.5, LEDGE, -3, 3, L - LEDGE, 8); // bolsters from the rock
  k.box(-6, LEDGE, -3, 2, L - LEDGE, 6);
  k.prism(roundRect(15, 9.5, 0.4, -0.5, -2.5), L, 0.45);
  glass(k, [-8, 2.2], [7, 2.2], L + 0.45, 2.6);
  glass(k, [7, 2.2], [7, -7], L + 0.45, 2.6);
  terrace(k, -6.8, 6.4, 2.0, 7.6, L); // the great south terrace, over the falls
  terrace(k, 6.6, 11.6, -5.2, 2.6, L); // east terrace
  // The hanging stair down to the water, under its glass hatch.
  k.stairs([-3.4, 7.2], [-3.4, 3.0], -4.3, L + 0.45 + 4.3, 1.5, 16);

  // ——— Second floor: the bedrooms, their terrace thrust out east and south ———
  const S = L + 3.1;
  k.prism(roundRect(15.4, 9.9, 0.4, -0.5, -2.5), S, 0.45); // roof of the living room
  glass(k, [-8, -1.6], [1.6, -1.6], S + 0.45, 2.5);
  terrace(k, -1.4, 9.4, -1.8, 5.2, S); // the master bedroom terrace
  terrace(k, -10.8, -6.6, -4.2, 0.6, S, 0.9); // west terrace

  // ——— Third floor: the study, and its small terrace ———
  const T = S + 3.0;
  k.prism(roundRect(8.4, 6, 0.4, -4.4, -4.6), T, 0.45);
  glass(k, [-8.4, -1.6], [-0.4, -1.6], T + 0.45, 2.4);
  terrace(k, -0.6, 3.6, -6.4, -1.4, T, 0.9);
  k.prism(roundRect(9.4, 6.8, 0.4, -4.4, -4.6), T + 2.85, 0.4);

  // ——— The stone: the tower to the west, the chimney, piers along the north ———
  k.box(-9.6, LEDGE, -5, 3.2, T + 3.6 - LEDGE, 4.6); // stair tower
  k.box(-2.4, L, -7.6, 2.2, T + 4.4 - L, 1.8); // chimney
  for (const x of [-5.6, 1.2, 4.6]) k.box(x, L, -7.4, 1.2, S + 2.9 - L, 1.0);
  k.box(-0.5, L, -7.7, 15, 0.9, 0.5);
  // Concrete trellis beams over the drive to the north, and the bridge over the run.
  for (const x of [-4, -2, 0, 2, 4]) k.box(x, T - 0.2, -10, 0.25, 0.4, 5.4);
  k.box(14, LEDGE + 0.5, -6, 6, 0.5, 4.5);
}

export default { title: 'Fallingwater', build } satisfies ModelInfo;
