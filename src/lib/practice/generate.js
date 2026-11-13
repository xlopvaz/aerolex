/**
 * METAR/TAF practice: questions generated from the didactic library with the tested decoders,
 * so the correct answer always matches what the decoders explain.
 *
 *   createQuestion(level, { metar, taf }, M, lang, ui, rng) →
 *     { level, message, highlight: {start,end}|null, prompt, options: [{id,text}], answer, explanation }
 *
 * Levels: 1 identify a group · 2 read a group's value · 3 understand a whole METAR · 4 read a TAF.
 * All visible text comes from the i18n messages (M = metar section merged with taf, ui = practice).
 */
import { decodeMetar } from '../metar/decode.js';
import { explainGroup } from '../metar/explain.js';
import { ceilingFt } from '../metar/render.js';
import { decodeTaf } from '../taf/decode.js';
import { conditionsAt, segments, timeAt } from '../taf/timeline.js';
import { explainTafGroup } from '../taf/render.js';

const fill = (str, vars = {}) => String(str ?? '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
const pad = (n) => String(n).padStart(2, '0');

/** Small deterministic PRNG (mulberry32), so tests can reproduce questions. */
export function rngFrom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Builds a question from a correct text and candidate distractor texts (deduplicated). */
function build(rng, base, correct, distractors, explanation) {
  const unique = [...new Set(distractors.filter((d) => d && d !== correct))].slice(0, 3);
  if (unique.length < 2) return null;
  const options = shuffle(rng, [correct, ...unique]).map((text, i) => ({ id: String.fromCharCode(97 + i), text }));
  return { ...base, options, answer: options.find((o) => o.text === correct).id, explanation };
}

const MAIN_KINDS = ['station', 'time', 'wind', 'windVariation', 'visibility', 'cavok', 'rvr', 'weather', 'clouds', 'temperature', 'pressure', 'trend', 'recent'];

/* ---------- distractor variants for level 2 ---------- */
const VIS_STEPS = [9999, 8000, 6000, 5000, 3000, 2000, 1500, 800, 400];
const COVERS = ['FEW', 'SCT', 'BKN', 'OVC'];

function variants(g, rng) {
  const d = g.data;
  const out = [];
  switch (g.kind) {
    case 'wind': {
      if (d.missing || d.calm) return [];
      const dir = d.direction ?? 0;
      const rot = (x) => ((((dir + x) % 360) + 360) % 360) || 360;
      if (!d.variable) out.push({ ...d, direction: rot(180) }, { ...d, direction: rot(pick(rng, [30, 60, -40, 90])) });
      out.push({ ...d, speed: d.speed + pick(rng, [5, 8, 10]) });
      if (d.gust) out.push({ ...d, speed: d.gust, gust: null });
      else out.push({ ...d, gust: d.speed + 10 });
      break;
    }
    case 'visibility':
      if (d.unit === 'M' && !d.missing) {
        for (const v of shuffle(rng, VIS_STEPS.filter((x) => x !== d.value)).slice(0, 3)) out.push({ ...d, value: v, tenOrMore: v === 9999, belowFifty: false });
      } else if (d.unit === 'SM') {
        out.push({ ...d, value: d.value * 2 }, { ...d, value: Math.max(0.25, d.value / 2) }, { ...d, below: !d.below });
      }
      break;
    case 'clouds':
      if (d.cover && d.height !== null) {
        out.push({ ...d, height: d.height * 10 }, { ...d, cover: pick(rng, COVERS.filter((c) => c !== d.cover)) });
        out.push({ ...d, height: Math.max(100, d.height / 10) }, { ...d, cover: pick(rng, COVERS.filter((c) => c !== d.cover)), height: d.height * 10 });
      }
      break;
    case 'temperature':
      if (d.dew !== null) out.push({ temp: d.dew, dew: d.temp }, { temp: -d.temp, dew: -d.dew }, { temp: d.temp + 5, dew: d.dew });
      break;
    case 'pressure':
      if (d.unit === 'HPA') out.push({ ...d, value: d.value + 10 }, { ...d, value: d.value - 10 }, { ...d, value: d.value + 3 });
      else out.push({ ...d, value: Math.round((d.value + 0.1) * 100) / 100 }, { ...d, value: Math.round((d.value - 0.12) * 100) / 100 });
      break;
    case 'time':
      out.push({ day: d.hour || 1, hour: Math.min(d.day, 23), minute: d.minute }, { ...d, hour: (d.hour + 1) % 24 }, { ...d, day: d.day === 1 ? 2 : d.day - 1 });
      break;
    case 'weather': {
      if (d.nsw || d.missing) return [];
      const swap = { RA: 'SN', SN: 'RA', DZ: 'RA', BR: 'FG', FG: 'BR', HZ: 'FU', GR: 'GS', TS: 'SH' };
      const phen = d.phenomena.map((p) => swap[p] ?? p);
      out.push({ ...d, phenomena: phen });
      if (d.intensity) out.push({ ...d, intensity: d.intensity === 'heavy' ? 'light' : 'heavy' });
      if (d.descriptor) out.push({ ...d, descriptor: d.descriptor === 'SH' ? 'TS' : 'SH' });
      else if (d.phenomena.some((p) => ['RA', 'SN', 'DZ'].includes(p))) out.push({ ...d, descriptor: 'FZ' });
      out.push({ ...d, vicinity: !d.vicinity });
      break;
    }
    default:
      return [];
  }
  return out.map((data) => ({ ...g, data, status: 'ok' }));
}

/* ---------- level generators ---------- */

function level1(rng, raw, M, lang, ui) {
  const r = decodeMetar(raw);
  const groups = r.groups.filter((g) => MAIN_KINDS.includes(g.kind) && g.status === 'ok');
  const g = pick(rng, groups);
  const correct = M.kinds[g.kind];
  const distractors = shuffle(rng, MAIN_KINDS.filter((k) => k !== g.kind && k !== 'windVariation' && k !== 'recent')).map((k) => M.kinds[k]);
  return build(rng, { level: 1, message: raw, highlight: { start: g.start, end: g.end }, prompt: fill(ui.prompts.identify, { group: g.raw }) }, correct, distractors, explainGroup(g, M, lang));
}

function level2(rng, raw, M, lang, ui) {
  const r = decodeMetar(raw);
  const candidates = r.groups.filter((g) => g.section === 'main' && g.status === 'ok' && variants(g, rng).length >= 2);
  if (!candidates.length) return null;
  const g = pick(rng, candidates);
  const correct = explainGroup(g, M, lang);
  const distractors = variants(g, rng).map((v) => explainGroup(v, M, lang));
  return build(rng, { level: 2, message: raw, highlight: { start: g.start, end: g.end }, prompt: fill(ui.prompts.meaning, { group: g.raw }) }, correct, distractors, correct);
}

function level3(rng, raw, M, lang, ui) {
  const r = decodeMetar(raw);
  const main = r.groups.filter((g) => g.section === 'main');
  const kinds = ['ceiling', 'weather', 'spread', 'trend'];
  for (const kind of shuffle(rng, kinds)) {
    const base = { level: 3, message: raw, highlight: null };
    if (kind === 'ceiling') {
      const c = ceilingFt(r);
      const text = (h) => (h === null ? ui.answers.noCeiling : fill(ui.answers.feet, { v: h.toLocaleString(ui.locale) }));
      const layers = main.filter((g) => g.kind === 'clouds' && g.data.height).map((g) => g.data.height);
      const correct = text(c);
      const distractors = [...layers, ...(c ? [c * 10, Math.max(100, c / 10)] : [800, 1500]), null].map(text);
      const q = build(rng, { ...base, prompt: ui.prompts.ceiling }, correct, shuffle(rng, distractors), ui.explain.ceiling);
      if (q) return q;
    }
    if (kind === 'weather') {
      const wx = main.filter((g) => g.kind === 'weather');
      const correct = wx.length ? wx.map((g) => explainGroup(g, M, lang)).join(' ') : ui.answers.noWeather;
      const others = [ui.answers.noWeather, ...variants(wx[0] ?? { kind: 'weather', data: { intensity: 'light', vicinity: false, descriptor: 'SH', phenomena: ['RA'] } }, rng).map((v) => explainGroup(v, M, lang))];
      const q = build(rng, { ...base, prompt: ui.prompts.weather }, correct, shuffle(rng, others), wx.length ? correct : ui.explain.noWeather);
      if (q) return q;
    }
    if (kind === 'spread') {
      const t = main.find((g) => g.kind === 'temperature');
      if (!t || t.data.dew === null) continue;
      const s = t.data.temp - t.data.dew;
      const text = (v) => fill(ui.answers.degrees, { v });
      const q = build(rng, { ...base, prompt: ui.prompts.spread }, text(s), [text(t.data.temp + t.data.dew), text(s + 3), text(Math.abs(s - 2)), text(t.data.temp)], explainGroup(t, M, lang) + ' ' + (s <= 2 ? ui.explain.spreadSmall : ui.explain.spreadLarge));
      if (q) return q;
    }
    if (kind === 'trend') {
      const tr = r.groups.find((g) => g.kind === 'trend');
      const key = tr ? tr.data.value : 'none';
      const q = build(rng, { ...base, prompt: ui.prompts.trend }, ui.answers.trend[key], Object.values(ui.answers.trend), tr ? explainGroup(tr, M, lang) : ui.answers.trend.none);
      if (q) return q;
    }
  }
  return null;
}

function level4(rng, raw, M, lang, ui) {
  const taf = decodeTaf(raw);
  const segs = segments(taf);
  const total = segs[0]?.end ?? 0;
  const tafWhen = (h) => {
    const t = timeAt(taf, h);
    return { day: t.day, hh: pad(t.hour), mm: pad(t.minute) };
  };
  for (const kind of shuffle(rng, ['wind', 'visibility', 'change', 'validity'])) {
    const base = { level: 4, message: raw, highlight: null };
    if (kind === 'wind' || kind === 'visibility') {
      const h = Math.floor(rng() * total);
      const at = conditionsAt(taf, h);
      const textOf = (c) => {
        if (kind === 'wind') return c.wind ? explainGroup({ kind: 'wind', data: c.wind, status: 'ok' }, M, lang) : null;
        if (c.cavok) return explainGroup({ kind: 'cavok', data: {}, status: 'ok' }, M, lang);
        return c.visibility ? explainGroup({ kind: 'visibility', data: c.visibility, status: 'ok' }, M, lang) : null;
      };
      const correct = textOf(at.prevailing);
      if (!correct) continue;
      const others = taf.periods.map((p) => textOf(p.conditions)).filter(Boolean);
      const q = build(rng, { ...base, prompt: fill(ui.prompts[kind === 'wind' ? 'tafWind' : 'tafVisibility'], tafWhen(h)) }, correct, shuffle(rng, others), ui.explain.tafPrevailing);
      if (q) return q;
    }
    if (kind === 'change') {
      const changes = taf.groups.filter((g) => g.kind === 'changeIndicator' || g.kind === 'changeFM');
      if (!changes.length) continue;
      const g = pick(rng, changes);
      const all = [...new Set(['FM', 'BECMG', 'TEMPO', 'PROB'].map((k) => ui.answers.change[k]))];
      const key = g.kind === 'changeFM' ? 'FM' : g.data.value;
      const q = build(
        rng,
        { ...base, highlight: { start: g.start, end: g.end }, prompt: fill(ui.prompts.change, { group: g.raw }) },
        ui.answers.change[key],
        all,
        explainTafGroup(g, M, lang, taf)
      );
      if (q) return q;
    }
    if (kind === 'validity') {
      const v = taf.groups.find((g) => g.kind === 'validity');
      if (!v) continue;
      const end = v.data.to;
      const text = (d, h) => fill(ui.answers.dayHour, { day: d, hh: pad(h) });
      const other = end.day > 1 ? end.day - 1 : end.day + 1;
      const q = build(rng, { ...base, prompt: ui.prompts.validityEnd }, text(end.day, end.hour), [text(v.data.from.day, v.data.from.hour), text(other, end.hour), text(end.day, (end.hour + 6) % 24)], explainTafGroup(v, M, lang, taf));
      if (q) return q;
    }
  }
  return null;
}

const GENERATORS = { 1: ['metar', level1], 2: ['metar', level2], 3: ['metar', level3], 4: ['taf', level4] };

/**
 * @param {1|2|3|4} level
 * @param {{ metar: string[], taf: string[] }} library didactic messages
 * @param {object} M messages (tafMessages(metar, taf))
 * @param {string} lang
 * @param {object} ui practice texts (i18n "practice")
 * @param {() => number} [rng]
 */
export function createQuestion(level, library, M, lang, ui, rng = Math.random) {
  const [source, gen] = GENERATORS[level];
  for (let attempt = 0; attempt < 20; attempt++) {
    const q = gen(rng, pick(rng, library[source]), M, lang, ui);
    if (q) return q;
  }
  throw new Error(`Could not generate a level ${level} question`);
}

export const LEVELS = [1, 2, 3, 4];
