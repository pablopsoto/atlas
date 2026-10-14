// Clay focus view: a curated model of the work rendered like a physical architectural
// model — matte plaster, soft shadow, ink edges, a hairline site circle. Loaded on demand.
import {
  Box3,
  BoxGeometry,
  BufferGeometry,
  Color,
  DoubleSide,
  DirectionalLight,
  EdgesGeometry,
  Euler,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  RingGeometry,
  Scene,
  ShadowMaterial,
  Sphere,
  Vector3,
  WebGLRenderer,
  MeshBasicMaterial,
  type Object3D,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { ModelRef } from '../data';
/** Screen space taken by panels, so the model centres in what's left. */
export interface Viewport {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface ClayTheme {
  paper: string;
  clay: string;
  ink: string;
}

/** Models are normalised so their larger plan dimension is this many units. */
const SIZE = 100;
/** Height of the base every model stands on. */
const PLINTH = 1.6;

export function createClay(container: HTMLElement) {
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  container.append(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.5, 5000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.maxPolarAngle = MathUtils.degToRad(86);
  controls.autoRotateSpeed = 0.7;
  controls.addEventListener('start', () => (controls.autoRotate = false));

  // Double-sided: some downloaded models are open shells.
  const clay = new MeshStandardMaterial({ color: '#efece6', roughness: 0.92, metalness: 0, side: DoubleSide });
  const edges = new LineBasicMaterial({ color: '#000', transparent: true, opacity: 0.22 });
  const site = new MeshBasicMaterial({ color: '#121211', transparent: true, opacity: 0.5 });

  scene.add(new HemisphereLight('#ffffff', '#d8d4cc', 1.7));
  const sun = new DirectionalLight('#ffffff', 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0005;
  sun.shadow.radius = 6;
  scene.add(sun, sun.target);

  const ground = new Mesh(new PlaneGeometry(SIZE * 8, SIZE * 8), new ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const ring = new Mesh(new RingGeometry(1, 1.004, 160), site);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  scene.add(ring);

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  let model: Object3D | null = null;
  let token = 0;
  let running = false;
  let viewport: Viewport = { left: 0, right: 0, top: 0, bottom: 0 };
  let intro: { from: Vector3; to: Vector3; start: number } | null = null;
  const readyListeners = new Set<() => void>();
  const errorListeners = new Set<(e: unknown) => void>();

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.setViewOffset(w, h, (viewport.right - viewport.left) / 2, (viewport.bottom - viewport.top) / 2, w, h);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);

  function dispose(o: Object3D) {
    o.traverse((c) => {
      if (c instanceof Mesh || c instanceof LineSegments) (c.geometry as BufferGeometry).dispose();
    });
  }

  function frame(now: number) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (intro) {
      const t = Math.min(1, (now - intro.start) / 1800);
      camera.position.lerpVectors(intro.from, intro.to, 1 - (1 - t) ** 3);
      camera.lookAt(controls.target);
      if (t >= 1) {
        intro = null;
        controls.enabled = true;
        controls.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      }
    } else {
      controls.update();
    }
    renderer.render(scene, camera);
  }

  return {
    domElement: renderer.domElement,

    async show(ref: ModelRef, vp: Viewport, bearing: number) {
      const my = ++token;
      viewport = vp;
      resize();
      controls.enabled = false;
      let inner: Object3D;
      try {
        inner = ref.code ? await import('../models/catalogue').then((m) => m.buildModel(ref.code!)) : (await loader.loadAsync(ref.src!)).scene;
      } catch (e) {
        if (my === token) errorListeners.forEach((l) => l(e));
        return;
      }
      if (my !== token) return;
      if (model) {
        scene.remove(model);
        dispose(model);
      }

      const root = new Group();
      if (ref.rotate) inner.rotation.copy(new Euler(...ref.rotate.map((d) => MathUtils.degToRad(d)) as [number, number, number]));
      root.add(inner);

      // Normalise: larger plan dimension = SIZE, sitting on the ground, centred.
      let box = new Box3().setFromObject(root);
      const plan = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) || 1;
      root.scale.setScalar(SIZE / plan);
      box = new Box3().setFromObject(root);
      const c = box.getCenter(new Vector3());
      root.position.set(-c.x, -box.min.y, -c.z);

      inner.traverse((o) => {
        if (!(o instanceof Mesh)) return;
        if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
        o.material = clay;
        o.castShadow = o.receiveShadow = true;
        // Ink the creases, like pencil on a white model.
        o.add(new LineSegments(new EdgesGeometry(o.geometry, 30), edges));
      });
      // Every model stands on the same plinth, like pieces of one collection.
      box = new Box3().setFromObject(root);
      const pw = (box.max.x - box.min.x) * 1.1 + SIZE * 0.04;
      const pd = (box.max.z - box.min.z) * 1.1 + SIZE * 0.04;
      const plinth = new Mesh(new BoxGeometry(pw, PLINTH, pd), clay);
      plinth.position.set((box.min.x + box.max.x) / 2, PLINTH / 2, (box.min.z + box.max.z) / 2);
      plinth.castShadow = plinth.receiveShadow = true;
      plinth.add(new LineSegments(new EdgesGeometry(plinth.geometry, 30), edges));
      root.position.y += PLINTH;
      const holder = new Group();
      holder.add(root, plinth);
      scene.add(holder);
      model = holder;

      box = new Box3().setFromObject(holder);
      const sphere = box.getBoundingSphere(new Sphere());
      const height = box.max.y - box.min.y;
      ring.scale.setScalar(sphere.radius * 1.12);
      sun.position.set(-sphere.radius * 1.2, sphere.radius * 2.2, sphere.radius * 1.4);
      Object.assign(sun.shadow.camera, {
        left: -sphere.radius * 1.5,
        right: sphere.radius * 1.5,
        top: sphere.radius * 1.5,
        bottom: -sphere.radius * 1.5,
        far: sphere.radius * 8,
      });
      sun.shadow.camera.updateProjectionMatrix();

      // Aim at the middle of the model, so towers fit as well as low, wide buildings.
      controls.target.set(0, height * 0.42, 0);
      const dist = (sphere.radius / Math.sin(MathUtils.degToRad(camera.fov / 2))) * 1.08;
      controls.minDistance = sphere.radius * 0.9;
      controls.maxDistance = dist * 3;
      // Same convention as the map: look along its bearing, from the south when north-up.
      const az = MathUtils.degToRad(bearing);
      const polar = MathUtils.degToRad(69);
      const eye = new Vector3(-Math.sin(az), 0, Math.cos(az))
        .multiplyScalar(Math.sin(polar) * dist)
        .setY(Math.cos(polar) * dist + controls.target.y);
      intro = { from: new Vector3(0, dist * 2.2, 0.01), to: eye, start: performance.now() };
      camera.position.copy(intro.from);
      if (!running) {
        running = true;
        requestAnimationFrame(frame);
      }
      readyListeners.forEach((l) => l());
    },

    /** Dev: put the camera at a given bearing and elevation (degrees), distance × zoom. */
    setView(azDeg: number, polarDeg: number, zoom = 1) {
      intro = null;
      controls.autoRotate = false;
      const d = camera.position.distanceTo(controls.target) * zoom;
      const az = MathUtils.degToRad(azDeg);
      const polar = MathUtils.degToRad(polarDeg);
      camera.position.set(-Math.sin(az) * Math.sin(polar) * d, controls.target.y + Math.cos(polar) * d, Math.cos(az) * Math.sin(polar) * d);
      camera.lookAt(controls.target);
      controls.update();
    },

    hide() {
      token++;
      running = false;
      controls.enabled = false;
    },

    setViewport(vp: Viewport) {
      viewport = vp;
      resize();
    },

    setTheme(t: ClayTheme) {
      scene.background = new Color(t.paper);
      clay.color.set(t.clay);
      site.color.set(t.ink);
    },

    onReady(l: () => void) {
      readyListeners.add(l);
    },
    onError(l: (e: unknown) => void) {
      errorListeners.add(l);
    },
  };
}

export type Clay = ReturnType<typeof createClay>;
