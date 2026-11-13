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
    kind: z.enum(['standard', 'regulation', 'glossary', 'handbook', 'aip', 'web', 'manufacturer']),
    url: z.string().url(),
    licence: z.enum(['copyright', 'public-domain-us', 'eu-reuse', 'wmo']),
  }),
});

const LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced', 'professional'] as const;
const review = z.object({
  status: z.enum(REVIEW_STATUSES as [string, ...string[]]),
  reviewedBy: z.string().nullable().default(null),
  date: z.string().nullable().default(null),
});

/** Learning paths (itinerarios). Only paths with at least one course are shown. */
const paths = defineCollection({
  loader: file('./src/content/paths/paths.json'),
  schema: z.object({ order: z.number(), title: bilingual, description: bilingual, icon: text }),
});

/** Courses: metadata + ordered lesson IDs. */
const courses = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/courses' }),
  schema: z.object({
    path: text,
    /** Display order inside its path (lower first); ties are broken by id. */
    order: z.number().int().default(0),
    level: z.enum(LEVELS),
    title: bilingual,
    description: bilingual,
    objectives: bilingualList,
    lessons: z.array(text).min(1),
    finalQuiz: text.nullable().default(null),
    sources: z.array(text).min(1),
    review,
  }),
});

/** Lessons: one MDX file per language ("<lesson>.es.mdx" / "<lesson>.en.mdx"). */
const lessons = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/lessons' }),
  schema: z.object({
    lesson: text,
    course: text,
    lang: z.enum(['es', 'en']),
    title: text,
    summary: text,
    objectives: z.array(text).min(1),
    minutes: z.number().int().positive(),
    terms: z.array(text).default([]),
    quiz: text.nullable().default(null),
    sources: z.array(text).min(1),
    review,
  }),
});

/** Quizzes: bilingual multiple-choice questions with explanations. */
const quizzes = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/quizzes' }),
  schema: z.object({
    questions: z
      .array(
        z.object({
          id: text,
          prompt: bilingual,
          code: z.string().nullable().default(null),
          options: z.array(z.object({ id: text, text: bilingual })).min(2),
          answer: text,
          explanation: bilingual,
        })
      )
      .min(1),
  }),
});

/** Aircraft families with per-variant figures. Every figure must come from the variant's sources;
 *  unknown values are null (shown as "—"), never estimated. */
const num = z.number().positive().nullable();
const aircraft = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/aircraft' }),
  schema: z.object({
    manufacturer: text,
    family: bilingual,
    category: z.enum(['commercial', 'regional', 'business', 'general-aviation', 'military']),
    order: z.number(),
    /** Generic, schematic illustration (src/lib/aircraft/silhouette.js): configuration only, not to scale. */
    silhouette: z.object({ body: z.enum(['narrow', 'wide']), engines: z.union([z.literal(2), z.literal(4)]), decks: z.union([z.literal(1), z.literal(2)]) }),
    summary: bilingual,
    history: bilingual,
    facts: z.array(bilingual),
    sources: z.array(text).min(1),
    review,
    variants: z
      .array(
        z.object({
          id: text,
          name: text,
          status: z.enum(['in-production', 'out-of-production', 'certified', 'in-development']).nullable(),
          milestones: z.object({
            firstFlight: z.string().nullable(),
            certified: z.string().nullable(),
            firstDelivery: z.string().nullable(),
            entryIntoService: z.string().nullable().default(null),
            firstOperator: z.string().nullable(),
          }),
          lengthM: num,
          wingspanM: num,
          heightM: num,
          seatsTypical: z.string().nullable(),
          seatsMax: num,
          rangeNm: num,
          rangeKm: num,
          mtowT: num,
          engines: z.array(text).min(1),
          note: bilingual.nullable(),
          sources: z.array(text).min(1),
        })
      )
      .min(1),
  }),
});

/** Aviation timeline (Phase 4). Dates are ISO with the precision the sources give:
 *  YYYY, YYYY-MM or YYYY-MM-DD. Every event cites its sources and starts as a draft. */
const timeline = defineCollection({
  loader: file('./src/content/timeline/events.json'),
  schema: z.object({
    date: z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/),
    theme: z.enum(['flight', 'airline', 'regulation']),
    title: bilingual,
    text: bilingual,
    terms: z.array(text),
    sources: z.array(text).min(1),
    review,
  }),
});

/** Weather glossary (Phase 4): METAR/TAF codes with their meaning (WMO-No. 306 / ICAO Annex 3). */
const weatherCodes = defineCollection({
  loader: file('./src/content/weather/codes.json'),
  schema: z.object({
    code: text,
    group: z.enum(['report', 'modifier', 'wind', 'visibility', 'intensity', 'descriptor', 'precipitation', 'obscuration', 'other', 'cloud', 'pressure', 'general', 'change']),
    meaning: bilingual,
    example: z.string().nullable(),
    terms: z.array(text),
    sources: z.array(text).min(1),
    review,
  }),
});

export const collections = { dictionary, sources, paths, courses, lessons, quizzes, aircraft, timeline, weatherCodes };
