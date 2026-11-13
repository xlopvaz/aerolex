/**
 * Practice results, keyed by practice ID (e.g. "metar-taf-1"), never by URL or language.
 *   store.practice[id] = { correct, wrong, lastAt }
 */
import { award } from '../gamification/engine.js';
import { emitReward } from '../gamification/client.js';
export function recordPractice(store, id, correct) {
  let reward;
  store.update((s) => {
    const p = s.practice[id] ?? { correct: 0, wrong: 0 };
    if (correct) p.correct += 1;
    else p.wrong += 1;
    p.lastAt = new Date().toISOString();
    s.practice[id] = p;
    // Correct answers earn XP (capped per day) and may unlock badges
    if (correct) reward = award(s, { type: 'practice', ref: id });
  });
  emitReward(reward);
  return reward;
}

export function practiceStats(state, id) {
  return state.practice?.[id] ?? { correct: 0, wrong: 0, lastAt: null };
}
