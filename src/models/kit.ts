// A small modelling kit for building architectural models in code, in metres.
// Plan coordinates are (x, z) with north towards -z; y is up. Every part is plain geometry:
// the clay viewer gives them all the same plaster, light and ink.
import {
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Matrix4,
  Mesh,
  Path,
  Shape,
  TubeGeometry,
  Vector2,
  Vector3,
  BoxGeometry,
  Float32BufferAttribute,
  SphereGeometry,
  Quaternion,
  Euler,
} from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export type P2 = [number, number];
export type P3 = [number, number, number];

// ——— Plan shapes ———

export const rect = (w: number, d: number, cx = 0, cz = 0): P2[] => [
  [cx - w / 2, cz - d / 2],
  [cx + w / 2, cz - d / 2],
  [cx + w / 2, cz + d / 2],
  [cx - w / 2, cz + d / 2],
];

export const circle = (r: number, n = 48, cx = 0, cz = 0, a0 = 0, a1 = Math.PI * 2): P2[] => {
  const full = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6;
  const m = full ? n : n + 1;
  return Array.from({ length: m }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + Math.cos(a) * r, cz + Math.sin(a) * r];
  });
};

/** A rectangle with rounded corners (radius r), as a plan outline. */
export function roundRect(w: number, d: number, r: number, cx = 0, cz = 0, n = 6): P2[] {
  const out: P2[] = [];
  const corners: [number, number, number][] = [
    [cx + w / 2 - r, cz - d / 2 + r, -Math.PI / 2],
    [cx + w / 2 - r, cz + d / 2 - r, 0],
    [cx - w / 2 + r, cz + d / 2 - r, Math.PI / 2],
    [cx - w / 2 + r, cz - d / 2 + r, Math.PI],
  ];
  for (const [x, z, a0] of corners) for (let i = 0; i <= n; i++) out.push([x + Math.cos(a0 + (i / n) * (Math.PI / 2)) * r, z + Math.sin(a0 + (i / n) * (Math.PI / 2)) * r]);
  return out;
}

/** An annulus sector as a closed outline (for curved slabs and walls). */
export const ringSector = (r0: number, r1: number, a0: number, a1: number, n = 48, cx = 0, cz = 0): P2[] => [
  ...circle(r1, n, cx, cz, a0, a1),
  ...circle(r0, n, cx, cz, a0, a1).reverse(),
];

/** Points along a polyline, every `step` metres (for repeating mullions or columns). */
export function along(path: P2[], step: number, inset = 0): P2[] {
  const out: P2[] = [];
  let carry = inset;
  for (let i = 1; i < path.length; i++) {
    const [ax, az] = path[i - 1];
    const [bx, bz] = path[i];
    const len = Math.hypot(bx - ax, bz - az);
    for (let t = carry; t <= len + 1e-6; t += step) out.push([ax + ((bx - ax) * t) / len, az + ((bz - az) * t) / len]);
    carry = (step - ((len - carry) % step)) % step;
  }
  return out;
}

function toShape(outline: P2[], holes: P2[][] = []) {
  // Shapes live in the XY plane; we extrude along Z and turn it to stand on the ground.
  // (x, z) → shape (x, -z) so the extrusion, rotated -90° about X, lands back on (x, z).
  const s = new Shape(outline.map(([x, z]) => new Vector2(x, -z)));
  for (const h of holes) s.holes.push(new Path(h.map(([x, z]) => new Vector2(x, -z))));
  return s;
}

// ——— The kit ———

export class Kit {
  private parts: BufferGeometry[] = [];

  /** Add a geometry, optionally transformed. */
  add(g: BufferGeometry, m?: Matrix4) {
    if (m) g.applyMatrix4(m);
    // Merging needs every part to carry the same attributes.
    g.deleteAttribute('uv');
    if (g.index) g = g.toNonIndexed();
    this.parts.push(g);
    return this;
  }

  /** A box by its plan centre and the height of its underside. ry turns it in plan (radians). */
  box(cx: number, y: number, cz: number, w: number, h: number, d: number, ry = 0) {
    const m = new Matrix4().compose(new Vector3(cx, y + h / 2, cz), new Quaternion().setFromEuler(new Euler(0, ry, 0)), new Vector3(1, 1, 1));
    return this.add(new BoxGeometry(w, h, d), m);
  }

  /** A box between two plan points (a wall, a beam, a fin): thickness t, from y up h. */
  bar(a: P2, b: P2, y: number, h: number, t: number) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 1e-6) return this;
    return this.box((a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2, len, h, t, -Math.atan2(b[1] - a[1], b[0] - a[0]));
  }

  /** A wall along a polyline. */
  wall(path: P2[], y: number, h: number, t: number) {
    for (let i = 1; i < path.length; i++) this.bar(path[i - 1], path[i], y, h, t);
    return this;
  }

  /** A plan outline (with optional holes) extruded from y up h. */
  prism(outline: P2[], y: number, h: number, holes: P2[][] = []) {
    const g = new ExtrudeGeometry(toShape(outline, holes), { depth: h, bevelEnabled: false, curveSegments: 24 });
    return this.add(g, new Matrix4().makeTranslation(0, y, 0).multiply(new Matrix4().makeRotationX(-Math.PI / 2)));
  }

  /** A vertical cylinder (a column, a drum). */
  cyl(cx: number, y: number, cz: number, r: number, h: number, seg = 24, r1 = r) {
    return this.add(new CylinderGeometry(r1, r, h, seg), new Matrix4().makeTranslation(cx, y + h / 2, cz));
  }

  /** A solid of revolution about a vertical axis: profile points are [radius, y]. */
  lathe(profile: P2[], cx = 0, cz = 0, seg = 64, phi0 = 0, phi = Math.PI * 2) {
    return this.add(new LatheGeometry(profile.map(([r, y]) => new Vector2(r, y)), seg, phi0, phi), new Matrix4().makeTranslation(cx, 0, cz));
  }

  /** A round bar along a 3D path. */
  tube(points: P3[], r: number, seg = 64, radial = 8, closed = false) {
    const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)), closed, 'catmullrom', 0.0);
    return this.add(new TubeGeometry(curve, seg, r, radial, closed));
  }

  /** A straight round bar between two 3D points. */
  rod(a: P3, b: P3, r: number, radial = 8) {
    const A = new Vector3(...a);
    const B = new Vector3(...b);
    const len = A.distanceTo(B);
    const g = new CylinderGeometry(r, r, len, radial);
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), B.clone().sub(A).normalize());
    return this.add(g, new Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), q, new Vector3(1, 1, 1)));
  }

  /** A square-section bar between two 3D points (a steel member, a mullion seen at a slant). */
  beam(a: P3, b: P3, w: number, h = w) {
    const A = new Vector3(...a);
    const B = new Vector3(...b);
    const len = A.distanceTo(B);
    const g = new BoxGeometry(w, len, h);
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), B.clone().sub(A).normalize());
    return this.add(g, new Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), q, new Vector3(1, 1, 1)));
  }

  sphere(c: P3, r: number, seg = 32, cut = Math.PI) {
    return this.add(new SphereGeometry(r, seg, seg / 2, 0, Math.PI * 2, 0, cut), new Matrix4().makeTranslation(...c));
  }

  /** Columns at plan points. Round when r is a number, square when given [w, d]. */
  columns(points: P2[], y: number, h: number, size: number | [number, number], seg = 16) {
    for (const [x, z] of points) {
      if (typeof size === 'number') this.cyl(x, y, z, size, h, seg);
      else this.box(x, y, z, size[0], h, size[1]);
    }
    return this;
  }

  /**
   * Glazing on a straight face from a to b: a thin pane set back from the face, with
   * mullions every `every` metres and transoms at the given heights.
   */
  glazing(a: P2, b: P2, y: number, h: number, every: number, opts: { transoms?: number[]; bar?: number; depth?: number; inset?: number } = {}) {
    const bar = opts.bar ?? 0.08;
    const depth = opts.depth ?? 0.12;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ux = (b[0] - a[0]) / len;
    const uz = (b[1] - a[1]) / len;
    // Inward normal (to the left of a→b) sets the pane back a little.
    const nx = -uz;
    const nz = ux;
    const inset = opts.inset ?? 0.1;
    const pa: P2 = [a[0] + nx * inset, a[1] + nz * inset];
    const pb: P2 = [b[0] + nx * inset, b[1] + nz * inset];
    this.bar(pa, pb, y, h, 0.02);
    const n = Math.max(1, Math.round(len / every));
    for (let i = 0; i <= n; i++) {
      const t = (len * i) / n;
      const p: P2 = [a[0] + ux * t, a[1] + uz * t];
      this.box(p[0], y, p[1], bar, h, depth, -Math.atan2(uz, ux));
    }
    for (const ty of opts.transoms ?? []) this.bar(a, b, y + ty - bar / 2, bar, depth);
    return this;
  }

  /**
   * The joints of formwork panels on a concrete face from a to b (outward to the right of
   * a→b), with the tie holes: Ando's 1.8 × 0.9 m grid unless told otherwise.
   */
  formwork(a: P2, b: P2, y: number, h: number, opts: { pw?: number; ph?: number; holes?: boolean } = {}) {
    const pw = opts.pw ?? 1.8;
    const ph = opts.ph ?? 0.9;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ux = (b[0] - a[0]) / len;
    const uz = (b[1] - a[1]) / len;
    const nx = uz;
    const nz = -ux;
    const off = 0.01;
    const at = (t: number): P2 => [a[0] + ux * t + nx * off, a[1] + uz * t + nz * off];
    const ry = -Math.atan2(uz, ux);
    for (let t = pw; t < len - 0.05; t += pw) {
      const [x, z] = at(t);
      this.box(x, y, z, 0.03, h, 0.03, ry);
    }
    for (let yy = y + ph; yy < y + h - 0.05; yy += ph) {
      const [x, z] = at(len / 2);
      this.box(x, yy, z, len, 0.03, 0.03, ry);
    }
    if (opts.holes ?? true) {
      for (let t = pw / 6; t < len; t += pw / 3) for (let yy = y + ph / 4; yy < y + h; yy += ph / 2) {
        const [x, z] = at(t);
        this.box(x, yy, z, 0.06, 0.06, 0.03, ry);
      }
    }
    return this;
  }

  /** A straight flight of stairs from a (bottom) to b (top), w wide, rising h. */
  stairs(a: P2, b: P2, y: number, h: number, w: number, steps?: number) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = steps ?? Math.max(2, Math.round(h / 0.17));
    const ry = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      this.box(a[0] + (b[0] - a[0]) * t, y, a[1] + (b[1] - a[1]) * t, len / n + 0.01, (h * (i + 1)) / n, w, ry);
    }
    return this;
  }

  /** A sloping slab (a ramp) from a (at ya) to b (at yb), w wide, t thick. */
  ramp(a: P2, b: P2, ya: number, yb: number, w: number, t = 0.3) {
    const A = new Vector3(a[0], ya, a[1]);
    const B = new Vector3(b[0], yb, b[1]);
    const len = A.distanceTo(B);
    const dir = B.clone().sub(A).normalize();
    const g = new BoxGeometry(len, t, w);
    // Length along the slope, width kept level, thickness square to the slope.
    const z = dir.clone().cross(new Vector3(0, 1, 0)).normalize();
    const y = z.clone().cross(dir);
    const m = new Matrix4().makeBasis(dir, y, z);
    m.setPosition(A.clone().add(B).multiplyScalar(0.5).addScaledVector(y, -t / 2));
    return this.add(g, m);
  }

  /**
   * A flat profile drawn in a vertical plane — points are [u, y], u running out from the
   * origin along the plan angle `angle` (radians) — extruded `t` thick, centred on that
   * plane. For ribs, fins, arches and columns of a curved section.
   */
  fin(profile: P2[], t: number, angle = 0, origin: P2 = [0, 0]) {
    const s = new Shape(profile.map(([u, y]) => new Vector2(u, y)));
    const g = new ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 16 });
    g.translate(0, 0, -t / 2);
    // Shape u along +x, extruded along z; turn so u points along the angle in plan.
    const m = new Matrix4().makeTranslation(origin[0], 0, origin[1]).multiply(new Matrix4().makeRotationY(-angle));
    return this.add(g, m);
  }

  /**
   * A closed solid lofted through rings of points (each ring the same length, in order
   * round the section), capped at both ends. For blobs, hulls and twisting towers.
   */
  loft(rings: P3[][], caps = true, smooth = true) {
    const n = rings[0].length;
    const pos: number[] = [];
    const tri = (a: P3, b: P3, c: P3) => pos.push(...a, ...b, ...c);
    for (let j = 1; j < rings.length; j++) {
      const A = rings[j - 1];
      const B = rings[j];
      for (let i = 0; i < n; i++) {
        const i1 = (i + 1) % n;
        tri(A[i], A[i1], B[i1]);
        tri(A[i], B[i1], B[i]);
      }
    }
    if (caps) {
      for (const [ring, flip] of [[rings[0], true], [rings[rings.length - 1], false]] as [P3[], boolean][]) {
        const c = ring.reduce((s, p) => [s[0] + p[0] / n, s[1] + p[1] / n, s[2] + p[2] / n] as P3, [0, 0, 0] as P3);
        for (let i = 0; i < n; i++) flip ? tri(c, ring[(i + 1) % n], ring[i]) : tri(c, ring[i], ring[(i + 1) % n]);
      }
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    if (!smooth) {
      g.computeVertexNormals();
      return this.add(g);
    }
    // Shared vertices, so curved skins shade smooth.
    const merged = mergeVertices(g, 1e-5);
    merged.computeVertexNormals();
    return this.add(merged);
  }

  /** A sheet given by f(u, v) for u, v in [0, 1], thickened downwards by t. */
  surface(f: (u: number, v: number) => P3, nu: number, nv: number, t = 0.4) {
    const rings: P3[][] = [];
    // Build it as a loft of closed rings: across the top, back along the underside.
    for (let j = 0; j <= nv; j++) {
      const v = j / nv;
      const top = Array.from({ length: nu + 1 }, (_, i) => f(i / nu, v));
      const under = top.slice().reverse().map(([x, y, z]): P3 => [x, y - t, z]);
      rings.push([...top, ...under]);
    }
    return this.loft(rings);
  }

  /** Copy the parts added by `fn` with a transform (mirror, repeat, rotate a whole wing). */
  transformed(m: Matrix4, fn: (k: Kit) => void) {
    const k = new Kit();
    fn(k);
    for (const g of k.parts) this.parts.push(g.applyMatrix4(m));
    return this;
  }

  build(): Group {
    const group = new Group();
    if (!this.parts.length) return group;
    // One mesh for the whole model; welding lets the viewer ink only real creases.
    const merged = mergeVertices(mergeGeometries(this.parts, false)!, 1e-4);
    group.add(new Mesh(merged));
    return group;
  }
}

export interface ModelInfo {
  /** Shown in the credit line. */
  title: string;
  build: (k: Kit) => void;
}
