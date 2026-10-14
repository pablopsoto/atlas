// Chapel on the Water, Tomamu, Hokkaido (Tadao Ando, 1988). Two cubes of concrete, one
// above the other's corner: the chapel, 15 m square, opens its whole glass wall onto a
// shallow pond where a steel cross stands in the water; above, a glass box holds four
// concrete crosses. An L-shaped wall wraps the approach.
import { rect, type Kit, type ModelInfo } from '../kit';

const S = 15; // the chapel
const H = 7.2;
const T = 0.35;

function build(k: Kit) {
  // The chapel box: three walls and a roof; the fourth side (east, toward the pond) is glass.
  k.box(-S / 2 + T / 2, 0, 0, T, H, S);
  k.box(0, 0, -S / 2 + T / 2, S, H, T);
  k.box(0, 0, S / 2 - T / 2, S, H, T);
  k.box(0, H - T, 0, S, T, S);
  k.glazing([S / 2 - 0.1, -S / 2 + T], [S / 2 - 0.1, S / 2 - T], 0, H - T, 3.6, { bar: 0.12, inset: 0, transoms: [5.8] });
  // The upper glass cube with its four crosses, set at the back corner.
  const c = 10;
  const cx = -S / 2 + c / 2 - 2;
  const cz = -S / 2 + c / 2 - 2;
  k.box(cx, H, cz, c, 0.3, c);
  for (const [x, z, w, d] of [[cx, cz - c / 2, c, 0.08], [cx, cz + c / 2, c, 0.08], [cx - c / 2, cz, 0.08, c], [cx + c / 2, cz, 0.08, c]]) k.box(x, H + 0.3, z, w, c - 0.6, d);
  for (const [x, z] of [[cx - c / 2, cz - c / 2], [cx + c / 2, cz - c / 2], [cx - c / 2, cz + c / 2], [cx + c / 2, cz + c / 2]]) k.box(x, H + 0.3, z, 0.25, c - 0.3, 0.25);
  k.box(cx, H + c - 0.3, cz, c, 0.25, c);
  // Four free-standing crosses inside it.
  for (const [x, z] of [[cx - 2.4, cz - 2.4], [cx + 2.4, cz - 2.4], [cx - 2.4, cz + 2.4], [cx + 2.4, cz + 2.4]]) {
    k.box(x, H + 0.3, z, 0.35, 6.2, 0.35);
    k.box(x, H + 4.5, z, 2.6, 0.35, 0.35);
  }
  // The pond: a wide shallow basin stepping down as a cascade, and the cross in it.
  k.prism(rect(45, 34, S / 2 + 22.5, 0), -0.4, 0.05);
  k.box(S / 2 + 22.5, -0.4, 17.4, 45, 0.6, 0.6);
  k.box(S / 2 + 22.5, -0.4, -17.4, 45, 0.6, 0.6);
  for (let i = 0; i < 4; i++) k.box(S / 2 + 45 + i * 1.6, -0.6 - i * 0.3, 0, 1.6, 0.2, 34);
  k.box(S / 2 + 20, -0.4, 0, 0.45, 10.4, 0.45);
  k.box(S / 2 + 20, 6.4, 0, 0.45, 0.45, 5.6);
  // The L-shaped wall guiding the approach round the back.
  k.wall([[-S / 2 - 4, S / 2 + 6], [-S / 2 - 4, -S / 2 - 4], [S / 2 + 30, -S / 2 - 4]], 0, 2.7, 0.35);
}

export default { title: 'Chapel on the Water', build } satisfies ModelInfo;
