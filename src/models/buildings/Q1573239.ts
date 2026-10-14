// Niterói Contemporary Art Museum (Oscar Niemeyer, 1996). A saucer 50 m across on a
// cylindrical stem 9 m wide, rising out of a reflecting pool on a cliff over Guanabara
// Bay; a ribbon window runs right round it between its two lips, and a red ramp curls
// up from the plaza to the entrance.
import { circle, type Kit, type ModelInfo, type P2 } from '../kit';

function build(k: Kit) {
  // The stem and the saucer as one profile of revolution (radius, height).
  const R = 25;
  const profile: P2[] = [
    [0.01, 0], [4.5, 0], [4.5, 2.4],
    // The underside sweeps out from the stem in a long curve to the lower lip.
    ...Array.from({ length: 18 }, (_, i): P2 => {
      const t = (i + 1) / 18;
      // A long flare: steep off the stem, flattening as it reaches the lip.
      return [4.5 + (R - 4.5) * (1 - (1 - t) ** 2.2), 2.4 + 6.6 * t ** 1.5];
    }),
    [R, 9.0],
    // The ribbon window, set back between the lips.
    [R - 1.6, 9.0], [R - 1.6, 11.6], [R - 0.3, 11.6],
    // The upper lip and the shallow roof dome.
    [R + 1.4, 13.2], [R + 0.4, 14.4], [R - 3, 15.2], [12, 15.8], [0.01, 16.1],
  ];
  k.lathe(profile, 0, 0, 120);
  // Mullions in the ribbon window.
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    k.box(Math.cos(a) * (R - 1.4), 9.0, Math.sin(a) * (R - 1.4), 0.12, 2.6, 0.12);
  }
  // The reflecting pool round the stem, with its rim, and the plaza.
  k.prism(circle(30, 96), 0, 0.12, [circle(28, 96)]);
  k.prism(circle(28, 96), 0, 0.04, [circle(4.6, 32)]);
  k.prism(circle(48, 96), -0.4, 0.4);

  // The ramp: a ribbon that curls from the plaza up to the door on the lower lip.
  const path: [number, number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const a = -0.3 + t * 3.6;
    const r = 44 - t * 17;
    path.push([Math.cos(a) * r, 0.4 + t * 8.6, Math.sin(a) * r]);
  }
  for (let i = 1; i < path.length; i++) {
    const [ax, ay, az] = path[i - 1];
    const [bx, by, bz] = path[i];
    k.ramp([ax, az], [bx, bz], ay, by, 3.2, 0.45);
    // Its low parapets.
    const dx = bx - ax;
    const dz = bz - az;
    const l = Math.hypot(dx, dz);
    for (const s of [-1, 1]) {
      const ox = (-dz / l) * 1.55 * s;
      const oz = (dx / l) * 1.55 * s;
      k.beam([ax + ox, ay + 0.55, az + oz], [bx + ox, by + 0.55, bz + oz], 0.14, 0.9);
    }
  }
  // Columns under the ramp where it leaves the ground.
  for (const i of [10, 20, 30]) k.cyl(path[i][0], 0, path[i][2], 0.5, path[i][1] - 0.4, 12);
}

export default { title: 'Niterói Contemporary Art Museum', build } satisfies ModelInfo;
