/**
 * Turns a decoded TAF into a timeline and answers "what is forecast at hour X?".
 * Rules (ICAO Annex 3): FM replaces everything from its time; BECMG changes only the elements
 * it gives, by the end of its period; TEMPO and PROB describe temporary/possible conditions
 * that do not change the prevailing forecast.
 */
import { offsetHours } from './decode.js';

const copy = (c) => ({ wind: c.wind, visibility: c.visibility, cavok: c.cavok, weather: [...c.weather], clouds: [...c.clouds] });

function apply(prev, change) {
  const next = copy(prev);
  for (const el of change.set) {
    if (el === 'wind') next.wind = change.wind;
    if (el === 'visibility') { next.visibility = change.visibility; next.cavok = change.cavok; }
    if (el === 'weather') next.weather = change.cavok ? [] : change.weather.filter((w) => !w.nsw);
    if (el === 'clouds') next.clouds = change.cavok ? [] : change.clouds.filter((c) => c.special !== 'NSC');
  }
  return next;
}

/** Start/end of every period in hours from the start of validity. */
export function segments(taf) {
  if (!taf.validity) return [];
  const ref = taf.validity.from;
  const sd = ref.day;
  const total = offsetHours(taf.validity.to, ref, sd, taf.monthDays);
  return taf.periods.map((p, index) => {
    if (index === 0) return { index, kind: 'BASE', start: 0, end: total, prob: null, tempo: false };
    const start = p.from ? offsetHours(p.from, ref, sd, taf.monthDays) : 0;
    const end = p.kind === 'FM' ? (nextFm(taf, index) ?? total) : p.to ? offsetHours(p.to, ref, sd, taf.monthDays) : start;
    return { index, kind: p.kind, start, end, prob: p.prob, tempo: p.tempo };
  });
}

function nextFm(taf, index) {
  const ref = taf.validity.from;
  for (let k = index + 1; k < taf.periods.length; k++) {
    const p = taf.periods[k];
    if (p.kind === 'FM' && p.from) return offsetHours(p.from, ref, ref.day, taf.monthDays);
  }
  return null;
}

/** Total validity in hours (0 if unknown). */
export function validityHours(taf) {
  return taf.validity ? offsetHours(taf.validity.to, taf.validity.from, taf.validity.from.day, taf.monthDays) : 0;
}

/** Day/hour/minute (UTC) at `h` hours after the start of validity. */
export function timeAt(taf, h) {
  const ref = taf.validity.from;
  const totalMinutes = Math.round((ref.hour + h) * 60);
  let day = ref.day + Math.floor(totalMinutes / 1440);
  if (day > taf.monthDays) day -= taf.monthDays;
  const mins = ((totalMinutes % 1440) + 1440) % 1440;
  return { day, hour: Math.floor(mins / 60), minute: mins % 60 };
}

/**
 * @param {object} taf decoded TAF
 * @param {number} h hours from the start of validity
 * @returns {{ prevailing, becoming: object[], temporary: object[] }}
 */
export function conditionsAt(taf, h) {
  const segs = segments(taf);
  let prevailing = copy(taf.periods[0].conditions);
  const becoming = [];
  const temporary = [];
  taf.periods.forEach((p, idx) => {
    if (idx === 0) return;
    const s = segs[idx];
    if (p.kind === 'FM') {
      if (h >= s.start) prevailing = apply({ wind: null, visibility: null, cavok: false, weather: [], clouds: [] }, { ...p.conditions, set: ['wind', 'visibility', 'weather', 'clouds'] });
    } else if (p.kind === 'BECMG') {
      if (h >= s.end) prevailing = apply(prevailing, p.conditions);
      else if (h >= s.start) becoming.push({ period: idx, conditions: p.conditions });
    } else if (h >= s.start && h < s.end) {
      temporary.push({ period: idx, kind: p.kind, prob: p.prob, tempo: p.tempo, conditions: p.conditions });
    }
  });
  return { prevailing, becoming, temporary };
}
