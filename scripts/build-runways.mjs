/**
 * Builds src/content/airports/runways.json from the OurAirports open data (public domain,
 * https://ourairports.com/data/) for the airport diagrams. Usage:
 *   node scripts/build-runways.mjs <path to airports.csv> <path to runways.csv>
 * Keeps the open runways (with coordinates for both ends) of the airports already in
 * src/content/airports/airports.json, keyed by IATA code. The data date is taken from that file,
 * so both datasets must come from the same OurAirports download.
 * Row: [leIdent, heIdent, leLat, leLon, heLat, heLon, lengthFt, widthFt, surface]
 */
import fs from 'node:fs';
import { parseCsv } from './lib/csv.mjs';
import { surfaceCategory } from '../src/lib/airports/runways.js';

const [airportsCsv, runwaysCsv] = process.argv.slice(2);
if (!airportsCsv || !runwaysCsv) {
  console.error('Usage: node scripts/build-runways.mjs airports.csv runways.csv');
  process.exit(1);
}
const ours = JSON.parse(fs.readFileSync('src/content/airports/airports.json', 'utf8'));
const wanted = new Set(ours.airports.map((a) => a[0]));
// OurAirports ident → IATA, for the airports we list
const identToIata = new Map(
  parseCsv(fs.readFileSync(airportsCsv, 'utf8')).filter((a) => wanted.has(a.iata_code)).map((a) => [a.ident, a.iata_code]),
);
const num = (v, d) => (v === '' ? null : Number(Number(v).toFixed(d)));
const runways = {};
for (const r of parseCsv(fs.readFileSync(runwaysCsv, 'utf8'))) {
  const iata = identToIata.get(r.airport_ident);
  if (!iata || r.closed === '1') continue;
  if ([r.le_latitude_deg, r.le_longitude_deg, r.he_latitude_deg, r.he_longitude_deg].some((v) => v === '')) continue;
  (runways[iata] ??= []).push([
    r.le_ident, r.he_ident,
    num(r.le_latitude_deg, 5), num(r.le_longitude_deg, 5), num(r.he_latitude_deg, 5), num(r.he_longitude_deg, 5),
    num(r.length_ft, 0), num(r.width_ft, 0), surfaceCategory(r.surface),
  ]);
}
const sorted = Object.fromEntries(Object.keys(runways).sort().map((k) => [k, runways[k]]));
const out = {
  source: 'OurAirports (https://ourairports.com/data/), public domain',
  dataDate: ours.dataDate,
  fields: ['leIdent', 'heIdent', 'leLat', 'leLon', 'heLat', 'heLon', 'lengthFt', 'widthFt', 'surface'],
  runways: sorted,
};
fs.writeFileSync('src/content/airports/runways.json', JSON.stringify(out) + '\n');
console.log(`${Object.values(sorted).flat().length} runways at ${Object.keys(sorted).length} airports`);
