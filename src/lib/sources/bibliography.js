/**
 * Global bibliography (Phase 3): which content cites each source, how sources are
 * grouped and ordered, and the text search used on the sources page.
 * Pure functions: the page passes in plain data read from the content collections.
 */

/** Display order of source kinds (most authoritative first). */
export const KIND_ORDER = ['standard', 'regulation', 'aip', 'handbook', 'glossary', 'manufacturer', 'web'];

/** Content areas that cite sources, in the order they are listed under each source. */
export const USAGE_AREAS = ['dictionary', 'lessons', 'courses', 'aircraft', 'cockpit', 'timeline', 'weather'];

/** Lower case, no accents, single spaces. */
export function fold(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Builds, for each source id, the content items that cite it, per area.
 * Items cited twice in one area (e.g. a lesson in two languages sharing a key) appear once.
 * @param {Record<string, { key: string, sources: string[] }[]>} areas
 * @returns {Map<string, Record<string, string[]>>}
 */
export function buildUsage(areas) {
  /** @type {Map<string, Record<string, Set<string>>>} */
  const sets = new Map();
  for (const [area, items] of Object.entries(areas)) {
    for (const item of items ?? []) {
      for (const id of new Set(item.sources ?? [])) {
        if (!sets.has(id)) sets.set(id, {});
        const byArea = sets.get(id);
        (byArea[area] ??= new Set()).add(item.key);
      }
    }
  }
  const out = new Map();
  for (const [id, byArea] of sets) {
    out.set(id, Object.fromEntries(Object.entries(byArea).map(([a, s]) => [a, [...s]])));
  }
  return out;
}

/** Total number of citing items for one source's usage record. */
export function usageCount(usage) {
  return Object.values(usage ?? {}).reduce((n, list) => n + list.length, 0);
}

/**
 * Sorts sources by publisher, then title (locale-aware, accents ignored for order).
 * @template {{ publisher: string, title: string }} T
 * @param {T[]} list @param {string} locale
 * @returns {T[]}
 */
export function sortSources(list, locale = 'en') {
  const cmp = new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
  return [...list].sort((a, b) => cmp.compare(a.publisher, b.publisher) || cmp.compare(a.title, b.title));
}

/**
 * Groups sources by kind following KIND_ORDER; unknown kinds go last, empty groups are dropped.
 * @template {{ kind: string, publisher: string, title: string }} T
 * @param {T[]} list @param {string} locale
 * @returns {{ kind: string, items: T[] }[]}
 */
export function groupByKind(list, locale = 'en') {
  const kinds = [...KIND_ORDER, ...[...new Set(list.map((s) => s.kind))].filter((k) => !KIND_ORDER.includes(k)).sort()];
  return kinds
    .map((kind) => ({ kind, items: sortSources(list.filter((s) => s.kind === kind), locale) }))
    .filter((g) => g.items.length);
}

/**
 * Whether a source matches a free-text query (title, publisher or id; accents ignored).
 * Every word of the query must appear.
 * @param {{ id?: string, title: string, publisher: string }} source @param {string} query
 */
export function matchesQuery(source, query) {
  const words = fold(query).split(' ').filter(Boolean);
  if (!words.length) return true;
  const hay = fold(`${source.title} ${source.publisher} ${source.id ?? ''}`);
  return words.every((w) => hay.includes(w));
}
