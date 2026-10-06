// Photorealistic focus view: Google's photogrammetry around one work, the building kept
// solid and its surroundings dissolved into the paper. Loaded on demand.
import {
  Color,
  MathUtils,
  Mesh,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Sphere,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D,
  type WebGLProgramParametersWithUniforms,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { CesiumIonAuthPlugin, GoogleCloudAuthPlugin } from '3d-tiles-renderer/core/plugins';
import { TilesRenderer } from '3d-tiles-renderer/three';
import {
  GLTFExtensionsPlugin,
  LoadRegionPlugin,
  ReorientationPlugin,
  SphereRegion,
  TileCompressionPlugin,
} from '3d-tiles-renderer/three/plugins';
import type { TileBoundingVolume } from '3d-tiles-renderer/three';

export interface FocusTarget {
  lng: number;
  lat: number;
  /** Metres kept fully solid around the target. */
  radius: number;
  /** Approximate building height in metres. */
  height: number;
  /** Map camera to start from, so the hand-off from the map feels continuous. */
  bearing: number;
  pitch: number;
}

/** Where the photorealistic tiles come from: Cesium ion's free tier, or Google directly. */
export type TilesAuth = { ion: string } | { google: string };

/** Google Photorealistic 3D Tiles as served through Cesium ion. */
const ION_GOOGLE_ASSET = '2275207';

export interface Viewport {
  /** Pixels covered by panels on each side; the model is centred in what's left. */
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Only load tiles inside a vertical column around the work. Everything outside is dissolved
 * by the shader anyway, so fetching it would be wasted requests. A column rather than a
 * sphere, because the ground height (anywhere from sea level to 500 m) isn't known upfront.
 */
class ColumnRegion extends SphereRegion {
  origin = new Vector3();
  up = new Vector3(0, 0, 1);
  radius = 100;
  private s = new Sphere();
  private v = new Vector3();

  intersectsTile(volume: TileBoundingVolume) {
    volume.getSphere(this.s);
    const v = this.v.subVectors(this.s.center, this.origin);
    const h = v.dot(this.up);
    const across = v.addScaledVector(this.up, -h).length();
    return across <= this.radius + this.s.radius && h + this.s.radius > -600 && h - this.s.radius < 2500;
  }
}

// One uniform block shared by every tile material.
const uniforms = {
  uFocus: { value: new Vector3() },
  uSolid: { value: 40 },
  uFeather: { value: 60 },
  uFade: { value: 0 },
  uMono: { value: 1 },
  uPaper: { value: new Color('#f3f2ee') },
};

function patch(material: Material) {
  if (material.userData.atlas) return;
  material.userData.atlas = true;
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vAtlasWorld;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvAtlasWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vAtlasWorld;
        uniform vec3 uFocus;
        uniform float uSolid, uFeather, uFade, uMono;
        uniform vec3 uPaper;`,
      )
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        // Distance from the work, on the ground plane.
        float d = length(vAtlasWorld.xz - uFocus.xz);
        float k = smoothstep(uSolid, uSolid + uFeather, d) * uFade;
        vec3 c = gl_FragColor.rgb;
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(c, vec3(pow(l, 0.92)), uMono);
        // Stipple the surroundings away (screen-door transparency keeps depth sorting simple),
        // and wash what remains towards the paper.
        float n = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453);
        if (n < k) discard;
        gl_FragColor.rgb = mix(c, uPaper, k * 0.8);`,
      );
  };
  material.customProgramCacheKey = () => 'atlas-focus';
  material.needsUpdate = true;
}

export function createPhotoreal(container: HTMLElement, auth: TilesAuth) {
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  container.append(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 1, 30_000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.maxPolarAngle = MathUtils.degToRad(84);
  controls.autoRotateSpeed = 0.5;
  controls.addEventListener('start', () => (controls.autoRotate = false));
  controls.enabled = false;

  const tiles = new TilesRenderer();
  tiles.registerPlugin(
    'ion' in auth
      ? new CesiumIonAuthPlugin({ apiToken: auth.ion, assetId: ION_GOOGLE_ASSET, autoRefreshToken: true })
      : new GoogleCloudAuthPlugin({ apiToken: auth.google, autoRefreshToken: true }),
  );
  tiles.registerPlugin(new TileCompressionPlugin());
  tiles.registerPlugin(
    new GLTFExtensionsPlugin({
      dracoLoader: new DRACOLoader().setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/'),
    }),
  );
  // Inside the column, refine to a fixed geometric error (metres) whatever the camera does.
  const column = new ColumnRegion({ errorTarget: 6, mask: true });
  const regions = new LoadRegionPlugin();
  tiles.registerPlugin(regions);
  regions.addRegion(column);
  const orient = new ReorientationPlugin({ lat: 0, lon: 0, height: 0, recenter: true });
  tiles.registerPlugin(orient);
  tiles.setCamera(camera);
  scene.add(tiles.group);

  tiles.addEventListener('load-model', ({ scene: model }: { scene: Object3D }) => {
    model.traverse((o) => {
      if (o instanceof Mesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(patch);
    });
  });

  const errorListeners = new Set<(e: unknown) => void>();
  tiles.addEventListener('load-error', ({ error }: { error: unknown }) => errorListeners.forEach((l) => l(error)));

  let running = false;
  let viewport: Viewport = { left: 0, right: 0, top: 0, bottom: 0 };
  let target: FocusTarget | null = null;
  let ground: number | null = null;
  let settle = 0;
  // Probing the first, coarse tiles reads the ground hundreds of metres too low; wait for a load pass.
  let loadsSettled = false;
  let shownAt = 0;
  tiles.addEventListener('tiles-load-end', () => (loadsSettled = true));
  let intro: { from: Vector3; to: Vector3; start: number } | null = null;
  const ray = new Raycaster();
  const down = new Vector3(0, -1, 0);

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Shift the projection so the model sits centred in the area free of panels.
    camera.setViewOffset(w, h, (viewport.right - viewport.left) / 2, (viewport.bottom - viewport.top) / 2, w, h);
    camera.updateProjectionMatrix();
    tiles.setResolutionFromRenderer(camera, renderer);
  }
  new ResizeObserver(resize).observe(container);

  /**
   * Ground height at the work: raycast the loaded tiles straight down at the centre and on
   * a ring around the building, and take the lowest hit — the centre alone lands on roofs.
   */
  function probeGround(): number | null {
    const r = (target?.radius ?? 40) + 25;
    let lowest: number | null = null;
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const [x, z] = i === 8 ? [0, 0] : [Math.cos(a) * r, Math.sin(a) * r];
      ray.set(new Vector3(x, 9000, z), down);
      ray.far = 20_000;
      const hit = ray.intersectObject(tiles.group, true)[0];
      if (hit && (lowest === null || hit.point.y < lowest)) lowest = hit.point.y;
    }
    return lowest;
  }

  function orbitPose(t: FocusTarget, groundY: number) {
    const dist = Math.max(90, (t.radius * 2.1) / Math.tan(MathUtils.degToRad(camera.fov / 2)) / 2 + t.height);
    const polar = MathUtils.degToRad(90 - Math.max(25, Math.min(70, 90 - t.pitch)));
    const az = MathUtils.degToRad(t.bearing);
    // Frame: X west, Z north, Y up. Look along the map's bearing.
    const focus = new Vector3(0, groundY + Math.min(t.height * 0.4, 50), 0);
    const offset = new Vector3(Math.sin(az), 0, -Math.cos(az))
      .multiplyScalar(Math.sin(polar) * dist)
      .setY(Math.cos(polar) * dist);
    return { focus, eye: focus.clone().add(offset), dist };
  }

  const readyListeners = new Set<() => void>();

  function frame(now: number) {
    if (!running) return;
    requestAnimationFrame(frame);

    if (target && ground === null && (loadsSettled || now - shownAt > 3000)) {
      ground = probeGround();
      if (ground !== null) {
        const { focus, eye, dist } = orbitPose(target, ground);
        controls.target.copy(focus);
        controls.minDistance = Math.max(25, target.radius * 0.6);
        controls.maxDistance = Math.max(900, dist * 4);
        intro = { from: camera.position.clone(), to: eye, start: now };
        uniforms.uFocus.value.set(0, ground, 0);
      }
    }
    if (intro) {
      // Descend from the survey view into the orbit.
      const t = Math.min(1, (now - intro.start) / 2200);
      const e = 1 - (1 - t) ** 3;
      camera.position.lerpVectors(intro.from, intro.to, e);
      camera.lookAt(controls.target);
      uniforms.uFade.value = e;
      if (t >= 1) {
        intro = null;
        controls.enabled = true;
        controls.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
        readyListeners.forEach((l) => l());
      }
    } else if (controls.enabled) {
      controls.update();
      // Higher-detail tiles keep arriving; settle the orbit onto the true ground.
      if (target && ground !== null && settle < 80 && Math.floor(now / 250) !== Math.floor((now - 16) / 250)) {
        settle++;
        let g = probeGround();
        if (g !== null && Math.abs(g - ground) > 0.5) {
          // Glide towards the refined ground rather than jumping.
          const dy = (g - ground) * 0.35;
          g = ground + dy;
          ground = g;
          controls.target.y += dy;
          camera.position.y += dy;
          uniforms.uFocus.value.y = g;
        }
      }
    }
    camera.updateMatrixWorld();
    tiles.update();
    renderer.render(scene, camera);
  }

  return {
    domElement: renderer.domElement,

    show(t: FocusTarget, vp: Viewport) {
      target = t;
      viewport = vp;
      ground = null;
      settle = 0;
      loadsSettled = false;
      shownAt = performance.now();
      intro = null;
      controls.enabled = false;
      controls.autoRotate = false;
      uniforms.uFade.value = 0;
      uniforms.uSolid.value = t.radius;
      uniforms.uFeather.value = Math.max(25, t.radius * 0.5);
      uniforms.uFocus.value.set(0, 0, 0);
      // Re-centre the globe on the work: X west, Z north, Y up.
      // The plugin re-applies its own lat/lon when the root tileset arrives, so keep them in sync.
      const o = orient as ReorientationPlugin & { lat: number; lon: number };
      o.lat = MathUtils.degToRad(t.lat);
      o.lon = MathUtils.degToRad(t.lng);
      o.transformLatLonHeightToOrigin(o.lat, o.lon, 0);
      // Tile bounds live in Earth-centred coordinates, so the column does too.
      tiles.ellipsoid.getCartographicToPosition(o.lat, o.lon, 0, column.origin);
      tiles.ellipsoid.getCartographicToNormal(o.lat, o.lon, column.up);
      column.radius = t.radius + uniforms.uFeather.value + 10;
      // Start above, looking down, so tiles around the work load first and we can find the ground.
      camera.position.set(0, 1500, 1);
      camera.lookAt(0, 0, 0);
      resize();
      if (!running) {
        running = true;
        requestAnimationFrame(frame);
      }
    },

    hide() {
      running = false;
      target = null;
      controls.enabled = false;
    },

    setViewport(vp: Viewport) {
      viewport = vp;
      resize();
    },

    setMono(on: boolean) {
      uniforms.uMono.value = on ? 1 : 0;
    },

    setPaper(color: string) {
      uniforms.uPaper.value.set(color);
      scene.background = new Color(color);
    },

    /** Data credits for the tiles on screen, as required by Google. */
    attributions(): string[] {
      // Google sends plain strings; Cesium ion sends HTML snippets. Keep the text only.
      const text = (a: { type: string; value: unknown }) =>
        a.type === 'string'
          ? String(a.value)
          : a.type === 'html'
            ? (new DOMParser().parseFromString(String(a.value), 'text/html').body.textContent ?? '').trim()
            : '';
      return [...new Set(tiles.getAttributions().map(text).filter(Boolean))];
    },

    onReady(l: () => void) {
      readyListeners.add(l);
    },
    onError(l: (e: unknown) => void) {
      errorListeners.add(l);
    },
  };
}

export type Photoreal = ReturnType<typeof createPhotoreal>;
