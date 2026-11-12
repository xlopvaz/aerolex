import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { CATEGORIES, ENTRY_TYPES, REVIEW_STATUSES } from '../../src/lib/dictionary/categories.js';
import { DICTS } from '../../src/i18n/index.js';
import { ROUTES } from '../../src/i18n/routes.js';

const DIR = 'src/content/dictionary';
const entries = fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => ({
  id: path.basename(f, '.json'),
  data: JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')),
}));
const ids = new Set(entries.map((e) => e.id));
const sources = JSON.parse(fs.readFileSync('src/content/sources/sources.json', 'utf8'));
const bilingualFields = ['term', 'definition', 'simple', 'example', 'pronunciation'];

describe('dictionary content', () => {
  it('has entries', () => expect(entries.length).toBeGreaterThan(50));

  it.each(entries.map((e) => [e.id, e.data]))('%s is complete and consistent', (id, d) => {
    expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(ENTRY_TYPES).toContain(d.type);
    for (const f of bilingualFields) {
      expect(d[f]?.en?.trim(), `${f}.en`).toBeTruthy();
      expect(d[f]?.es?.trim(), `${f}.es`).toBeTruthy();
    }
    if (d.type === 'abbreviation') {
      expect(d.expansion?.en?.trim()).toBeTruthy();
      expect(d.expansion?.es?.trim()).toBeTruthy();
    }
    if (d.regionalNote) { expect(d.regionalNote.en).toBeTruthy(); expect(d.regionalNote.es).toBeTruthy(); }
    expect(d.categories.length).toBeGreaterThan(0);
    for (const c of d.categories) expect(CATEGORIES).toContain(c);
    expect(['official', 'technical']).toContain(d.definitionBasis);
    expect(d.sources.length, 'every entry needs a source').toBeGreaterThan(0);
    for (const s of d.sources) expect(sources, `unknown source ${s}`).toHaveProperty(s);
    for (const r of d.related) {
      expect(ids.has(r), `related "${r}" does not exist`).toBe(true);
      expect(r).not.toBe(id);
    }
    expect(REVIEW_STATUSES).toContain(d.review.status);
    if (d.review.status !== 'draft') expect(d.review.reviewedBy).toBeTruthy();
  });

  it('entry IDs never collide with pages inside the dictionary section', () => {
    const reserved = Object.values(ROUTES)
      .flatMap((r) => Object.entries(r.slug))
      .map(([lang, slug]) => slug.replace(`${ROUTES.dictionary.slug[lang]}/`, ''));
    for (const id of ids) expect(reserved).not.toContain(id);
  });

  it('every category has a label in every language', () => {
    for (const c of CATEGORIES) for (const l of ['es', 'en']) expect(DICTS[l].categories[c]).toBeTruthy();
  });

  it('every source is used and well-formed', () => {
    const used = new Set(entries.flatMap((e) => e.data.sources));
    for (const [id, s] of Object.entries(sources)) {
      expect(s.url, id).toMatch(/^https:\/\//);
      expect(used.has(id), `source "${id}" is not used by any entry`).toBe(true);
    }
  });

  it('covers every abbreviation requested in the project brief', () => {
    const brief = ['ATC', 'ATIS', 'APU', 'MEL', 'CDL', 'NOTAM', 'SID', 'STAR', 'ILS', 'VOR', 'DME', 'TCAS', 'EGPWS', 'FMS', 'FOD', 'PAX', 'ETA', 'ETD', 'QNH', 'QFE', 'RVSM', 'RVR', 'SOP', 'CRM', 'PPL', 'CPL', 'ATPL'];
    const have = new Set(entries.filter((e) => e.data.type === 'abbreviation').map((e) => e.data.term.en));
    for (const a of brief) expect(have.has(a), a).toBe(true);
  });
});
