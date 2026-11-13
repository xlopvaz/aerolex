/**
 * Downloads the latest METAR and TAF for the stations in src/content/live/stations.json from the
 * Aviation Weather Center Data API (no key, public domain) and writes public/data/live/weather.json.
 * Best effort: on any error it still writes a file (with `errors`) and exits 0, so a temporary API
 * problem never blocks a deployment. Run by .github/workflows/deploy.yml and live-weather.yml.
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildLiveFile } from '../src/lib/live/awc.js';

const { stations } = JSON.parse(fs.readFileSync('src/content/live/stations.json', 'utf8'));
const ids = stations.map((s) => s.id).join(',');
const BASE = 'https://aviationweather.gov/api/data';
const headers = { 'User-Agent': 'AeroLex educational site (https://github.com/xlopvaz/aerolex)', Accept: 'application/json' };
const errors = [];

async function get(kind) {
  try {
    const res = await fetch(`${BASE}/${kind}?ids=${ids}&format=json`, { headers, signal: AbortSignal.timeout(20000) });
    if (res.status === 204) return [];
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    errors.push(`${kind}: ${e.message}`);
    return [];
  }
}

const [metar, taf] = await Promise.all([get('metar'), get('taf')]);
const file = buildLiveFile(stations, metar, taf, new Date(), errors);
const out = path.join('public', 'data', 'live', 'weather.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(file, null, 2) + '\n');
const withMetar = file.stations.filter((s) => s.metar).length;
const withTaf = file.stations.filter((s) => s.taf).length;
console.log(`Live weather: ${withMetar}/${stations.length} METAR, ${withTaf}/${stations.length} TAF${errors.length ? ` · errors: ${errors.join('; ')}` : ''}`);
