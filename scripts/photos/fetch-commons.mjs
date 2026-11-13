/**
 * Downloads aircraft photos from Wikimedia Commons with their licence metadata.
 * Runs in GitHub Actions (the dev sandbox cannot reach Commons). No key or account needed.
 *
 *   node scripts/photos/fetch-commons.mjs candidates scripts/photos/queries.json out/
 *   node scripts/photos/fetch-commons.mjs final src/content/photos/selection.json out/
 *
 * Only freely licensed files are accepted (CC0, public domain, CC BY, CC BY-SA); anything
 * else is skipped. Every file keeps its author, licence and Commons page for attribution.
 */
import fs from 'node:fs';
import path from 'node:path';

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'AeroLexPhotoFetcher/1.0 (https://github.com/xlopvaz/aerolex; educational site)';
const FREE = /^(CC0|Public domain|PD|CC BY(-SA)? \d(\.\d)?( [a-z-]+)?)$/i;

const [mode, input, outDir = 'out'] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (html) => String(html ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params })}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function describe(page) {
  const ii = page.imageinfo?.[0];
  if (!ii) return null;
  const m = ii.extmetadata ?? {};
  const licence = strip(m.LicenseShortName?.value);
  return {
    title: page.title,
    pageUrl: ii.descriptionurl,
    mime: ii.mime,
    width: ii.width,
    height: ii.height,
    thumbUrl: ii.thumburl,
    author: strip(m.Artist?.value) || null,
    credit: strip(m.Credit?.value) || null,
    licence,
    licenceUrl: m.LicenseUrl?.value ?? null,
    restrictions: strip(m.Restrictions?.value) || null,
    date: strip(m.DateTimeOriginal?.value) || null,
    description: strip(m.ImageDescription?.value).slice(0, 300) || null,
    free: FREE.test(licence),
  };
}

async function download(url, file) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

async function candidates() {
  const queries = JSON.parse(fs.readFileSync(input, 'utf8'));
  const report = {};
  for (const [family, searches] of Object.entries(queries)) {
    const seen = new Map();
    for (const q of searches) {
      const data = await api({
        action: 'query', generator: 'search', gsrsearch: q, gsrnamespace: '6', gsrlimit: '20',
        prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiurlwidth: '640',
      });
      for (const p of data.query?.pages ?? []) {
        const d = describe(p);
        if (d && d.free && d.mime === 'image/jpeg' && d.width >= 1600 && !seen.has(d.title)) seen.set(d.title, { ...d, query: q });
      }
      await sleep(500);
    }
    const list = [...seen.values()].slice(0, 14);
    for (const [i, d] of list.entries()) {
      d.file = `${family}/${String(i + 1).padStart(2, '0')}.jpg`;
      await download(d.thumbUrl, path.join(outDir, 'candidates', d.file));
      await sleep(300);
    }
    report[family] = list;
    console.log(`${family}: ${list.length} candidates`);
  }
  fs.writeFileSync(path.join(outDir, 'candidates.json'), JSON.stringify(report, null, 2));
}

async function final() {
  const selection = JSON.parse(fs.readFileSync(input, 'utf8'));
  const out = [];
  for (const s of selection) {
    const data = await api({ action: 'query', titles: s.title, prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiurlwidth: '1600' });
    const d = describe(data.query.pages[0]);
    if (!d || !d.free) { console.log(`SKIP (not free or missing): ${s.title}`); continue; }
    await download(d.thumbUrl, path.join(outDir, 'final', `${s.id}.jpg`));
    out.push({ id: s.id, ...d });
    console.log(`OK ${s.id}: ${d.title} — ${d.author} — ${d.licence}`);
    await sleep(400);
  }
  fs.writeFileSync(path.join(outDir, 'final.json'), JSON.stringify(out, null, 2));
}

if (mode === 'candidates') await candidates();
else if (mode === 'final') await final();
else { console.error('Usage: fetch-commons.mjs candidates|final <input.json> [outDir]'); process.exit(1); }
