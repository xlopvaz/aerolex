import { describe, it, expect } from 'vitest';
import { createStore, ImportError } from '../../src/lib/core/store.js';
import { createMemoryAdapter } from '../../src/lib/core/adapters/memory.js';
import { createLocalAdapter } from '../../src/lib/core/adapters/local.js';
import { STORAGE_KEY, SCHEMA_VERSION, normalizeState, defaultState } from '../../src/lib/core/schema.js';
import { recordPractice, practiceStats } from '../../src/lib/practice/stats.js';

const fixedNow = () => new Date('2026-11-12T10:00:00Z');
const make = (initial) => createStore({ adapter: createMemoryAdapter(initial), now: fixedNow });

describe('store', () => {
  it('starts with a valid default state', () => {
    const s = make().get();
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.prefs).toEqual({ theme: 'system', lang: null });
    expect(s.xp.total).toBe(0);
  });

  it('persists updates and reloads them', () => {
    const adapter = createMemoryAdapter();
    const a = createStore({ adapter, now: fixedNow });
    a.update((s) => { s.xp.total = 40; s.prefs.lang = 'es'; });
    const b = createStore({ adapter, now: fixedNow });
    expect(b.get().xp.total).toBe(40);
    expect(b.get().prefs.lang).toBe('es');
  });

  it('get() returns a copy that cannot mutate the store', () => {
    const store = make();
    store.get().xp.total = 999;
    expect(store.get().xp.total).toBe(0);
  });

  it('notifies subscribers and allows unsubscribing', () => {
    const store = make();
    const seen = [];
    const off = store.subscribe((s) => seen.push(s.xp.total));
    store.update((s) => { s.xp.total = 5; });
    off();
    store.update((s) => { s.xp.total = 6; });
    expect(seen).toEqual([5]);
  });

  it('recovers from corrupt stored data', () => {
    const store = make({ [STORAGE_KEY]: '{not json' });
    expect(store.get().schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('fills keys missing from older saved data and fixes invalid prefs', () => {
    const partial = JSON.stringify({ schemaVersion: 1, prefs: { theme: 'neon', lang: 'fr' }, xp: { total: 12 } });
    const s = make({ [STORAGE_KEY]: partial }).get();
    expect(s.xp.total).toBe(12);
    expect(s.xp.log).toEqual([]);
    expect(s.favorites.terms).toEqual([]);
    expect(s.prefs.theme).toBe('system');
    expect(s.prefs.lang).toBe(null);
  });

  it('keeps data saved by a newer version instead of wiping it', () => {
    const future = normalizeState({ ...defaultState(), schemaVersion: SCHEMA_VERSION + 1, newThing: 1 });
    expect(future.schemaVersion).toBe(SCHEMA_VERSION + 1);
    expect(future.newThing).toBe(1);
  });

  it('exports and imports a backup round-trip', () => {
    const a = make();
    a.update((s) => { s.xp.total = 120; s.badges['first-flight'] = { earnedAt: 'x' }; });
    const backup = JSON.stringify(a.exportData());
    const b = make();
    b.importData(backup);
    expect(b.get().xp.total).toBe(120);
    expect(b.get().badges['first-flight']).toBeTruthy();
  });

  it('rejects invalid backups without changing anything', () => {
    const store = make();
    store.update((s) => { s.xp.total = 7; });
    expect(() => store.importData('nope')).toThrow(ImportError);
    expect(() => store.importData({ app: 'other', data: {} })).toThrow(ImportError);
    expect(() => store.importData({ app: 'aerolex', data: { foo: 1 } })).toThrow(ImportError);
    expect(store.get().xp.total).toBe(7);
  });

  it('reset() clears storage and returns defaults', () => {
    const adapter = createMemoryAdapter();
    const store = createStore({ adapter, now: fixedNow });
    store.update((s) => { s.xp.total = 3; });
    store.reset();
    expect(store.get().xp.total).toBe(0);
    expect(adapter.get(STORAGE_KEY)).toBe(null);
  });
});

describe('local adapter', () => {
  it('falls back to memory when storage throws', () => {
    const broken = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() {} };
    const adapter = createLocalAdapter(broken);
    expect(adapter.persistent).toBe(false);
    adapter.set('k', 'v');
    expect(adapter.get('k')).toBe('v');
  });

  it('uses the provided storage when it works', () => {
    const data = {};
    const storage = {
      getItem: (k) => (k in data ? data[k] : null),
      setItem: (k, v) => { data[k] = String(v); },
      removeItem: (k) => { delete data[k]; },
    };
    const adapter = createLocalAdapter(storage);
    adapter.set('a', '1');
    expect(data.a).toBe('1');
    expect(adapter.persistent).toBe(true);
  });
});


describe('schema v2 — practice results', () => {
  it('migrates a v1 state and keeps its data', () => {
    const v1 = { schemaVersion: 1, prefs: { theme: 'dark', lang: 'es' }, progress: { lessons: { 'taf/what-is-taf': { completedAt: '2026-11-13T00:00:00.000Z' } }, paths: {} } };
    const s = normalizeState(v1);
    expect(s.schemaVersion).toBe(2);
    expect(s.practice).toEqual({});
    expect(s.prefs.theme).toBe('dark');
    expect(s.progress.lessons['taf/what-is-taf']).toBeTruthy();
  });
  it('records practice answers by ID', () => {
    const store = createStore({ adapter: createMemoryAdapter() });
    recordPractice(store, 'metar-taf-1', true);
    recordPractice(store, 'metar-taf-1', false);
    recordPractice(store, 'metar-taf-1', true);
    expect(practiceStats(store.get(), 'metar-taf-1')).toMatchObject({ correct: 2, wrong: 1 });
    expect(practiceStats(store.get(), 'metar-taf-4')).toMatchObject({ correct: 0, wrong: 0 });
  });
});
