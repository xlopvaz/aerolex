/**
 * Spaced repetition with a Leitner box system (simple and predictable).
 * Card state, saved by card ID in store.srs.cards[id]: { box: 1..6, due: ISO, reviews, lapses }.
 *   again → box 1, due now (comes back in the same session)
 *   good  → next box          easy → two boxes up
 * Interval for each box, in days.
 */
export const INTERVAL_DAYS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 16, 6: 35 };
export const MAX_BOX = 6;
const DAY = 24 * 60 * 60 * 1000;

/** New state of a card after a review. */
export function review(state, grade, now = new Date()) {
  const prev = state ?? { box: 0, reviews: 0, lapses: 0 };
  let box;
  if (grade === 'again') box = 1;
  else if (grade === 'good') box = Math.min(MAX_BOX, Math.max(1, prev.box) + (prev.box === 0 ? 0 : 1));
  else if (grade === 'easy') box = Math.min(MAX_BOX, Math.max(1, prev.box) + 2);
  else throw new Error(`Unknown grade ${grade}`);
  if (prev.box === 0 && grade === 'good') box = 2;
  return {
    box,
    due: new Date(now.getTime() + INTERVAL_DAYS[box] * DAY).toISOString(),
    reviews: prev.reviews + 1,
    lapses: prev.lapses + (grade === 'again' && prev.box > 1 ? 1 : 0),
  };
}

/** Days until the next review for each grade (shown on the buttons). */
export function previewIntervals(state) {
  const now = new Date(0);
  return Object.fromEntries(['again', 'good', 'easy'].map((g) => [g, Math.round((new Date(review(state, g, now).due).getTime() - now.getTime()) / DAY)]));
}

/**
 * Cards to study now: due cards first (oldest due first), then up to `newLimit` new cards.
 * @param {string[]} deck card IDs in the deck
 * @param {Record<string, any>} states store.srs.cards
 */
export function studyQueue(deck, states, now = new Date(), newLimit = 10) {
  const due = deck
    .filter((id) => states[id] && new Date(states[id].due).getTime() <= now.getTime())
    .sort((a, b) => new Date(states[a].due).getTime() - new Date(states[b].due).getTime());
  const fresh = deck.filter((id) => !states[id]).slice(0, newLimit);
  return [...due, ...fresh];
}

export function deckStats(deck, states, now = new Date()) {
  let due = 0;
  let fresh = 0;
  let learned = 0;
  for (const id of deck) {
    const s = states[id];
    if (!s) fresh++;
    else {
      if (new Date(s.due).getTime() <= now.getTime()) due++;
      if (s.box >= 4) learned++;
    }
  }
  return { total: deck.length, due, fresh, learned };
}
