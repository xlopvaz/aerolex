/**
 * Interactive flight deck (Phase 5): pure helpers over src/content/cockpits/cockpits.json.
 * Shapes are rectangles [x, y, width, height] in the drawing's viewBox.
 */

/** Whether point (x, y) is inside rectangle [x, y, w, h] (edges included). */
export function inRect([rx, ry, rw, rh], x, y) {
  return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}

/** Whether two rectangles overlap (touching edges do not count). */
export function rectsOverlap([ax, ay, aw, ah], [bx, by, bw, bh]) {
  return ax < bx + bw && bx < ax + aw && ay < by + bh && by < ay + ah;
}

/** Centre of a rectangle. */
export function rectCenter([x, y, w, h]) {
  return [x + w / 2, y + h / 2];
}

/** The item whose shapes contain the point, or null. */
export function itemAt(items, x, y) {
  return items.find((i) => i.shapes.some((s) => inRect(s, x, y))) ?? null;
}

/**
 * Next item to find in "Where is…?" mode: random, never the same as the previous one,
 * and cycling through every item before repeating (`asked` holds the ids already asked).
 * @param {{ id: string }[]} items @param {() => number} rng @param {string[]} asked
 * @returns {{ id: string, asked: string[] }}
 */
export function nextQuestion(items, rng, asked = []) {
  const last = asked[asked.length - 1];
  let pool = items.filter((i) => !asked.includes(i.id));
  let history = asked;
  if (!pool.length) {
    pool = items.filter((i) => i.id !== last);
    history = [];
  }
  const pick = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
  return { id: pick.id, asked: [...history, pick.id] };
}

/**
 * Problems in a cockpit definition (empty when valid): shapes outside the drawing,
 * shapes of different items overlapping, duplicate ids.
 * @param {{ items: { id: string, shapes: number[][] }[] }} cockpit @param {[number, number]} viewBox
 * @returns {string[]}
 */
export function cockpitProblems(cockpit, [w, h]) {
  const out = [];
  const ids = new Set();
  for (const i of cockpit.items) {
    if (ids.has(i.id)) out.push(`duplicate id ${i.id}`);
    ids.add(i.id);
    if (!i.shapes.length) out.push(`${i.id}: no shapes`);
    for (const s of i.shapes) {
      if (s.length !== 4 || s[2] <= 0 || s[3] <= 0 || s[0] < 0 || s[1] < 0 || s[0] + s[2] > w || s[1] + s[3] > h) out.push(`${i.id}: shape out of bounds ${s}`);
    }
  }
  for (let a = 0; a < cockpit.items.length; a++) {
    for (let b = a + 1; b < cockpit.items.length; b++) {
      const A = cockpit.items[a];
      const B = cockpit.items[b];
      if (A.shapes.some((sa) => B.shapes.some((sb) => rectsOverlap(sa, sb)))) out.push(`${A.id} overlaps ${B.id}`);
    }
  }
  return out;
}
