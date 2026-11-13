/**
 * Weather glossary (Phase 4): grouping, search and "explain this group" for METAR/TAF codes.
 * The meanings live in src/content/weather/codes.json; this module only finds and combines
 * entries. Weather groups reuse the METAR decoder's parser so both tools agree.
 */
import { parseWeather } from '../metar/weather.js';

export const GROUPS = [
  'report', 'modifier', 'wind', 'visibility', 'intensity', 'descriptor', 'precipitation',
  'obscuration', 'other', 'cloud', 'pressure', 'general', 'change',
];

/** @param {{ id: string, group: string }[]} entries @returns {{ group: string, items: any[] }[]} */
export function groupCodes(entries) {
  return GROUPS.map((group) => ({ group, items: entries.filter((e) => e.group === group) })).filter((g) => g.items.length);
}

/** Lower case, no accents, no surrounding spaces. */
export function fold(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Entries whose code or meaning (in `lang`) contains the query. Exact code matches first.
 * @param {any[]} entries @param {string} query @param {'es'|'en'} lang
 */
export function searchCodes(entries, query, lang) {
  const q = fold(query);
  if (!q) return entries;
  const exact = [];
  const partial = [];
  for (const e of entries) {
    const code = fold(e.code);
    if (code === q || code.split(/\s*\/\s*/).includes(q)) exact.push(e);
    else if (code.includes(q) || fold(e.meaning?.[lang]).includes(q)) partial.push(e);
  }
  return [...exact, ...partial];
}

/** Map code → entry id for the codes that are written literally ("BR", "CAVOK", "PROB30"…). */
export function buildCodeIndex(entries) {
  const index = new Map();
  for (const e of entries) {
    for (const c of String(e.code).split('/').map((s) => s.trim())) {
      if (/^[A-Z0-9+-]+$/.test(c)) index.set(c, e.id);
    }
  }
  return index;
}

function weatherParts(token, index) {
  const w = parseWeather(token);
  if (!w) return null;
  const ids = [];
  if (w.vicinity) ids.push('vc');
  else if (w.intensity === 'light') ids.push('light');
  else if (w.intensity === 'heavy') ids.push('heavy');
  else if (w.intensity === 'moderate') ids.push('moderate');
  if (w.descriptor) ids.push(index.get(w.descriptor));
  for (const p of w.phenomena) ids.push(index.get(p));
  return ids.every(Boolean) ? ids : null;
}

/**
 * Break one METAR/TAF group into glossary entries.
 * @param {string} input e.g. "+TSRA", "BKN012CB", "RESHSN", "VV002", "Q1013", "PROB40"
 * @param {Map<string,string>} index from buildCodeIndex()
 * @returns {{ token: string, ids: string[], heightFt?: number|null } | null}
 */
export function explainGroup(input, index) {
  const token = String(input ?? '').trim().toUpperCase();
  if (!token || /\s/.test(token)) return null;
  // Weather groups first, so "RA" shows its implicit moderate intensity.
  const wx = weatherParts(token, index);
  if (wx) return { token, ids: wx };
  if (index.has(token)) return { token, ids: [index.get(token)] };

  let m;
  if ((m = /^(FEW|SCT|BKN|OVC)(\d{3}|\/{3})(CB|TCU|\/{3})?$/.exec(token))) {
    const ids = [index.get(m[1])];
    if (m[3] === 'CB' || m[3] === 'TCU') ids.push(index.get(m[3]));
    return { token, ids, heightFt: m[2] === '///' ? null : Number(m[2]) * 100 };
  }
  if ((m = /^VV(\d{3}|\/{3})$/.exec(token))) return { token, ids: ['vv'], heightFt: m[1] === '///' ? null : Number(m[1]) * 100 };
  if (/^R\d{2}[LCR]?\/[PM]?\d{4}(V[PM]?\d{4})?(FT)?[UDN]?$/.test(token)) return { token, ids: ['rvr'] };
  if (/^Q\d{4}$/.test(token)) return { token, ids: ['q'] };
  if (/^A\d{4}$/.test(token)) return { token, ids: ['a'] };
  if (/^T[XN]M?\d{2}\/\d{4}Z$/.test(token)) return { token, ids: ['tx-tn'] };
  if (/^FM\d{6}$/.test(token)) return { token, ids: ['fm'] };
  if ((m = /^(\d{3}|VRB)\d{2,3}(G\d{2,3})?(KT|MPS)$/.exec(token))) {
    return { token, ids: m[1] === 'VRB' ? ['vrb', 'kt'] : ['kt'] };
  }
  if (/^\d{4}NDV$/.test(token)) return { token, ids: ['ndv'] };
  if ((m = /^RE(.+)$/.exec(token))) {
    const parts = weatherParts(m[1], index);
    return parts ? { token, ids: ['re', ...parts] } : null;
  }
  return null;
}
