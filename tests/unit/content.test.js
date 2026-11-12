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

  it('every source is used somewhere and well-formed', () => {
    const used = new Set(entries.flatMap((e) => e.data.sources));
    const readJson = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
    for (const c of readJson('src/content/courses')) c.sources.forEach((x) => used.add(x));
    for (const a of readJson('src/content/aircraft')) { a.sources.forEach((x) => used.add(x)); a.variants.forEach((v) => v.sources.forEach((x) => used.add(x))); }
    for (const f of fs.readdirSync('src/content/lessons', { recursive: true }).map(String).filter((f) => f.endsWith('.mdx'))) {
      const m = fs.readFileSync(path.join('src/content/lessons', f), 'utf8').match(/^sources: \[(.*)\]$/m);
      if (m) m[1].split(',').map((x) => x.trim()).forEach((x) => used.add(x));
    }
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

describe('academy content', () => {
  const read = (p) => fs.readFileSync(p, 'utf8');
  const courses = fs.readdirSync('src/content/courses').map((f) => ({ id: path.basename(f, '.json'), data: JSON.parse(read(`src/content/courses/${f}`)) }));
  const paths = JSON.parse(read('src/content/paths/paths.json'));
  const quizIds = new Set(fs.readdirSync('src/content/quizzes').map((f) => path.basename(f, '.json')));
  const lessonFiles = fs.readdirSync('src/content/lessons', { recursive: true }).filter((f) => String(f).endsWith('.mdx')).map(String);
  const front = (file) => {
    const m = read(path.join('src/content/lessons', file)).match(/^---\n([\s\S]*?)\n---/);
    const get = (k) => m[1].match(new RegExp(`^${k}: (.*)$`, 'm'))?.[1]?.trim();
    const list = (k) => (get(k) ?? '[]').replace(/^\[|\]$/g, '').split(',').map((x) => x.trim()).filter(Boolean);
    return { lesson: get('lesson'), course: get('course'), lang: get('lang'), quiz: get('quiz'), terms: list('terms'), sources: list('sources') };
  };
  const lessons = lessonFiles.map(front);

  it.each(courses.map((c) => [c.id, c.data]))('course %s is complete in both languages', (id, c) => {
    expect(paths).toHaveProperty(c.path);
    for (const l of c.lessons) {
      for (const lang of ['es', 'en']) {
        expect(lessons.some((x) => x.course === id && x.lesson === l && x.lang === lang), `${id}/${l} (${lang})`).toBe(true);
      }
    }
    for (const s of c.sources) expect(sources).toHaveProperty(s);
  });

  it('lessons reference existing quizzes, terms and sources', () => {
    for (const l of lessons) {
      if (l.quiz && l.quiz !== 'null') expect(quizIds.has(l.quiz), `${l.lesson}: quiz ${l.quiz}`).toBe(true);
      for (const t of l.terms) expect(ids.has(t), `${l.lesson}: term ${t}`).toBe(true);
      for (const s of l.sources) expect(sources, `${l.lesson}: source ${s}`).toHaveProperty(s);
    }
  });

  it('both language versions of a lesson share the same quiz, terms and sources', () => {
    const byKey = new Map();
    for (const l of lessons) {
      const k = `${l.course}/${l.lesson}`;
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push(l);
    }
    for (const [k, versions] of byKey) {
      expect(versions.length, k).toBe(2);
      const [a, b] = versions;
      expect(a.quiz, k).toBe(b.quiz);
      expect(a.terms, k).toEqual(b.terms);
      expect(a.sources, k).toEqual(b.sources);
    }
  });

  it('quiz answers are valid options and texts are bilingual', () => {
    for (const id of quizIds) {
      const q = JSON.parse(read(`src/content/quizzes/${id}.json`));
      const qids = new Set();
      for (const question of q.questions) {
        expect(qids.has(question.id), `${id}/${question.id} duplicated`).toBe(false);
        qids.add(question.id);
        expect(question.options.map((o) => o.id)).toContain(question.answer);
        for (const f of [question.prompt, question.explanation, ...question.options.map((o) => o.text)]) {
          expect(f.es?.trim()).toBeTruthy();
          expect(f.en?.trim()).toBeTruthy();
        }
      }
    }
  });
});
