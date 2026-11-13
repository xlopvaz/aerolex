/**
 * Read-back checking for the ATC phraseology trainer.
 * normalisePhraseology() turns what a pilot types ("flight level eight zero", "FL80", "one two
 * zero decimal four five") into a canonical form ("fl 80", "120.45"), so the safety-related
 * elements of each instruction can be checked (SERA.8015(e), ICAO Doc 4444 §4.5.7.5).
 */
const DIGITS = { zero: '0', one: '1', two: '2', three: '3', tree: '3', four: '4', fower: '4', five: '5', fife: '5', six: '6', seven: '7', eight: '8', nine: '9', niner: '9' };
const LETTERS = { alpha: 'a', alfa: 'a', bravo: 'b', charlie: 'c', delta: 'd', echo: 'e', foxtrot: 'f', golf: 'g', hotel: 'h', india: 'i', juliett: 'j', juliet: 'j', kilo: 'k', lima: 'l', mike: 'm', november: 'n', oscar: 'o', papa: 'p', quebec: 'q', romeo: 'r', sierra: 's', tango: 't', uniform: 'u', victor: 'v', whiskey: 'w', xray: 'x', yankee: 'y', zulu: 'z' };
const SIDES = { left: 'l', right: 'r', center: 'c', centre: 'c' };

export function normalisePhraseology(text) {
  let s = String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/x-ray/g, 'xray')
    .replace(/take-off/g, 'take off')
    .replace(/takeoff/g, 'take off')
    .replace(/[,;:!?"'()]/g, ' ')
    .replace(/\.(?!\d)/g, ' ');
  let words = s.split(/\s+/).filter(Boolean).flatMap((w) => {
    if (DIGITS[w]) return [DIGITS[w]];
    if (/^fl\d+$/.test(w)) return ['fl', w.slice(2)];
    if (/^\d+\.\d+$/.test(w)) return [w];
    if (/^\d+$/.test(w)) return w.split('');
    return [w];
  });
  // "decimal" / "point" only between digits.
  words = words.map((w, i) => ((w === 'decimal' || w === 'point') && /^\d+$/.test(words[i - 1] ?? '') && /^\d+$/.test(words[i + 1] ?? '') ? '.' : w));
  // Join digit sequences; "thousand"/"hundred" build whole numbers that are not joined further.
  const out = [];
  let locked = false; // last item is a number built with thousand/hundred
  for (const w of words) {
    const prev = out[out.length - 1];
    const isNum = /^[\d.]+$/.test(w);
    if (isNum && prev !== undefined && /^[\d.]+$/.test(prev) && !locked) {
      out[out.length - 1] = prev + w;
    } else if (w === 'thousand' && /^\d+$/.test(prev ?? '')) {
      out[out.length - 1] = String(Number(prev) * 1000);
      locked = true;
      continue;
    } else if (w === 'hundred' && /^\d+$/.test(prev ?? '')) {
      const twoBack = out[out.length - 2];
      if (Number(prev) < 10 && twoBack && /^\d+000$/.test(twoBack)) {
        out.pop();
        out[out.length - 1] = String(Number(twoBack) + Number(prev) * 100);
      } else out[out.length - 1] = String(Number(prev) * 100);
      locked = true;
      continue;
    } else out.push(w);
    locked = false;
  }
  // "flight level" → "fl"; runway side letters glued to the number; phonetic letters.
  const joined = out.join(' ').replace(/flight level/g, 'fl');
  const tokens = joined.split(' ');
  const final = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const prev = final[final.length - 1];
    if (SIDES[t] && /^\d{1,2}$/.test(prev ?? '') && final[final.length - 2] === 'runway') {
      final[final.length - 1] = prev + SIDES[t];
    } else if (LETTERS[t]) {
      const l = LETTERS[t];
      if (/^\d+$/.test(prev ?? '')) final[final.length - 1] = prev + l;
      else final.push(l);
    } else final.push(t);
  }
  return final.join(' ').replace(/\s+/g, ' ').trim();
}

const contains = (hay, needle) => ` ${hay} `.includes(` ${needle} `);

/**
 * @param {string} readback what the user typed
 * @param {{elements:{key:string,value:string}[]}} step
 * @param {string} callsign canonical callsign, e.g. "lexair 123"
 * @returns {{ elements: {key:string, ok:boolean}[], callsign: boolean, callsignLast: boolean, ok: boolean }}
 */
export function checkReadback(readback, step, callsign) {
  const n = normalisePhraseology(readback);
  const elements = step.elements.map((e) => ({ key: e.key, ok: contains(n, e.value) }));
  const cs = contains(n, callsign);
  const callsignLast = cs && n.endsWith(callsign);
  return { elements, callsign: cs, callsignLast, ok: elements.every((e) => e.ok) && cs };
}

/** Which element (if any) a given read-back gets wrong, compared with the instruction. */
export function firstWrongElement(readback, step) {
  const n = normalisePhraseology(readback);
  return step.elements.find((e) => !contains(n, e.value))?.key ?? null;
}
