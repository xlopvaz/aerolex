/**
 * Learning progress, keyed by content IDs (never by URL or language).
 *   lessons:  store.progress.lessons[lessonId] = { completedAt, score?, total? }
 *   answers:  store.quiz.answers["<quiz>/<question>"] = { correct, wrong, last, lastAt }
 * Completing lessons and courses and answering correctly also earn XP and badges
 * (src/lib/gamification/engine.js); the reward is returned and announced to the page.
 */
import { award, completeCourses, mergeRewards } from '../gamification/engine.js';
import { emitReward } from '../gamification/client.js';

/**
 * Mark a lesson as completed. Keeps the first completion date and the best score.
 * `ctx.courses` (course → lessons) lets it detect finished courses and path badges.
 */
export function completeLesson(store, lessonId, result = {}, ctx) {
  let reward;
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
    const now = new Date();
    const rewards = [award(s, { type: 'lesson', ref: lessonId }, { now, ctx })];
    for (const course of completeCourses(s, ctx, now)) rewards.push(award(s, { type: 'course', ref: course }, { now, ctx }));
    reward = mergeRewards(...rewards);
  });
  emitReward(reward);
  return reward;
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
  let reward;
  store.update((s) => {
    const a = s.quiz.answers[questionKey] ?? { correct: 0, wrong: 0 };
    if (correct) a.correct += 1; else a.wrong += 1;
    a.last = correct;
    a.lastAt = new Date().toISOString();
    s.quiz.answers[questionKey] = a;
    if (correct) reward = award(s, { type: 'quiz', ref: questionKey });
  });
  emitReward(reward);
  return reward;
}

/** Questions whose last answer was wrong ("error history"). */
export function missedQuestions(state) {
  return Object.entries(state.quiz.answers).filter(([, a]) => a.last === false).map(([k]) => k);
}

/** Lesson ID used in the store: "<course>/<lesson>" so IDs never collide across courses. */
export function lessonKey(courseId, lessonId) {
  return `${courseId}/${lessonId}`;
}
