import { describe, expect, it } from 'vitest';
import { groupByDay, questionsToReview, quizAccuracy, studyHistory } from '../../src/lib/review/review.js';

describe('error review', () => {
  const known = new Set(['q/1', 'q/2', 'q/3', 'q/4']);
  it('lists questions whose last answer was wrong, most recent first, ignoring removed ones', () => {
    const answers = {
      'q/1': { correct: 0, wrong: 1, last: false, lastAt: '2026-11-10T10:00:00Z' },
      'q/2': { correct: 1, wrong: 2, last: true, lastAt: '2026-11-12T10:00:00Z' },
      'q/3': { correct: 1, wrong: 1, last: false, lastAt: '2026-11-12T09:00:00Z' },
      'gone/1': { correct: 0, wrong: 1, last: false, lastAt: '2026-11-13T09:00:00Z' },
    };
    expect(questionsToReview(answers, known)).toEqual(['q/3', 'q/1']);
    expect(questionsToReview(undefined, known)).toEqual([]);
  });

  it('computes overall quiz accuracy', () => {
    expect(quizAccuracy({ a: { correct: 3, wrong: 1 }, b: { correct: 0, wrong: 0 } })).toEqual({ answered: 4, correct: 3, wrong: 1, percent: 75 });
    expect(quizAccuracy({})).toEqual({ answered: 0, correct: 0, wrong: 0, percent: null });
  });
});

describe('study history', () => {
  it('lists completed lessons, most recent first, with scores', () => {
    const lessons = {
      'taf/a': { completedAt: '2026-11-10T10:00:00Z', score: 4, total: 5 },
      'taf/b': { completedAt: '2026-11-12T10:00:00Z' },
      'old/x': { completedAt: '2026-11-13T10:00:00Z' },
    };
    expect(studyHistory(lessons, new Set(['taf/a', 'taf/b']))).toEqual([
      { key: 'taf/b', completedAt: '2026-11-12T10:00:00Z', score: null, total: null },
      { key: 'taf/a', completedAt: '2026-11-10T10:00:00Z', score: 4, total: 5 },
    ]);
  });

  it('groups by local day keeping the order', () => {
    const items = [{ at: '2026-11-12T18:00:00' }, { at: '2026-11-12T09:00:00' }, { at: '2026-11-10T09:00:00' }];
    expect(groupByDay(items, (i) => i.at).map((g) => [g.day, g.items.length])).toEqual([['2026-11-12', 2], ['2026-11-10', 1]]);
  });
});
