// Phillips Exeter Academy Library, New Hampshire (Louis Kahn, 1972). A brick cube about
// 33.5 m square and 24 m high, its corners cut away; brick piers that grow slimmer as the
// building rises, an arcade round the ground floor, teak carrels in each bay, and an open
// loggia at the top where the walls stand free against the sky.
import { type Kit, type ModelInfo, type P2 } from '../kit';

const S = 33.5;
const H = 24.4;
const BAYS = 5;
const FLOORS = [0, 4.0, 7.2, 10.4, 13.6, 16.8, 20.0];

function build(k: Kit) {
  const h = S / 2;
  const cut = 2.6; // the chamfer at each corner
  // The four faces, each its own wall of piers and bays.
  for (let side = 0; side < 4; side++) {
    const ang = (side * Math.PI) / 2;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const P = ([u, v]: P2): P2 => [u * c - v * s, u * s + v * c];
    const span = S - 2 * cut;
    const bay = span / BAYS;
    // Piers: wider at the bottom, stepping in at each floor.
    for (let i = 0; i <= BAYS; i++) {
      const u = -span / 2 + i * bay;
      for (let f = 0; f < FLOORS.length; f++) {
        const y0 = FLOORS[f];
        const y1 = f + 1 < FLOORS.length ? FLOORS[f + 1] : H;
        const w = 2.4 - f * 0.22;
        const [x, z] = P([u, h - 0.5]);
        k.box(x, y0, z, side % 2 ? 1.0 : w, y1 - y0, side % 2 ? w : 1.0);
      }
    }
    // Spandrels at each floor, a flat arch over the ground-floor arcade, a deep top band.
    for (const y of FLOORS.slice(1)) {
      const [x, z] = P([0, h - 0.5]);
      k.box(x, y - 0.55, z, side % 2 ? 1.0 : span, 0.55, side % 2 ? span : 1.0);
    }
    // Teak carrels: a wooden panel and a small window set back in each bay above the arcade.
    for (let i = 0; i < BAYS; i++) {
      const u = -span / 2 + (i + 0.5) * bay;
      for (let f = 1; f < FLOORS.length - 1; f++) {
        const [x, z] = P([u, h - 1.1]);
        k.box(x, FLOORS[f], z, side % 2 ? 0.2 : bay - 2.4, 1.1, side % 2 ? bay - 2.4 : 0.2);
      }
    }
    // The open loggia at the top: the wall stands free, open between the piers.
    const [x, z] = P([0, h - 0.5]);
    k.box(x, H - 0.6, z, side % 2 ? 1.0 : span, 0.6, side % 2 ? span : 1.0);
  }
  // The building behind the brick: the concrete inner block, the roof and clerestory.
  k.box(0, 0, 0, S - 5, FLOORS[FLOORS.length - 1], S - 5);
  k.box(0, FLOORS[FLOORS.length - 1], 0, S - 9, 1.6, S - 9);
  k.box(0, FLOORS[FLOORS.length - 1] + 1.6, 0, 12, 1.8, 12); // the clerestory over the atrium
  // The chamfered corners: recessed glass between the faces.
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as P2[]) {
    k.bar([sx * (h - cut), sz * h - sz * 0.5], [sx * h - sx * 0.5, sz * (h - cut)], 0, H - 4.4, 0.3);
  }
}

export default { title: 'Phillips Exeter Academy Library', build } satisfies ModelInfo;
