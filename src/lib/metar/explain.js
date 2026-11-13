/**
 * Turns decoded groups into plain-language explanations, using the message templates in
 * src/i18n/ui/<lang>.json under "metar". The same function runs at build time and in the
 * browser, so it receives the message object instead of importing the dictionaries.
 */
import { ktToKmh, mpsToKmh, smToM, inHgToHpa, hpaToInHg, round } from '../units/convert.js';

const fill = (str, vars = {}) => String(str ?? '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
const pad = (n) => String(n).padStart(2, '0');

function numberFormatter(lang) {
  return (v, digits = 0, grouping = true) =>
    new Intl.NumberFormat(lang, { maximumFractionDigits: digits, minimumFractionDigits: 0, useGrouping: grouping }).format(v);
}

function speedText(M, n, speed, unit, above = false) {
  const kmh = unit === 'KT' ? ktToKmh(speed) : unit === 'MPS' ? mpsToKmh(speed) : speed;
  const value = above ? fill(M.above, { v: n(speed) }) : n(speed);
  const base = fill(M.speed, { v: value, unit: M.units[unit] });
  return unit === 'KMH' ? base : `${base} ${fill(M.approxKmh, { v: n(round(kmh)) })}`;
}

function metresText(M, n, m) {
  return m >= 1000 ? fill(M.km, { v: n(m / 1000, 1) }) : fill(M.m, { v: n(round(m / 10) * 10) });
}

/** Text for a weather group (present, recent or forecast). */
export function weatherText(M, d) {
  if (d.nsw) return M.wxNsw;
  if (d.missing) return M.wxMissing;
  if (d.phenomena.includes('FC') && d.intensity === 'heavy') return M.wxTornado;
  const names = d.phenomena.map((p) => M.phenomena[p]);
  let what = names.length ? names.join(M.and) : M.descriptorsAlone[d.descriptor] ?? M.descriptors[d.descriptor];
  const parts = [];
  if (names.length && d.descriptor) parts.push(M.descriptors[d.descriptor]);
  if (d.intensity) parts.push(fill(M.intensityLabel, { i: M.intensity[d.intensity] }));
  if (parts.length) what += ` (${parts.join(', ')})`;
  if (d.vicinity) what = fill(M.wxVicinity, { what });
  return what.charAt(0).toUpperCase() + what.slice(1);
}

/**
 * @param {object} g decoded group
 * @param {object} M messages for one language (i18n "metar" section)
 * @param {string} lang 'es' | 'en'
 * @returns {string}
 */
export function explainGroup(g, M, lang) {
  const n = numberFormatter(lang);
  const E = M.explain;
  const d = g.data;
  let text = '';
  switch (g.kind) {
    case 'type': text = E.type[d.value]; break;
    case 'modifier': text = E.modifier[d.value]; break;
    case 'station': text = fill(E.station, { code: d.code }); break;
    case 'time': text = fill(E.time, { day: d.day, hh: pad(d.hour), mm: pad(d.minute) }); break;
    case 'wind':
      if (d.missing) text = E.windMissing;
      else if (d.calm) text = E.windCalm;
      else {
        const speed = speedText(E, n, d.speed, d.unit, d.speedAbove);
        text = d.variable ? fill(E.windVrb, { speed }) : fill(E.wind, { dir: pad(d.direction).padStart(3, '0'), speed });
        if (d.gust !== null) text += ' ' + fill(E.windGust, { gust: speedText(E, n, d.gust, d.unit) });
      }
      break;
    case 'windVariation': text = fill(E.windVariation, { from: String(d.from).padStart(3, '0'), to: String(d.to).padStart(3, '0') }); break;
    case 'cavok': text = E.cavok; break;
    case 'visibility':
      if (d.missing) text = E.visMissing;
      else if (d.unit === 'M') {
        text = d.tenOrMore ? E.vis10k : d.belowFifty ? E.vis50 : fill(E.visM, { v: metresText(E, n, d.value) });
        if (d.ndv) text += ' ' + E.visNdv;
      } else {
        const key = d.below ? 'visSmBelow' : d.above ? 'visSmAbove' : 'visSm';
        text = fill(E[key], { v: n(d.value, 2), m: metresText(E, n, smToM(d.value)) });
      }
      break;
    case 'minVisibility': text = fill(E.minVis, { v: metresText(E, n, d.value), dir: E.dirs[d.direction] }); break;
    case 'rvr': {
      const unit = d.unit === 'FT' ? 'ft' : 'm';
      const one = (v, above, below) => {
        const s = `${n(v)} ${unit}`;
        return above ? fill(E.above, { v: s }) : below ? fill(E.below, { v: s }) : s;
      };
      const value = d.max !== null ? fill(E.rvrRange, { min: one(d.value, d.above, d.below), max: one(d.max, d.maxAbove, d.maxBelow) }) : one(d.value, d.above, d.below);
      text = fill(E.rvr, { rwy: d.runway, value }) + (d.trend ? ' ' + E.rvrTrend[d.trend] : '');
      break;
    }
    case 'weather': text = weatherText(E, d) + '.'; break;
    case 'recent': text = fill(E.recent, { what: weatherText(E, d) }); break;
    case 'clouds':
      if (d.special) text = E.special[d.special];
      else if ('verticalVisibility' in d) text = d.verticalVisibility === null ? E.vvMissing : fill(E.vv, { h: n(d.verticalVisibility) });
      else {
        const cover = d.cover ? E.covers[d.cover] : E.coverUnknown;
        text = d.height === null ? fill(E.cloudsNoHeight, { cover }) : fill(E.clouds, { cover, h: n(d.height) });
        if (d.type) text += ' ' + E.cloudType[d.type];
      }
      break;
    case 'temperature':
      text = d.dew === null
        ? fill(E.temperatureNoDew, { t: n(d.temp) })
        : fill(E.temperature, { t: n(d.temp), d: n(d.dew), spread: n(d.temp - d.dew) });
      break;
    case 'pressure':
      text = d.unit === 'HPA'
        ? fill(E.qnh, { v: n(d.value, 0, false), alt: n(hpaToInHg(d.value), 2) })
        : fill(E.altimeter, { v: n(d.value, 2), alt: n(round(inHgToHpa(d.value)), 0, false) });
      break;
    case 'windShear': text = d.all ? E.windShearAll : fill(E.windShear, { rwy: d.runway }); break;
    case 'trend': text = E.trend[d.value]; break;
    case 'trendTime': text = fill(E.trendTime[d.prefix], { hh: pad(d.hour), mm: pad(d.minute) }); break;
    case 'remarks': text = E.remarks; break;
    default: text = E.unknown;
  }
  if (g.status === 'invalid') text += ' ' + E.invalidNote;
  return text;
}

/** Text of an issue (error or warning). */
export function explainIssue(issue, M) {
  const template = issue.code.split('.').reduce((o, k) => (o == null ? o : o[k]), M.issues);
  return fill(typeof template === 'string' ? template : issue.code, issue.params);
}
