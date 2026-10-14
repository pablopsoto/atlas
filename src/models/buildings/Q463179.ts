// Fallingwater, Mill Run, Pennsylvania (Frank Lloyd Wright, 1936–39). The house is a stack of
// horizontal concrete bands — terraces with deep solid parapets, their corners just rounded —
// cantilevered from a sandstone ledge out over the falls of Bear Run. Under each band, a
// recessed strip of steel windows in shadow; between them, piers of laid stone; behind, the
// stone tower and chimney rise above everything. The falls pour from the ledge beneath the
// living room into the stream; a stair hangs from the living room down to the water.
// Looking upstream at the classic view, south is +z (towards the falls), east +x.
import { roundRect, type Kit, type ModelInfo, type P2 } from '../kit';

const BAND = 1.35; // height of a parapet band, slab included
const PT = 0.32; // parapet thickness

/** A terrace: a solid band with a floor inside it, rounded just at the corners. */
function band(k: Kit, x0: number, x1: number, z0: number, z1: number, y: number, h = BAND) {
  const w = x1 - x0;
  const d = z1 - z0;
  const c: P2 = [(x0 + x1) / 2, (z0 + z1) / 2];
  const outer = roundRect(w, d, 0.4, c[0], c[1]);
  k.prism(outer, y, 0.35); // the slab
  k.prism(outer, y + 0.35, h - 0.35, [roundRect(w - 2 * PT, d - 2 * PT, 0.15, c[0], c[1])]);
}

/** Cantilever beams under a terrace, running out towards its edge. */
function ribs(k: Kit, xs: number[], z0: number, z1: number, y: number) {
  for (const x of xs) k.box(x, y - 0.7, (z0 + z1) / 2, 0.45, 0.7, z1 - z0);
}

/** A strip of steel windows, recessed under a band: mullions close-set, a transom high up. */
function windows(k: Kit, a: P2, b: P2, y: number, h: number) {
  k.glazing(a, b, y, h, 0.62, { bar: 0.06, depth: 0.1, inset: 0.0, transoms: [h * 0.7] });
}

/** Stone: laid in courses, so it reads against the smooth concrete. */
function stone(k: Kit, cx: number, cz: number, w: number, d: number, y0: number, y1: number) {
  k.box(cx, y0, cz, w, y1 - y0, d);
  for (let y = y0 + 0.9; y < y1; y += 0.9) k.box(cx, y, cz, w + 0.05, 0.04, d + 0.05);
}

function build(k: Kit) {
  // ——— The stream and the falls ———
  const BED = -6.2;
  k.box(1, BED - 0.3, 6.5, 30, 0.3, 11); // the stream below the falls
  // The sandstone ledge the house sits on, in stacked, slightly skewed slabs.
  const rocks: [number, number, number, number, number, number, number][] = [
    // cx, cz, w, d, y0, y1, turn
    [-1, -3.5, 22, 11, BED, -2.6, 0.02],
    [0.5, -2.6, 19, 9.4, -2.6, -0.9, -0.03],
    [-0.5, -3.2, 17, 8.6, -0.9, 0.0, 0.04],
    [11.5, -3, 4.5, 7, BED, -3.4, -0.15],
  ];
  for (const [cx, cz, w, d, y0, y1, t] of rocks) k.box(cx, y0, cz, w, y1 - y0, d, t);
  // Boulders below the lip, where the water lands.
  k.box(-6, BED, 4.2, 4.5, 1.6, 3.2, 0.3);
  k.box(4.5, BED, 5.6, 6, 1.0, 3.6, -0.2);
  k.box(-0.5, BED, 3.4, 4, 2.2, 2.4, 0.1);
  // The falls: sheets of water pouring off the lip of the ledge.
  for (const [x, w] of [[-4.6, 2.4], [-1.4, 1.6], [1.8, 3.2], [5.6, 1.6]] as [number, number][]) k.box(x, BED, 1.95, w, -0.9 - BED, 0.14);

  // ——— Living room level, resting on the ledge ———
  const L = 0.0;
  k.prism(roundRect(15.6, 12.4, 0.3, -0.4, -2.6), L, 0.4);
  windows(k, [-8.2, 3.0], [7.0, 3.0], L + 0.4, 2.55);
  windows(k, [7.0, 3.0], [7.0, -8.0], L + 0.4, 2.55);
  // The great terrace south over the falls, on four cantilever ribs; the east terrace beyond.
  band(k, -7.6, 6.8, 3.0, 8.2, L);
  ribs(k, [-5.6, -1.9, 1.8, 5.2], 1.0, 8.0, L);
  band(k, 6.8, 12.4, -5.8, 3.4, L);
  ribs(k, [8.4, 10.8], -5.6, 3.2, L);
  // The hanging stair to the water, under its hatch in the terrace.
  k.stairs([-3.2, 7.9], [-3.2, 4.0], BED + 0.4, L + 0.4 - BED - 0.4, 1.4, 18);
  k.wall([[-4.0, 4.0], [-4.0, 7.9]], BED + 0.4, 0.9, 0.06);

  // ——— Second floor ———
  const S = L + 3.05;
  k.prism(roundRect(16.2, 13, 0.3, -0.4, -2.6), S, 0.42); // over the living room
  windows(k, [-8.4, -0.9], [2.4, -0.9], S + 0.42, 2.45);
  windows(k, [2.4, -0.9], [2.4, -7.6], S + 0.42, 2.45);
  // The master terrace: the band that juts furthest, east and south.
  band(k, -0.8, 10.4, -1.6, 5.6, S);
  ribs(k, [1.4, 4.8, 8.2], -1.4, 5.4, S);
  // The guest terrace round the west side.
  band(k, -11.4, -6.8, -5.6, 1.4, S);

  // ——— Third floor: the study and its terrace ———
  const T = S + 3.0;
  k.prism(roundRect(9.6, 7.6, 0.3, -4.0, -4.8), T, 0.4);
  windows(k, [-8.6, -1.2], [0.8, -1.2], T + 0.4, 2.3);
  band(k, -1.0, 4.4, -6.4, -0.6, T);
  // The roof, its edge a thin cantilevered plane, wider than the room.
  k.prism(roundRect(11.6, 9.2, 0.35, -3.6, -4.8), T + 2.7, 0.34);

  // ——— The stone ———
  stone(k, -8.4, -4.6, 3.0, 4.8, BED, T + 6.0); // the tower, rising from the stream
  stone(k, -1.4, -7.4, 2.4, 1.8, L, T + 4.9); // the chimney
  // Piers between the window strips on each floor.
  for (const [x, z, y0, y1] of [[-8.4, 3.0, L, S + 0.4], [7.0, -8.0, L, S], [2.4, -7.6, S, T], [-8.6, -1.2, T, T + 2.7]] as [number, number, number, number][]) stone(k, x, z, 1.1, 1.1, y0, y1);
  stone(k, -0.4, -9.2, 16, 0.8, L, S + 3.0); // the north wall, against the hill

  // ——— To the north: the trellis beams over the drive, bent round a tree ———
  for (const x of [-4.5, -2.5, -0.5, 1.5, 3.5]) k.box(x, T - 0.4, -12, 0.25, 0.4, 5.6);
  k.box(-0.5, T, -11, 9.4, 0.22, 0.3);
}

export default { title: 'Fallingwater', build } satisfies ModelInfo;
