import { describe, it, expect } from 'vitest';
import { normalize, buildIndex, search, initial, sortByName, termOfTheDay } from '../../src/lib/dictionary/search.js';
import { createStore } from '../../src/lib/core/store.js';
import { createMemoryAdapter } from '../../src/lib/core/adapters/memory.js';
import { toggleFavorite, isFavorite, addRecentSearch, clearRecentSearches, addViewed, MAX_RECENT_SEARCHES } from '../../src/lib/dictionary/user.js';

const items = [
  { id: 'lift', type: 'term', en: 'lift', es: 'sustentación', abbr: null, exp: null, syn: [], cats: ['aerodynamics'] },
  { id: 'qnh', type: 'abbreviation', en: 'QNH', es: 'QNH', abbr: null, exp: { en: 'Altimeter sub-scale setting', es: 'Reglaje de la subescala del altímetro' }, syn: [], cats: ['meteorology'] },
  { id: 'qfe', type: 'abbreviation', en: 'QFE', es: 'QFE', abbr: null, exp: { en: 'Pressure at aerodrome elevation', es: 'Presión a la elevación del aeródromo' }, syn: [], cats: ['meteorology'] },
  { id: 'altimeter', type: 'term', en: 'altimeter', es: 'altímetro', abbr: null, exp: null, syn: [], cats: ['cockpit'] },
  { id: 'go-around', type: 'term', en: 'go-around', es: 'motor y al aire', abbr: null, exp: null, syn: ['missed approach'], cats: ['flight-operations'] },
  { id: 'angle-of-attack', type: 'term', en: 'angle of attack', es: 'ángulo de ataque', abbr: 'AoA', exp: null, syn: [], cats: ['aerodynamics'] },
];
const index = buildIndex(items);
const ids = (r) => r.map((x) => x.id);

describe('normalize', () => {
  it('removes accents, case and punctuation', () => {
    expect(normalize('Sustentación')).toBe('sustentacion');
    expect(normalize('PAN-PAN')).toBe('pan pan');
    expect(normalize('  Ángulo  ')).toBe('angulo');
  });
});

describe('search', () => {
  it('finds Spanish terms without accents', () => expect(ids(search(index, 'sustentacion'))).toEqual(['lift']));
  it('finds English terms', () => expect(ids(search(index, 'lift'))[0]).toBe('lift'));
  it('ranks exact abbreviation matches first', () => expect(ids(search(index, 'qnh'))[0]).toBe('qnh'));
  it('matches prefixes', () => expect(ids(search(index, 'q'))).toEqual(['qfe', 'qnh']));
  it('matches abbreviations of terms', () => expect(ids(search(index, 'aoa'))).toEqual(['angle-of-attack']));
  it('matches inside expansions with lower priority', () => {
    const r = ids(search(index, 'altimet'));
    expect(r[0]).toBe('altimeter');
    expect(r).toContain('qnh');
  });
  it('matches synonyms and hyphenated terms', () => {
    expect(ids(search(index, 'missed approach'))).toEqual(['go-around']);
    expect(ids(search(index, 'go around'))).toEqual(['go-around']);
  });
  it('filters by category and type', () => {
    expect(ids(search(index, 'a', { category: 'cockpit' }))).toEqual(['altimeter']);
    expect(search(index, 'a', { type: 'abbreviation' }).every((x) => x.type === 'abbreviation')).toBe(true);
  });
  it('returns nothing for empty queries or no match', () => {
    expect(search(index, '   ')).toEqual([]);
    expect(search(index, 'zzzz')).toEqual([]);
  });
});

describe('helpers', () => {
  it('initial uses the language name', () => {
    expect(initial(items[0], 'es')).toBe('S');
    expect(initial(items[0], 'en')).toBe('L');
    expect(initial(items[5], 'es')).toBe('A');
  });
  it('sorts with the language collation', () => {
    expect(sortByName(items, 'es').map((i) => i.es)[0]).toBe('altímetro');
  });
  it('term of the day is stable for a date and changes the next day', () => {
    const d1 = termOfTheDay(items, new Date('2026-11-12T08:00:00Z'));
    expect(termOfTheDay(items, new Date('2026-11-12T23:00:00Z'))).toBe(d1);
    expect(termOfTheDay(items, new Date('2026-11-13T08:00:00Z'))).not.toBe(d1);
  });
});

describe('favourites and history', () => {
  const make = () => createStore({ adapter: createMemoryAdapter() });
  it('toggles favourites by ID', () => {
    const s = make();
    expect(toggleFavorite(s, 'qnh')).toBe(true);
    expect(isFavorite(s.get(), 'qnh')).toBe(true);
    expect(toggleFavorite(s, 'qnh')).toBe(false);
    expect(s.get().favorites.terms).toEqual([]);
  });
  it('keeps recent searches unique, newest first and capped', () => {
    const s = make();
    for (let i = 0; i < MAX_RECENT_SEARCHES + 3; i++) addRecentSearch(s, `term${i}`);
    addRecentSearch(s, 'TERM5');
    addRecentSearch(s, 'x');
    const list = s.get().history.searches;
    expect(list.length).toBe(MAX_RECENT_SEARCHES);
    expect(list[0]).toBe('TERM5');
    expect(list.filter((q) => q.toLowerCase() === 'term5').length).toBe(1);
    clearRecentSearches(s);
    expect(s.get().history.searches).toEqual([]);
  });
  it('records viewed entries without duplicates', () => {
    const s = make();
    addViewed(s, 'a'); addViewed(s, 'b'); addViewed(s, 'a');
    expect(s.get().history.viewed).toEqual(['a', 'b']);
  });
});
