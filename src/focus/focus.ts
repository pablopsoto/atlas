import type { Work } from '../data';
import { reducedMotion, type AtlasMap } from '../map';
import { PALETTES, type Theme } from '../map-style';
import { esc } from '../ui/util';
import type { Clay, ClayTheme } from './clay';
import { clearMassing, createMapOrbit, findFootprint, setOverlayVisible, showMassing, zoomFor, type Footprint } from './massing';

const CLAY: Record<Theme, ClayTheme> = {
  light: { paper: PALETTES.light.paper, clay: '#efece6', ink: PALETTES.light.ink },
  dark: { paper: PALETTES.dark.paper, clay: '#b9b5ad', ink: PALETTES.dark.ink },
};

/**
 * Focus on one work: the map flies to it and its building is drawn solid among ghosted
 * neighbours, then the clay model takes over. Every work on the map has one.
 */
export function createFocus(am: AtlasMap, getTheme: () => Theme) {
  const { map } = am;
  const orbit = createMapOrbit(map);
  const stage = document.getElementById('stage')!;
  const bar = document.getElementById('focusbar')!;
  const credit = document.getElementById('fb-credit')!;
  let token = 0;
  let current: { work: Work; fp: Footprint | null } | null = null;
  let clay: Promise<Clay | null> | null = null;

  function viewport() {
    const p = am.padding();
    return { left: p.left, right: p.right, top: p.top, bottom: p.bottom };
  }

  /** The 3D stage covers the map once the model is ready; the map orbit stands down. */
  function reveal() {
    stage.dataset.view = 'clay';
    stage.classList.add('visible');
    orbit.disable();
  }

  function conceal() {
    stage.classList.remove('visible');
    clay?.then((c) => c?.hide());
  }

  function loadClay() {
    clay ??= import('./clay')
      .then(({ createClay }) => {
        const c = createClay(stage);
        c.domElement.classList.add('stage-clay');
        c.setTheme(CLAY[getTheme()]);
        c.onReady(() => current && reveal());
        c.onError((err) => console.warn('Could not load the model.', err));
        return c;
      })
      .catch((err) => {
        console.warn('Could not load the model viewer.', err);
        return null;
      });
    return clay;
  }

  function renderBar() {
    const m = current?.work.model;
    if (!m) return;
    credit.innerHTML = m.code
      ? '<span>Modelled in code by Pablo Pérez for Atlas</span>'
      : `<a href="${esc(m.page)}" target="_blank" rel="noopener">Model “${esc(m.title)}” by ${esc(m.author)} · ${esc(m.license)}</a>`;
  }

  /** Bring up the clay model. */
  async function present(work: Work, my: number) {
    if (!work.model) return;
    const c = await loadClay();
    if (c && my === token) c.show(work.model, viewport(), map.getBearing());
  }

  const settled = (my: number) =>
    new Promise<boolean>((resolve) => {
      map.once('moveend', () => {
        if (my !== token) return resolve(false);
        // Give building tiles at the new zoom a moment to arrive.
        const timeout = setTimeout(() => resolve(my === token), 1500);
        map.once('idle', () => {
          clearTimeout(timeout);
          resolve(my === token);
        });
      });
    });

  async function enter(work: Work) {
    const my = ++token;
    const wasFocused = current !== null;
    current = { work, fp: null };
    document.body.classList.add('focus');
    bar.hidden = false;
    renderBar();
    conceal();
    orbit.disable();
    clearMassing(map);

    // Listen before flying: with reduced motion the flight ends at once.
    const landed = settled(my);
    map.flyTo({
      center: [work.lng, work.lat],
      zoom: 16.8,
      pitch: 58,
      bearing: wasFocused ? map.getBearing() : -24,
      padding: am.padding(),
      duration: reducedMotion() ? 0 : 3000,
      essential: true,
    });
    // The model doesn't depend on the map: it loads and appears during the flight.
    present(work, my);
    if (!(await landed)) return;

    const fp = findFootprint(map, work);
    current.fp = fp;
    showMassing(map, fp);
    setOverlayVisible(map, false);
    const pad = am.padding();
    map.easeTo({
      center: fp.center,
      zoom: zoomFor(fp, innerWidth - pad.left - pad.right, innerHeight - pad.top - pad.bottom),
      padding: pad,
      duration: reducedMotion() ? 0 : 900,
    });
    orbit.enable(false);
  }

  function exit() {
    token++;
    current = null;
    document.body.classList.remove('focus');
    bar.hidden = true;
    conceal();
    orbit.disable();
    clearMassing(map);
    setOverlayVisible(map, true);
  }

  // Keep the model centred as panels open, close or the window resizes.
  addEventListener('resize', () => {
    if (!current) return;
    clay?.then((c) => c?.setViewport(viewport()));
  });

  return {
    enter,
    exit,
    get active() {
      return current !== null;
    },
    setTheme(theme: Theme) {
      clay?.then((c) => c?.setTheme(CLAY[theme]));
      if (current?.fp) showMassing(map, current.fp);
      if (current) renderBar();
    },
  };
}
