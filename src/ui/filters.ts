import { TYPE_LABELS, type Atlas } from '../data';
import type { Store } from '../state';
import { esc } from './util';

const MAX_STYLES = 14;

export function mountFilters(atlas: Atlas, store: Store) {
  const typeChips = document.getElementById('type-chips')!;
  const styleChips = document.getElementById('style-chips')!;
  const iconsOnly = document.getElementById('icons-only') as HTMLInputElement;
  const badge = document.getElementById('filter-badge')!;

  const count = <T,>(keys: T[]) => {
    const m = new Map<T, number>();
    for (const k of keys) m.set(k, (m.get(k) ?? 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1]);
  };
  const types = count(atlas.works.map((w) => w.type)).filter(([t]) => t !== 'other');
  const styles = count(atlas.works.flatMap((w) => w.styles)).slice(0, MAX_STYLES);

  const chip = (group: string, value: string, label: string, n: number) =>
    `<button class="chip" data-group="${group}" data-value="${esc(value)}" aria-pressed="false">${esc(label)}<span class="mono">${n}</span></button>`;
  typeChips.innerHTML = types.map(([t, n]) => chip('types', t, TYPE_LABELS[t] ?? t, n)).join('');
  styleChips.innerHTML = styles
    .map(([s, n]) => chip('styles', s, s.replace(/ architecture$/, '').replace(/^./, (c) => c.toUpperCase()), n))
    .join('');

  document.getElementById('filters')!.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.chip');
    if (!btn) return;
    const group = btn.dataset.group as 'types' | 'styles';
    const next = new Set(store.get()[group]);
    const v = btn.dataset.value!;
    if (!next.delete(v)) next.add(v);
    store.set({ [group]: next });
  });
  iconsOnly.addEventListener('change', () => store.set({ iconsOnly: iconsOnly.checked }));
  document.getElementById('filters-reset')!.addEventListener('click', () =>
    store.set({ types: new Set(), styles: new Set(), iconsOnly: false, years: store.fullRange }),
  );

  function sync() {
    const s = store.get();
    for (const btn of document.querySelectorAll<HTMLButtonElement>('#filters .chip')) {
      const set = s[btn.dataset.group as 'types' | 'styles'];
      btn.setAttribute('aria-pressed', String(set.has(btn.dataset.value!)));
    }
    iconsOnly.checked = s.iconsOnly;
    const n = store.activeFilterCount();
    badge.hidden = n === 0;
    badge.textContent = String(n);
  }
  store.subscribe(sync);
  sync();
}
