/**
 * Runway data for the airport diagrams, split by the first letter of the IATA code
 * (/aerolex/data/runways/M.json…) so the page only downloads a small part when it needs it.
 * Built from OurAirports open data by scripts/build-runways.mjs.
 */
import data from '../../../content/airports/runways.json';

export function getStaticPaths() {
  const letters = [...new Set(Object.keys(data.runways).map((k) => k[0]))];
  return letters.map((letter) => ({ params: { letter } }));
}

export function GET({ params }) {
  const runways = Object.fromEntries(Object.entries(data.runways).filter(([k]) => k[0] === params.letter));
  const body = { source: data.source, dataDate: data.dataDate, fields: data.fields, runways };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
}
