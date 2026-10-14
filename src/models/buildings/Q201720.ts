// Cathedral of Brasília (Oscar Niemeyer, 1970). Sixteen boomerang-shaped concrete columns,
// about 90 tonnes each, rise from a 60 m circle, pinch together into a ring and open
// again like hands at prayer. Glass fills the hyperboloid between them; the entrance is
// a ramp down below the reflecting pool.
import { circle, type Kit, type ModelInfo, type P2 } from '../kit';

const N = 16;
const R0 = 30; // feet of the columns
const WAIST = 6.4; // narrowest radius, just above the ring
const YW = 26;
const RING = 23.5; // the ring beam that ties the columns
const TIP = 33.5;
// The columns trace a hyperboloid of one sheet: r² = a² + c²(y − y0)².
const C = Math.sqrt(R0 ** 2 - WAIST ** 2) / YW;
const hyper = (y: number) => Math.sqrt(WAIST ** 2 + (C * (y - YW)) ** 2);

function build(k: Kit) {
  // Each column, drawn in its radial plane (u out from the axis, y up): its outer edge on
  // the hyperbola, standing proud of the glass; deepest near the ring, sharp at the tip.
  const depth = (y: number) => 0.9 + 2.2 * Math.sin(Math.min(1, y / YW) * Math.PI * 0.5) ** 2;
  const column: P2[] = [];
  for (let n = 0; n <= 48; n++) {
    const y = (n / 48) * TIP;
    column.push([hyper(y) + 1.6, y]);
  }
  for (let n = 48; n >= 0; n--) {
    const y = (n / 48) * TIP;
    const d = y > YW ? depth(YW) * (1 - (y - YW) / (TIP - YW)) ** 1.3 : depth(y);
    column.push([hyper(y) + 1.6 - Math.max(0.15, d), y]);
  }
  for (let i = 0; i < N; i++) k.fin(column, 1.6, (i / N) * Math.PI * 2);

  // The glass: the same hyperboloid a little inside, one flat pane per bay.
  const glass: P2[] = [];
  for (let n = 0; n <= 24; n++) {
    const y = (n / 24) * RING;
    glass.push([hyper(y) - 0.2, y]);
  }
  glass.push([0.01, RING + 0.4]);
  k.lathe(glass, 0, 0, N, Math.PI / N);
  // The ring that ties the columns, and the roof light within it.
  const rr = hyper(RING);
  k.lathe([[rr + 1.2, RING - 0.7], [rr + 1.2, RING + 0.5], [rr - 0.6, RING + 0.5], [rr - 0.6, RING - 0.7]], 0, 0, 48);
  // The cross.
  k.rod([0, RING, 0], [0, RING + 16, 0], 0.18, 8);
  k.rod([-2.4, RING + 13, 0], [2.4, RING + 13, 0], 0.14, 8);

  // The reflecting pool round the nave, with its low rim; the entrance ramp sinks under it.
  k.prism(circle(38, 72), 0, 0.15, [circle(35.5, 72)]);
  k.prism(circle(35.5, 72), 0, 0.05, [circle(R0 + 2.4, 72)]);
  k.prism(circle(R0 + 2.4, 72), 0, 0.3);
  k.box(36.8, -0.01, 0, 5, 0.3, 6.5);
}

export default { title: 'Cathedral of Brasília', build } satisfies ModelInfo;
