/**
 * Airport search over the OurAirports-derived dataset (src/content/airports/airports.json).
 * Exact IATA/ICAO codes rank first, then names and cities (accent-insensitive).
 * Pure functions, shared by the page and the tests.
 */
import { normalize } from '../dictionary/search.js';

/** Array rows → objects, with normalised search fields. */
export function buildAirportIndex(data) {
  const f = data.fields;
  return data.airports.map((row) => {
    const a = Object.fromEntries(f.map((k, i) => [k, row[i]]));
    a.countryName = data.countries[a.country] ?? a.country;
    return { a, name: normalize(a.name), city: normalize(a.city ?? ''), country: normalize(a.countryName) };
  });
}

const SIZE_RANK = { large: 3, medium: 2, small: 1 };

/**
 * @param {ReturnType<typeof buildAirportIndex>} index
 * @param {string} query
 * @param {number} [limit]
 */
export function searchAirports(index, query, limit = 25) {
  const raw = String(query ?? '').trim().toUpperCase();
  const q = normalize(query);
  if (!q) return [];
  const scored = [];
  for (const e of index) {
    let s = 0;
    if (raw.length === 3 && e.a.iata === raw) s = 1000;
    else if (raw.length === 4 && e.a.icao === raw) s = 1000;
    else if (raw.length >= 2 && raw.length <= 4 && (e.a.icao?.startsWith(raw) || e.a.iata.startsWith(raw))) s = 300;
    if (q.length >= 2) {
      if (e.city === q || e.name === q) s = Math.max(s, 500);
      else if (e.city.startsWith(q)) s = Math.max(s, 400);
      else if (e.name.startsWith(q) || e.name.split(' ').some((w) => w.startsWith(q))) s = Math.max(s, 350);
      else if (q.length >= 3 && (e.name.includes(q) || e.city.includes(q))) s = Math.max(s, 200);
      else if (q.length >= 4 && e.country === q) s = Math.max(s, 100);
    }
    if (s > 0) scored.push({ e, s: s + (SIZE_RANK[e.a.size] ?? 0) * 10 + (e.a.scheduled ? 5 : 0) });
  }
  return scored.sort((x, y) => y.s - x.s || x.e.a.iata.localeCompare(y.e.a.iata)).slice(0, limit).map((x) => x.e.a);
}

/**
 * Broad region of an ICAO location indicator from its first letter (ICAO Doc 7910).
 * Returns a key for the i18n "airports.regions" section, or null.
 */
export function icaoRegion(icao) {
  const c = String(icao ?? '').charAt(0).toUpperCase();
  return 'ABCDEFGHKLMNOPRSTUVWYZ'.includes(c) && c ? c : null;
}
