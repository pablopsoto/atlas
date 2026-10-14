// Dancing House, Prague (Frank Gehry and Vlado Milunić, 1996). On the corner by the
// Vltava, "Ginger": a glass tower pinched at the waist and stepping on curved legs; beside
// her "Fred": a solid cylinder crowned by a twisted steel-mesh dome. Along the river, the
// block's windows jostle out of line between undulating mouldings. River front is +z.
import { type Kit, type ModelInfo, type P3 } from '../kit';

const FL = 3.1;
const N = 8;

function build(k: Kit) {
  const H = FL * N;
  // ——— The block along the river ———
  const x0 = -4;
  const x1 = 26;
  k.box((x0 + x1) / 2, 0, -7.5, x1 - x0, H, 15);
  // Windows that don't line up: each storey shifted a little, as on the building.
  for (let f = 1; f < N; f++) {
    const shift = Math.sin(f * 1.7) * 0.6;
    for (let x = x0 + 1.6; x < x1 - 1; x += 2.6) k.box(x + shift + (f % 2) * 0.4, f * FL + 0.7, 0.05, 1.3, 1.5, 0.3);
    // The wavy moulding at every floor line.
    const wave: P3[] = Array.from({ length: 33 }, (_, i) => {
      const x = x0 + ((x1 - x0) * i) / 32;
      return [x, f * FL + 0.15 + Math.sin(i * 0.9 + f) * 0.35, 0.25];
    });
    k.tube(wave, 0.12, 64, 6);
  }
  k.box((x0 + x1) / 2, H, -7.5, x1 - x0 + 0.4, 0.5, 15.4);

  // ——— Fred: the cylinder, a little proud of the façade, and Medusa on top ———
  const fx = -1;
  const fz = -2;
  k.cyl(fx, 0, fz, 4.8, H + 0.5, 48);
  for (let f = 1; f < N; f++) for (let i = 0; i < 9; i++) {
    const a = -0.4 + (i / 8) * Math.PI * 0.9;
    k.box(fx + Math.cos(a) * 4.82, f * FL + 0.8 + ((i + f) % 2) * 0.3, fz + Math.sin(a) * 4.82, 1.1, 1.4, 0.25, -a + Math.PI / 2);
  }
  // Medusa: a dome of twisted steel bands.
  for (let i = 0; i < 14; i++) {
    const a0 = (i / 14) * Math.PI * 2;
    const band: P3[] = Array.from({ length: 9 }, (_, j) => {
      const t = j / 8;
      const a = a0 + t * 1.4;
      const r = 4.2 * Math.cos(t * 1.25) + 0.3;
      return [fx + Math.cos(a) * r, H + 0.5 + Math.sin(t * 1.4) * 5.2, fz + Math.sin(a) * r];
    });
    k.tube(band, 0.16, 16, 5);
  }

  // ——— Ginger: the glass tower at the corner, pinched at the waist ———
  const gx = -10;
  const gz = -1;
  const rings: P3[][] = [];
  for (let j = 0; j <= 16; j++) {
    const y = FL + (j / 16) * (H - FL + 1.2);
    const t = (y - FL) / (H - FL);
    const r = 4.6 - 1.7 * Math.exp(-(((t - 0.42) / 0.22) ** 2)) + t * 0.6;
    const lean = Math.sin(t * Math.PI) * 1.4;
    rings.push(Array.from({ length: 32 }, (_, i) => {
      const a = (i / 32) * Math.PI * 2;
      return [gx + lean + Math.cos(a) * r, y, gz + Math.sin(a) * r * 0.9] as P3;
    }));
  }
  k.loft(rings);
  // The steel mullion grid on her glass: verticals that follow the pinch.
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    k.tube(rings.map((ring) => {
      const n = Math.round((a / (Math.PI * 2)) * 32) % 32;
      const [x, y, z] = ring[n];
      return [gx + (x - gx) * 1.02, y, gz + (z - gz) * 1.02] as P3;
    }), 0.06, 32, 4);
  }
  // Her legs: curved columns under the open ground floor.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const lean = i % 2 ? 0.8 : -0.6;
    k.tube([[gx + Math.cos(a) * 3.8, 0, gz + Math.sin(a) * 3.4], [gx + Math.cos(a) * (4.0 + lean), FL * 0.6, gz + Math.sin(a) * 3.6], [gx + Math.cos(a) * 4.3, FL + 0.1, gz + Math.sin(a) * 3.9]], 0.32, 12, 8);
  }
  // The core behind her glass, and the pavement.
  k.box(gx + 3, 0, gz - 4, 6, H, 6);
  k.box(6, -0.2, -6, 44, 0.2, 26);
}

export default { title: 'Dancing House', build } satisfies ModelInfo;
