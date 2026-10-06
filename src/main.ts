import './style.css';
import { loadAtlas, surname, worksOf } from './data';
import { createFocus } from './focus/focus';
import { createMap, reducedMotion } from './map';
import type { Theme } from './map-style';
import { createStore, passes, type State } from './state';
import { mountBanner } from './ui/banner';
import { mountBrief } from './ui/brief';
import { mountFilters } from './ui/filters';
import { mountSearch } from './ui/search';
import { mountSheet } from './ui/sheet';
import { mountTimeline } from './ui/timeline';
import { esc, fmt } from './ui/util';

const THEME_KEY = 'atlas-theme';

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

async function main() {
  let theme = initialTheme();
  document.documentElement.dataset.theme = theme;

  const atlas = await loadAtlas();
  const store = createStore(atlas);

  const tooltip = document.getElementById('tooltip')!;
  const am = createMap(document.getElementById('map')!, atlas, theme, {
    onHover(work, point) {
      tooltip.hidden = !work;
      if (!work || !point) return;
      const by = work.architects.map((id) => surname(atlas.architectById.get(id)!.name)).join(' & ');
      tooltip.innerHTML = `<strong>${esc(work.name)}</strong><span class="mono">${work.year ?? 'n.d.'} · ${esc(by)}</span>`;
      tooltip.style.translate = `${point.x + 14}px ${point.y - 10}px`;
    },
    onClick(work) {
      store.set({ work: work.id });
    },
    locked: () => store.get().work !== null,
  });
  const focus = createFocus(am, () => theme);

  document.getElementById('tb-count')!.textContent = `${fmt.format(atlas.works.length)} works · ${atlas.architects.length} architects`;
  document.getElementById('tb-range')!.textContent = `${atlas.minYear} — ${atlas.maxYear}`;

  mountBanner(document.getElementById('banner')!, atlas, store);
  mountTimeline(document.getElementById('timeline')!, atlas, store);
  mountBrief(document.getElementById('brief')!, atlas, store);
  mountSheet(document.getElementById('sheet')!, atlas, store);
  mountFilters(atlas, store);
  mountSearch(atlas, store);

  // Theme toggle: a circular reveal from the button via the View Transitions API.
  const themeBtn = document.getElementById('theme')!;
  themeBtn.addEventListener('click', async () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
    const apply = () =>
      new Promise<void>((resolve) => {
        document.documentElement.dataset.theme = theme;
        am.setTheme(theme);
        focus.setTheme(theme);
        am.map.once('render', () => resolve());
        am.map.triggerRepaint();
      });
    if (!document.startViewTransition || reducedMotion()) return apply();
    const r = themeBtn.getBoundingClientRect();
    document.documentElement.style.setProperty('--reveal-x', `${r.left + r.width / 2}px`);
    document.documentElement.style.setProperty('--reveal-y', `${r.top + r.height / 2}px`);
    document.documentElement.classList.add('theme-transition');
    await document.startViewTransition(apply).finished.catch(() => {});
    document.documentElement.classList.remove('theme-transition');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    const s = store.get();
    if (document.querySelector('#filters:popover-open')) return;
    if (s.work) store.set({ work: null });
    else if (s.architect) store.set({ architect: null });
  });

  await am.ready;

  const filtersChanged = (s: State, p: State) =>
    s.types !== p.types || s.styles !== p.styles || s.years !== p.years || s.iconsOnly !== p.iconsOnly;
  const careerPath = (s: State) =>
    s.architect ? worksOf(atlas, s.architect).filter((w) => w.year !== null && passes(w, s, store.fullRange)) : [];

  function apply(s: State, p: State | null) {
    const first = p === null;
    if (first || filtersChanged(s, p)) am.setVisible(store.visible());
    if (first || s.preview !== p.preview || s.architect !== p.architect) am.setArchitect(s.preview ?? s.architect);

    if (first || s.architect !== p.architect) {
      am.drawPath(careerPath(s), !first);
      if (s.architect && !s.work) am.fitWorks(worksOf(atlas, s.architect).filter((w) => passes(w, s, store.fullRange)));
      else if (!s.architect && !first && !s.work) am.overview();
    } else if (filtersChanged(s, p)) {
      am.drawPath(careerPath(s), false);
    }

    if (first || s.work !== p.work) {
      const work = s.work ? atlas.byId.get(s.work)! : null;
      am.select(work);
      // Let the sheet lay out first so the camera pads for it.
      if (work) requestAnimationFrame(() => focus.enter(work));
      else if (!first) {
        focus.exit();
        if (s.architect === p.architect) {
          if (s.architect) am.fitWorks(worksOf(atlas, s.architect).filter((w) => passes(w, s, store.fullRange)));
          else
            am.map.easeTo({
              pitch: 0,
              bearing: 0,
              zoom: Math.min(am.map.getZoom(), 12),
              padding: am.padding(),
              duration: reducedMotion() ? 0 : 1200,
            });
        }
      }
    }
  }

  store.subscribe(apply);
  apply(store.get(), null);

  // A slow drift into place on first visit (skipped when a deep link set the view).
  const s = store.get();
  if (!s.work && !s.architect && !reducedMotion()) {
    am.map.easeTo({ center: [8, 30], zoom: innerWidth > 760 ? 2 : 1.2, duration: 3200, easing: (t: number) => 1 - (1 - t) ** 3 });
  }
  document.body.classList.add('ready');
}

main().catch((err) => {
  console.error(err);
  document.body.insertAdjacentHTML('beforeend', `<p class="fatal mono">Could not load the atlas. ${esc(err.message)}</p>`);
});
