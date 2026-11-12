/**
 * In-memory storage adapter. Used in tests and as a fallback when the browser
 * blocks LocalStorage (e.g. some private modes).
 * Implements the StorageAdapter contract: get, set, remove (strings in, strings out).
 */
export function createMemoryAdapter(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    kind: 'memory',
    persistent: false,
    get: (key) => (data.has(key) ? data.get(key) : null),
    set: (key, value) => { data.set(key, String(value)); },
    remove: (key) => { data.delete(key); },
  };
}
