// Finlandia Hall, Helsinki (Alvar Aalto, 1971; congress wing 1975). A long white-marble
// building on the shore of Töölönlahti: a low base of foyers and the congress wing, ribbed
// with vertical fins, and above it the concert hall's tower, its roof sloping steeply up
// to a high wall so the sound can rise.
import { type Kit, type ModelInfo, type P2 } from '../kit';

function ribbed(k: Kit, outline: P2[], y: number, h: number, every = 1.3) {
  k.prism(outline, y, h);
  // Fins standing off the long east face (the first edge of the outline).
  const [a, b] = outline;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.floor(len / every);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    k.box(a[0] + (b[0] - a[0]) * t, y, a[1] + (b[1] - a[1]) * t + 0.35, 0.18, h, 0.7);
  }
}

function build(k: Kit) {
  // The base: foyers and offices, three storeys, running north–south along the bay.
  ribbed(k, [[-60, 9], [40, 9], [40, -6], [-60, -6]], 0, 10.5);
  // The congress wing extending north, a storey lower.
  ribbed(k, [[40, 7], [95, 7], [95, -8], [40, -8]], 0, 8.2);
  // A band of glazed foyer under the overhang on the bay side.
  k.box(-10, 0, 10.2, 100, 3.6, 2.4);
  k.box(-10, 3.6, 10.6, 101, 0.4, 3.2);

  // The concert hall tower: a block whose roof slopes up to the high back wall.
  const x0 = -36;
  const x1 = -6;
  k.prism([[x0, 8], [x1, 8], [x1, -10], [x0, -10]], 10.5, 8);
  k.fin([[x0, 18.5], [x1 - 6, 18.5], [x1, 30], [x1, 32], [x0 + 4, 26], [x0, 24]], 18, 0, [0, -1]);
  // Its high back wall, standing above the slope, and the ribbing that marks it.
  k.box(x1 - 0.6, 18.5, -1, 1.4, 14.5, 18.2);
  for (let z = -9; z <= 7; z += 1.3) k.box(x1 + 0.2, 10.5, z, 0.7, 21, 0.18);
  // The chamber music hall, a smaller sloping block beside it.
  k.prism([[-2, 6], [20, 6], [20, -6], [-2, -6]], 10.5, 3.5);
  k.fin([[-2, 14], [20, 14], [20, 19], [-2, 16]], 12, 0, [0, 0]);
  // The terrace along the bay, and the low stone wall on the shore.
  k.box(-10, 0, 15, 120, 0.4, 9);
}

export default { title: 'Finlandia Hall', build } satisfies ModelInfo;
