import type { Atlas, Work } from '../data';
import type { Store } from '../state';
import { esc } from './util';

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** Type-ahead search over works, cities and architects. "/" focuses it. */
export function mountSearch(atlas: Atlas, store: Store) {
  const input = document.getElementById('search') as HTMLInputElement;
  const list = document.getElementById('search-results')!;
  const index = atlas.works.map((w) => ({
    w,
    text: fold([w.name, w.place, w.country, ...w.architects.map((a) => atlas.architectById.get(a)!.name)].join(' ')),
  }));
  let results: Work[] = [];
  let active = 0;

  function render() {
    list.hidden = !results.length;
    list.innerHTML = results
      .map(
        (w, i) => `
        <li role="option" id="sr-${i}" aria-selected="${i === active}" data-id="${w.id}">
          <span class="sr-name">${esc(w.name)}</span>
          <span class="sr-meta mono">${esc([w.year, w.place ?? w.country].filter(Boolean).join(' · '))}</span>
        </li>`,
      )
      .join('');
    input.setAttribute('aria-activedescendant', results.length ? `sr-${active}` : '');
  }

  function choose(w: Work | undefined) {
    if (!w) return;
    input.value = '';
    results = [];
    render();
    input.blur();
    store.set({ work: w.id });
  }

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-controls', 'search-results');
  input.setAttribute('aria-expanded', 'false');
  input.addEventListener('input', () => {
    const terms = fold(input.value.trim()).split(/\s+/).filter(Boolean);
    results = terms.length
      ? index
          .filter((x) => terms.every((t) => x.text.includes(t)))
          .sort((a, b) => Number(b.w.icon) - Number(a.w.icon))
          .slice(0, 8)
          .map((x) => x.w)
      : [];
    active = 0;
    input.setAttribute('aria-expanded', String(results.length > 0));
    render();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length) active = (active + (e.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length;
      render();
    } else if (e.key === 'Enter') {
      choose(results[active]);
    } else if (e.key === 'Escape') {
      input.value = '';
      results = [];
      render();
      input.blur();
      e.stopPropagation();
    }
  });
  list.addEventListener('pointerdown', (e) => {
    const li = (e.target as HTMLElement).closest('li');
    if (li) {
      e.preventDefault();
      choose(atlas.byId.get(li.dataset.id!));
    }
  });
  input.addEventListener('blur', () => setTimeout(() => (list.hidden = true), 100));
  input.addEventListener('focus', () => render());

  document.addEventListener('keydown', (e) => {
    const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
    if (e.key === '/' && !typing) {
      e.preventDefault();
      input.focus();
    }
  });
}
