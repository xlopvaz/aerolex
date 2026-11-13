/**
 * METAR / SPECI decoder.
 *
 *   decodeMetar(raw) → { type, tokens, groups, issues }
 *
 * - groups: one entry per decoded group, in message order:
 *     { kind, raw, start, end, section: 'main'|'trend'|'remarks', status: 'ok'|'invalid'|'unknown', data }
 * - issues: { level: 'error'|'warning', code, params } — codes are translated in src/i18n (metar.issues.*)
 *
 * Unknown groups are reported as unknown; nothing is guessed. Groups found out of their expected
 * order are still decoded, with a warning. Educational use only — not for operational use.
 */
import { tokenize } from './tokenize.js';
import * as G from './groups.js';

/** Expected order of the main body. `repeat` stages may appear several times. */
const STAGES = [
  { name: 'type', parsers: [G.reportType] },
  { name: 'cor', parsers: [(t, i) => (t[i]?.text === 'COR' ? G.modifier(t, i) : null)] },
  { name: 'station', parsers: [G.station] },
  { name: 'time', parsers: [G.obsTime] },
  { name: 'modifier', parsers: [(t, i) => (['AUTO', 'NIL', 'COR'].includes(t[i]?.text) ? G.modifier(t, i) : null)] },
  { name: 'wind', parsers: [G.wind] },
  { name: 'windVariation', parsers: [G.windVariation] },
  { name: 'visibility', parsers: [G.cavok, G.visibility] },
  { name: 'minVisibility', parsers: [G.minVisibility] },
  { name: 'rvr', parsers: [G.rvr], repeat: true },
  { name: 'weather', parsers: [(t, i) => G.presentWeather(t, i)], repeat: true },
  { name: 'clouds', parsers: [G.clouds], repeat: true },
  { name: 'temperature', parsers: [G.temperature] },
  { name: 'pressure', parsers: [G.pressure] },
  { name: 'recent', parsers: [G.recentWeather], repeat: true },
  { name: 'windShear', parsers: [G.windShear], repeat: true },
];

/** Groups allowed inside a trend (after NOSIG/BECMG/TEMPO). */
const TREND_PARSERS = [
  G.trendIndicator,
  G.trendTime,
  G.wind,
  G.cavok,
  G.visibility,
  (t, i) => G.presentWeather(t, i, { allowNsw: true }),
  G.clouds,
];

function tryParsers(parsers, tokens, i) {
  for (const p of parsers) {
    const r = p(tokens, i);
    if (r) return r;
  }
  return null;
}

function makeGroup(tokens, i, r, section) {
  const first = tokens[i];
  const last = tokens[i + r.size - 1];
  return {
    kind: r.kind,
    raw: tokens.slice(i, i + r.size).map((t) => t.text).join(' '),
    start: first.start,
    end: last.end,
    section,
    status: r.status,
    data: r.data,
  };
}

const unknownGroup = (t, section) => ({ kind: 'unknown', raw: t.text, start: t.start, end: t.end, section, status: 'unknown', data: {} });

/**
 * @param {string} raw
 */
export function decodeMetar(raw) {
  const tokens = tokenize(raw);
  const groups = [];
  const issues = [];
  if (tokens.length === 0) {
    issues.push({ level: 'error', code: 'empty', params: {} });
    return { type: null, tokens, groups, issues };
  }

  let stage = 0;
  let section = 'main';
  let i = 0;
  const seen = new Set();

  while (i < tokens.length) {
    const t = tokens[i];

    if (t.text === 'RMK') {
      // Remarks: national information, shown but not decoded.
      const rest = tokens.slice(i + 1);
      groups.push({
        kind: 'remarks',
        raw: tokens.slice(i).map((x) => x.text).join(' '),
        start: t.start,
        end: tokens[tokens.length - 1].end,
        section: 'remarks',
        status: 'ok',
        data: { count: rest.length },
      });
      break;
    }

    if (section === 'trend') {
      const r = tryParsers(TREND_PARSERS, tokens, i);
      if (r) {
        groups.push(makeGroup(tokens, i, r, 'trend'));
        i += r.size;
      } else {
        groups.push(unknownGroup(t, 'trend'));
        issues.push({ level: 'warning', code: 'unknownGroup', params: { group: t.text } });
        i += 1;
      }
      continue;
    }

    const trend = G.trendIndicator(tokens, i);
    if (trend) {
      section = 'trend';
      groups.push(makeGroup(tokens, i, trend, 'trend'));
      i += 1;
      continue;
    }

    // Try the current stage and the ones after it, in order.
    let matched = null;
    for (let s = stage; s < STAGES.length; s++) {
      const r = tryParsers(STAGES[s].parsers, tokens, i);
      if (r) {
        matched = { r, s };
        break;
      }
    }
    if (matched) {
      const { r, s } = matched;
      groups.push(makeGroup(tokens, i, r, 'main'));
      seen.add(STAGES[s].name);
      stage = STAGES[s].repeat ? s : s + 1;
      i += r.size;
      continue;
    }

    // Not where expected: maybe an earlier group out of order.
    let late = null;
    for (let s = 0; s < stage; s++) {
      if (seen.has(STAGES[s].name) && !STAGES[s].repeat) continue;
      const r = tryParsers(STAGES[s].parsers, tokens, i);
      if (r) {
        late = { r, s };
        break;
      }
    }
    if (late) {
      groups.push(makeGroup(tokens, i, late.r, 'main'));
      seen.add(STAGES[late.s].name);
      issues.push({ level: 'warning', code: 'outOfOrder', params: { group: t.text } });
      i += late.r.size;
      continue;
    }

    groups.push(unknownGroup(t, 'main'));
    issues.push({ level: 'warning', code: 'unknownGroup', params: { group: t.text } });
    i += 1;
  }

  const type = groups.find((g) => g.kind === 'type')?.data.value ?? null;
  const has = (k) => groups.some((g) => g.kind === k && g.section === 'main');
  const nil = groups.some((g) => g.kind === 'modifier' && g.data.value === 'NIL');

  if (type === 'TAF') issues.push({ level: 'error', code: 'isTaf', params: {} });
  if (!has('station')) issues.push({ level: 'error', code: 'noStation', params: {} });
  if (!has('time')) issues.push({ level: 'error', code: 'noTime', params: {} });
  if (!nil && !has('wind')) issues.push({ level: 'warning', code: 'noWind', params: {} });
  if (!nil && !has('visibility') && !has('cavok')) issues.push({ level: 'warning', code: 'noVisibility', params: {} });
  if (!nil && !has('temperature')) issues.push({ level: 'warning', code: 'noTemperature', params: {} });
  if (!nil && !has('pressure')) issues.push({ level: 'warning', code: 'noPressure', params: {} });
  if (has('cavok') && (has('weather') || groups.some((g) => g.kind === 'clouds' && g.section === 'main'))) {
    issues.push({ level: 'warning', code: 'cavokWithWeather', params: {} });
  }
  for (const g of groups) {
    if (g.status === 'invalid') issues.push({ level: 'error', code: `invalid.${g.data.reason ?? 'range'}`, params: { group: g.raw } });
    if (g.kind === 'wind' && g.status === 'ok' && g.data.direction !== null && g.data.direction % 10 !== 0) {
      issues.push({ level: 'warning', code: 'windNotTens', params: { group: g.raw } });
    }
  }

  return { type, tokens, groups, issues };
}
