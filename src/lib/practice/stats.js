/**
 * Practice results, keyed by practice ID (e.g. "metar-taf-1"), never by URL or language.
 *   store.practice[id] = { correct, wrong, lastAt }
 */
export function recordPractice(store, id, correct) {
  store.update((s) => {
    const p = s.practice[id] ?? { correct: 0, wrong: 0 };
    if (correct) p.correct += 1;
    else p.wrong += 1;
    p.lastAt = new Date().toISOString();
    s.practice[id] = p;
  });
}

export function practiceStats(state, id) {
  return state.practice?.[id] ?? { correct: 0, wrong: 0, lastAt: null };
}
