// Kimbell Art Museum, Fort Worth (Louis Kahn, 1972). Sixteen cycloid vaults, each about
// 31 m long and 7 m wide, side by side in three wings: six to the north, six to the
// south, four in the middle round the entrance court. A slit of skylight runs along every
// crown; the westernmost vault of each outer wing is an open portico. Between the vaults,
// flat concrete channels; at their ends, the glazed lunettes.
import { type Kit, type ModelInfo, type P2 } from '../kit';

const SPAN = 6.1; // shell
const PITCH = 7.0; // centre to centre, with the channel between
const LEN = 31; // north–south
const SPRING = 3.7; // top of the walls, where the vault springs
const RISE = 3.1;

function cycloid(n = 24, gap = 0.45): P2[][] {
  // Two halves of the shell, either side of the skylight slit, as [u, y] profiles.
  const a = SPAN / (2 * Math.PI);
  const half = (from: number, to: number): P2[] => {
    const out: P2[] = [];
    for (let i = 0; i <= n; i++) {
      const t = from + ((to - from) * i) / n;
      out.push([a * (t - Math.sin(t)) - SPAN / 2, SPRING + (RISE / (2 * a)) * a * (1 - Math.cos(t))]);
    }
    return out;
  };
  const tSlit = Math.PI - (gap / SPAN) * Math.PI;
  return [half(0, tSlit), half(Math.PI * 2 - tSlit, Math.PI * 2).reverse()];
}

function vault(k: Kit, x: number, z0: number, open: boolean) {
  const t = 0.18;
  for (const side of cycloid()) {
    // Thicken each half into a shell and extrude it along the vault.
    const outline: P2[] = [...side, ...side.slice().reverse().map(([u, y]): P2 => [u * (1 - t / SPAN), y - t])];
    k.fin(outline.map(([u, y]): P2 => [u + x, y]), LEN, 0, [0, z0 + LEN / 2]);
  }
  // Edge beams along the springing.
  for (const s of [-1, 1]) k.box(x + (s * SPAN) / 2, SPRING - 0.6, z0 + LEN / 2, 0.5, 0.6, LEN);
  if (open) {
    // A portico: just the columns at the corners.
    for (const s of [-1, 1]) for (const z of [z0 + 0.3, z0 + LEN - 0.3]) k.box(x + (s * SPAN) / 2, 0, z, 0.6, SPRING - 0.6, 0.6);
  } else {
    for (const s of [-1, 1]) k.box(x + (s * SPAN) / 2, 0, z0 + LEN / 2, 0.45, SPRING - 0.6, LEN - 1.2);
    // End walls of travertine with a glass lunette under the arch.
    for (const z of [z0 + 0.2, z0 + LEN - 0.2]) k.box(x, 0, z, SPAN, SPRING - 0.6, 0.4);
  }
}

function build(k: Kit) {
  const x0 = -2.5 * PITCH;
  const wings: [number, number[]][] = [
    [-LEN - 2.0, [0, 1, 2, 3, 4, 5]], // north
    [2.0, [0, 1, 2, 3, 4, 5]], // south
  ];
  for (const [z0, cols] of wings) for (const c of cols) vault(k, x0 + c * PITCH, z0, c === 0);
  // The middle wing: four vaults round the entrance, shorter, east of the court.
  for (const c of [2, 3, 4, 5]) vault(k, x0 + c * PITCH, -LEN / 2 + 0.5 - 0.25, false);
  // The channels between vaults, flat roofs at the springing.
  for (let c = 0; c < 5; c++) k.box(x0 + (c + 0.5) * PITCH, SPRING - 0.2, 0, PITCH - SPAN + 0.3, 0.2, LEN * 2 + 4);
  // Podium, the entrance court's lawn and the reflecting pools before the porticoes.
  k.box(0, -0.3, 0, PITCH * 6 + 12, 0.3, LEN * 2 + 10);
  k.box(x0 - PITCH * 1.4, -0.05, -LEN / 2 - 2, 4, 0.1, LEN - 6);
  k.box(x0 - PITCH * 1.4, -0.05, LEN / 2 + 2, 4, 0.1, LEN - 6);
}

export default { title: 'Kimbell Art Museum', build } satisfies ModelInfo;
