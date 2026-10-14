// 30 St Mary Axe, London (Foster + Partners, 2004). 180 m, its girth swelling from about
// 49 m at the street to 56 m at the 17th floor and closing into a glass lantern. The
// structure is a diagrid: steel diagonals spiralling both ways, tied by a hoop at every
// node level, two floors apart.
import type { Kit, ModelInfo, P2 } from '../kit';

const H = 180;
// Radius at height, through measured points (smoothly interpolated).
const PROFILE: P2[] = [
  [0, 24.5], [12, 26.2], [30, 27.6], [50, 28.1], [70, 28.1], [90, 27.4], [110, 25.6],
  [130, 22.6], [148, 18.6], [162, 14.2], [172, 9.6], [177, 5.6], [180, 0],
];
function radius(y: number) {
  for (let i = 1; i < PROFILE.length; i++) {
    const [y0, r0] = PROFILE[i - 1];
    const [y1, r1] = PROFILE[i];
    if (y <= y1) {
      // Cosine blend between points keeps the curve free of kinks at this spacing.
      const t = (y - y0) / (y1 - y0);
      return r0 + (r1 - r0) * (1 - Math.cos(Math.PI * t)) * 0.5;
    }
  }
  return 0;
}

const AROUND = 18; // diagonals each way
const LEVELS = 21; // node rings, base to lantern

function build(k: Kit) {
  // The glass skin, just inside the steel.
  const skin: P2[] = [];
  for (let y = 0; y <= H; y += 2) skin.push([Math.max(0.01, radius(y) - 0.45), y]);
  k.lathe(skin, 0, 0, 72);

  // Node rings get closer together towards the top, as the floors' diagonals steepen.
  const ys = Array.from({ length: LEVELS }, (_, j) => 4 + (H - 14) * (1 - (1 - j / (LEVELS - 1)) ** 1.25));
  const node = (j: number, i: number): [number, number, number] => {
    const y = ys[j];
    const a = ((i + (j % 2) * 0.5) / AROUND) * Math.PI * 2;
    const r = radius(y) + 0.2;
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  };
  for (let j = 0; j < LEVELS - 1; j++) {
    for (let i = 0; i < AROUND; i++) {
      const a = node(j, i);
      // Each node sends one diagonal up to either side.
      const shift = j % 2;
      k.beam(a, node(j + 1, i + shift), 0.55, 0.7);
      k.beam(a, node(j + 1, i + shift - 1), 0.55, 0.7);
    }
    // The hoop at this level.
    const ring: [number, number, number][] = Array.from({ length: 73 }, (_, n) => {
      const ang = (n / 72) * Math.PI * 2;
      const r = radius(ys[j]) + 0.25;
      return [Math.cos(ang) * r, ys[j], Math.sin(ang) * r];
    });
    k.tube(ring, 0.22, 72, 6, true);
  }
  // Legs from the first ring down to the ground.
  for (let i = 0; i < AROUND; i++) {
    const a = node(0, i);
    k.beam([a[0] * 0.98, 0, a[2] * 0.98], a, 0.6, 0.8);
  }
  // The lantern: a ring beam and a slim spire of glass ribs.
  k.tube(Array.from({ length: 49 }, (_, n) => {
    const ang = (n / 48) * Math.PI * 2;
    const r = radius(172) + 0.3;
    return [Math.cos(ang) * r, 172, Math.sin(ang) * r] as [number, number, number];
  }), 0.45, 48, 6, true);
  // A low podium-plaza round the foot.
  k.cyl(0, 0, 0, 33, 0.4, 72);
}

export default { title: '30 St Mary Axe', build } satisfies ModelInfo;
