// Church of the Light, Ibaraki, Osaka (Tadao Ando, 1989). A concrete box of three cubes,
// about 5.9 m wide, 17.7 m long and 6 m high, sliced at 15° by a free-standing wall that
// makes the entrance; the altar wall is cut through by a cross of light.
import { Matrix4 } from 'three';
import { type Kit, type ModelInfo } from '../kit';

const W = 6.3; // outside
const L = 18.1;
const H = 6.2;
const T = 0.4;

function church(k: Kit) {
  // Side walls, the roof and the floor.
  k.box(0, 0, -W / 2 + T / 2, L, H, T);
  k.box(0, 0, W / 2 - T / 2, L, H, T);
  k.box(0, H - T, 0, L, T, W);
  k.box(0, -0.15, 0, L + 1.5, 0.15, W + 4);
  // The altar wall (east), with the cross cut right through it: built from four blocks
  // that leave a vertical slit and a horizontal one.
  const x = L / 2 - T / 2;
  const slit = 0.38;
  const cy = 3.4; // height of the cross's arm
  const inner = W - 2 * T;
  k.box(x, 0, -inner / 4 - slit / 4, T, cy - slit / 2, inner / 2 - slit / 2);
  k.box(x, 0, inner / 4 + slit / 4, T, cy - slit / 2, inner / 2 - slit / 2);
  k.box(x, cy + slit / 2, -inner / 4 - slit / 4, T, H - T - cy - slit / 2, inner / 2 - slit / 2);
  k.box(x, cy + slit / 2, inner / 4 + slit / 4, T, H - T - cy - slit / 2, inner / 2 - slit / 2);
  // The west wall.
  k.box(-L / 2 + T / 2, 0, 0, T, H, W);
  // The free-standing wall at 15°, passing through the box and beyond it.
  const a = (15 * Math.PI) / 180;
  k.bar([-L / 2 + 1.0, -W / 2 - 3.0], [-L / 2 + 1.0 + Math.cos(a) * 15.5, -W / 2 - 3.0 + Math.sin(a) * 15.5], 0, H - 1.0, T);
  // Stepped floor of the nave, falling towards the altar.
  for (let i = 0; i < 6; i++) k.box(-L / 2 + 3 + i * 2, 0, 0, 2, 0.6 - i * 0.1, W - 2 * T);
  // The Sunday school beside it (1999), a lower box to the north.
  k.box(-2, 0, -W / 2 - 7, 12, 4.4, 7);
}

// Turned so the wall with the cross faces the way you first see it.
function build(k: Kit) {
  k.transformed(new Matrix4().makeRotationY(-Math.PI / 2 + 0.35), church);
}

export default { title: 'Church of the Light', build } satisfies ModelInfo;
