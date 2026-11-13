/**
 * Aircraft identification game, built only from the Hangar's sourced figures (no estimates).
 *   createRound(variants, rng) → { kind: 'clues'|'compare', ... }
 * - clues:   three figures of one variant; pick it among four options. Distractors always
 *            differ from the answer in at least one of the clues, so there is one right answer.
 * - compare: which of two variants has the higher value of a metric (values must differ).
 */
import { METRICS } from './compare.js';

const known = (v, k) => typeof v[k] === 'number';
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const keyOf = (v) => `${v.familyId}:${v.id}`;

export function cluesRound(variants, rng) {
  const candidates = variants.filter((v) => METRICS.filter((m) => known(v, m.key)).length >= 3);
  for (let attempt = 0; attempt < 30; attempt++) {
    const answer = pick(rng, candidates);
    const metrics = shuffle(rng, METRICS.filter((m) => known(answer, m.key))).slice(0, 3).map((m) => m.key);
    const distinct = variants.filter(
      (v) => keyOf(v) !== keyOf(answer) && metrics.every((k) => known(v, k)) && metrics.some((k) => v[k] !== answer[k])
    );
    if (distinct.length < 3) continue;
    const options = shuffle(rng, [answer, ...shuffle(rng, distinct).slice(0, 3)]);
    return { kind: 'clues', metrics, clues: metrics.map((k) => ({ key: k, value: answer[k] })), options: options.map(keyOf), answer: keyOf(answer) };
  }
  return null;
}

export function compareRound(variants, rng) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const metric = pick(rng, METRICS).key;
    const pool = variants.filter((v) => known(v, metric));
    if (pool.length < 2) continue;
    const [a, b] = shuffle(rng, pool);
    if (a[metric] === b[metric]) continue;
    return { kind: 'compare', metric, options: [keyOf(a), keyOf(b)], values: { [keyOf(a)]: a[metric], [keyOf(b)]: b[metric] }, answer: a[metric] > b[metric] ? keyOf(a) : keyOf(b) };
  }
  return null;
}

export function createRound(variants, rng = Math.random) {
  const r = rng() < 0.5 ? cluesRound(variants, rng) : compareRound(variants, rng);
  return r ?? cluesRound(variants, rng) ?? compareRound(variants, rng);
}
