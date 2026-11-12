import { describe, it, expect } from 'vitest';
import { createStore } from '../../src/lib/core/store.js';
import { createMemoryAdapter } from '../../src/lib/core/adapters/memory.js';
import { completeLesson, uncompleteLesson, isLessonComplete, courseProgress, recordAnswer, missedQuestions, lessonKey } from '../../src/lib/academy/progress.js';

const make = () => createStore({ adapter: createMemoryAdapter() });

describe('academy progress', () => {
  it('marks lessons complete and computes course progress', () => {
    const s = make();
    const ids = ['c/a', 'c/b', 'c/c', 'c/d'];
    completeLesson(s, 'c/a');
    completeLesson(s, 'c/b');
    expect(isLessonComplete(s.get(), 'c/a')).toBe(true);
    expect(courseProgress(s.get(), ids)).toEqual({ done: 2, total: 4, percent: 50 });
    uncompleteLesson(s, 'c/a');
    expect(courseProgress(s.get(), ids).done).toBe(1);
  });

  it('keeps the first completion date and the best score', () => {
    const s = make();
    completeLesson(s, 'x', { score: 2, total: 3 });
    const first = s.get().progress.lessons.x.completedAt;
    completeLesson(s, 'x', { score: 1, total: 3 });
    expect(s.get().progress.lessons.x).toMatchObject({ score: 2, total: 3, completedAt: first });
    completeLesson(s, 'x', { score: 3, total: 3 });
    expect(s.get().progress.lessons.x.score).toBe(3);
  });

  it('records answers and lists the ones last answered wrong', () => {
    const s = make();
    recordAnswer(s, 'q/1', false);
    recordAnswer(s, 'q/2', true);
    expect(missedQuestions(s.get())).toEqual(['q/1']);
    recordAnswer(s, 'q/1', true);
    expect(missedQuestions(s.get())).toEqual([]);
    expect(s.get().quiz.answers['q/1']).toMatchObject({ correct: 1, wrong: 1, last: true });
  });

  it('builds collision-free lesson keys', () => {
    expect(lessonKey('metar-speci', 'wind')).toBe('metar-speci/wind');
  });
});
