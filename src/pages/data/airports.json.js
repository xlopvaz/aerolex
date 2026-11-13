/**
 * Airport dataset for the IATA/ICAO finder: /aerolex/data/airports.json (loaded on demand by the
 * browser). Built from OurAirports open data by scripts/build-airports.mjs.
 */
import data from '../../content/airports/airports.json';

export function GET() {
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
}
