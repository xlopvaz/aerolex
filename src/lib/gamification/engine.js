/**
 * Gamification (Phase 5): XP, daily goal, learning streak and badges.
 *
 * Learning activity is described as events ({ type, ref }) and applied to the saved state
 * with award(). Everything here is pure: it changes the state object it is given (a store
 * draft) and returns what was earned, so the page can show it.
 *
 * XP is earned once per piece of content (first lesson completion, first correct answer to
 * a question…) or, for open-ended practice, up to a daily cap, so repeating the same action
 * cannot inflate it. Days are the learner's local calendar days.
 */

/** XP per event type; `once`: only the first time for that ref; `dailyCap`: max XP per ref and day. */
export const XP_RULES = {
  lesson:    { xp: 50, once: true },
  course:    { xp: 100, once: true },
  quiz:      { xp: 10, once: true },
  practice:  { xp: 2, dailyCap: 40 },
  flashcard: { xp: 1, dailyCap: 30 },
};

export const DAILY_GOALS = [20, 50, 100, 200];
export const DEFAULT_DAILY_GOAL = 50;

/** Days of daily totals kept (older days are dropped). */
export const DAYS_KEPT = 120;
/** Activity log entries kept (most recent). */
export const LOG_KEPT = 100;

/** Local calendar day of a date, as YYYY-MM-DD. */
export function localDay(date) {
  const d = new Date(date);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** The day before a YYYY-MM-DD day. */
export function previousDay(day) {
  const [y, m, d] = day.split('-').map(Number);
  return localDay(new Date(y, m - 1, d - 1));
}

/**
 * XP an event is worth right now, given what has already been awarded.
 * @param {any} state @param {{ type: string, ref: string }} event @param {string} day
 */
export function xpFor(state, event, day) {
  const rule = XP_RULES[event.type];
  if (!rule || !event.ref) return 0;
  const key = `${event.type}:${event.ref}`;
  if (rule.once) return state.xp.awarded?.[key] ? 0 : rule.xp;
  if (rule.dailyCap) {
    const used = state.xp.days?.[day]?.caps?.[key] ?? 0;
    return Math.max(0, Math.min(rule.xp, rule.dailyCap - used));
  }
  return rule.xp;
}

/** Records a day of activity in the streak. */
export function touchStreak(streak, day) {
  if (streak.lastActiveDay === day) return streak;
  const current = streak.lastActiveDay === previousDay(day) ? streak.current + 1 : 1;
  return { current, best: Math.max(streak.best, current), lastActiveDay: day };
}

/** Streak to show today: it is broken once a whole day passes without activity. */
export function streakToday(streak, day) {
  if (!streak.lastActiveDay) return 0;
  return streak.lastActiveDay === day || streak.lastActiveDay === previousDay(day) ? streak.current : 0;
}

/** XP earned on one day. */
export function xpOnDay(state, day) {
  return state.xp.days?.[day]?.total ?? 0;
}

/** Daily goal progress for a day. */
export function dailyProgress(state, day) {
  const goal = DAILY_GOALS.includes(state.prefs?.dailyGoal) ? state.prefs.dailyGoal : DEFAULT_DAILY_GOAL;
  const xp = xpOnDay(state, day);
  return { xp, goal, met: xp >= goal, percent: Math.min(100, Math.round((xp / goal) * 100)) };
}

/** XP of the last `n` days, oldest first: [{ day, xp }]. */
export function recentDays(state, day, n = 7) {
  const out = [];
  let d = day;
  for (let i = 0; i < n; i++) {
    out.unshift({ day: d, xp: xpOnDay(state, d) });
    d = previousDay(d);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Badges

const practiceCorrect = (s, prefix) =>
  Object.entries(s.practice ?? {}).filter(([id]) => id.startsWith(prefix)).reduce((n, [, p]) => n + (p.correct ?? 0), 0);

/** Every course of a learning path is completed (needs the course list in ctx). */
const pathDone = (s, ctx, path) => {
  const ids = Object.entries(ctx?.courses ?? {}).filter(([, c]) => c.path === path).map(([id]) => id);
  return ids.length > 0 && ids.every((id) => s.progress.courses?.[id]);
};

/**
 * Badge rules. Each test reads only the saved state (and, for path badges, the course list).
 * The texts are in i18n under badges.<id>.
 */
export const BADGES = [
  { id: 'first-flight', icon: 'plane-takeoff', test: (s) => Object.keys(s.progress.lessons).length >= 1 },
  { id: 'aviation-enthusiast', icon: 'heart', test: (s) => Object.keys(s.progress.courses ?? {}).length >= 1 },
  { id: 'pilot-in-training', icon: 'gauge', test: (s, ctx) => pathDone(s, ctx, 'pilot-training') },
  { id: 'cabin-crew-ready', icon: 'users', test: (s, ctx) => pathDone(s, ctx, 'cabin-crew-training') },
  { id: 'metar-master', icon: 'cloud-sun', test: (s) => Boolean(s.progress.courses?.['metar-speci']) && practiceCorrect(s, 'metar-taf-') >= 25 },
  { id: 'atc-communicator', icon: 'headset', test: (s) => practiceCorrect(s, 'atc-') >= 10 },
  { id: 'aircraft-expert', icon: 'plane', test: (s) => practiceCorrect(s, 'aircraft-') >= 25 },
  { id: 'week-streak', icon: 'flame', test: (s) => (s.streak.best ?? 0) >= 7 },
  { id: 'aviation-master', icon: 'trophy', test: (s) => BADGES.filter((b) => b.id !== 'aviation-master').every((b) => s.badges[b.id]) },
];

/** Badges whose rule is now met and that were not earned yet, in BADGES order. */
export function newBadges(state, ctx) {
  const earned = [];
  for (const b of BADGES) {
    if (state.badges[b.id]) continue;
    // aviation-master depends on the others, including any earned in this same pass
    const view = earned.length ? { ...state, badges: { ...state.badges, ...Object.fromEntries(earned.map((id) => [id, true])) } } : state;
    if (b.test(view, ctx)) earned.push(b.id);
  }
  return earned;
}

// ---------------------------------------------------------------------------
// Applying events

/**
 * Applies one learning event to a state draft: XP (with its log and daily total), streak and badges.
 * @param {any} s state draft (mutated)
 * @param {{ type: string, ref: string }} event
 * @param {{ now?: Date, ctx?: { courses?: Record<string, { path: string, lessons: string[] }> } }} [opts]
 * @returns {{ xp: number, badges: string[], goalMet: boolean }}
 */
export function award(s, event, { now = new Date(), ctx } = {}) {
  ensureShape(s);
  const day = localDay(now);
  const before = dailyProgress(s, day).met;
  const xp = xpFor(s, event, day);
  if (xp > 0) {
    const key = `${event.type}:${event.ref}`;
    const rule = XP_RULES[event.type];
    if (rule.once) s.xp.awarded[key] = true;
    const today = (s.xp.days[day] ??= { total: 0, caps: {} });
    today.total += xp;
    if (rule.dailyCap) today.caps[key] = (today.caps[key] ?? 0) + xp;
    s.xp.total += xp;
    s.xp.log.push({ at: now.toISOString(), amount: xp, reason: event.type, ref: event.ref });
    if (s.xp.log.length > LOG_KEPT) s.xp.log.splice(0, s.xp.log.length - LOG_KEPT);
    s.streak = touchStreak(s.streak, day);
    pruneDays(s.xp.days, day);
  }
  const badges = newBadges(s, ctx);
  for (const id of badges) s.badges[id] = { earnedAt: now.toISOString() };
  return { xp, badges, goalMet: !before && dailyProgress(s, day).met };
}

/**
 * Records the courses that the completed lessons now finish, and awards them.
 * @returns {string[]} ids of courses completed by this call
 */
export function completeCourses(s, ctx, now = new Date()) {
  ensureShape(s);
  const done = [];
  for (const [id, c] of Object.entries(ctx?.courses ?? {})) {
    if (s.progress.courses[id] || !c.lessons.length) continue;
    if (c.lessons.every((k) => s.progress.lessons[k])) {
      s.progress.courses[id] = { completedAt: now.toISOString() };
      done.push(id);
    }
  }
  return done;
}

/** Merges several award() results into one. */
export function mergeRewards(...results) {
  return {
    xp: results.reduce((n, r) => n + (r?.xp ?? 0), 0),
    badges: results.flatMap((r) => r?.badges ?? []),
    goalMet: results.some((r) => r?.goalMet),
  };
}

function ensureShape(s) {
  s.xp ??= { total: 0, log: [] };
  s.xp.log ??= [];
  s.xp.days ??= {};
  s.xp.awarded ??= {};
  s.streak ??= { current: 0, best: 0, lastActiveDay: null };
  s.badges ??= {};
  s.progress.courses ??= {};
}

function pruneDays(days, today) {
  const keys = Object.keys(days).sort();
  if (keys.length <= DAYS_KEPT) return;
  for (const k of keys.slice(0, keys.length - DAYS_KEPT)) if (k !== today) delete days[k];
}
