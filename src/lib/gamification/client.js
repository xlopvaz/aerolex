/**
 * Browser glue for gamification: the course list the badge rules need (published by
 * BaseLayout as JSON) and the "aerolex:reward" event that the reward toast listens to.
 */

/** @returns {{ courses: Record<string, { path: string, lessons: string[] }> } | undefined} */
export function pageContext() {
  const el = globalThis.document?.getElementById('aerolex-ctx');
  if (!el) return undefined;
  try {
    return JSON.parse(el.textContent || '{}');
  } catch {
    return undefined;
  }
}

/** Tells the page that something was earned (no event when nothing was). */
export function emitReward(reward) {
  if (!reward || (!reward.xp && !reward.badges?.length && !reward.goalMet)) return;
  globalThis.dispatchEvent?.(new CustomEvent('aerolex:reward', { detail: reward }));
}
