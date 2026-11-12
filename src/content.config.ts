/**
 * Content collections with build-time validation.
 * If an entry is missing a language, uses an unknown category or source, or has the wrong
 * shape, `astro build` FAILS — this is how bilingual completeness and "every fact has a
 * source" are enforced. Cross-references (related, sources) are checked in
 * tests/unit/content.test.js.
 */
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES, ENTRY_TYPES, REVIEW_STATUSES } from './lib/dictionary/categories.js';

const text = z.string().trim().min(1);
const bilingual = z.object({ en: text, es: text });
const bilingualList = z.object({ en: z.array(text), es: z.array(text) });

const dictionary = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/dictionary' }),
  schema: z
    .object({
      type: z.enum(ENTRY_TYPES as [string, ...string[]]),
      term: bilingual,
      abbreviation: z.string().nullable().default(null),
      expansion: bilingual.nullable().default(null),
      categories: z.array(z.enum(CATEGORIES as [string, ...string[]])).min(1),
      keepOriginal: z.boolean(),
      definition: bilingual,
      definitionBasis: z.enum(['official', 'technical']),
      simple: bilingual,
      example: bilingual,
      pronunciation: bilingual,
      synonyms: bilingualList,
      related: z.array(z.string()),
      regionalNote: bilingual.nullable().default(null),
      sources: z.array(z.string()).min(1),
      review: z.object({
        status: z.enum(REVIEW_STATUSES as [string, ...string[]]),
        reviewedBy: z.string().nullable().default(null),
        date: z.string().nullable().default(null),
      }),
    })
    .refine((e) => e.type !== 'abbreviation' || e.expansion !== null, {
      message: 'Abbreviations need an expansion in both languages',
    }),
});

const sources = defineCollection({
  loader: file('./src/content/sources/sources.json'),
  schema: z.object({
    title: text,
    publisher: text,
    kind: z.enum(['standard', 'regulation', 'glossary', 'handbook', 'aip', 'web']),
    url: z.string().url(),
    licence: z.enum(['copyright', 'public-domain-us', 'eu-reuse', 'wmo']),
  }),
});

export const collections = { dictionary, sources };
