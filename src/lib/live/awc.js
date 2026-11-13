/**
 * Normalises responses from the Aviation Weather Center Data API (NOAA/NWS,
 * https://aviationweather.gov/data/api/) into the small file the site publishes.
 * The API does not allow browser (CORS) requests, so the download runs in a scheduled
 * GitHub Action (scripts/fetch-live-weather.mjs) and the site reads the resulting JSON.
 * Field names are read defensively because the API may evolve.
 */

/** Epoch seconds, epoch milliseconds or an ISO string → ISO string (or null). */
export function toIso(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return new Date(v < 1e12 ? v * 1000 : v).toISOString();
  const d = new Date(String(v).replace(' ', 'T').replace(/(\d)$/, '$1Z').replace(/ZZ$/, 'Z'));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const first = (o, keys) => keys.map((k) => o?.[k]).find((v) => v !== undefined && v !== null && v !== '');

/** One METAR item → { raw, time } or null. */
export function metarItem(o) {
  const raw = first(o, ['rawOb', 'raw_text', 'rawText']);
  if (!raw) return null;
  return { raw: String(raw).trim(), time: toIso(first(o, ['reportTime', 'obsTime', 'observation_time'])) };
}

/** One TAF item → { raw, time } or null. */
export function tafItem(o) {
  const raw = first(o, ['rawTAF', 'raw_text', 'rawText']);
  if (!raw) return null;
  return { raw: String(raw).replace(/\s+/g, ' ').trim(), time: toIso(first(o, ['issueTime', 'bulletinTime', 'issue_time'])) };
}

const stationOf = (o) => String(first(o, ['icaoId', 'station_id', 'stationId']) ?? '').toUpperCase();

/** Keeps the most recent item per station. */
function latestBy(items, read) {
  const out = {};
  for (const o of Array.isArray(items) ? items : []) {
    const id = stationOf(o);
    const item = read(o);
    if (!id || !item) continue;
    if (!out[id] || (item.time && (!out[id].time || item.time > out[id].time))) out[id] = item;
  }
  return out;
}

/**
 * @param {{id:string,name:string}[]} stations configured stations (order kept)
 * @param {unknown} metarJson AWC METAR response
 * @param {unknown} tafJson AWC TAF response
 * @param {Date} now
 */
export function buildLiveFile(stations, metarJson, tafJson, now = new Date(), errors = []) {
  const metars = latestBy(metarJson, metarItem);
  const tafs = latestBy(tafJson, tafItem);
  return {
    source: 'aviationweather.gov (NOAA/NWS)',
    fetchedAt: now.toISOString(),
    errors,
    stations: stations.map((s) => ({ id: s.id, name: s.name, metar: metars[s.id] ?? null, taf: tafs[s.id] ?? null })),
  };
}

/** Data older than this is shown as stale (decision in docs/02, §8). */
export const STALE_MS = 2 * 60 * 60 * 1000;
export const isStale = (iso, now = new Date()) => !iso || now.getTime() - new Date(iso).getTime() > STALE_MS;

/** Minutes between an ISO time and now (rounded down, never negative). */
export const ageMinutes = (iso, now = new Date()) => Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 60000));
