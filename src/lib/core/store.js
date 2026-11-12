import { STORAGE_KEY, defaultState, normalizeState, isPlainObject } from './schema.js';

/**
 * Single source of truth for the user's state.
 *
 *   const store = createStore({ adapter });
 *   store.get();                         // current state (read-only copy)
 *   store.update((s) => { s.xp.total += 10; });
 *   const off = store.subscribe((state) => …);
 *
 * @param {{ adapter: { get(k:string): string|null, set(k:string, v:string): void, remove(k:string): void, persistent?: boolean },
 *           key?: string, now?: () => Date }} options
 */
export function createStore({ adapter, key = STORAGE_KEY, now = () => new Date() }) {
  /** @type {Set<(state: any) => void>} */
  const listeners = new Set();
  let state = load();

  function load() {
    const raw = adapter.get(key);
    if (raw == null) return defaultState(now());
    try {
      return normalizeState(JSON.parse(raw), now());
    } catch {
      return defaultState(now());
    }
  }

  function save() {
    adapter.set(key, JSON.stringify(state));
  }

  function emit() {
    const snapshot = get();
    for (const fn of listeners) fn(snapshot);
  }

  function get() {
    return structuredClone(state);
  }

  /** @param {(draft: any) => void} mutator */
  function update(mutator) {
    const draft = structuredClone(state);
    mutator(draft);
    draft.updatedAt = now().toISOString();
    state = normalizeState(draft, now());
    save();
    emit();
    return get();
  }

  /** @param {(state: any) => void} fn */
  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  /** Re-read storage (e.g. after another tab changed it). */
  function reload() {
    state = load();
    emit();
  }

  /** Backup file content. */
  function exportData() {
    return { app: 'aerolex', format: 1, exportedAt: now().toISOString(), data: get() };
  }

  /**
   * Restore from a backup. Throws ImportError and changes nothing if the file is invalid.
   * @param {string | object} input
   */
  function importData(input) {
    let parsed;
    try {
      parsed = typeof input === 'string' ? JSON.parse(input) : input;
    } catch {
      throw new ImportError('not-json');
    }
    if (!isPlainObject(parsed) || parsed.app !== 'aerolex' || !isPlainObject(parsed.data)
        || typeof parsed.data.schemaVersion !== 'number') {
      throw new ImportError('not-aerolex');
    }
    state = normalizeState(parsed.data, now());
    save();
    emit();
    return get();
  }

  function reset() {
    adapter.remove(key);
    state = defaultState(now());
    emit();
    return get();
  }

  return {
    get, update, subscribe, reload, exportData, importData, reset,
    get persistent() { return adapter.persistent !== false; },
    key,
  };
}

export class ImportError extends Error {
  /** @param {string} reason */
  constructor(reason) {
    super(`Invalid AeroLex backup: ${reason}`);
    this.name = 'ImportError';
    this.reason = reason;
  }
}
