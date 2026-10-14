// National Congress, Brasília (Oscar Niemeyer, 1960). A long horizontal platform with, on
// its roof, the Senate's dome and the Chamber of Deputies' upturned bowl; behind, the two
// 28-storey office towers, joined halfway up into an H. A ramp climbs to the roof from
// the esplanade, and the reflecting pool lies before it.
import { rect, type Kit, type ModelInfo } from '../kit';

const PL = 8.5; // roof of the platform

function build(k: Kit) {
  // The platform: a glazed base under a deep fascia.
  k.box(0, 0, 0, 236, PL - 1.6, 76);
  k.box(0, PL - 1.6, 0, 240, 1.6, 80);
  for (let x = -116; x <= 116; x += 4) k.box(x, 0, 38.4, 0.25, PL - 1.6, 0.5);
  // The ramp from the esplanade to the roof, on the west front.
  k.ramp([-30, 100], [-30, 40], 0, PL, 8, 0.6);
  // The Senate (north): a dome.
  k.lathe([[19.5, PL], [19.5, PL + 0.6], ...Array.from({ length: 16 }, (_, i) => {
    const a = ((i + 1) / 16) * (Math.PI / 2);
    return [Math.cos(a) * 19.5, PL + 0.6 + Math.sin(a) * 11] as [number, number];
  })], -45, 0, 72);
  // The Chamber of Deputies (south): the bowl, open to the sky, on a short neck.
  k.lathe([[7, PL], [7, PL + 2.4], [14, PL + 3.4], [31, PL + 10.5], [31.8, PL + 11.4], [30.8, PL + 11.6], [14, PL + 4.6], [0.01, PL + 4.4]], 50, 0, 96);

  // The towers: two slender slabs side by side, 100 m tall, joined by a bridge block.
  const H = 100;
  for (const z of [-7.6, 7.6]) {
    k.prism(rect(14, 11, 0, z - 16), 0, H);
    // Lines of the floors, every 3.6 m, on their glass faces.
    for (let y = PL + 3.6; y < H; y += 3.6) k.box(0, y, z - 16, 14.3, 0.12, 11.3);
  }
  // The gap between them, closed at the three storeys of the bridge.
  k.box(0, 49, -16, 12, 11, 5);
  k.box(0, H, -16, 14, 1.4, 27);

  // The reflecting pool on the esplanade side.
  k.box(0, -0.05, 64, 200, 0.1, 40);
}

export default { title: 'National Congress', build } satisfies ModelInfo;
