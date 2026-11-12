/**
 * Learning progress, keyed by content IDs (never by URL or language).
 *   lessons:  store.progress.lessons[lessonId] = { completedAt, score?, total? }
 *   answers:  store.quiz.answers["<quiz>/<question>"] = { correct, wrong, last, lastAt }
 */

/** Mark a lesson as completed. Keeps the first completion date and the best score. */
export function completeLesson(store, lessonId, result = {}) {
  store.update((s) => {
    const prev = s.progress.lessons[lessonId];
    const next = { completedAt: prev?.completedAt ?? new Date().toISOString() };
    const prevScore = prev?.score ?? -1;
    if (typeof result.score === 'number' && result.score >= prevScore) {
      next.score = result.score;
      next.total = result.total;
    } else if (prev?.score !== undefined) {
      next.score = prev.score;
      next.total = prev.total;
    }
    s.progress.lessons[lessonId] = next;
  });
}

export function uncompleteLesson(store, lessonId) {
  store.update((s) => { delete s.progress.lessons[lessonId]; });
}

export function isLessonComplete(state, lessonId) {
  return Boolean(state.progress.lessons[lessonId]);
}

/** @returns {{ done: number, total: number, percent: number }} */
export function courseProgress(state, lessonIds) {
  const done = lessonIds.filter((id) => isLessonComplete(state, id)).length;
  return { done, total: lessonIds.length, percent: lessonIds.length ? Math.round((done / lessonIds.length) * 100) : 0 };
}

/** Record a quiz answer (used later for error history and spaced repetition). */
export function recordAnswer(store, questionKey, correct) {
  store.update((s) => {
    const a = s.quiz.answers[questionKey] ?? { correct: 0, wrong: 0 };
    if (correct) a.correct += 1; else a.wrong += 1;
    a.last = correct;
    a.lastAt = new Date().toISOString();
    s.quiz.answers[questionKey] = a;
  });
}

/** Questions whose last answer was wrong ("error history"). */
export function missedQuestions(state) {
  return Object.entries(state.quiz.answers).filter(([, a]) => a.last === false).map(([k]) => k);
}

/** Lesson ID used in the store: "<course>/<lesson>" so IDs never collide across courses. */
export function lessonKey(courseId, lessonId) {
  return `${courseId}/${lessonId}`;
}
