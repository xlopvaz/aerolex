/**
 * Browser helpers shared by the dictionary islands: loads the build-time index once.
 */
import { buildIndex } from './search.js';

let cache;

/** @param {string} url absolute URL (with base) of /data/dictionary.json */
export function loadIndex(url) {
  if (!cache) {
    cache = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Dictionary index: HTTP ${r.status}`);
        return r.json();
      })
      .then((items) => ({ items, index: buildIndex(items), byId: new Map(items.map((i) => [i.id, i])) }));
  }
  return cache;
}

/** Escape text for safe insertion into HTML built in JS. */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
