import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { KIND_ORDER, buildUsage, fold, groupByKind, matchesQuery, sortSources, usageCount } from '../../src/lib/sources/bibliography.js';

describe('bibliography', () => {
  it('folds accents, case and spaces', () => {
    expect(fold('  Aviación   CIVIL ')).toBe('aviacion civil');
  });

  it('builds usage per source and area, without duplicates', () => {
    const usage = buildUsage({
      dictionary: [{ key: 'metar', sources: ['a', 'b'] }, { key: 'taf', sources: ['a', 'a'] }],
      lessons: [{ key: 'metar-speci/01', sources: ['a'] }, { key: 'metar-speci/01', sources: ['a'] }],
    });
    expect(usage.get('a')).toEqual({ dictionary: ['metar', 'taf'], lessons: ['metar-speci/01'] });
    expect(usage.get('b')).toEqual({ dictionary: ['metar'] });
    expect(usageCount(usage.get('a'))).toBe(3);
    expect(usageCount(undefined)).toBe(0);
  });

  it('sorts by publisher then title, ignoring accents and case', () => {
    const list = [
      { publisher: 'ICAO', title: 'Annex 3' },
      { publisher: 'EASA', title: 'Part-FCL' },
      { publisher: 'ICAO', title: 'Annex 10' },
      { publisher: 'Agencia Estatal de Seguridad Aérea', title: 'AIP' },
    ];
    expect(sortSources(list, 'es').map((s) => `${s.publisher}|${s.title}`)).toEqual([
      'Agencia Estatal de Seguridad Aérea|AIP',
      'EASA|Part-FCL',
      'ICAO|Annex 3',
      'ICAO|Annex 10',
    ]);
  });

  it('groups by kind in the fixed order and drops empty groups', () => {
    const list = [
      { kind: 'web', publisher: 'B', title: 'x' },
      { kind: 'standard', publisher: 'A', title: 'y' },
      { kind: 'odd', publisher: 'C', title: 'z' },
    ];
    expect(groupByKind(list).map((g) => g.kind)).toEqual(['standard', 'web', 'odd']);
  });

  it('matches every word of the query in title, publisher or id', () => {
    const s = { id: 'icao-annex-3', title: 'Annex 3 — Meteorological Service', publisher: 'ICAO' };
    expect(matchesQuery(s, '')).toBe(true);
    expect(matchesQuery(s, 'icao meteorological')).toBe(true);
    expect(matchesQuery(s, 'annex-3')).toBe(true);
    expect(matchesQuery(s, 'icao easa')).toBe(false);
  });

  it('knows every kind used in the source registry', () => {
    const sources = JSON.parse(fs.readFileSync('src/content/sources/sources.json', 'utf8'));
    for (const [id, s] of Object.entries(sources)) expect(KIND_ORDER, id).toContain(s.kind);
  });
});
