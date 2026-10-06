import { worksOf, type Atlas } from '../data';
import { pathLengthKm } from '../geo';
import type { Store } from '../state';
import { esc, fmt, lifespan, transition } from './util';

/** Summary card for the selected architect, under the title block. */
export function mountBrief(el: HTMLElement, atlas: Atlas, store: Store) {
  let shown: string | null | undefined;

  function render(id: string) {
    const a = atlas.architectById.get(id)!;
    const works = worksOf(atlas, id);
    const dated = works.filter((w) => w.year !== null);
    const countries = new Set(works.map((w) => w.country).filter(Boolean));
    const km = pathLengthKm(dated.map((w) => [w.lng, w.lat]));
    const p = a.portrait;
    el.innerHTML = `
      <div class="brief-portrait">
        ${p ? `<img src="${esc(p.src)}" alt="Portrait of ${esc(a.name)}" />` : ''}
      </div>
      <div class="brief-text">
        <p class="kicker mono">${esc(a.movements.slice(0, 2).join(' · ') || 'Architect')}</p>
        <h2 class="serif">${esc(a.name)}</h2>
        <p class="brief-life mono">${lifespan(a.born, a.died)}${a.countries.length ? ` · ${esc(a.countries.join(', '))}` : ''}</p>
        <dl class="stats">
          <div><dt class="mono">Works</dt><dd>${works.length}</dd></div>
          <div><dt class="mono">Countries</dt><dd>${countries.size}</dd></div>
          <div><dt class="mono">Career path</dt><dd>${fmt.format(Math.round(km))}<small> km</small></dd></div>
        </dl>
        ${
          p
            ? `<p class="brief-credit mono"><a href="${esc(p.page)}" target="_blank" rel="noopener">Portrait: ${esc(p.credit ?? 'Wikimedia Commons')}${p.license ? ` · ${esc(p.license)}` : ''}</a></p>`
            : ''
        }
      </div>
      <button class="brief-close" aria-label="Show all architects">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></svg>
      </button>`;
  }

  el.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.brief-close')) store.set({ architect: null, work: null });
  });

  function sync() {
    const id = store.get().architect;
    if (id === shown) return;
    shown = id;
    transition(() => {
      el.hidden = !id;
      if (id) render(id);
    });
  }
  store.subscribe(sync);
  sync();
}
