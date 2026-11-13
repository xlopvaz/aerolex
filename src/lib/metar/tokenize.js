/**
 * Splits a raw METAR/SPECI/TAF into tokens, keeping each token's character position so the
 * interface can highlight exactly what was decoded. Normalises case and whitespace and drops
 * the trailing "=" end-of-message marker.
 * @param {string} raw
 * @returns {{ text: string, start: number, end: number }[]}
 */
export function tokenize(raw) {
  const text = String(raw ?? '').toUpperCase().replace(/=+\s*$/, '');
  const tokens = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(text))) tokens.push({ text: m[0], start: m.index, end: m.index + m[0].length });
  return tokens;
}

/** The normalised text the tokens refer to (same transformation as tokenize). */
export function normalise(raw) {
  return String(raw ?? '').toUpperCase().replace(/=+\s*$/, '');
}
