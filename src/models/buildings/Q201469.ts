// Solomon R. Guggenheim Museum, New York (Frank Lloyd Wright, 1959). The rotunda is a
// spiral ramp that widens as it climbs, about 28 m tall and 30 m across at the top, its
// bands separated by deep strips of glass; the smaller Monitor building to the north, a
// low base along Fifth Avenue tying them, and the 1992 tower behind.
import { circle, rect, type Kit, type ModelInfo } from '../kit';

function build(k: Kit) {
  // ——— The rotunda: four bands, each a little wider than the one below ———
  const base = 3.2;
  const bands = 4;
  for (let b = 0; b < bands; b++) {
    const y0 = base + b * 5.9;
    const r0 = 13.4 + b * 1.15;
    // The band itself, leaning out slightly as on the building.
    k.lathe([[r0 - 0.9, y0], [r0, y0], [r0 + 0.55, y0 + 4.3], [r0 - 0.4, y0 + 4.3]], 0, 0, 96);
    // The recessed strip of glass above it.
    k.lathe([[r0 - 1.0, y0 + 4.3], [r0 - 0.8, y0 + 4.3], [r0 - 0.8, y0 + 5.9], [r0 - 1.0, y0 + 5.9]], 0, 0, 96);
  }
  const top = base + bands * 5.9;
  // The glass dome over the atrium, ribbed like a wheel.
  k.lathe([[17.6, top - 1.6], [17.6, top - 0.6], [12, top + 0.4], [0.01, top + 1.4]], 0, 0, 96);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    k.rod([Math.cos(a) * 12, top + 0.45, Math.sin(a) * 12], [0, top + 1.45, 0], 0.18, 6);
  }
  // The ground floor under the rotunda, set back, and the slab it rests on.
  k.cyl(0, 0, 0, 12.2, base, 64);

  // ——— The Monitor, north: a smaller drum of three bands ———
  const mx = 0;
  const mz = -27;
  for (let b = 0; b < 2; b++) {
    const y0 = base + b * 4.6;
    k.lathe([[8.4, y0], [9.2, y0], [9.6, y0 + 3.5], [8.6, y0 + 3.5]], mx, mz, 72);
    k.lathe([[8.5, y0 + 3.5], [8.7, y0 + 3.5], [8.7, y0 + 4.6], [8.5, y0 + 4.6]], mx, mz, 72);
  }
  k.cyl(mx, 0, mz, 8.6, base + 9.2, 64);

  // ——— The base along Fifth Avenue: a long low band with the name on it ———
  k.prism([[-17, -38], [-17, 10], [-9, 15], [12, 15], [12, -38]], 0, base - 0.4);
  k.prism([[-18, -38], [-18, 10], [-9.5, 16.3], [12.5, 16.3], [12.5, -38]], base - 0.4, 0.5);
  // The 1992 tower behind (Gwathmey Siegel), a plain grid.
  k.prism(rect(13, 34, 21, -14), 0, 38);
  for (let y = 4; y < 38; y += 3.8) k.box(21, y, -14, 13.3, 0.12, 34.3);
  // The planter round the rotunda's foot.
  k.prism(circle(15.5, 72, 0, 0, 0.3, Math.PI * 1.3), 0, 0.8);
}

export default { title: 'Solomon R. Guggenheim Museum', build } satisfies ModelInfo;
