/**
 * Shape of the user's saved state, and migrations between versions.
 *
 * Rules:
 *  - Everything is keyed by stable content IDs, never by URL or language,
 *    so switching language never loses progress.
 *  - When the shape changes: bump SCHEMA_VERSION and add a migration from the previous version.
 *    Never edit an existing migration.
 */
export const STORAGE_KEY = 'aerolex:v1';
export const SCHEMA_VERSION = 2;

export const THEMES = ['system', 'light', 'dark'];

/** @param {Date} [now] */
export function defaultState(now = new Date()) {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    prefs: {
      theme: 'system',   // 'system' | 'light' | 'dark'
      lang: null,        // 'es' | 'en' | null (null = follow the browser)
    },
    progress: {
      lessons: {},       // { [lessonId]: { completedAt, score? } }
      paths: {},         // { [pathId]: { startedAt, lastLessonId } }
    },
    xp: { total: 0, log: [] },                       // log: [{ at, amount, reason, ref }]
    streak: { current: 0, best: 0, lastActiveDay: null },
    badges: {},                                      // { [badgeId]: { earnedAt } }
    favorites: { terms: [], aircraft: [], lessons: [] },
    history: { searches: [], viewed: [] },
    quiz: { answers: {} },                           // { [questionId]: { correct, wrong, lastAt } }
    srs: { cards: {} },                              // spaced repetition, Phase 4–5
    practice: {},                                    // { [practiceId]: { correct, wrong, lastAt } } (since v2)
  };
}

/**
 * Migrations: MIGRATIONS[n] upgrades a state from version n to n + 1.
 * @type {Record<number, (state: any) => any>}
 */
export const MIGRATIONS = {
  1: (s) => ({ ...s, schemaVersion: 2, practice: {} }),
};

/**
 * Turn whatever was stored (or imported) into a valid, current state.
 * Unknown or corrupt input yields a fresh default state instead of crashing.
 * @param {unknown} raw
 * @param {Date} [now]
 */
export function normalizeState(raw, now = new Date()) {
  if (!isPlainObject(raw) || typeof raw.schemaVersion !== 'number') return defaultState(now);

  let state = raw;
  let guard = 0;
  while (state.schemaVersion < SCHEMA_VERSION && guard++ < 100) {
    const migrate = MIGRATIONS[state.schemaVersion];
    if (!migrate) return defaultState(now);
    state = migrate(state);
  }
  // Data saved by a newer version of AeroLex: keep it as is, fill missing keys.
  const merged = deepMerge(defaultState(now), state);
  merged.schemaVersion = Math.max(SCHEMA_VERSION, state.schemaVersion);
  if (!THEMES.includes(merged.prefs.theme)) merged.prefs.theme = 'system';
  if (merged.prefs.lang !== null && !['es', 'en'].includes(merged.prefs.lang)) merged.prefs.lang = null;
  return merged;
}

/** @param {any} v */
export function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** Recursively fill `target` defaults with values from `source`. */
function deepMerge(target, source) {
  const out = { ...target };
  for (const [k, v] of Object.entries(source)) {
    out[k] = isPlainObject(v) && isPlainObject(target[k]) ? deepMerge(target[k], v) : v;
  }
  return out;
}
