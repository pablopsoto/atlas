// Church of the Light, Ibaraki, Osaka (Tadao Ando, 1989). A box of three 5.9 m cubes in
// fair-faced concrete, sliced at 15° by a free-standing wall that makes the entrance. The
// altar wall is cut right through by a cross: its arm runs the full width, its upright from
// the floor almost to the roof. The walls carry Ando's 1.8 × 0.9 m panel grid and tie holes.
// The Sunday school (1999) stands beside it across a small court.
import { Matrix4 } from 'three';
import { type Kit, type ModelInfo, type P2 } from '../kit';

const W = 6.3; // outside width
const L = 18.1; // outside length
const H = 6.3;
const T = 0.4;
const SLIT = 0.5;

function church(k: Kit) {
  const x0 = -L / 2;
  const x1 = L / 2;
  const z0 = -W / 2;
  const z1 = W / 2;
  // Floor, roof, the two long walls and the entrance end.
  k.box(0, -0.2, 0, L, 0.2, W);
  k.box(0, H - T, 0, L, T, W);
  k.box(0, 0, z0 + T / 2, L, H - T, T);
  k.box(0, 0, z1 - T / 2, L, H - T, T);
  k.box(x0 + T / 2, 0, 0, T, H - T, W - 2 * T);
  // The altar wall, east: four blocks that leave the cross open between them.
  const xa = x1 - T / 2;
  const arm = 3.55; // height of the arm's centre
  const top = H - T - 0.15; // the upright stops just short of the roof
  const half = (W - 2 * T - SLIT) / 2;
  for (const s of [-1, 1]) {
    const zc = s * (SLIT / 2 + half / 2);
    k.box(xa, 0, zc, T, arm - SLIT / 2, half);
    k.box(xa, arm + SLIT / 2, zc, T, top - arm - SLIT / 2, half);
  }
  k.box(xa, top, 0, T, H - T - top, SLIT); // the lintel over the upright
  // The cross reaches the side walls: the arm cuts through to their edges.
  for (const s of [-1, 1]) k.box(xa, arm - SLIT / 2, s * (W / 2 - T / 2), T, SLIT, 0.001);

  // The free-standing wall at 15°, passing through the box near the entrance.
  const a = (15 * Math.PI) / 180;
  const p0: P2 = [x0 - 2.5, z1 + 2.2];
  const p1: P2 = [p0[0] + Math.cos(a) * 15.5, p0[1] - Math.sin(a) * 15.5];
  k.bar(p0, p1, 0, H - 0.9, T);

  // The panel grid on the outside faces.
  k.formwork([x1, z1], [x0, z1], 0, H);
  k.formwork([x0, z0], [x1, z0], 0, H);
  k.formwork([x0, z1], [x0, z0], 0, H);
  // Pews stepping down towards the altar, seen through the cross.
  for (let i = 0; i < 6; i++) k.box(x0 + 3 + i * 2, 0, 0, 2, 0.55 - i * 0.08, W - 2 * T - 0.6);
  // The Sunday school, beside it across the court.
  k.box(-1.5, 0, z0 - 7.2, 13.5, 4.6, 6.6);
  k.formwork([-8.25, z0 - 3.9], [4.75, z0 - 3.9], 0, 4.6);
}

// Turned so the wall with the cross faces the way you first see it.
function build(k: Kit) {
  k.transformed(new Matrix4().makeRotationY(-Math.PI / 2 + 0.35), church);
}

export default { title: 'Church of the Light', build } satisfies ModelInfo;
