import type { Atlas } from '../data';
import { passes, type Store } from '../state';

const SVG = 'http://www.w3.org/2000/svg';

/** A one-bar-per-year histogram ("barcode") with a two-handle range to filter by era. */
export function mountTimeline(el: HTMLElement, atlas: Atlas, store: Store) {
  const [min, max] = store.fullRange;
  const span = max - min + 1;
  const total = new Array<number>(span).fill(0);
  for (const w of atlas.works) if (w.year !== null) total[w.year - min]++;
  const peak = Math.max(...total);
  const h = (n: number) => (n ? 4 + 36 * Math.sqrt(n / peak) : 0);

  el.innerHTML = `
    <div class="tl-head mono">
      <span>Era</span>
      <output id="tl-out" aria-live="polite"></output>
    </div>
    <div class="tl-track">
      <svg class="tl-bars" viewBox="0 0 ${span} 40" preserveAspectRatio="none" aria-hidden="true"></svg>
      <div class="tl-shade tl-shade-l"></div><div class="tl-shade tl-shade-r"></div>
      <input type="range" class="tl-min" min="${min}" max="${max}" step="1" value="${min}" aria-label="From year" />
      <input type="range" class="tl-max" min="${min}" max="${max}" step="1" value="${max}" aria-label="To year" />
    </div>
    <div class="tl-ticks mono" aria-hidden="true"></div>`;

  const svg = el.querySelector('svg')!;
  const out = el.querySelector('output')!;
  const lo = el.querySelector<HTMLInputElement>('.tl-min')!;
  const hi = el.querySelector<HTMLInputElement>('.tl-max')!;
  const shadeL = el.querySelector<HTMLElement>('.tl-shade-l')!;
  const shadeR = el.querySelector<HTMLElement>('.tl-shade-r')!;

  const ticks = el.querySelector('.tl-ticks')!;
  for (let y = Math.ceil(min / 20) * 20; y <= max; y += 20) {
    const t = document.createElement('span');
    t.textContent = String(y);
    t.style.left = `${((y - min + 0.5) / span) * 100}%`;
    ticks.append(t);
  }

  const base: SVGRectElement[] = [];
  const lit: SVGRectElement[] = [];
  for (let i = 0; i < span; i++) {
    for (const [list, cls] of [[base, 'bar'], [lit, 'bar lit']] as const) {
      const r = document.createElementNS(SVG, 'rect');
      r.setAttribute('class', cls);
      r.setAttribute('x', String(i + 0.15));
      r.setAttribute('width', '0.7');
      list.push(r);
      svg.append(r);
    }
    base[i].setAttribute('y', String(40 - h(total[i])));
    base[i].setAttribute('height', String(h(total[i])));
  }

  function paint() {
    const s = store.get();
    const focus = s.preview ?? s.architect;
    const counts = new Array<number>(span).fill(0);
    for (const w of atlas.works) {
      if (w.year === null) continue;
      if (focus && !w.architects.includes(focus)) continue;
      if (!passes(w, s, store.fullRange)) continue;
      counts[w.year - min]++;
    }
    for (let i = 0; i < span; i++) {
      // Lit bars share the base scale so a single architect reads as a share of the whole.
      lit[i].setAttribute('y', String(40 - h(counts[i])));
      lit[i].setAttribute('height', String(h(counts[i])));
    }
    const [a, b] = s.years;
    lo.value = String(a);
    hi.value = String(b);
    shadeL.style.width = `${((a - min) / span) * 100}%`;
    shadeR.style.width = `${((max - b) / span) * 100}%`;
    out.textContent = a === min && b === max ? `${min} — ${max}` : `${a} — ${b}`;
    el.classList.toggle('narrowed', a !== min || b !== max);
  }

  let frame = 0;
  const onInput = (e: Event) => {
    let a = Number(lo.value);
    let b = Number(hi.value);
    if (a > b) [a, b] = e.target === lo ? [b, b] : [a, a];
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => store.set({ years: [a, b] }));
  };
  lo.addEventListener('input', onInput);
  hi.addEventListener('input', onInput);

  // Clicking the bars moves the nearest handle there.
  el.querySelector('.tl-track')!.addEventListener('pointerdown', (e) => {
    const ev = e as PointerEvent;
    if (ev.target instanceof HTMLInputElement) return;
    const rect = svg.getBoundingClientRect();
    const year = Math.round(min + ((ev.clientX - rect.left) / rect.width) * span - 0.5);
    const [a, b] = store.get().years;
    store.set({ years: Math.abs(year - a) < Math.abs(year - b) ? [Math.min(year, b), b] : [a, Math.max(year, a)] });
  });

  store.subscribe(paint);
  paint();
}
