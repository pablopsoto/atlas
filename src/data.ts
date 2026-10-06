// Emitted with a content hash, so a new dataset is never hidden behind a cached copy.
import atlasUrl from './generated/atlas.json?url';

export interface ImageRef {
  src: string;
  page: string;
  credit: string | null;
  license: string | null;
}

export interface Architect {
  id: string;
  name: string;
  description: string | null;
  born: number | null;
  died: number | null;
  countries: string[];
  movements: string[];
  portrait: ImageRef | null;
}

export interface Work {
  id: string;
  name: string;
  description: string | null;
  architects: string[];
  lng: number;
  lat: number;
  year: number | null;
  demolished: number | null;
  type: string;
  styles: string[];
  styleInferred: boolean;
  place: string | null;
  country: string | null;
  wikipedia: string | null;
  image: ImageRef | null;
  icon: boolean;
  /** Metres kept solid around the work in the 3D focus view; otherwise derived from the footprint. */
  radius?: number;
  /** A curated 3D model, shown as a clay model in the focus view. */
  model?: ModelRef;
}

export interface ModelRef {
  src: string;
  title: string;
  author: string;
  license: string;
  page: string;
  /** Euler rotation in degrees [x, y, z] for models authored on their side. */
  rotate?: [number, number, number];
}

export interface Atlas {
  architects: Architect[];
  works: Work[];
  /** Feature index of each work, used as the MapLibre feature id. */
  index: Map<string, number>;
  byId: Map<string, Work>;
  architectById: Map<string, Architect>;
  minYear: number;
  maxYear: number;
}

export const TYPE_LABELS: Record<string, string> = {
  house: 'Houses',
  housing: 'Housing',
  culture: 'Culture',
  religious: 'Religious',
  education: 'Education',
  civic: 'Civic',
  commercial: 'Commercial',
  infrastructure: 'Public & infrastructure',
  urban: 'Urban plans',
  other: 'Other',
};

export async function loadAtlas(): Promise<Atlas> {
  const res = await fetch(atlasUrl);
  if (!res.ok) throw new Error(`Could not load data (${res.status})`);
  const { architects, works } = (await res.json()) as { architects: Architect[]; works: Work[] };
  const years = works.map((w) => w.year).filter((y): y is number => y !== null);
  return {
    architects,
    works,
    index: new Map(works.map((w, i) => [w.id, i])),
    byId: new Map(works.map((w) => [w.id, w])),
    architectById: new Map(architects.map((a) => [a.id, a])),
    minYear: Math.min(...years),
    maxYear: Math.max(...years),
  };
}

/** Works of an architect in chronological order (undated last). */
export function worksOf(atlas: Atlas, architectId: string): Work[] {
  return atlas.works
    .filter((w) => w.architects.includes(architectId))
    .sort((a, b) => (a.year ?? 1e4) - (b.year ?? 1e4) || a.name.localeCompare(b.name));
}

export function surname(name: string): string {
  if (name === 'Le Corbusier') return name;
  if (name.includes('van der Rohe')) return 'Mies';
  return name.split(' ').at(-1)!;
}
