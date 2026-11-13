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
export const SCHEMA_VERSION = 3;

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
      dailyGoal: 50,     // XP per day (since v3): 20 | 50 | 100 | 200
    },
    progress: {
      lessons: {},       // { [lessonId]: { completedAt, score? } }
      paths: {},         // { [pathId]: { startedAt, lastLessonId } }
      courses: {},       // { [courseId]: { completedAt } } (since v3)
    },
    xp: { total: 0, log: [], days: {}, awarded: {} }, // log: [{ at, amount, reason, ref }]; days: { [YYYY-MM-DD]: { total, caps } }; awarded: { ['<type>:<ref>']: true } (days/awarded since v3)
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
  // v3: gamification. Lessons already completed and questions already answered correctly
  // earn their XP once, retroactively (50 and 10, as in XP_RULES), without counting towards
  // any day or streak; they are marked as awarded so they never count twice.
  2: (s) => {
    const awarded = {};
    let total = 0;
    for (const k of Object.keys(s.progress?.lessons ?? {})) { awarded[`lesson:${k}`] = true; total += 50; }
    for (const [k, a] of Object.entries(s.quiz?.answers ?? {})) if (a?.correct > 0) { awarded[`quiz:${k}`] = true; total += 10; }
    return {
      ...s,
      schemaVersion: 3,
      prefs: { ...s.prefs, dailyGoal: 50 },
      progress: { ...s.progress, courses: {} },
      xp: { ...s.xp, total: (s.xp?.total ?? 0) + total, days: {}, awarded },
    };
  },
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
