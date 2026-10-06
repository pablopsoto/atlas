import { TYPE_LABELS, surname, worksOf, type Atlas, type Work } from '../data';
import type { Store } from '../state';
import { esc, transition } from './util';

/** The detail sheet for a single work, with prev/next through the architect's career. */
export function mountSheet(el: HTMLElement, atlas: Atlas, store: Store) {
  let shown: string | null = null;

  function context(w: Work) {
    const s = store.get();
    const archId = s.architect && w.architects.includes(s.architect) ? s.architect : w.architects[0];
    const list = worksOf(atlas, archId);
    return { arch: atlas.architectById.get(archId)!, list, i: list.findIndex((x) => x.id === w.id) };
  }

  function render(w: Work) {
    const { arch, list, i } = context(w);
    const prev = list[i - 1];
    const next = list[i + 1];
    const architects = w.architects.map((id) => atlas.architectById.get(id)!);
    const coords = `${Math.abs(w.lat).toFixed(4)}° ${w.lat >= 0 ? 'N' : 'S'}  ${Math.abs(w.lng).toFixed(4)}° ${w.lng >= 0 ? 'E' : 'W'}`;
    const location = [w.place, w.country].filter((x, j, a) => x && a.indexOf(x) === j).join(', ');
    const img = w.image;

    el.innerHTML = `
      <button class="sheet-close" aria-label="Close">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></svg>
      </button>
      <figure class="sheet-figure">
        ${
          img
            ? `<img src="${esc(img.src)}" alt="${esc(w.name)}" decoding="async" />
               <figcaption class="mono"><a href="${esc(img.page)}" target="_blank" rel="noopener">${esc(img.credit ?? 'Wikimedia Commons')}${img.license ? ` · ${esc(img.license)}` : ''}</a></figcaption>`
            : `<div class="sheet-noimg" aria-hidden="true"><svg viewBox="0 0 100 60" preserveAspectRatio="none"><path d="M0 0L100 60M100 0L0 60" /></svg></div>
               <figcaption class="mono">No photograph on record</figcaption>`
        }
      </figure>
      <div class="sheet-body">
        <p class="kicker mono">${esc(TYPE_LABELS[w.type] ?? w.type)}${w.icon ? ' · Masterwork' : ''}</p>
        <h2 id="sheet-title" class="serif" tabindex="-1">${esc(w.name)}</h2>
        ${w.description ? `<p class="sheet-desc">${esc(w.description[0].toUpperCase() + w.description.slice(1))}</p>` : ''}
        <dl class="facts">
          <div><dt class="mono">Architect</dt><dd>${architects
            .map((a) => `<button class="link" data-architect="${a.id}">${esc(a.name)}</button>`)
            .join(', ')}</dd></div>
          <div><dt class="mono">Year</dt><dd>${w.year ?? '<span class="muted">Unknown</span>'}${
            w.demolished ? ` <span class="muted">— demolished ${w.demolished}</span>` : ''
          }</dd></div>
          ${
            w.styles.length
              ? `<div><dt class="mono">Style</dt><dd>${esc(w.styles.map((st) => st[0].toUpperCase() + st.slice(1)).join(', '))}${w.styleInferred ? ' <span class="muted">(architect)</span>' : ''}</dd></div>`
              : ''
          }
          ${location ? `<div><dt class="mono">Location</dt><dd>${esc(location)}</dd></div>` : ''}
          <div><dt class="mono">Position</dt><dd class="mono">${coords}</dd></div>
        </dl>
        <p class="sheet-links">
          ${w.wikipedia ? `<a href="${esc(w.wikipedia)}" target="_blank" rel="noopener">Wikipedia ↗</a>` : ''}
          <a href="https://www.wikidata.org/wiki/${w.id}" target="_blank" rel="noopener">Wikidata ↗</a>
        </p>
      </div>
      <nav class="sheet-nav" aria-label="${esc(arch.name)} works">
        <button class="nav-btn" data-go="${prev?.id ?? ''}" ${prev ? '' : 'disabled'} aria-label="Previous work">←</button>
        <span class="mono">${i + 1} / ${list.length} · ${esc(surname(arch.name))}</span>
        <button class="nav-btn" data-go="${next?.id ?? ''}" ${next ? '' : 'disabled'} aria-label="Next work">→</button>
      </nav>`;
  }

  el.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest('button');
    if (!t) return;
    if (t.classList.contains('sheet-close')) store.set({ work: null });
    else if (t.dataset.go) store.set({ work: t.dataset.go });
    else if (t.dataset.architect) store.set({ architect: t.dataset.architect, preview: null });
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const btn = el.querySelectorAll<HTMLButtonElement>('.nav-btn')[e.key === 'ArrowLeft' ? 0 : 1];
      if (btn && !btn.disabled) store.set({ work: btn.dataset.go! });
    }
  });

  function sync() {
    const id = store.get().work;
    if (id === shown) return;
    const opening = shown === null;
    shown = id;
    transition(() => {
      if (!id) {
        el.hidden = true;
        return;
      }
      render(atlas.byId.get(id)!);
      el.hidden = false;
    });
    if (id && opening) requestAnimationFrame(() => el.querySelector<HTMLElement>('#sheet-title')?.focus({ preventScroll: true }));
  }
  store.subscribe(sync);
  sync();
}
