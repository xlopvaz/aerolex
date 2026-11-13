/**
 * Parsers for individual METAR/SPECI/TAF groups (WMO-No. 306 FM 15/16/51, ICAO Annex 3, and the
 * US variants in the FAA Aviation Weather Handbook). Each parser receives the list of tokens and
 * the current index and returns `null` (no match) or `{ kind, size, status, data }`:
 *   - size:   how many tokens the group uses (some groups span two, e.g. "1 1/2SM", "WS R24")
 *   - status: 'ok' or 'invalid' (recognised shape but impossible values)
 * Nothing here produces visible text: explanations are built from src/i18n by explain.js.
 */
import { parseWeather } from './weather.js';

const ok = (kind, data, size = 1) => ({ kind, size, status: 'ok', data });
const bad = (kind, data, size = 1, reason = 'range') => ({ kind, size, status: 'invalid', data: { ...data, reason } });
const tok = (tokens, i) => tokens[i]?.text ?? '';

/** METAR / SPECI / TAF report type. */
export function reportType(tokens, i) {
  const t = tok(tokens, i);
  return t === 'METAR' || t === 'SPECI' || t === 'TAF' ? ok('type', { value: t }) : null;
}

/** COR, AMD, AUTO, NIL, CNL modifiers. */
export function modifier(tokens, i) {
  const t = tok(tokens, i);
  return ['COR', 'AMD', 'AUTO', 'NIL', 'CNL'].includes(t) ? ok('modifier', { value: t }) : null;
}

/** Four-letter ICAO location indicator. */
export function station(tokens, i) {
  const t = tok(tokens, i);
  return /^[A-Z][A-Z0-9]{3}$/.test(t) && !/^(METAR|SPECI|AUTO|NSC|NCD|SKC|CLR|NSW)$/.test(t) ? ok('station', { code: t }) : null;
}

/** Day and time of observation or issue: DDHHMMZ. */
export function obsTime(tokens, i) {
  const m = /^(\d{2})(\d{2})(\d{2})Z$/.exec(tok(tokens, i));
  if (!m) return null;
  const [day, hour, minute] = m.slice(1).map(Number);
  const data = { day, hour, minute };
  return day >= 1 && day <= 31 && hour <= 23 && minute <= 59 ? ok('time', data) : bad('time', data);
}

const SPEED_UNITS = { KT: 'KT', MPS: 'MPS', KMH: 'KMH' };

/** Surface wind: dddff(f)[Gfff]KT, VRBffKT, 00000KT, /////KT. */
export function wind(tokens, i) {
  const t = tok(tokens, i);
  if (/^\/{5}(KT|MPS|KMH)$/.test(t)) return ok('wind', { missing: true, unit: t.slice(5) });
  const m = /^(\d{3}|VRB)(P?\d{2,3})(?:G(P?\d{2,3}))?(KT|MPS|KMH)$/.exec(t);
  if (!m) return null;
  const [, d, s, g, unit] = m;
  const above = s.startsWith('P');
  const speed = Number(s.replace('P', ''));
  const gust = g ? Number(g.replace('P', '')) : null;
  const data = {
    direction: d === 'VRB' ? null : Number(d),
    variable: d === 'VRB',
    speed,
    speedAbove: above,
    gust,
    unit: SPEED_UNITS[unit],
    calm: d === '000' && speed === 0 && !g,
  };
  if (data.direction !== null && (data.direction > 360 || (data.direction === 0 && speed > 0))) return bad('wind', data);
  if (gust !== null && gust <= speed) return bad('wind', data, 1, 'gust');
  return ok('wind', data);
}

/** Variable wind direction: dddVddd. */
export function windVariation(tokens, i) {
  const m = /^(\d{3})V(\d{3})$/.exec(tok(tokens, i));
  if (!m) return null;
  const data = { from: Number(m[1]), to: Number(m[2]) };
  return data.from <= 360 && data.to <= 360 ? ok('windVariation', data) : bad('windVariation', data);
}

/** CAVOK. */
export function cavok(tokens, i) {
  return tok(tokens, i) === 'CAVOK' ? ok('cavok', {}) : null;
}

const fraction = (s) => {
  const [a, b] = s.split('/').map(Number);
  return b ? a / b : NaN;
};

/**
 * Prevailing visibility. ICAO: 4 digits in metres (9999 = 10 km or more, 0000 = less than 50 m),
 * optionally followed by NDV. US: statute miles (10SM, 3/4SM, 1 1/2SM, M1/4SM, P6SM).
 */
export function visibility(tokens, i) {
  const t = tok(tokens, i);
  let m = /^(\d{4})(NDV)?$/.exec(t);
  if (m) {
    const metres = Number(m[1]);
    return ok('visibility', { unit: 'M', value: metres, tenOrMore: metres === 9999, belowFifty: metres === 0, ndv: Boolean(m[2]) });
  }
  if (t === '////') return ok('visibility', { unit: 'M', missing: true });
  // Two-token form: "1 1/2SM"
  const next = tok(tokens, i + 1);
  if (/^\d$/.test(t) && /^\d\/\dSM$/.test(next)) {
    const value = Number(t) + fraction(next.slice(0, -2));
    return ok('visibility', { unit: 'SM', value }, 2);
  }
  m = /^([MP])?(\d{1,2}(?:\/\d{1,2})?)SM$/.exec(t);
  if (m) {
    const value = m[2].includes('/') ? fraction(m[2]) : Number(m[2]);
    if (!Number.isFinite(value)) return null;
    return ok('visibility', { unit: 'SM', value, below: m[1] === 'M', above: m[1] === 'P' });
  }
  return null;
}

const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** Minimum visibility with direction: 4 digits + compass point (e.g. 1500SW). */
export function minVisibility(tokens, i) {
  const m = /^(\d{4})(N|NE|E|SE|S|SW|W|NW)$/.exec(tok(tokens, i));
  return m && DIRECTIONS.includes(m[2]) ? ok('minVisibility', { value: Number(m[1]), direction: m[2] }) : null;
}

/** Runway visual range: R24/P2000N, R06L/0600V1000U, R27/M0050, R09/1200FT (US). */
export function rvr(tokens, i) {
  const m = /^R(\d{2}[LCR]?)\/([PM])?(\d{4})(?:V([PM])?(\d{4}))?(FT)?(?:\/?([UDN]))?$/.exec(tok(tokens, i));
  if (!m) return null;
  const [, runway, p1, v1, p2, v2, ft, trend] = m;
  return ok('rvr', {
    runway,
    value: Number(v1),
    above: p1 === 'P',
    below: p1 === 'M',
    max: v2 ? Number(v2) : null,
    maxAbove: p2 === 'P',
    maxBelow: p2 === 'M',
    unit: ft ? 'FT' : 'M',
    trend: trend ?? null,
  });
}

/** Present weather (or NSW, "no significant weather", in trends and TAF). */
export function presentWeather(tokens, i, { allowNsw = false } = {}) {
  const t = tok(tokens, i);
  if (allowNsw && t === 'NSW') return ok('weather', { nsw: true });
  if (t === '//') return ok('weather', { missing: true });
  const w = parseWeather(t);
  return w ? ok('weather', w) : null;
}

/** Recent weather: RExx. */
export function recentWeather(tokens, i) {
  const t = tok(tokens, i);
  if (!t.startsWith('RE') || t.length < 4) return null;
  const w = parseWeather(t.slice(2));
  return w ? ok('recent', w) : null;
}

/** Cloud groups: FEW/SCT/BKN/OVC hhh [CB|TCU|///], VVhhh, NSC, NCD, SKC, CLR. */
export function clouds(tokens, i) {
  const t = tok(tokens, i);
  if (['NSC', 'NCD', 'SKC', 'CLR'].includes(t)) return ok('clouds', { special: t });
  let m = /^VV(\d{3}|\/{3})$/.exec(t);
  if (m) return ok('clouds', { verticalVisibility: m[1] === '///' ? null : Number(m[1]) * 100 });
  m = /^(FEW|SCT|BKN|OVC|\/{3})(\d{3}|\/{3})(CB|TCU|\/{3})?$/.exec(t);
  if (!m) return null;
  return ok('clouds', {
    cover: m[1] === '///' ? null : m[1],
    height: m[2] === '///' ? null : Number(m[2]) * 100,
    type: m[3] === '///' ? 'unknown' : m[3] ?? null,
  });
}

const signed = (s) => (s.startsWith('M') ? -Number(s.slice(1)) : Number(s));

/** Temperature / dew point: TT/TdTd with M for negative values. */
export function temperature(tokens, i) {
  const m = /^(M?\d{2})\/(M?\d{2}|\/\/)?$/.exec(tok(tokens, i));
  if (!m) return null;
  const data = { temp: signed(m[1]), dew: m[2] && m[2] !== '//' ? signed(m[2]) : null };
  return data.dew !== null && data.dew > data.temp ? bad('temperature', data, 1, 'dewAboveTemp') : ok('temperature', data);
}

/** Pressure: Q1013 (hPa) or A2992 (hundredths of inHg). */
export function pressure(tokens, i) {
  const m = /^([QA])(\d{4})$/.exec(tok(tokens, i));
  if (!m) return null;
  if (m[1] === 'Q') {
    const data = { unit: 'HPA', value: Number(m[2]) };
    return data.value >= 850 && data.value <= 1090 ? ok('pressure', data) : bad('pressure', data);
  }
  const data = { unit: 'INHG', value: Number(m[2]) / 100 };
  return data.value >= 25 && data.value <= 32.5 ? ok('pressure', data) : bad('pressure', data);
}

/** Wind shear: "WS R24", "WS RWY24" or "WS ALL RWY". */
export function windShear(tokens, i) {
  if (tok(tokens, i) !== 'WS') return null;
  const next = tok(tokens, i + 1);
  if (next === 'ALL' && tok(tokens, i + 2) === 'RWY') return ok('windShear', { all: true }, 3);
  const m = /^R(?:WY)?(\d{2}[LCR]?)$/.exec(next);
  return m ? ok('windShear', { runway: m[1] }, 2) : null;
}

/** Trend / change indicators: NOSIG, BECMG, TEMPO (METAR) and FM, PROB in TAF are separate. */
export function trendIndicator(tokens, i) {
  const t = tok(tokens, i);
  return ['NOSIG', 'BECMG', 'TEMPO'].includes(t) ? ok('trend', { value: t }) : null;
}

/** Trend time groups: FMhhmm, TLhhmm, AThhmm. */
export function trendTime(tokens, i) {
  const m = /^(FM|TL|AT)(\d{2})(\d{2})$/.exec(tok(tokens, i));
  if (!m) return null;
  const data = { prefix: m[1], hour: Number(m[2]), minute: Number(m[3]) };
  return data.hour <= 24 && data.minute <= 59 ? ok('trendTime', data) : bad('trendTime', data);
}
