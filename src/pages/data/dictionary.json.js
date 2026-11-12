/**
 * Compact search index of the dictionary, generated at build time:
 * /aerolex/data/dictionary.json — used by the dictionary search and the home page.
 */
import { getCollection } from 'astro:content';

export async function GET() {
  const entries = await getCollection('dictionary');
  const index = entries.map(({ id, data }) => ({
    id,
    type: data.type,
    en: data.term.en,
    es: data.term.es,
    abbr: data.abbreviation,
    exp: data.expansion,
    syn: [...data.synonyms.en, ...data.synonyms.es],
    cats: data.categories,
    simple: data.simple,
    review: data.review.status,
  }));
  index.sort((a, b) => a.id.localeCompare(b.id));
  return new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json' } });
}
