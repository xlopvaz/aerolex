import { describe, it, expect } from 'vitest';
import { review, previewIntervals, studyQueue, deckStats } from '../../src/lib/srs/leitner.js';

const t0 = new Date('2026-11-13T08:00:00Z');
const days = (iso) => (new Date(iso) - t0) / 86400000;

describe('Leitner review', () => {
  it('new card: good → box 2 (1 day), easy → box 3 (3 days), again → box 1 (now)', () => {
    expect(review(null, 'good', t0)).toMatchObject({ box: 2, reviews: 1 });
    expect(days(review(null, 'good', t0).due)).toBe(1);
    expect(days(review(null, 'easy', t0).due)).toBe(3);
    expect(days(review(null, 'again', t0).due)).toBe(0);
  });
  it('moves up and falls back to box 1 with a lapse', () => {
    let s = review(null, 'good', t0);
    s = review(s, 'good', t0);
    expect(s.box).toBe(3);
    s = review(s, 'easy', t0);
    expect(s.box).toBe(5);
    s = review(s, 'easy', t0);
    expect(s.box).toBe(6);
    s = review(s, 'again', t0);
    expect(s).toMatchObject({ box: 1, lapses: 1, reviews: 5 });
  });
  it('rejects unknown grades and previews intervals', () => {
    expect(() => review(null, 'maybe', t0)).toThrow();
    expect(previewIntervals(null)).toEqual({ again: 0, good: 1, easy: 3 });
    expect(previewIntervals({ box: 3, reviews: 2, lapses: 0 })).toEqual({ again: 0, good: 7, easy: 16 });
  });
});

describe('study queue and stats', () => {
  const states = {
    a: { box: 2, due: '2026-11-12T08:00:00.000Z', reviews: 1, lapses: 0 },
    b: { box: 4, due: '2026-11-20T08:00:00.000Z', reviews: 3, lapses: 0 },
    c: { box: 1, due: '2026-11-13T07:00:00.000Z', reviews: 2, lapses: 1 },
  };
  it('due first (oldest first), then new cards up to the limit', () => {
    expect(studyQueue(['a', 'b', 'c', 'd', 'e', 'f'], states, t0, 2)).toEqual(['a', 'c', 'd', 'e']);
  });
  it('counts due, new and learned cards', () => {
    expect(deckStats(['a', 'b', 'c', 'd'], states, t0)).toEqual({ total: 4, due: 2, fresh: 1, learned: 1 });
  });
});
