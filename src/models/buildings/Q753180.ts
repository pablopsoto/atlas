// S. R. Crown Hall, Illinois Institute of Technology, Chicago (Mies van der Rohe, 1956).
// One clear-span room, 220 × 120 ft (67 × 36.6 m), its roof hung from four steel plate
// girders that cross over it, 60 ft apart, on columns outside the glass. The main floor
// sits 6 ft above the ground on a half-sunken basement; travertine steps rise to the
// south door.
import { type Kit, type ModelInfo } from '../kit';

const L = 67;
const D = 36.6;
const F = 1.8; // main floor
const ROOF = F + 5.6;
const MOD = 3.05; // the 10 ft facade module

function build(k: Kit) {
  // Floor plate and the basement wall below it (glazed band, set back).
  k.box(0, 0, 0, L - 0.8, F, D - 0.8);
  k.box(0, F - 0.3, 0, L, 0.3, D);
  // Roof plate.
  k.box(0, ROOF, 0, L, 0.45, D);
  // The glass walls: mullions every 10 ft, a transom where the frosted lower panes end.
  const g = { bar: 0.16, depth: 0.22, inset: 0.05, transoms: [2.6] };
  const [x0, x1, z0, z1] = [-L / 2, L / 2, -D / 2, D / 2];
  k.glazing([x0, z1], [x1, z1], F, ROOF - F, MOD, g);
  k.glazing([x1, z1], [x1, z0], F, ROOF - F, MOD, g);
  k.glazing([x1, z0], [x0, z0], F, ROOF - F, MOD, g);
  k.glazing([x0, z0], [x0, z1], F, ROOF - F, MOD, g);
  // Basement windows, a dark band under the floor.
  k.glazing([x0 + 0.4, z1 - 0.4], [x1 - 0.4, z1 - 0.4], 0.2, F - 0.5, MOD, { bar: 0.12, inset: 0.05 });

  // The four girders, each on two columns standing clear of the glass.
  for (const x of [-27.45, -9.15, 9.15, 27.45]) {
    const zc = D / 2 + 0.55;
    k.box(x, ROOF + 0.45, 0, 0.5, 1.75, D + 1.6); // the girder, 6 ft deep
    k.box(x, ROOF + 2.2, 0, 1.1, 0.06, D + 1.6); // its top flange
    for (const z of [-zc, zc]) {
      k.box(x, 0, z, 0.36, ROOF + 2.25, 0.36);
      k.box(x, 0, z, 0.06, ROOF + 2.25, 0.7); // flange
    }
    // Hangers from the girder down to the roof plate.
    for (const z of [-D / 4, 0, D / 4]) k.box(x, ROOF + 0.45, z, 0.6, 0.2, 0.6);
  }

  // The south entrance: a travertine landing on its own steel frame, and two flights.
  k.box(0, F * 0.5, D / 2 + 3.4, 18.3, 0.25, 4.8);
  k.stairs([0, D / 2 + 9.5], [0, D / 2 + 5.8], 0, F * 0.5 + 0.25, 13.5, 5);
  k.stairs([0, D / 2 + 2.6], [0, D / 2 + 0.35], F * 0.5 + 0.25, F - F * 0.5 - 0.25, 9.2, 5);
}

export default { title: 'S. R. Crown Hall', build } satisfies ModelInfo;
