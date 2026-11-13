import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { THEMES, parseEventDate, formatEventDate, sortEvents, filterEvents, centuryOf, groupByCentury, yearsSince } from '../../src/lib/timeline/timeline.js';
import { GROUPS, groupCodes, searchCodes, buildCodeIndex, explainGroup, fold } from '../../src/lib/weather/glossary.js';
import { DESCRIPTORS, PHENOMENA } from '../../src/lib/metar/weather.js';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const sources = read('src/content/sources/sources.json');
const dictIds = new Set(fs.readdirSync('src/content/dictionary').map((f) => f.replace(/\.json$/, '')));
const events = Object.entries(read('src/content/timeline/events.json')).map(([id, d]) => ({ id, ...d }));
const codes = Object.entries(read('src/content/weather/codes.json')).map(([id, d]) => ({ id, ...d }));
const index = buildCodeIndex(codes);

describe('timeline helpers', () => {
  it('parses dates at the precision given', () => {
    expect(parseEventDate('1903-12-17')).toEqual({ year: 1903, month: 12, day: 17, precision: 'day' });
    expect(parseEventDate('1923-01')).toEqual({ year: 1923, month: 1, day: null, precision: 'month' });
    expect(parseEventDate('2002')).toEqual({ year: 2002, month: null, day: null, precision: 'year' });
    expect(parseEventDate('1903-02-30')).toBeNull();
    expect(parseEventDate('1903-13')).toBeNull();
    expect(parseEventDate('17/12/1903')).toBeNull();
  });

  it('formats without inventing a day or month', () => {
    expect(formatEventDate('1903-12-17', 'es')).toBe('17 de diciembre de 1903');
    expect(formatEventDate('1903-12-17', 'en')).toMatch(/17 December 1903|December 17, 1903/);
    expect(formatEventDate('1923-01', 'es')).toBe('enero de 1923');
    expect(formatEventDate('2002', 'en')).toBe('2002');
  });

  it('sorts, filters and groups by century', () => {
    const list = [{ id: 'b', date: '2002', theme: 'regulation' }, { id: 'a', date: '1783-11-21', theme: 'flight' }, { id: 'c', date: '1903-12-17', theme: 'flight' }];
    expect(sortEvents(list).map((e) => e.id)).toEqual(['a', 'c', 'b']);
    expect(filterEvents(list, 'flight').map((e) => e.id)).toEqual(['a', 'c']);
    expect(filterEvents(list, 'all')).toHaveLength(3);
    expect([centuryOf(1783), centuryOf(1900), centuryOf(1903), centuryOf(2002)]).toEqual([18, 19, 20, 21]);
    expect(groupByCentury(list).map((g) => [g.century, g.events.length])).toEqual([[18, 1], [20, 1], [21, 1]]);
    expect(yearsSince('1903-12-17', new Date('2026-11-13T00:00:00Z'))).toBe(123);
  });
});

describe('timeline content', () => {
  it('has a real set of events', () => expect(events.length).toBeGreaterThanOrEqual(15));

  it.each(events.map((e) => [e.id, e]))('%s is bilingual, sourced and consistent', (id, e) => {
    expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(parseEventDate(e.date), 'valid date').not.toBeNull();
    expect(THEMES).toContain(e.theme);
    for (const f of ['title', 'text']) {
      expect(e[f].es.trim()).toBeTruthy();
      expect(e[f].en.trim()).toBeTruthy();
    }
    expect(e.sources.length).toBeGreaterThan(0);
    for (const s of e.sources) expect(sources, `unknown source ${s}`).toHaveProperty(s);
    for (const t of e.terms) expect(dictIds.has(t), `unknown term ${t}`).toBe(true);
    expect(['draft', 'reviewed', 'verified']).toContain(e.review.status);
  });

  it('covers every theme', () => {
    for (const t of THEMES) expect(events.some((e) => e.theme === t)).toBe(true);
  });
});

describe('weather glossary content', () => {
  it.each(codes.map((c) => [c.id, c]))('%s is bilingual, sourced and grouped', (id, c) => {
    expect(GROUPS).toContain(c.group);
    expect(c.meaning.es.trim()).toBeTruthy();
    expect(c.meaning.en.trim()).toBeTruthy();
    expect(c.sources.length).toBeGreaterThan(0);
    for (const s of c.sources) expect(sources, `unknown source ${s}`).toHaveProperty(s);
    for (const t of c.terms) expect(dictIds.has(t), `unknown term ${t}`).toBe(true);
    expect(c.review.status).toBe('draft');
  });

  it('documents every descriptor and phenomenon the METAR decoder understands', () => {
    for (const code of [...DESCRIPTORS, ...PHENOMENA]) expect(index.has(code), code).toBe(true);
  });

  it('every example is explained by the glossary itself or is a full message fragment', () => {
    for (const c of codes.filter((c) => c.example && !/\s/.test(c.example) && !/[…=]/.test(c.example))) {
      const r = explainGroup(c.example, index);
      expect(r, `${c.id}: ${c.example}`).not.toBeNull();
      expect(r.ids, `${c.id}: ${c.example}`).toContain(c.id);
    }
  });
});

describe('weather glossary helpers', () => {
  it('groups in display order', () => {
    const g = groupCodes(codes);
    expect(g.map((x) => x.group)).toEqual(GROUPS.filter((x) => codes.some((c) => c.group === x)));
  });

  it('searches by code first, then by meaning without accents', () => {
    expect(searchCodes(codes, 'br', 'es')[0].id).toBe('br');
    expect(searchCodes(codes, 'prob40', 'en')[0].id).toBe('prob');
    expect(searchCodes(codes, 'ceniza volcanica', 'es').map((c) => c.id)).toContain('va');
    expect(searchCodes(codes, '', 'es')).toHaveLength(codes.length);
    expect(fold('  Engelante ')).toBe('engelante');
  });

  it('explains weather, cloud and other groups', () => {
    expect(explainGroup('+TSRA', index).ids).toEqual(['heavy', 'ts', 'ra']);
    expect(explainGroup('-shra', index).ids).toEqual(['light', 'sh', 'ra']);
    expect(explainGroup('RA', index).ids).toEqual(['moderate', 'ra']);
    expect(explainGroup('VCSH', index).ids).toEqual(['vc', 'sh']);
    expect(explainGroup('FZFG', index).ids).toEqual(['fz', 'fg']);
    expect(explainGroup('RETSRA', index).ids).toEqual(['re', 'moderate', 'ts', 'ra']);
    expect(explainGroup('BKN012CB', index)).toEqual({ token: 'BKN012CB', ids: ['bkn', 'cb'], heightFt: 1200 });
    expect(explainGroup('VV///', index)).toEqual({ token: 'VV///', ids: ['vv'], heightFt: null });
    expect(explainGroup('R18R/0600U', index).ids).toEqual(['rvr']);
    expect(explainGroup('Q1013', index).ids).toEqual(['q']);
    expect(explainGroup('A2992', index).ids).toEqual(['a']);
    expect(explainGroup('VRB02KT', index).ids).toEqual(['vrb', 'kt']);
    expect(explainGroup('CAVOK', index).ids).toEqual(['cavok']);
    expect(explainGroup('PROB40', index).ids).toEqual(['prob']);
    expect(explainGroup('TX24/1314Z', index).ids).toEqual(['tx-tn']);
    expect(explainGroup('FM131500', index).ids).toEqual(['fm']);
  });

  it('rejects what it does not understand', () => {
    expect(explainGroup('', index)).toBeNull();
    expect(explainGroup('RARA', index)).toBeNull();
    expect(explainGroup('HELLO', index)).toBeNull();
    expect(explainGroup('BKN 012', index)).toBeNull();
  });
});
