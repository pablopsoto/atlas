// MAXXI, National Museum of 21st Century Arts, Rome (Zaha Hadid, 2010). Long curving bands
// of fair-faced concrete that run side by side, cross over and stack, their roofs combed
// with skylight fins; at the entrance the topmost gallery shoots out over the piazza and
// ends in a great window, above a hall on slender steel columns.
import { type Kit, type ModelInfo, type P2 } from '../kit';

/** A band: a strip of plan along a path, w wide, from y up h. */
function band(k: Kit, path: P2[], w: number, y: number, h: number, fins = true) {
  const left: P2[] = [];
  const right: P2[] = [];
  for (let i = 0; i < path.length; i++) {
    const a = path[Math.max(0, i - 1)];
    const b = path[Math.min(path.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const l = Math.hypot(dx, dz);
    left.push([path[i][0] - (dz / l) * (w / 2), path[i][1] + (dx / l) * (w / 2)]);
    right.push([path[i][0] + (dz / l) * (w / 2), path[i][1] - (dx / l) * (w / 2)]);
  }
  k.prism([...left, ...right.reverse()], y, h);
  if (!fins) return;
  // Skylight fins across the roof, at right angles to the band.
  for (let i = 1; i < path.length - 1; i++) {
    const [ax, az] = path[i - 1];
    const [bx, bz] = path[i + 1];
    const l = Math.hypot(bx - ax, bz - az);
    const nx = -(bz - az) / l;
    const nz = (bx - ax) / l;
    k.bar([path[i][0] - nx * (w / 2 - 0.6), path[i][1] - nz * (w / 2 - 0.6)], [path[i][0] + nx * (w / 2 - 0.6), path[i][1] + nz * (w / 2 - 0.6)], y + h, 0.9, 0.18);
  }
}

const arc = (cx: number, cz: number, r: number, a0: number, a1: number, n = 24): P2[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + Math.cos(a) * r, cz + Math.sin(a) * r];
  });

function build(k: Kit) {
  // The long ground-floor band curving across the site from the west.
  band(k, [[-90, -20], [-60, -18], ...arc(-20, 40, 60, -1.6, -0.6, 10), [40, 8]], 16, 0, 7.5);
  // A second band beside it, a storey up at its far end.
  band(k, [[-80, -42], [-40, -40], ...arc(10, 30, 70, -1.4, -0.75, 10)], 14, 0, 14);
  // The upper gallery: rising over the others and cantilevering out over the piazza.
  band(k, [[-70, -30], [-30, -28], ...arc(0, 30, 58, -1.55, -1.0, 8), [26, -14], [40, -6]], 13, 14, 7.5);
  // Its great window at the end, set into the cantilever.
  k.box(40.5, 15, -6.5, 0.4, 5.6, 10);
  // The hall under it, glazed, with its slender steel columns.
  for (let i = 0; i < 9; i++) k.cyl(18 + i * 2.2, 0, -2 + (i % 2) * 1.2, 0.18, 14, 10);
  k.box(14, 0, -10, 18, 6, 0.3);
  // The old barracks building kept on the site, and the piazza.
  k.box(-40, 0, 26, 40, 13, 14);
  k.box(-10, -0.3, 0, 150, 0.3, 90);
}

export default { title: 'MAXXI', build } satisfies ModelInfo;
