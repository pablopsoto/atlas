// London Aquatics Centre (Zaha Hadid, 2011). A wave-shaped roof about 160 m long and 80 m
// wide, curving down to rest at the south end and on two concrete cores, floats over a
// concrete podium; under its rising sides, walls of glass. (Shown as it is now, without
// the temporary Olympic seating wings.)
import { type Kit, type ModelInfo } from '../kit';

const L = 160;
const W = 82;
const POD = 4.5;

function build(k: Kit) {
  // The podium: a concrete plinth with steps up from the bridge.
  k.box(0, 0, 0, L + 20, POD, W + 16);
  k.stairs([0, W / 2 + 22], [0, W / 2 + 8], 0, POD, 30, 14);

  // The roof: a single sheet, its spine highest a third of the way along, curving down to
  // a lip near the ground at the south end; its sides flare up, its plan a manta's.
  const roof = (u: number, v: number): [number, number, number] => {
    const x = -L / 2 + u * L;
    const half = (W / 2) * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, 0.15 + u * 0.95)));
    const z = (v - 0.5) * 2 * half;
    const spine = POD + 8 + 13 * Math.sin(Math.PI * u ** 0.75) - 9 * (1 - u) ** 6;
    const across = 1 - (2 * v - 1) ** 2;
    const y = spine * (0.72 + 0.28 * across) + 2.5 * (2 * v - 1) ** 4;
    return [x, y, z];
  };
  k.surface(roof, 48, 24, 1.6);
  // The two cores it rests on at the north end, and the support at the south lip.
  for (const z of [-22, 22]) k.box(L / 2 - 26, POD, z, 10, 18, 6);
  k.box(-L / 2 + 6, POD, 0, 6, 4, 22);
  // Glass walls under the rising sides, mullioned, set back.
  for (const s of [-1, 1]) {
    for (let x = -L / 2 + 20; x <= L / 2 - 8; x += 4) {
      const [, y, z] = roof((x + L / 2) / L, s > 0 ? 0.9 : 0.1);
      k.box(x, POD, z * 0.98, 0.15, Math.max(0.5, y - POD - 1.2), 0.15);
    }
    k.bar([-L / 2 + 20, s * W * 0.38], [L / 2 - 8, s * W * 0.38], POD, 0.3, 0.2);
  }
}

export default { title: 'London Aquatics Centre', build } satisfies ModelInfo;
