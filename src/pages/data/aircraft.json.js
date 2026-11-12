/** Aircraft families and variants for the comparator: /aerolex/data/aircraft.json */
import { getCollection } from 'astro:content';

export async function GET() {
  const families = (await getCollection('aircraft'))
    .sort((a, b) => a.data.order - b.data.order)
    .map(({ id, data }) => ({ id, manufacturer: data.manufacturer, family: data.family, variants: data.variants }));
  return new Response(JSON.stringify(families), { headers: { 'Content-Type': 'application/json' } });
}
