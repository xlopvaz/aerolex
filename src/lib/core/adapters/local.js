import { createMemoryAdapter } from './memory.js';

/**
 * LocalStorage adapter. If LocalStorage is unavailable or throws (private mode,
 * disabled storage, quota), it transparently falls back to memory and reports
 * `persistent: false` so the UI can warn the user.
 *
 * A future RemoteSyncAdapter (accounts, multi-device sync) only has to implement
 * the same get / set / remove contract.
 *
 * @param {Storage} [storage]
 */
export function createLocalAdapter(storage = globalThis.localStorage) {
  if (!isUsable(storage)) return createMemoryAdapter();
  const fallback = createMemoryAdapter();
  let persistent = true;
  return {
    kind: 'local',
    get persistent() { return persistent; },
    get(key) {
      try { return storage.getItem(key); } catch { persistent = false; return fallback.get(key); }
    },
    set(key, value) {
      try { storage.setItem(key, value); } catch { persistent = false; fallback.set(key, value); }
    },
    remove(key) {
      try { storage.removeItem(key); } catch { fallback.remove(key); }
    },
  };
}

/** @param {Storage | undefined} storage */
function isUsable(storage) {
  if (!storage) return false;
  try {
    const probe = '__aerolex_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}
