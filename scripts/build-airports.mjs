/**
 * Builds src/content/airports/airports.json from the OurAirports open data (public domain,
 * https://ourairports.com/data/). Usage:
 *   node scripts/build-airports.mjs <path to airports.csv> <path to countries.csv> <data date YYYY-MM-DD>
 * Keeps airports with an IATA code that are large or medium airports, or small airports with
 * scheduled service: the codes people actually look up.
 */
import fs from 'node:fs';
import { parseCsv } from './lib/csv.mjs';

const [airportsCsv, countriesCsv, date] = process.argv.slice(2);
if (!airportsCsv || !countriesCsv || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) {
  console.error('Usage: node scripts/build-airports.mjs airports.csv countries.csv YYYY-MM-DD');
  process.exit(1);
}
const countries = Object.fromEntries(parseCsv(fs.readFileSync(countriesCsv, 'utf8')).map((c) => [c.code, c.name]));
const airports = parseCsv(fs.readFileSync(airportsCsv, 'utf8'))
  .filter((a) => /^[A-Z0-9]{3}$/.test(a.iata_code) && (['large_airport', 'medium_airport'].includes(a.type) || (a.type === 'small_airport' && a.scheduled_service === 'yes')))
  .map((a) => {
    const icao = /^[A-Z]{4}$/.test(a.icao_code) ? a.icao_code : /^[A-Z]{4}$/.test(a.gps_code) ? a.gps_code : null;
    return [a.iata_code, icao, a.name, a.municipality || null, a.iso_country, a.type.replace('_airport', ''), Number(Number(a.latitude_deg).toFixed(4)), Number(Number(a.longitude_deg).toFixed(4)), a.elevation_ft === '' ? null : Number(a.elevation_ft), a.scheduled_service === 'yes' ? 1 : 0];
  })
  .sort((x, y) => x[0].localeCompare(y[0]));
const usedCountries = Object.fromEntries([...new Set(airports.map((a) => a[4]))].sort().map((c) => [c, countries[c] ?? c]));
const out = {
  source: 'OurAirports (https://ourairports.com/data/), public domain',
  dataDate: date,
  fields: ['iata', 'icao', 'name', 'city', 'country', 'size', 'lat', 'lon', 'elevationFt', 'scheduled'],
  countries: usedCountries,
  airports,
};
fs.mkdirSync('src/content/airports', { recursive: true });
fs.writeFileSync('src/content/airports/airports.json', JSON.stringify(out) + '\n');
console.log(`${airports.length} airports, ${Object.keys(usedCountries).length} countries`);
