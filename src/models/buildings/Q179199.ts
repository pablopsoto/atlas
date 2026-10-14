// Guggenheim Museum Bilbao (Frank Gehry, 1997). On the south bank of the Nervión: a cluster
// of titanium-clad curved volumes round a tall atrium "flower", tied to the city by
// rectilinear blocks of limestone; the longest gallery runs east under the La Salve bridge
// and ends in a tower that clasps it. River (north) is -z.
import { roundRect, type Kit, type ModelInfo, type P3 } from '../kit';

/**
 * A Gehry volume: a box whose section turns, slides and swells as it rises, its corners
 * only slightly rounded, so its skin reads as bent sheet. Stations: [y, cx, cz, w, d, turn].
 */
function volume(k: Kit, stations: [number, number, number, number, number, number][]) {
  const rings: P3[][] = stations.map(([y, cx, cz, w, d, turn]) =>
    roundRect(w, d, Math.min(w, d) * 0.18, 0, 0, 3).map(([x, z]): P3 => [cx + x * Math.cos(turn) - z * Math.sin(turn), y, cz + x * Math.sin(turn) + z * Math.cos(turn)]),
  );
  k.loft(rings);
}

function build(k: Kit) {
  // ——— Limestone blocks to the south and west, the city side ———
  k.box(-50, 0, 24, 36, 17, 26);
  k.box(-20, 0, 34, 24, 12, 18);
  k.box(-64, 0, -4, 18, 22, 22);
  k.box(-38, 0, -2, 14, 27, 12);
  // ——— The atrium and its "flower": the tallest volumes, twisting as they climb ———
  volume(k, [[0, -8, -2, 24, 20, 0.1], [20, -6, -3, 22, 18, 0.35], [36, -4, -5, 16, 13, 0.7], [50, -2, -6, 8, 6, 1.0]]);
  volume(k, [[8, -22, -12, 20, 14, 0.5], [22, -21, -14, 22, 15, 0.7], [34, -19, -15, 16, 10, 1.0]]);
  volume(k, [[0, 10, -16, 18, 14, -0.4], [14, 12, -17, 20, 15, -0.15], [28, 13, -18, 14, 10, 0.25]]);
  volume(k, [[12, -6, 12, 16, 12, -0.2], [26, -5, 13, 18, 12, 0.1], [36, -4, 14, 12, 8, 0.4]]);
  // The river-side sails: lower, wider, leaning out over the water.
  volume(k, [[0, -36, -20, 28, 14, 0.15], [12, -38, -25, 30, 15, 0.05], [22, -37, -27, 22, 10, -0.05]]);
  volume(k, [[0, 20, -2, 20, 18, 0.6], [16, 22, -4, 22, 18, 0.85], [27, 23, -5, 15, 12, 1.1]]);
  // ——— The long gallery east, under the bridge, ending at the tower ———
  volume(k, [[0, 54, -9, 70, 24, 0.0], [10, 56, -10, 74, 26, 0.03], [20, 58, -11, 66, 20, 0.06], [24, 58, -11, 52, 12, 0.08]]);
  // La Salve bridge crossing over it, on its piers.
  k.box(88, 26, -10, 14, 1.4, 120);
  for (const z of [-48, 28]) k.box(88, 0, z, 6, 26, 4);
  // The tower that clasps the bridge.
  volume(k, [[0, 100, 10, 9, 7, 0], [20, 100, 10, 8, 6, 0.35], [36, 100, 10, 6, 4.5, 0.7], [42, 100, 10, 2.5, 2, 0.8]]);
  // Glass curtain walls of the atrium facing the water.
  k.box(-8, 0, -24, 20, 20, 0.4);
  // ——— The water: the reflecting pool along the river front, and the quay ———
  k.box(-10, -0.2, -42, 130, 0.2, 18);
  k.box(-10, 0, -52, 150, 1.5, 3);
}

export default { title: 'Guggenheim Museum Bilbao', build } satisfies ModelInfo;
