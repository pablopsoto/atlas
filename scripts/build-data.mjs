// Builds the ATLAS dataset from Wikidata + Wikimedia Commons.
// Output: src/generated/atlas.json (bundled with a content hash) and public/architects/<qid>.jpg
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { MODELS } from './models.mjs';
import { EXTRA_WORKS, OVERRIDES } from './overrides.mjs';

const UA = 'AtlasArchitectureMap/0.1 (portfolio project)';
const OUT = new URL('../public/', import.meta.url);

// Curation: up to PER_ARCHITECT works each, chosen by Wikipedia coverage.
const PER_ARCHITECT = 18;
const MIN_SITELINKS = 3;

// Headline architects shown in the banner, in chronological order of birth.
const ARCHITECTS = [
  'Q25328',  // Antoni Gaudí
  'Q5604',   // Frank Lloyd Wright
  'Q4724',   // Le Corbusier
  'Q41508',  // Ludwig Mies van der Rohe
  'Q82840',  // Alvar Aalto
  'Q210134', // Louis Kahn
  'Q134165', // Oscar Niemeyer
  'Q180374', // Frank Gehry
  'Q104898', // Norman Foster
  'Q208220', // Tadao Ando
  'Q47780',  // Zaha Hadid
];

// Map Wikidata "instance of" labels to a small set of typologies.
const TYPES = [
  ['urban', /\b(neighbou?rhood|district|quarter|planned city|capital of|city in|urban|masterplan|capitol complex)\b/],
  ['house', /\b(house|villa|residence|home|cottage|bungalow|dwelling|mansion|chalet|cabin)\b/],
  ['housing', /\b(apartment|housing|residential|condominium|dormitory|unité)\b/],
  ['religious', /\b(church|chapel|cathedral|basilica|temple|mosque|synagogue|monastery|convent|abbey|shrine|parish)\b/],
  ['culture', /\b(museum|gallery|theat|concert|opera|library|auditorium|cultural|art center|pavilion|exhibition|cinema|student nation)\b/],
  ['education', /\b(school|university|college|campus|institute|academy|kindergarten|faculty)\b/],
  ['civic', /\b(government|parliament|city hall|town hall|palace|congress|embassy|court|ministry|headquarters)\b/],
  ['commercial', /\b(office|bank|store|shop|hotel|restaurant|tower|skyscraper|commercial|factory|industrial|company|shopping|warehouse|winery|silo|mill|pharmacy|barn)\b/],
  ['infrastructure', /\b(station|bridge|stadium|sports|airport|terminal|hospital|sanatorium|garage|park|garden|memorial|monument|fountain|tomb|hall|ski jump|shelter|windmill)\b/],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Wikimedia rate-limits bursts; retry with backoff on 429/5xx or non-JSON replies.
async function politeFetch(url, init = {}, tries = 6) {
  for (let i = 0; ; i++) {
    const res = await fetch(url, { ...init, headers: { 'User-Agent': UA, ...init.headers } });
    const retryable = res.status === 429 || res.status >= 500 ||
      (res.ok && init.json && !res.headers.get('content-type')?.includes('json'));
    if (!retryable || i === tries - 1) return res;
    const wait = Number(res.headers.get('retry-after')) * 1000 || 2000 * 2 ** i;
    console.log(`  rate-limited, retrying in ${wait / 1000}s`);
    await sleep(wait);
  }
}

async function sparql(query) {
  const res = await politeFetch('https://query.wikidata.org/sparql', {
    method: 'POST',
    headers: {
      Accept: 'application/sparql-results+json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ query }),
  });
  if (!res.ok) throw new Error(`SPARQL ${res.status}: ${await res.text()}`);
  return (await res.json()).results.bindings;
}

const qid = (uri) => uri.split('/').pop();
const val = (b, k) => b[k]?.value;
const fileName = (uri) => decodeURIComponent(uri.split('/').pop()).replace(/_/g, ' ');
const year = (iso) => {
  const m = /^(-?\d{1,4})-/.exec(iso ?? '');
  return m ? Number(m[1]) : null;
};

async function fetchArchitects() {
  const rows = await sparql(`
    SELECT ?a ?aLabel ?aDescription ?birth ?death ?img ?countryLabel ?movementLabel WHERE {
      VALUES ?a { ${ARCHITECTS.map((q) => 'wd:' + q).join(' ')} }
      OPTIONAL { ?a wdt:P569 ?birth }
      OPTIONAL { ?a wdt:P570 ?death }
      OPTIONAL { ?a wdt:P18 ?img }
      OPTIONAL { ?a wdt:P27 ?country }
      OPTIONAL { ?a wdt:P135 ?movement }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }`);
  const byId = new Map();
  for (const r of rows) {
    const id = qid(r.a.value);
    const a = byId.get(id) ?? {
      id,
      name: val(r, 'aLabel'),
      description: val(r, 'aDescription'),
      born: year(val(r, 'birth')),
      died: year(val(r, 'death')),
      image: r.img ? fileName(r.img.value) : null,
      countries: new Set(),
      movements: new Set(),
    };
    if (r.countryLabel) a.countries.add(val(r, 'countryLabel'));
    if (r.movementLabel) a.movements.add(val(r, 'movementLabel'));
    byId.set(id, a);
  }
  return ARCHITECTS.map((id) => byId.get(id)).filter(Boolean);
}

async function fetchWorks() {
  // Works credited to the architect directly, or to a firm the architect founded.
  const rows = await sparql(`
    SELECT ?work ?workLabel ?workDescription ?arch ?coord ?img ?typeLabel ?styleLabel
           ?opened ?inception ?start ?demolished ?placeLabel ?countryLabel ?article ?sitelinks WHERE {
      VALUES ?arch { ${ARCHITECTS.map((q) => 'wd:' + q).join(' ')} }
      { ?work wdt:P84 ?arch } UNION { ?firm wdt:P112 ?arch . ?work wdt:P84 ?firm }
      UNION { VALUES (?work ?arch) { ${EXTRA_WORKS.map(([w, a]) => `(wd:${w} wd:${a})`).join(' ')} } }
      ?work wdt:P625 ?coord ; wikibase:sitelinks ?sitelinks .
      OPTIONAL { ?work wdt:P18 ?img }
      OPTIONAL { ?work wdt:P31 ?type }
      OPTIONAL { ?work wdt:P149 ?style }
      OPTIONAL { ?work wdt:P1619 ?opened }
      OPTIONAL { ?work wdt:P571 ?inception }
      OPTIONAL { ?work wdt:P580 ?start }
      OPTIONAL { ?work wdt:P576 ?demolished }
      OPTIONAL { ?work wdt:P131 ?place }
      OPTIONAL { ?work wdt:P17 ?country }
      OPTIONAL { ?article schema:about ?work ; schema:isPartOf <https://en.wikipedia.org/> }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }`);

  const byId = new Map();
  for (const r of rows) {
    const id = qid(r.work.value);
    const label = val(r, 'workLabel');
    if (!label || /^Q\d+$/.test(label)) continue; // no English label
    const m = /Point\(([-\d.]+) ([-\d.]+)\)/.exec(val(r, 'coord'));
    if (!m) continue;
    const w = byId.get(id) ?? {
      id,
      name: label,
      description: val(r, 'workDescription') ?? null,
      architects: new Set(),
      lng: Number(Number(m[1]).toFixed(5)),
      lat: Number(Number(m[2]).toFixed(5)),
      image: null,
      types: new Set(),
      styles: new Set(),
      years: [],
      demolished: null,
      place: val(r, 'placeLabel') ?? null,
      country: val(r, 'countryLabel') ?? null,
      wikipedia: val(r, 'article') ?? null,
      // Number of Wikipedia language editions covering the work: our notability signal.
      sitelinks: Number(val(r, 'sitelinks') ?? 0),
    };
    w.architects.add(qid(r.arch.value));
    if (r.img && !w.image) w.image = fileName(r.img.value);
    if (r.typeLabel) w.types.add(val(r, 'typeLabel').toLowerCase());
    if (r.styleLabel) w.styles.add(val(r, 'styleLabel'));
    // Prefer opening date, then inception, then construction start.
    for (const [k, rank] of [['opened', 0], ['inception', 1], ['start', 2]]) {
      const y = year(val(r, k));
      if (y) w.years.push([rank, y]);
    }
    if (r.demolished) w.demolished = year(val(r, 'demolished'));
    byId.set(id, w);
  }
  return [...byId.values()];
}

function typology(types, description) {
  // "instance of" labels first; the free-text description is the fallback.
  for (const text of [[...types].join(' | '), (description ?? '').toLowerCase()]) {
    for (const [name, re] of TYPES) if (re.test(text)) return name;
  }
  return 'other';
}

// Fallback for works with no image on Wikidata: the lead image of their English
// Wikipedia article, restricted to freely licensed files.
async function wikipediaLeadImages(works) {
  const byTitle = new Map(
    works.filter((w) => !w.image && w.wikipedia).map((w) => [decodeURIComponent(w.wikipedia.split('/wiki/')[1]).replace(/_/g, ' '), w]),
  );
  const titles = [...byTitle.keys()];
  let found = 0;
  for (let i = 0; i < titles.length; i += 50) {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      prop: 'pageimages',
      piprop: 'name',
      pilicense: 'free',
      redirects: '1',
      titles: titles.slice(i, i + 50).join('|'),
    });
    const res = await politeFetch('https://en.wikipedia.org/w/api.php?' + params, { json: true });
    await sleep(500);
    const q = (await res.json()).query;
    // Follow normalisation and redirects back to the title we asked for.
    const back = new Map();
    for (const n of [...(q.normalized ?? []), ...(q.redirects ?? [])]) back.set(n.to, back.get(n.from) ?? n.from);
    for (const page of q.pages) {
      const w = byTitle.get(back.get(page.title) ?? page.title);
      if (w && page.pageimage) {
        w.image = page.pageimage.replace(/_/g, ' ');
        found++;
      }
    }
  }
  return found;
}

async function commonsInfo(files, width, api = 'https://commons.wikimedia.org/w/api.php') {
  const info = new Map();
  for (let i = 0; i < files.length; i += 50) {
    const batch = files.slice(i, i + 50);
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl',
      iiurlwidth: String(width),
      titles: batch.map((f) => 'File:' + f).join('|'),
    });
    const res = await politeFetch(api + '?' + params, { json: true });
    await sleep(500);
    const data = await res.json();
    const normalized = new Map((data.query.normalized ?? []).map((n) => [n.to, n.from]));
    for (const p of data.query.pages) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      const md = ii.extmetadata ?? {};
      // Strip markup, and collapse credits that Commons repeats ("Unknown authorUnknown author").
      const strip = (s) => s?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().replace(/^(.+?)\s*\1$/, '$1') || null;
      const original = (normalized.get(p.title) ?? p.title).replace(/^File:/, '');
      info.set(original, {
        src: ii.thumburl?.split('?')[0],
        page: ii.descriptionurl,
        credit: strip(md.Artist?.value),
        license: strip(md.LicenseShortName?.value),
      });
    }
  }
  return info;
}

async function main() {
  console.log('Fetching architects…');
  const architects = await fetchArchitects();
  console.log('Fetching works…');
  const works = await fetchWorks();
  console.log(`  ${works.length} works`);

  const movementsOf = new Map(architects.map((a) => [a.id, [...a.movements]]));

  console.log('Filling missing images from Wikipedia…');
  console.log(`  ${await wikipediaLeadImages(works)} found`);

  console.log('Fetching image metadata from Commons…');
  const files = [...new Set(works.map((w) => w.image).filter(Boolean))];
  const workImages = await commonsInfo(files, 800);
  // Free files hosted locally on English Wikipedia rather than on Commons.
  const local = await commonsInfo(files.filter((f) => !workImages.has(f)), 800, 'https://en.wikipedia.org/w/api.php');
  for (const [k, v] of local) workImages.set(k, v);
  const portraitInfo = await commonsInfo(architects.map((a) => a.image).filter(Boolean), 400);

  const DATA = new URL('../src/generated/', import.meta.url);
  await mkdir(DATA, { recursive: true });
  await mkdir(new URL('architects/', OUT), { recursive: true });

  console.log('Downloading portraits…');
  const outArchitects = [];
  for (const a of architects) {
    const info = a.image ? portraitInfo.get(a.image) : null;
    let portrait = null;
    if (info?.src) {
      const res = await politeFetch(info.src);
      await sleep(500);
      if (res.ok) {
        await writeFile(new URL(`architects/${a.id}.jpg`, OUT), Buffer.from(await res.arrayBuffer()));
        portrait = { src: `/architects/${a.id}.jpg`, page: info.page, credit: info.credit, license: info.license };
      }
    }
    outArchitects.push({
      id: a.id,
      name: a.name,
      description: a.description,
      born: a.born,
      died: a.died,
      countries: [...a.countries],
      movements: [...a.movements],
      portrait,
    });
  }

  // Clay models built by build-models.mjs (absent until it has run).
  const builtModels = await readFile(new URL('./models.json', import.meta.url), 'utf8').then(JSON.parse, () => ({}));

  const bornOf = new Map(architects.map((a) => [a.id, a.born]));
  const thisYear = new Date().getFullYear();

  const outWorks = works
    .map((w) => {
      // Drop dates that can't be the architect's: an institution's founding year,
      // the original building they later remodelled, or a planned future opening.
      const earliest = Math.min(...[...w.architects].map((id) => (bornOf.get(id) ?? 0) + 18));
      w.years = w.years.filter(([, y]) => y >= earliest && y <= thisYear);
      w.years.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
      const styles = [...w.styles];
      return {
        id: w.id,
        name: w.name,
        description: w.description,
        architects: [...w.architects],
        lng: w.lng,
        lat: w.lat,
        year: w.years[0]?.[1] ?? null,
        demolished: w.demolished,
        type: typology(w.types, w.description),
        styles,
        // When the building has no style on record, inherit the architect's movement.
        styleInferred: styles.length === 0,
        ...(styles.length === 0 && {
          styles: [...new Set([...w.architects].flatMap((id) => movementsOf.get(id) ?? []))],
        }),
        place: w.place,
        country: w.country,
        wikipedia: w.wikipedia,
        image: w.image ? workImages.get(w.image) ?? null : null,
        icon: false,
        ...(builtModels[w.id] && {
          model: {
            src: builtModels[w.id].src,
            title: MODELS[w.id].title,
            author: MODELS[w.id].author,
            license: MODELS[w.id].license,
            page: `https://sketchfab.com/models/${MODELS[w.id].uid}`,
            ...(MODELS[w.id].rotate && { rotate: MODELS[w.id].rotate }),
          },
        }),
        ...OVERRIDES[w.id],
      };
    })
    .sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));

  // Curate: each architect's masterworks plus their most widely documented works.
  const excluded = (w) => OVERRIDES[w.id]?.exclude;
  const keep = new Set(outWorks.filter((w) => w.icon && !excluded(w)).map((w) => w.id));
  const notability = new Map(works.map((w) => [w.id, w.sitelinks]));
  for (const a of outArchitects) {
    outWorks
      .filter((w) => w.architects.includes(a.id) && !w.icon && !excluded(w) && w.image && notability.get(w.id) >= MIN_SITELINKS)
      .sort((x, y) => notability.get(y.id) - notability.get(x.id))
      .slice(0, PER_ARCHITECT - outWorks.filter((w) => w.icon && w.architects.includes(a.id)).length)
      .forEach((w) => keep.add(w.id));
  }
  const curated = outWorks.filter((w) => keep.has(w.id));
  console.log(`  curated ${curated.length} of ${outWorks.length} works`);

  const data = { generated: new Date().toISOString(), architects: outArchitects, works: curated };
  await writeFile(new URL('atlas.json', DATA), JSON.stringify(data));

  for (const a of outArchitects) {
    const mine = curated.filter((w) => w.architects.includes(a.id));
    console.log(
      `  ${a.name.padEnd(26)} works ${String(mine.length).padStart(3)}  dated ${String(mine.filter((w) => w.year).length).padStart(3)}  portrait ${a.portrait ? a.portrait.license : '—'}`,
    );
  }
  const types = Object.groupBy(curated, (w) => w.type);
  console.log('  types:', Object.entries(types).map(([k, v]) => `${k} ${v.length}`).join(', '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
