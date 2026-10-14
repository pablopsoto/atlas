// Apple Park, Cupertino (Foster + Partners, 2017). A ring 461 m across and four storeys
// high, its glass walls shaded at every floor by white canopies that run the full
// circumference; the roof carries solar panels. Inside, the orchard and the pond; the ring
// is broken only where the passages cross it.
import { circle, type Kit, type ModelInfo, type P2 } from '../kit';

const R = 230.5; // outer radius
const W = 58; // depth of the ring
const FL = 4.6;
const N = 4;

function build(k: Kit) {
  const r0 = R - W;
  // The floors and canopies: each slab overhangs the glass on both sides.
  for (let f = 0; f <= N; f++) {
    const y = f * FL;
    const t = f === N ? 0.9 : 0.35;
    k.lathe([[r0 - 3.2, y], [R + 3.2, y], [R + 3.2, y + t], [r0 - 3.2, y + t]], 0, 0, 192);
  }
  // The glass between, set back under the canopies.
  k.lathe([[R - 0.5, 0], [R - 0.5, N * FL]], 0, 0, 192);
  k.lathe([[r0 + 0.5, N * FL], [r0 + 0.5, 0]], 0, 0, 192);
  // Rooflights over the atria, a regular rhythm round the ring.
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const rm = R - W / 2;
    k.box(Math.cos(a) * rm, N * FL + 0.9, Math.sin(a) * rm, 6, 1.2, 18, -a);
  }
  // The pond in the courtyard, the orchard's paths, and the central green.
  k.prism(circle(r0 - 12, 128), -0.2, 0.2);
  k.prism([[-30, -40], [10, -60], [40, -20], [10, 10], [-25, 0]] as P2[], 0, 0.15);
  k.prism(circle(16, 48, 60, 60), 0, 0.25);
}

export default { title: 'Apple Park', build } satisfies ModelInfo;
