import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import {
  BADGES, DAILY_GOALS, XP_RULES, award, completeCourses, dailyProgress, localDay, mergeRewards,
  newBadges, previousDay, recentDays, streakToday, touchStreak, xpFor,
} from '../../src/lib/gamification/engine.js';
import { defaultState, normalizeState, SCHEMA_VERSION } from '../../src/lib/core/schema.js';
import { createStore } from '../../src/lib/core/store.js';
import { createMemoryAdapter } from '../../src/lib/core/adapters/memory.js';
import { completeLesson, recordAnswer } from '../../src/lib/academy/progress.js';
import { recordPractice } from '../../src/lib/practice/stats.js';

const at = (d, h = 12) => new Date(`${d}T${String(h).padStart(2, '0')}:00:00`);
const fresh = () => normalizeState(defaultState());
const ctx = {
  courses: {
    'metar-speci': { path: 'aviation-meteorology', lessons: ['metar-speci/a', 'metar-speci/b'] },
    'principles-of-flight': { path: 'pilot-training', lessons: ['principles-of-flight/a'] },
    aerodynamics: { path: 'pilot-training', lessons: ['aerodynamics/a'] },
  },
};

describe('days', () => {
  it('uses local calendar days and steps back across months and years', () => {
    expect(localDay(at('2026-11-13', 23))).toBe('2026-11-13');
    expect(previousDay('2026-03-01')).toBe('2026-02-28');
    expect(previousDay('2028-03-01')).toBe('2028-02-29');
    expect(previousDay('2027-01-01')).toBe('2026-12-31');
  });
});

describe('xp', () => {
  it('awards lessons, courses and quiz questions only once', () => {
    const s = fresh();
    expect(award(s, { type: 'lesson', ref: 'taf/x' }, { now: at('2026-11-13') }).xp).toBe(XP_RULES.lesson.xp);
    expect(award(s, { type: 'lesson', ref: 'taf/x' }, { now: at('2026-11-14') }).xp).toBe(0);
    expect(award(s, { type: 'quiz', ref: 'q/1' }, { now: at('2026-11-14') }).xp).toBe(10);
    expect(award(s, { type: 'quiz', ref: 'q/1' }, { now: at('2026-11-14') }).xp).toBe(0);
    expect(s.xp.total).toBe(60);
    expect(s.xp.log.map((l) => l.amount)).toEqual([50, 10]);
  });

  it('caps open-ended practice per practice and per day', () => {
    const s = fresh();
    let total = 0;
    for (let i = 0; i < 30; i++) total += award(s, { type: 'practice', ref: 'metar-taf-1' }, { now: at('2026-11-13') }).xp;
    expect(total).toBe(XP_RULES.practice.dailyCap);
    expect(award(s, { type: 'practice', ref: 'atc-pilot' }, { now: at('2026-11-13') }).xp).toBe(2);
    expect(award(s, { type: 'practice', ref: 'metar-taf-1' }, { now: at('2026-11-14') }).xp).toBe(2);
    expect(xpFor(s, { type: 'unknown', ref: 'x' }, '2026-11-14')).toBe(0);
  });

  it('tracks daily totals and the daily goal', () => {
    const s = fresh();
    s.prefs.dailyGoal = 20;
    const r1 = award(s, { type: 'quiz', ref: 'a' }, { now: at('2026-11-13') });
    const r2 = award(s, { type: 'quiz', ref: 'b' }, { now: at('2026-11-13') });
    expect(r1.goalMet).toBe(false);
    expect(r2.goalMet).toBe(true);
    expect(award(s, { type: 'quiz', ref: 'c' }, { now: at('2026-11-13') }).goalMet).toBe(false); // only announced once
    expect(dailyProgress(s, '2026-11-13')).toEqual({ xp: 30, goal: 20, met: true, percent: 100 });
    expect(recentDays(s, '2026-11-14', 3)).toEqual([{ day: '2026-11-12', xp: 0 }, { day: '2026-11-13', xp: 30 }, { day: '2026-11-14', xp: 0 }]);
    s.prefs.dailyGoal = 7;
    expect(dailyProgress(s, '2026-11-13').goal).toBe(50);
    expect(DAILY_GOALS).toContain(50);
  });
});

describe('streak', () => {
  it('grows on consecutive days, restarts after a gap and keeps the best', () => {
    let st = { current: 0, best: 0, lastActiveDay: null };
    for (const d of ['2026-11-10', '2026-11-11', '2026-11-11', '2026-11-12']) st = touchStreak(st, d);
    expect(st).toEqual({ current: 3, best: 3, lastActiveDay: '2026-11-12' });
    st = touchStreak(st, '2026-11-15');
    expect(st).toEqual({ current: 1, best: 3, lastActiveDay: '2026-11-15' });
  });

  it('shows a streak as broken once a whole day passes without activity', () => {
    const st = { current: 4, best: 4, lastActiveDay: '2026-11-12' };
    expect(streakToday(st, '2026-11-12')).toBe(4);
    expect(streakToday(st, '2026-11-13')).toBe(4);
    expect(streakToday(st, '2026-11-14')).toBe(0);
    expect(streakToday({ current: 0, best: 0, lastActiveDay: null }, '2026-11-14')).toBe(0);
  });

  it('only counts days with XP', () => {
    const s = fresh();
    award(s, { type: 'lesson', ref: 'a' }, { now: at('2026-11-12') });
    award(s, { type: 'lesson', ref: 'a' }, { now: at('2026-11-13') }); // no XP: already awarded
    expect(s.streak.lastActiveDay).toBe('2026-11-12');
  });
});

describe('courses and badges', () => {
  it('completes a course when all its lessons are done', () => {
    const s = fresh();
    s.progress.lessons['metar-speci/a'] = { completedAt: 'x' };
    expect(completeCourses(s, ctx)).toEqual([]);
    s.progress.lessons['metar-speci/b'] = { completedAt: 'x' };
    expect(completeCourses(s, ctx)).toEqual(['metar-speci']);
    expect(completeCourses(s, ctx)).toEqual([]);
    expect(completeCourses(s, undefined)).toEqual([]);
  });

  it('earns badges from the saved state', () => {
    const s = fresh();
    s.progress.lessons['principles-of-flight/a'] = { completedAt: 'x' };
    expect(newBadges(s, ctx)).toEqual(['first-flight']);
    s.progress.courses['principles-of-flight'] = { completedAt: 'x' };
    expect(newBadges(s, ctx)).toEqual(['first-flight', 'aviation-enthusiast']);
    s.progress.courses.aerodynamics = { completedAt: 'x' };
    expect(newBadges(s, ctx)).toContain('pilot-in-training');
    expect(newBadges(s, undefined)).not.toContain('pilot-in-training'); // path badges need the course list
    s.practice = { 'atc-pilot': { correct: 6, wrong: 0 }, 'atc-controller': { correct: 4, wrong: 9 } };
    expect(newBadges(s, ctx)).toContain('atc-communicator');
    s.practice['metar-taf-2'] = { correct: 25, wrong: 0 };
    expect(newBadges(s, ctx)).not.toContain('metar-master'); // needs the METAR & SPECI course too
    s.progress.courses['metar-speci'] = { completedAt: 'x' };
    expect(newBadges(s, ctx)).toContain('metar-master');
  });

  it('earns Aviation Master in the same pass as the last other badge', () => {
    const s = fresh();
    for (const b of BADGES) if (!['aviation-master', 'week-streak'].includes(b.id)) s.badges[b.id] = { earnedAt: 'x' };
    s.streak.best = 7;
    expect(newBadges(s, ctx)).toEqual(['week-streak', 'aviation-master']);
  });

  it('has a name and a description for every badge in both languages', () => {
    for (const lang of ['es', 'en']) {
      const ui = JSON.parse(fs.readFileSync(`src/i18n/ui/${lang}.json`, 'utf8'));
      for (const b of BADGES) {
        expect(ui.badges[b.id]?.name, `${lang} ${b.id}`).toBeTruthy();
        expect(ui.badges[b.id]?.desc, `${lang} ${b.id}`).toBeTruthy();
      }
    }
  });

  it('merges rewards', () => {
    expect(mergeRewards({ xp: 50, badges: ['a'], goalMet: false }, { xp: 100, badges: ['b'], goalMet: true }, undefined)).toEqual({ xp: 150, badges: ['a', 'b'], goalMet: true });
  });
});

describe('store integration', () => {
  it('completing a lesson earns XP, finishes courses and badges, once', () => {
    const store = createStore({ adapter: createMemoryAdapter() });
    const r1 = completeLesson(store, 'metar-speci/a', {}, ctx);
    expect(r1.xp).toBe(50);
    expect(r1.badges).toEqual(['first-flight']);
    const r2 = completeLesson(store, 'metar-speci/b', { score: 3, total: 3 }, ctx);
    expect(r2.xp).toBe(150);
    expect(r2.badges).toEqual(['aviation-enthusiast']);
    expect(completeLesson(store, 'metar-speci/b', { score: 3, total: 3 }, ctx).xp).toBe(0);
    const s = store.get();
    expect(s.xp.total).toBe(200);
    expect(Object.keys(s.progress.courses)).toEqual(['metar-speci']);
  });

  it('right answers and practice earn XP; wrong ones do not', () => {
    const store = createStore({ adapter: createMemoryAdapter() });
    expect(recordAnswer(store, 'quiz/q1', false)).toBeUndefined();
    expect(recordAnswer(store, 'quiz/q1', true).xp).toBe(10);
    expect(recordPractice(store, 'aircraft-photo', true).xp).toBe(2);
    expect(recordPractice(store, 'aircraft-photo', false)).toBeUndefined();
    expect(store.get().xp.total).toBe(12);
  });
});

describe('schema v3 migration', () => {
  it('gives earlier progress its XP once, without touching days or streak', () => {
    const v2 = {
      schemaVersion: 2,
      prefs: { theme: 'dark', lang: 'es' },
      progress: { lessons: { 'taf/a': { completedAt: 'x' }, 'taf/b': { completedAt: 'x' } }, paths: {} },
      xp: { total: 0, log: [] },
      quiz: { answers: { 'q/1': { correct: 1, wrong: 0 }, 'q/2': { correct: 0, wrong: 2 } } },
      practice: {},
    };
    const s = normalizeState(v2);
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.xp.total).toBe(110);
    expect(s.xp.awarded).toEqual({ 'lesson:taf/a': true, 'lesson:taf/b': true, 'quiz:q/1': true });
    expect(s.xp.days).toEqual({});
    expect(s.prefs).toMatchObject({ theme: 'dark', lang: 'es', dailyGoal: 50 });
    expect(s.progress.courses).toEqual({});
    // Already-awarded content earns nothing more
    expect(award(s, { type: 'lesson', ref: 'taf/a' }).xp).toBe(0);
  });
});
