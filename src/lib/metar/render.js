/**
 * Builds the decoder's result as HTML strings, so the same markup is produced at build time
 * (first example, readable without JavaScript) and in the browser (every new message).
 * All visible words come from the i18n messages passed in.
 */
import { explainGroup, explainIssue } from './explain.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fill = (str, vars = {}) => String(str ?? '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));

/** Category used for colour-coding, so related groups share a colour. */
const TONE = {
  type: 'muted', modifier: 'muted', station: 'primary', time: 'primary',
  wind: 'cyan', windVariation: 'cyan', cavok: 'green', visibility: 'green', minVisibility: 'green', rvr: 'green',
  weather: 'magenta', recent: 'magenta', clouds: 'amber', temperature: 'primary', pressure: 'primary',
  windShear: 'red', trend: 'muted', trendTime: 'muted', remarks: 'muted', unknown: 'red',
};

/** The original message with each group highlighted. */
export function highlightedHtml(result, labels) {
  return result.groups
    .map((g, i) => {
      const cls = `mt-tok mt-tok--${TONE[g.kind] ?? 'muted'}${g.status !== 'ok' ? ` mt-tok--${g.status}` : ''}`;
      return `<a class="${cls}" href="#mt-g${i}" title="${esc(labels.kinds[g.kind])}">${esc(g.raw)}</a>`;
    })
    .join(' ');
}

/** One row per group: code, what it is, explanation. */
export function groupsTableHtml(result, M, lang, ui) {
  const rows = [];
  let section = null;
  result.groups.forEach((g, i) => {
    if (g.section !== section) {
      section = g.section;
      rows.push(`<tr class="mt-sec"><th colspan="3" scope="rowgroup">${esc(M.sections[section])}</th></tr>`);
    }
    const status = g.status === 'ok' ? '' : ` <span class="mt-flag mt-flag--${g.status}">${esc(ui.status[g.status])}</span>`;
    rows.push(
      `<tr id="mt-g${i}" class="mt-row mt-row--${TONE[g.kind] ?? 'muted'}">` +
        `<td><code>${esc(g.raw)}</code></td>` +
        `<td>${esc(M.kinds[g.kind])}${status}</td>` +
        `<td>${esc(explainGroup(g, M, lang))}</td>` +
      '</tr>'
    );
  });
  return (
    `<table class="mt-table"><caption class="visually-hidden">${esc(ui.tableCaption)}</caption>` +
    `<thead><tr><th scope="col">${esc(ui.colGroup)}</th><th scope="col">${esc(ui.colKind)}</th><th scope="col">${esc(ui.colMeaning)}</th></tr></thead>` +
    `<tbody>${rows.join('')}</tbody></table>`
  );
}

export function issuesHtml(result, M, ui) {
  if (result.issues.length === 0) return `<p class="mt-ok">${esc(ui.noIssues)}</p>`;
  const items = result.issues
    .map((i) => `<li class="mt-issue mt-issue--${i.level}"><strong>${esc(ui.level[i.level])}:</strong> ${esc(explainIssue(i, M))}</li>`)
    .join('');
  return `<ul class="mt-issues">${items}</ul>`;
}

const COVER_OKTAS = { FEW: 2, SCT: 4, BKN: 7, OVC: 8 };

/** Lowest broken/overcast layer or vertical visibility (the "ceiling"), in feet. */
export function ceilingFt(result) {
  const heights = result.groups
    .filter((g) => g.kind === 'clouds' && g.section === 'main')
    .map((g) => ('verticalVisibility' in g.data ? g.data.verticalVisibility : ['BKN', 'OVC'].includes(g.data.cover) ? g.data.height : null))
    .filter((h) => h !== null && h !== undefined);
  return heights.length ? Math.min(...heights) : null;
}

/**
 * Wind rose: arrow pointing the way the wind blows, from the direction it comes from.
 * @returns {string} SVG markup
 */
export function windRoseSvg(result, ui) {
  const w = result.groups.find((g) => g.kind === 'wind' && g.section === 'main' && g.status === 'ok');
  const v = result.groups.find((g) => g.kind === 'windVariation' && g.section === 'main');
  const R = 80;
  const c = 100;
  const pt = (deg, r) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [c + r * Math.cos(a), c + r * Math.sin(a)];
  };
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const [x1, y1] = pt(i * 10, R);
    const [x2, y2] = pt(i * 10, i % 9 === 0 ? R - 12 : R - 6);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="wr-tick" />`;
  }).join('');
  const cardinals = [['N', 0], ['E', 90], ['S', 180], ['W', 270]]
    .map(([k, d]) => {
      const [x, y] = pt(d, R + 12);
      return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" class="wr-card" text-anchor="middle">${esc(ui.cardinal[k])}</text>`;
    })
    .join('');
  let arc = '';
  if (v) {
    const [x1, y1] = pt(v.data.from, R - 3);
    const [x2, y2] = pt(v.data.to, R - 3);
    const span = (v.data.to - v.data.from + 360) % 360;
    arc = `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R - 3} ${R - 3} 0 ${span > 180 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" class="wr-arc" />`;
  }
  let arrow = '';
  let label = esc(ui.noWind);
  if (w && !w.data.missing) {
    const unit = ui.units[w.data.unit];
    if (w.data.calm) label = esc(ui.calm);
    else {
      label = `${w.data.speed}${w.data.gust ? `G${w.data.gust}` : ''} ${esc(unit)}`;
      if (!w.data.variable) {
        const [x1, y1] = pt(w.data.direction, R - 4);
        const [x2, y2] = pt(w.data.direction, 22);
        arrow = `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="wr-arrow" marker-end="url(#wr-head)" />`;
      } else label = `VRB ${label}`;
    }
  }
  const title = w && !w.data.missing && !w.data.calm && !w.data.variable
    ? fill(ui.roseTitle, { dir: String(w.data.direction).padStart(3, '0'), speed: label })
    : label;
  return (
    `<svg viewBox="0 0 200 200" class="wr" role="img" aria-label="${esc(title)}">` +
    '<defs><marker id="wr-head" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="wr-headpath" /></marker></defs>' +
    `<circle cx="${c}" cy="${c}" r="${R}" class="wr-ring" />${ticks}${cardinals}${arc}${arrow}` +
    `<text x="${c}" y="${c + 5}" text-anchor="middle" class="wr-speed">${label}</text></svg>`
  );
}

/** Cloud layers drawn at their heights, width proportional to coverage in oktas. */
export function cloudProfileSvg(result, ui) {
  const layers = result.groups.filter((g) => g.kind === 'clouds' && g.section === 'main' && g.status === 'ok');
  const W = 320;
  const H = 200;
  const pad = 28;
  const special = layers.find((g) => g.data.special);
  const real = layers.filter((g) => !g.data.special && (g.data.height ?? g.data.verticalVisibility) != null);
  const cavok = result.groups.some((g) => g.kind === 'cavok' && g.section === 'main');
  if (!real.length) {
    const msg = cavok ? ui.cloudsCavok : special ? ui.cloudsNone : ui.cloudsUnknown;
    return `<svg viewBox="0 0 ${W} ${H}" class="cp" role="img" aria-label="${esc(msg)}"><line x1="0" y1="${H - pad}" x2="${W}" y2="${H - pad}" class="cp-ground" /><text x="${W / 2}" y="${H / 2}" text-anchor="middle" class="cp-msg">${esc(msg)}</text></svg>`;
  }
  const heights = real.map((g) => g.data.height ?? g.data.verticalVisibility);
  const top = Math.max(5000, Math.ceil((Math.max(...heights) * 1.25) / 1000) * 1000);
  const y = (h) => H - pad - (h / top) * (H - pad - 12);
  const grid = [0, top / 2, top]
    .map((h) => `<line x1="40" y1="${y(h).toFixed(1)}" x2="${W}" y2="${y(h).toFixed(1)}" class="cp-grid" /><text x="36" y="${(y(h) + 4).toFixed(1)}" text-anchor="end" class="cp-axis">${h.toLocaleString(ui.locale)}</text>`)
    .join('');
  const bands = real
    .map((g) => {
      const h = g.data.height ?? g.data.verticalVisibility;
      const oktas = 'verticalVisibility' in g.data ? 8 : COVER_OKTAS[g.data.cover] ?? 4;
      const width = ((W - 60) * oktas) / 8;
      const label = 'verticalVisibility' in g.data ? `VV ${h} ft` : `${g.data.cover ?? '///'} ${h} ft${g.data.type && g.data.type !== 'unknown' ? ` ${g.data.type}` : ''}`;
      return `<rect x="48" y="${(y(h) - 7).toFixed(1)}" width="${width.toFixed(1)}" height="14" rx="7" class="cp-band${g.data.type === 'CB' || g.data.type === 'TCU' ? ' cp-band--cb' : ''}" /><text x="${(52 + width).toFixed(1)}" y="${(y(h) + 4).toFixed(1)}" class="cp-label">${esc(label)}</text>`;
    })
    .join('');
  const aria = fill(ui.cloudsAria, { layers: real.map((g) => g.raw).join(', ') });
  return `<svg viewBox="0 0 ${W} ${H}" class="cp" role="img" aria-label="${esc(aria)}">${grid}<line x1="40" y1="${H - pad}" x2="${W}" y2="${H - pad}" class="cp-ground" /><text x="40" y="${H - 8}" class="cp-axis">${esc(ui.ftAal)}</text>${bands}</svg>`;
}

/** Everything the result panel shows, as strings. */
export function renderMetar(result, M, lang, ui) {
  const ceiling = ceilingFt(result);
  return {
    highlighted: highlightedHtml(result, M),
    table: groupsTableHtml(result, M, lang, ui),
    issues: issuesHtml(result, M, ui),
    rose: windRoseSvg(result, ui),
    clouds: cloudProfileSvg(result, ui),
    ceiling: ceiling === null ? ui.noCeiling : `${ceiling.toLocaleString(ui.locale)} ft`,
  };
}
