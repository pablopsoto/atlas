import type { Atlas, Work } from './data';

export interface State {
  architect: string | null;
  /** Architect previewed by hovering the banner. */
  preview: string | null;
  work: string | null;
  types: Set<string>;
  styles: Set<string>;
  years: [number, number];
  iconsOnly: boolean;
}

type Listener = (state: State, prev: State) => void;

export function createStore(atlas: Atlas) {
  const fullRange: [number, number] = [atlas.minYear, atlas.maxYear];
  let state: State = {
    architect: null,
    preview: null,
    work: null,
    types: new Set(),
    styles: new Set(),
    years: fullRange,
    iconsOnly: false,
    ...readUrl(atlas),
  };
  const listeners = new Set<Listener>();

  return {
    fullRange,
    get: () => state,
    set(patch: Partial<State>) {
      const prev = state;
      state = { ...state, ...patch };
      writeUrl(state);
      for (const l of listeners) l(state, prev);
    },
    subscribe(l: Listener) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    /** Works passing the filters (the architect selection highlights, it doesn't filter). */
    visible(): Work[] {
      return atlas.works.filter((w) => passes(w, state, fullRange));
    },
    activeFilterCount(): number {
      const yearsNarrowed = state.years[0] !== fullRange[0] || state.years[1] !== fullRange[1];
      return state.types.size + state.styles.size + (state.iconsOnly ? 1 : 0) + (yearsNarrowed ? 1 : 0);
    },
  };
}

export type Store = ReturnType<typeof createStore>;

export function passes(w: Work, s: State, fullRange: [number, number]): boolean {
  if (s.iconsOnly && !w.icon) return false;
  if (s.types.size && !s.types.has(w.type)) return false;
  if (s.styles.size && !w.styles.some((st) => s.styles.has(st))) return false;
  const narrowed = s.years[0] !== fullRange[0] || s.years[1] !== fullRange[1];
  if (narrowed && (w.year === null || w.year < s.years[0] || w.year > s.years[1])) return false;
  return true;
}

function readUrl(atlas: Atlas): Partial<State> {
  const p = new URLSearchParams(location.search);
  const out: Partial<State> = {};
  const a = p.get('architect');
  if (a && atlas.architectById.has(a)) out.architect = a;
  const w = p.get('work');
  if (w && atlas.byId.has(w)) out.work = w;
  return out;
}

function writeUrl(s: State) {
  const p = new URLSearchParams();
  if (s.architect) p.set('architect', s.architect);
  if (s.work) p.set('work', s.work);
  const q = p.toString();
  const url = location.pathname + (q ? '?' + q : '');
  if (url !== location.pathname + location.search) history.replaceState(null, '', url);
}
