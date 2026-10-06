// Downloads the curated Sketchfab models and turns them into light clay-ready GLBs.
// Usage: SKETCHFAB_TOKEN=… npm run models
// Output: public/models/<qid>.glb (geometry only, simplified, meshopt-compressed)
//         scripts/models.json (what was built, for build-data.mjs)
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { center, compactPrimitive, dedup, flatten, getBounds, join, meshopt, prune, simplify, weld } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import { MODELS } from './models.mjs';

const TOKEN = process.env.SKETCHFAB_TOKEN;
if (!TOKEN) {
  console.error('Set SKETCHFAB_TOKEN (Sketchfab → Settings → Password & API).');
  process.exit(1);
}

const CACHE = new URL('../.cache/models/', import.meta.url);
const OUT = new URL('../public/models/', import.meta.url);
const MAX_TRIANGLES = 150_000;

await mkdir(CACHE, { recursive: true });
await mkdir(OUT, { recursive: true });
await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });

const exists = (u) => stat(u).then(() => true, () => false);

async function download(qid, uid) {
  const raw = new URL(`${qid}.glb`, CACHE);
  if (await exists(raw)) return raw;
  const res = await fetch(`https://api.sketchfab.com/v3/models/${uid}/download`, {
    headers: { Authorization: `Token ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`download info ${res.status}`);
  const info = await res.json();
  if (!info.glb?.url) throw new Error('no GLB offered');
  const file = await fetch(info.glb.url);
  if (!file.ok) throw new Error(`GLB ${file.status}`);
  await writeFile(raw, Buffer.from(await file.arrayBuffer()));
  return raw;
}

const triangles = (doc) =>
  doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0);

/** Keep triangles whose centre lies within r of (x, z) in plan, in world space. */
function cropTo(doc, { x, z, r, maxEdge }) {
  for (const node of doc.getRoot().listNodes().filter((n) => n.getMesh())) {
    const m = node.getWorldMatrix();
    for (const prim of node.getMesh().listPrimitives()) {
      const pos = prim.getAttribute('POSITION');
      const idx = prim.getIndices();
      if (!idx) continue;
      const kept = [];
      const a = [0, 0, 0];
      const w = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (let i = 0; i < idx.getCount(); i += 3) {
        for (let k = 0; k < 3; k++) {
          pos.getElement(idx.getScalar(i + k), a);
          // Column-major 4x4: world = M · local.
          for (let j = 0; j < 3; j++) w[k][j] = m[j] * a[0] + m[4 + j] * a[1] + m[8 + j] * a[2] + m[12 + j];
        }
        const cx = (w[0][0] + w[1][0] + w[2][0]) / 3;
        const cz = (w[0][2] + w[1][2] + w[2][2]) / 3;
        if (Math.hypot(cx - x, cz - z) > r) continue;
        // Terrain shards: triangles far longer than any building edge.
        const edge = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
        if (maxEdge && Math.max(edge(w[0], w[1]), edge(w[1], w[2]), edge(w[2], w[0])) > maxEdge) continue;
        kept.push(idx.getScalar(i), idx.getScalar(i + 1), idx.getScalar(i + 2));
      }
      if (!kept.length) {
        prim.dispose();
        continue;
      }
      idx.setArray(new Uint32Array(kept));
      compactPrimitive(prim);
    }
  }
}

async function toClay(qid, raw, opts = {}) {
  const doc = await io.read(raw.pathname);
  const root = doc.getRoot();
  // Clay: geometry only. Drop textures, materials, animation and skins.
  for (const t of root.listTextures()) t.dispose();
  for (const m of root.listMaterials()) m.dispose();
  for (const a of root.listAnimations()) a.dispose();
  for (const s of root.listSkins()) s.dispose();
  for (const p of root.listMeshes().flatMap((m) => m.listPrimitives())) {
    for (const sem of p.listSemantics()) if (sem !== 'POSITION' && sem !== 'NORMAL') p.setAttribute(sem, null);
    if (p.getMode() !== 4) p.dispose(); // keep triangles only (no lines/points)
  }
  const meshNodes = root.listNodes().filter((n) => n.getMesh());
  const extent = (n) => {
    const b = getBounds(n);
    return Math.max(...b.max.map((v, i) => v - b.min[i]));
  };
  // Scenery (terrain skirts, sky shells) dwarfs the building: drop oversized parts.
  if (opts.maxNodeSize) for (const n of meshNodes) if (extent(n) > opts.maxNodeSize) n.dispose();
  // The most detailed part is the building; crop around it.
  let focus = null;
  if (opts.crop) {
    const tris = (n) => n.getMesh().listPrimitives().reduce((t, p) => t + (p.getIndices()?.getCount() ?? 0), 0);
    const hero = root.listNodes().filter((n) => n.getMesh()).sort((a, b) => tris(b) - tris(a))[0];
    const hb = getBounds(hero);
    const sb = getBounds(root.listScenes()[0]);
    focus = {
      x: (hb.min[0] + hb.max[0]) / 2,
      z: (hb.min[2] + hb.max[2]) / 2,
      r: opts.crop * Math.max(sb.max[0] - sb.min[0], sb.max[2] - sb.min[2]),
    };
    if (opts.maxEdge) focus.maxEdge = opts.maxEdge * focus.r;
  }
  if (focus) cropTo(doc, focus);
  await doc.transform(prune(), dedup(), flatten(), join(), weld());
  const before = triangles(doc);
  // Simplify within a small error first; loosen it until the model fits the budget.
  for (const error of [0.002, 0.005, 0.01, 0.02]) {
    const now = triangles(doc);
    if (now <= MAX_TRIANGLES * 1.15) break;
    await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: MAX_TRIANGLES / now, error }));
  }
  await doc.transform(center({ pivot: 'below' }), prune());
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: 'quantize' });
  await doc.transform(meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  const out = new URL(`${qid}.glb`, OUT);
  await io.write(out.pathname, doc);
  return { before: Math.round(before), after: Math.round(triangles(doc)), bytes: (await stat(out)).size };
}

const built = {};
for (const [qid, m] of Object.entries(MODELS)) {
  try {
    const raw = await download(qid, m.uid);
    const r = await toClay(qid, raw, m);
    built[qid] = { src: `/models/${qid}.glb`, ...r };
    console.log(`✓ ${qid.padEnd(11)} ${m.title.slice(0, 32).padEnd(32)} ${String(r.before).padStart(8)} → ${String(r.after).padStart(7)} tris  ${(r.bytes / 1e6).toFixed(2)} MB`);
  } catch (e) {
    console.log(`✗ ${qid.padEnd(11)} ${m.title.slice(0, 32).padEnd(32)} ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 500));
}
const manifest = new URL('./models.json', import.meta.url);
const previous = (await exists(manifest)) ? JSON.parse(await readFile(manifest, 'utf8')) : {};
await writeFile(manifest, JSON.stringify({ ...previous, ...built }, null, 1) + '\n');
