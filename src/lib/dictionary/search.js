/**
 * Dictionary search: bilingual, accent-insensitive, ranked.
 * Pure functions (no DOM), shared by the dictionary page, the home page and tests.
 *
 * Index item shape (built by src/pages/data/dictionary.json.js):
 * { id, type, en, es, abbr, exp: { en, es }, syn: string[], cats: string[], simple: { en, es } }
 */

/** Lowercase, strip accents and punctuation: "Sustentación" -> "sustentacion", "PAN-PAN" -> "pan pan" */
export function normalize(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim();
}

/** Precompute normalized search fields once. */
export function buildIndex(items) {
  return items.map((item) => {
    const primary = [item.en, item.es, item.abbr].filter(Boolean).map(normalize);
    const secondary = [item.exp?.en, item.exp?.es, ...(item.syn ?? [])].filter(Boolean).map(normalize);
    return { item, primary: [...new Set(primary)], secondary: [...new Set(secondary)] };
  });
}

/**
 * Score one field against the query. Higher is better; 0 = no match.
 * exact > starts with > a word starts with > contains
 */
function scoreField(field, q) {
  if (!field) return 0;
  if (field === q) return 100;
  if (field.startsWith(q)) return 80 - Math.min(field.length - q.length, 20) * 0.5;
  if (field.split(' ').some((w) => w.startsWith(q))) return 60;
  if (q.length >= 3 && field.includes(q)) return 40;
  return 0;
}

/**
 * @param {ReturnType<typeof buildIndex>} index
 * @param {string} query
 * @param {{ limit?: number, category?: string|null, type?: string|null }} [options]
 */
export function search(index, query, { limit = 20, category = null, type = null } = {}) {
  const q = normalize(query);
  const pool = index.filter(({ item }) =>
    (!category || item.cats.includes(category)) && (!type || item.type === type)
  );
  if (!q) return [];
  const results = [];
  for (const entry of pool) {
    const p = Math.max(0, ...entry.primary.map((f) => scoreField(f, q)));
    const s = Math.max(0, ...entry.secondary.map((f) => scoreField(f, q))) * 0.7;
    const score = Math.max(p, s);
    if (score > 0) results.push({ item: entry.item, score });
  }
  results.sort((a, b) => b.score - a.score || a.item.en.localeCompare(b.item.en));
  return results.slice(0, limit).map((r) => r.item);
}

/** Initial letter used for the A–Z grouping, in the given language. */
export function initial(item, lang) {
  const c = normalize(item[lang] || item.en).charAt(0).toUpperCase();
  return /[A-ZÑ]/.test(c) ? c : '#';
}

/** Sort items alphabetically by their name in the given language (Spanish collation for 'es'). */
export function sortByName(items, lang) {
  const collator = new Intl.Collator(lang, { sensitivity: 'base' });
  return [...items].sort((a, b) => collator.compare(a[lang] || a.en, b[lang] || b.en));
}

/** Deterministic "term of the day": same term for everyone on a given UTC date. */
export function termOfTheDay(items, date = new Date()) {
  if (!items.length) return null;
  const day = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);
  const sorted = [...items].sort((a, b) => a.id.localeCompare(b.id));
  return sorted[day % sorted.length];
}
