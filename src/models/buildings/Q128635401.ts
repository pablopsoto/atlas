// Salk Institute, La Jolla (Louis Kahn, 1966). Two mirror-image laboratory buildings
// either side of a travertine court open to the Pacific, a thin channel of water running
// down its axis to the west. Along the court, the scholars' study towers, their teak
// windows turned 45° to face the ocean, linked to the labs by bridges.
import { type Kit, type ModelInfo, type P2 } from '../kit';

const COURT = 27; // width of the plaza
const LEN = 78; // east–west
const LAB = 20; // depth of each lab block
const LABH = 15;

function build(k: Kit) {
  // The plaza: travertine with the water channel down the middle, ending in a fountain
  // block and a step down to the lower terrace at the ocean end.
  k.box(0, 0, 0, LEN + 8, 0.35, COURT + 2 * (LAB + 10));
  k.box(-4, 0.35, 0, LEN, 0.02, 0.4);
  k.box(-LEN / 2 - 1.4, 0.35, 0, 2.6, 0.9, 2.6);
  k.box(-LEN / 2 - 6, -0.8, 0, 6, 0.8, COURT + 10);

  for (const side of [-1, 1]) {
    const zc = side * (COURT / 2);
    // The study towers: ten per side, each a concrete block with a 45° bay facing west.
    for (let i = 0; i < 10; i++) {
      const x = -LEN / 2 + 5 + i * 7.6;
      const z0 = zc;
      const z1 = zc + side * 6.5;
      const tower: P2[] = side > 0
        ? [[x - 3, z0 + 2.2], [x - 0.8, z0], [x + 3, z0], [x + 3, z1], [x - 3, z1]]
        : [[x - 3, z0 - 2.2], [x - 0.8, z0], [x + 3, z0], [x + 3, z1], [x - 3, z1]];
      k.prism(tower, 0.35, LABH - 1.6);
      // Teak window boxes on the angled face, a dark recess per floor.
      for (const y of [3.4, 7.7, 12]) k.bar([x - 2.9, z0 + side * 2.1], [x - 0.9, z0 + side * 0.1], y, 1.9, 0.25);
      // The bridge to the lab block at each study floor.
      k.box(x, 6.4, zc + side * 8.4, 2.4, 0.5, 3.8);
    }
    // The laboratory block, set back behind the towers, with its service stair towers.
    const zl = zc + side * (10 + LAB / 2);
    k.box(-2, 0.35, zl, LEN - 4, LABH, LAB);
    for (let y = 4.2; y < LABH; y += 4.4) k.box(-2, y, zl - side * (LAB / 2), LEN - 4.2, 0.35, 0.3);
    for (const x of [-LEN / 2 + 1, LEN / 2 - 6]) k.box(x, 0.35, zl, 4.5, LABH + 2.5, 7);
  }
}

export default { title: 'Salk Institute', build } satisfies ModelInfo;
