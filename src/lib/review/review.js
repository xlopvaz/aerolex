/**
 * Error review and study history (Phase 5): pure selectors over the saved state.
 *   quiz answers: state.quiz.answers["<quiz>/<question>"] = { correct, wrong, last, lastAt }
 *   lessons:      state.progress.lessons["<course>/<lesson>"] = { completedAt, score?, total? }
 */

/**
 * Questions to review: the last answer was wrong. Most recent mistakes first.
 * Only keys present in `known` (questions that still exist) are returned.
 * @param {Record<string, { last?: boolean, lastAt?: string, wrong?: number }>} answers
 * @param {Set<string> | { has(k: string): boolean }} known
 * @returns {string[]}
 */
export function questionsToReview(answers, known) {
  return Object.entries(answers ?? {})
    .filter(([k, a]) => a?.last === false && known.has(k))
    .sort(([ka, a], [kb, b]) => String(b.lastAt ?? '').localeCompare(String(a.lastAt ?? '')) || ka.localeCompare(kb))
    .map(([k]) => k);
}

/**
 * Completed lessons, most recent first, with the best quiz score when there is one.
 * @param {Record<string, { completedAt: string, score?: number, total?: number }>} lessons
 * @param {Set<string> | { has(k: string): boolean }} known
 * @returns {{ key: string, completedAt: string, score: number | null, total: number | null }[]}
 */
export function studyHistory(lessons, known) {
  return Object.entries(lessons ?? {})
    .filter(([k, l]) => l?.completedAt && known.has(k))
    .map(([key, l]) => ({ key, completedAt: l.completedAt, score: l.score ?? null, total: l.total ?? null }))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt) || a.key.localeCompare(b.key));
}

/**
 * Groups items with an ISO date by local calendar day (YYYY-MM-DD), keeping their order.
 * @template T
 * @param {T[]} items @param {(item: T) => string} dateOf
 * @returns {{ day: string, items: T[] }[]}
 */
export function groupByDay(items, dateOf) {
  const out = [];
  for (const item of items) {
    const d = new Date(dateOf(item));
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const last = out[out.length - 1];
    if (last?.day === day) last.items.push(item);
    else out.push({ day, items: [item] });
  }
  return out;
}

/** Accuracy over all quiz answers ever given: { answered, correct, wrong, percent }. */
export function quizAccuracy(answers) {
  let correct = 0;
  let wrong = 0;
  for (const a of Object.values(answers ?? {})) {
    correct += a?.correct ?? 0;
    wrong += a?.wrong ?? 0;
  }
  const answered = correct + wrong;
  return { answered, correct, wrong, percent: answered ? Math.round((correct / answered) * 100) : null };
}
