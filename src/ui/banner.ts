import { surname, worksOf, type Atlas } from '../data';
import type { Store } from '../state';
import { esc, lifespan } from './util';

/** The strip of architects along the bottom: hover previews, click selects. */
export function mountBanner(el: HTMLElement, atlas: Atlas, store: Store) {
  el.innerHTML = atlas.architects
    .map(
      (a) => `
      <button class="card" data-id="${a.id}" aria-pressed="false">
        <span class="card-portrait">${a.portrait ? `<img src="${esc(a.portrait.src)}" alt="" loading="lazy" decoding="async" />` : ''}</span>
        <span class="card-text">
          <span class="card-name">${esc(surname(a.name))}</span>
          <span class="card-meta mono">${lifespan(a.born, a.died)}</span>
          <span class="card-count mono">${worksOf(atlas, a.id).length} works</span>
        </span>
      </button>`,
    )
    .join('');

  const cards = [...el.querySelectorAll<HTMLButtonElement>('.card')];
  for (const card of cards) {
    const id = card.dataset.id!;
    card.addEventListener('click', () => {
      const s = store.get();
      store.set({ architect: s.architect === id ? null : id, preview: null, work: null });
    });
    const preview = () => store.get().architect !== id && store.set({ preview: id });
    const unpreview = () => store.get().preview === id && store.set({ preview: null });
    card.addEventListener('pointerenter', preview);
    card.addEventListener('pointerleave', unpreview);
    card.addEventListener('focus', preview);
    card.addEventListener('blur', unpreview);
  }

  // Roving arrow-key navigation across the strip.
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = cards.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    cards[(i + (e.key === 'ArrowRight' ? 1 : cards.length - 1)) % cards.length].focus();
  });

  store.subscribe((s, prev) => {
    if (s.architect === prev.architect) return;
    for (const card of cards) card.setAttribute('aria-pressed', String(card.dataset.id === s.architect));
    el.querySelector(`[data-id="${s.architect}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  });
  for (const card of cards) card.setAttribute('aria-pressed', String(card.dataset.id === store.get().architect));
}
