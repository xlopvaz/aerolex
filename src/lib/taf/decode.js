/**
 * TAF decoder (WMO FM 51 / ICAO Annex 3, with US usage).
 *
 *   decodeTaf(raw) → { type, station, issued, validity, periods, groups, issues, monthDays }
 *
 * - periods[0] is the base forecast; the rest are change groups in order:
 *     { kind: 'BASE'|'FM'|'BECMG'|'TEMPO'|'PROB', prob: 30|40|null, tempo: boolean,
 *       from: {day,hour,minute}, to: {day,hour,minute}|null, groups: [...], conditions }
 * - groups: every decoded group in message order (same shape as the METAR decoder, with
 *   `period` = index in periods), for highlighting and the group-by-group table.
 * Unknown groups are reported, never guessed. Educational use only.
 */
import { tokenize } from '../metar/tokenize.js';
import * as G from '../metar/groups.js';

const ok = (kind, data, size = 1) => ({ kind, size, status: 'ok', data });
const bad = (kind, data, size = 1, reason = 'range') => ({ kind, size, status: 'invalid', data: { ...data, reason } });
const tok = (tokens, i) => tokens[i]?.text ?? '';

const dayHourOk = (d, h) => d >= 1 && d <= 31 && h <= 24;

/** DDHH/DDHH validity or change period. */
export function period(tokens, i, kind = 'period') {
  const m = /^(\d{2})(\d{2})\/(\d{2})(\d{2})$/.exec(tok(tokens, i));
  if (!m) return null;
  const [d1, h1, d2, h2] = m.slice(1).map(Number);
  const data = { from: { day: d1, hour: h1, minute: 0 }, to: { day: d2, hour: h2, minute: 0 } };
  return dayHourOk(d1, h1) && dayHourOk(d2, h2) ? ok(kind, data) : bad(kind, data);
}

/** FMDDHHMM. */
export function fromGroup(tokens, i) {
  const m = /^FM(\d{2})(\d{2})(\d{2})$/.exec(tok(tokens, i));
  if (!m) return null;
  const [day, hour, minute] = m.slice(1).map(Number);
  const data = { from: { day, hour, minute } };
  return dayHourOk(day, hour) && minute <= 59 ? ok('changeFM', data) : bad('changeFM', data);
}

/** TX24/1315Z, TNM02/1406Z. */
export function extremeTemp(tokens, i) {
  const m = /^(TX|TN)(M?\d{2})\/(\d{2})(\d{2})Z$/.exec(tok(tokens, i));
  if (!m) return null;
  const value = m[2].startsWith('M') ? -Number(m[2].slice(1)) : Number(m[2]);
  const data = { which: m[1], value, at: { day: Number(m[3]), hour: Number(m[4]), minute: 0 } };
  return dayHourOk(data.at.day, data.at.hour) ? ok('extremeTemp', data) : bad('extremeTemp', data);
}

const CONDITION_PARSERS = [
  G.wind,
  G.cavok,
  G.visibility,
  (t, i) => G.presentWeather(t, i, { allowNsw: true }),
  G.clouds,
  extremeTemp,
];

function tryParsers(parsers, tokens, i) {
  for (const p of parsers) {
    const r = p(tokens, i);
    if (r) return r;
  }
  return null;
}

const emptyConditions = () => ({ wind: null, visibility: null, cavok: false, weather: [], clouds: [] });

/** Collects the forecast elements of one period. */
function conditionsOf(groups) {
  const c = emptyConditions();
  c.set = new Set();
  for (const g of groups) {
    if (g.status !== 'ok') continue;
    if (g.kind === 'wind') { c.wind = g.data; c.set.add('wind'); }
    if (g.kind === 'visibility') { c.visibility = g.data; c.cavok = false; c.set.add('visibility'); }
    if (g.kind === 'cavok') { c.cavok = true; c.visibility = null; c.set.add('visibility'); c.set.add('weather'); c.set.add('clouds'); }
    if (g.kind === 'weather') { c.weather.push(g.data); c.set.add('weather'); }
    if (g.kind === 'clouds') { c.clouds.push(g.data); c.set.add('clouds'); }
  }
  c.set = [...c.set];
  return c;
}

export function decodeTaf(raw) {
  const tokens = tokenize(raw);
  const groups = [];
  const issues = [];
  const periods = [];
  const push = (r, i, periodIndex) => {
    const g = {
      kind: r.kind,
      raw: tokens.slice(i, i + r.size).map((t) => t.text).join(' '),
      start: tokens[i].start,
      end: tokens[i + r.size - 1].end,
      section: periodIndex === 0 ? 'main' : 'change',
      period: periodIndex,
      status: r.status,
      data: r.data,
    };
    groups.push(g);
    return g;
  };
  if (!tokens.length) {
    issues.push({ level: 'error', code: 'empty', params: {} });
    return { type: null, station: null, issued: null, validity: null, periods, groups, issues, monthDays: 31 };
  }

  let i = 0;
  // Header: TAF [AMD|COR|CNL] CCCC DDHHMMZ DDHH/DDHH [NIL|CNL]
  const header = [G.reportType, G.modifier, G.station, G.obsTime, (t, j) => period(t, j, 'validity'), G.modifier];
  let h = 0;
  while (i < tokens.length && h < header.length) {
    const r = header[h](tokens, i);
    if (r) {
      push(r, i, 0);
      i += r.size;
    }
    h += 1;
  }

  let current = { kind: 'BASE', prob: null, tempo: false, from: null, to: null, groups: [] };
  periods.push(current);
  const startPeriod = (p) => {
    current = { ...p, groups: [] };
    periods.push(current);
  };

  while (i < tokens.length) {
    const t = tokens[i].text;
    if (t === 'RMK') {
      push({ kind: 'remarks', size: tokens.length - i, status: 'ok', data: {} }, i, periods.length - 1);
      break;
    }
    const fm = fromGroup(tokens, i);
    if (fm) {
      startPeriod({ kind: 'FM', prob: null, tempo: false, from: fm.data.from, to: null });
      current.groups.push(push(fm, i, periods.length - 1));
      i += 1;
      continue;
    }
    if (t === 'BECMG' || t === 'TEMPO' || /^PROB(30|40)$/.test(t)) {
      const prob = t.startsWith('PROB') ? Number(t.slice(4)) : null;
      let size = 1;
      let tempo = t === 'TEMPO';
      if (prob && tok(tokens, i + 1) === 'TEMPO') { tempo = true; size = 2; }
      const per = period(tokens, i + size, 'changePeriod');
      const kind = prob ? 'PROB' : t;
      startPeriod({ kind, prob, tempo, from: per?.data.from ?? null, to: per?.data.to ?? null });
      current.groups.push(push(ok('changeIndicator', { value: kind, prob, tempo }, size), i, periods.length - 1));
      i += size;
      if (per) {
        current.groups.push(push(per, i, periods.length - 1));
        i += 1;
      } else issues.push({ level: 'error', code: 'noChangePeriod', params: { group: t } });
      continue;
    }
    if (/^PROB\d{2}$/.test(t)) {
      current.groups.push(push(bad('changeIndicator', { value: 'PROB', prob: Number(t.slice(4)) }, 1, 'prob'), i, periods.length - 1));
      i += 1;
      continue;
    }
    const r = tryParsers(CONDITION_PARSERS, tokens, i);
    if (r) {
      current.groups.push(push(r, i, periods.length - 1));
      i += r.size;
      continue;
    }
    current.groups.push(push({ kind: 'unknown', size: 1, status: 'unknown', data: {} }, i, periods.length - 1));
    issues.push({ level: 'warning', code: 'unknownGroup', params: { group: t } });
    i += 1;
  }

  for (const p of periods) p.conditions = conditionsOf(p.groups);

  const find = (k) => groups.find((g) => g.kind === k);
  const type = find('type')?.data.value ?? null;
  const validity = find('validity')?.data ?? null;
  const nil = groups.some((g) => g.kind === 'modifier' && (g.data.value === 'NIL' || g.data.value === 'CNL'));
  if (validity) periods[0].from = validity.from;
  if (validity) periods[0].to = validity.to;

  // Days in the month: a TAF does not say which month it is, so infer it from the days used.
  const days = groups.flatMap((g) => [g.data.from?.day, g.data.to?.day, g.data.at?.day, g.kind === 'time' ? g.data.day : undefined]).filter(Boolean);
  const startDay = validity?.from.day ?? 1;
  const monthDays = Math.max(28, ...days.filter((d) => d >= startDay));

  if (type && type !== 'TAF') issues.push({ level: 'error', code: 'notTaf', params: {} });
  if (!find('station')) issues.push({ level: 'error', code: 'noStation', params: {} });
  if (!find('time')) issues.push({ level: 'warning', code: 'noTime', params: {} });
  if (!validity) issues.push({ level: 'error', code: 'noValidity', params: {} });
  if (validity && !nil) {
    const len = hoursBetween(validity.from, validity.to, startDay, monthDays);
    if (len < 6 || len > 30) issues.push({ level: 'warning', code: 'validityLength', params: { hours: len } });
    if (!periods[0].conditions.wind) issues.push({ level: 'warning', code: 'noWind', params: {} });
    if (!periods[0].conditions.visibility && !periods[0].conditions.cavok) issues.push({ level: 'warning', code: 'noVisibility', params: {} });
  }
  for (const p of periods.slice(1)) {
    if (!validity || !p.from) continue;
    const s = offsetHours(p.from, validity.from, startDay, monthDays);
    const e = p.to ? offsetHours(p.to, validity.from, startDay, monthDays) : s;
    const total = offsetHours(validity.to, validity.from, startDay, monthDays);
    if (s < 0 || e > total) issues.push({ level: 'warning', code: 'outsideValidity', params: { group: p.groups[0]?.raw ?? '' } });
    if (p.kind === 'BECMG' && p.to && e - s > 4) issues.push({ level: 'warning', code: 'becmgTooLong', params: { group: p.groups.map((g) => g.raw).slice(0, 2).join(' ') } });
    if (p.to && e < s) issues.push({ level: 'error', code: 'periodReversed', params: { group: p.groups.map((g) => g.raw).slice(0, 2).join(' ') } });
  }
  for (const g of groups) if (g.status === 'invalid') issues.push({ level: 'error', code: `invalid.${g.data.reason ?? 'range'}`, params: { group: g.raw } });

  return { type, station: find('station')?.data.code ?? null, issued: find('time')?.data ?? null, validity, periods, groups, issues, monthDays };
}

/** Hours from `ref` to `t` ({day,hour,minute}), crossing the month end if needed. */
export function offsetHours(t, ref, startDay = ref.day, monthDays = 31) {
  const dayIndex = (d) => (d >= startDay ? d - startDay : d + monthDays - startDay);
  return (dayIndex(t.day) - dayIndex(ref.day)) * 24 + (t.hour - ref.hour) + ((t.minute ?? 0) - (ref.minute ?? 0)) / 60;
}

export function hoursBetween(a, b, startDay = a.day, monthDays = 31) {
  return offsetHours(b, a, startDay, monthDays);
}
