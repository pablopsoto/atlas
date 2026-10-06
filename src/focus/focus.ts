import type { Work } from '../data';
import { reducedMotion, type AtlasMap } from '../map';
import { PALETTES, type Theme } from '../map-style';
import { esc } from '../ui/util';
import type { Clay, ClayTheme } from './clay';
import { clearMassing, createMapOrbit, findFootprint, setOverlayVisible, showMassing, zoomFor, type Footprint } from './massing';
import type { Photoreal, TilesAuth } from './photoreal';

/** Photorealistic tiles: Cesium ion's free tier first, a Google key as an alternative. */
const ION = (import.meta.env.VITE_CESIUM_ION_TOKEN as string | undefined)?.trim();
const GOOGLE = (import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined)?.trim();
const AUTH: TilesAuth | null = ION ? { ion: ION } : GOOGLE ? { google: GOOGLE } : null;

/** model: curated clay model · photo: photorealistic tiles · massing: OpenStreetMap footprints. */
type Mode = 'model' | 'photo' | 'massing';

const GOOGLE_LOGO = {
  light: 'https://maps.gstatic.com/mapfiles/api-3/images/google4_hdpi.png',
  dark: 'https://maps.gstatic.com/mapfiles/api-3/images/google_white5_hdpi.png',
};

const CLAY: Record<Theme, ClayTheme> = {
  light: { paper: PALETTES.light.paper, clay: '#efece6', ink: PALETTES.light.ink },
  dark: { paper: PALETTES.dark.paper, clay: '#b9b5ad', ink: PALETTES.dark.ink },
};

/**
 * Focus on one work: the map locks onto it and orbits, its building is drawn solid among
 * ghosted neighbours, and a 3D view takes over — the curated clay model where there is one,
 * otherwise photorealistic tiles when configured.
 */
export function createFocus(am: AtlasMap, getTheme: () => Theme) {
  const { map } = am;
  const orbit = createMapOrbit(map);
  const stage = document.getElementById('stage')!;
  const bar = document.getElementById('focusbar')!;
  const credit = document.getElementById('fb-credit')!;
  const modeBtns = [...bar.querySelectorAll<HTMLButtonElement>('[data-mode]')];
  const monoBtn = document.getElementById('fb-mono') as HTMLButtonElement;

  let mode: Mode = 'massing';
  let mono = true;
  let token = 0;
  let current: { work: Work; fp: Footprint | null } | null = null;
  let photo: Promise<Photoreal | null> | null = null;
  let clay: Promise<Clay | null> | null = null;
  let creditTimer = 0;

  const available = (m: Mode, w: Work) => (m === 'model' ? !!w.model : m === 'photo' ? !!AUTH : true);
  const preferred = (w: Work): Mode => (w.model ? 'model' : AUTH ? 'photo' : 'massing');

  function viewport() {
    const p = am.padding();
    return { left: p.left, right: p.right, top: p.top, bottom: p.bottom };
  }

  /** The 3D stage covers the map once a view is ready; the map orbit stands down. */
  function reveal(which: 'clay' | 'photo') {
    stage.dataset.view = which;
    stage.classList.add('visible');
    orbit.disable();
  }

  function conceal() {
    stage.classList.remove('visible');
    clay?.then((c) => c?.hide());
    photo?.then((p) => p?.hide());
  }

  function loadPhoto() {
    if (!AUTH) return Promise.resolve(null);
    photo ??= import('./photoreal')
      .then(({ createPhotoreal }) => {
        const p = createPhotoreal(stage, AUTH);
        p.domElement.classList.add('stage-photo');
        p.setPaper(PALETTES[getTheme()].paper);
        p.setMono(mono);
        p.onReady(() => mode === 'photo' && current && reveal('photo'));
        p.onError((err) => {
          console.warn('Photorealistic tiles unavailable.', err);
          if (mode === 'photo' && current) setMode(current.work.model ? 'model' : 'massing');
        });
        return p;
      })
      .catch((err) => {
        console.warn('Could not load the photoreal viewer.', err);
        return null;
      });
    return photo;
  }

  function loadClay() {
    clay ??= import('./clay')
      .then(({ createClay }) => {
        const c = createClay(stage);
        c.domElement.classList.add('stage-clay');
        c.setTheme(CLAY[getTheme()]);
        c.onReady(() => mode === 'model' && current && reveal('clay'));
        c.onError((err) => {
          console.warn('Could not load the model.', err);
          if (mode === 'model' && current) setMode(AUTH ? 'photo' : 'massing');
        });
        return c;
      })
      .catch((err) => {
        console.warn('Could not load the model viewer.', err);
        return null;
      });
    return clay;
  }

  function renderBar() {
    const work = current?.work;
    for (const b of modeBtns) {
      const m = b.dataset.mode as Mode;
      b.hidden = !work || !available(m, work);
      b.setAttribute('aria-pressed', String(m === mode));
    }
    // A single option isn't a choice.
    bar.querySelector<HTMLElement>('.fb-seg')!.hidden = modeBtns.filter((b) => !b.hidden).length < 2;
    monoBtn.hidden = mode !== 'photo';
    monoBtn.setAttribute('aria-pressed', String(mono));
    clearInterval(creditTimer);
    if (mode === 'photo') {
      const update = async () => {
        const text = (await photo)?.attributions().join(' · ') ?? '';
        credit.innerHTML = `<img src="${GOOGLE_LOGO[getTheme()]}" alt="Google" height="16" /><span>${esc(text)}</span>`;
      };
      update();
      creditTimer = window.setInterval(update, 1500);
    } else if (mode === 'model' && work?.model) {
      const m = work.model;
      credit.innerHTML = `<a href="${esc(m.page)}" target="_blank" rel="noopener">Model “${esc(m.title)}” by ${esc(m.author)} · ${esc(m.license)}</a>`;
    } else {
      credit.innerHTML = '<span>Massing from OpenStreetMap</span>';
    }
  }

  /** Bring up the 3D view for the current mode (massing needs nothing beyond the map). */
  async function present(work: Work, fp: Footprint | null, my: number) {
    if (mode === 'model' && work.model) {
      const c = await loadClay();
      if (c && my === token && mode === 'model') c.show(work.model, viewport(), map.getBearing());
    } else if (mode === 'photo') {
      const p = await loadPhoto();
      if (!p || my !== token || mode !== 'photo') return;
      p.show(
        {
          lng: fp?.center[0] ?? work.lng,
          lat: fp?.center[1] ?? work.lat,
          radius: fp ? fp.radius * 0.9 + 4 : (work.radius ?? 40),
          height: fp?.height ?? 15,
          bearing: map.getBearing(),
          pitch: map.getPitch(),
        },
        viewport(),
      );
    }
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
    mode = preferred(work);
    document.body.classList.add('focus');
    bar.hidden = false;
    renderBar();
    conceal();
    orbit.disable();
    clearMassing(map);

    map.flyTo({
      center: [work.lng, work.lat],
      zoom: 16.8,
      pitch: 58,
      bearing: wasFocused ? map.getBearing() : -24,
      padding: am.padding(),
      duration: reducedMotion() ? 0 : 3000,
      essential: true,
    });
    // A clay model doesn't depend on the map, so it loads during the flight.
    if (mode === 'model') loadClay();
    if (!(await settled(my))) return;

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
    // Turning the camera would cancel the zoom, so the slow spin waits for it to land.
    map.once('moveend', () => my === token && mode === 'massing' && orbit.enable(!reducedMotion()));
    present(work, fp, my);
  }

  function exit() {
    token++;
    current = null;
    document.body.classList.remove('focus');
    bar.hidden = true;
    clearInterval(creditTimer);
    conceal();
    orbit.disable();
    clearMassing(map);
    setOverlayVisible(map, true);
  }

  function setMode(next: Mode) {
    if (!current || !available(next, current.work)) return;
    mode = next;
    renderBar();
    conceal();
    if (mode === 'massing') orbit.enable(!reducedMotion());
    else present(current.work, current.fp, token);
  }

  bar.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button');
    if (!btn) return;
    if (btn.dataset.mode) setMode(btn.dataset.mode as Mode);
    else if (btn === monoBtn) {
      mono = !mono;
      renderBar();
      photo?.then((p) => p?.setMono(mono));
    }
  });

  // Keep the model centred as panels open, close or the window resizes.
  addEventListener('resize', () => {
    if (!current) return;
    photo?.then((p) => p?.setViewport(viewport()));
    clay?.then((c) => c?.setViewport(viewport()));
  });

  return {
    enter,
    exit,
    get active() {
      return current !== null;
    },
    setTheme(theme: Theme) {
      photo?.then((p) => p?.setPaper(PALETTES[theme].paper));
      clay?.then((c) => c?.setTheme(CLAY[theme]));
      if (current?.fp) showMassing(map, current.fp);
      if (current) renderBar();
    },
  };
}
