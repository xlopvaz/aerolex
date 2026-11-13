/**
 * HTML/SVG for the TAF decoder, shared by the build (first example) and the browser.
 * Visible words come from the i18n sections "metar", "taf" and "tafTool".
 */
import { explainGroup, explainIssue } from '../metar/explain.js';
import { esc, highlightedHtml } from '../metar/render.js';
import { conditionsAt, segments, timeAt, validityHours } from './timeline.js';

const fill = (str, vars = {}) => String(str ?? '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
const pad = (n) => String(n).padStart(2, '0');

/** Messages for the TAF: METAR messages with TAF kinds/issues merged in. */
export function tafMessages(metar, taf) {
  return {
    ...metar,
    kinds: { ...metar.kinds, ...taf.kinds },
    issues: { ...metar.issues, ...taf.issues, invalid: { ...metar.issues.invalid, ...taf.issues.invalid } },
    taf,
  };
}

const when = (M, t) => (t ? fill(M.taf.when, { day: t.day, hh: pad(t.hour), mm: pad(t.minute ?? 0) }) : '—');

export function periodTitle(p, M) {
  const key = p.kind === 'PROB' && p.tempo ? 'PROBTEMPO' : p.kind;
  return fill(M.taf.sections[key], { from: when(M, p.from), to: when(M, p.to), p: p.prob ?? '' });
}

/** Explanation of one TAF group (falls back to the METAR explanations). */
export function explainTafGroup(g, M, lang, taf) {
  const E = M.taf.explain;
  const d = g.data;
  let text;
  switch (g.kind) {
    case 'type': if (d.value !== 'TAF') return explainGroup(g, M, lang); text = E.type; break;
    case 'time': text = fill(E.issued, { day: d.day, hh: pad(d.hour), mm: pad(d.minute) }); break;
    case 'validity': {
      const hours = taf ? validityHours(taf) : '';
      text = fill(E.validity, { d1: d.from.day, h1: pad(d.from.hour), d2: d.to.day, h2: pad(d.to.hour), hours });
      break;
    }
    case 'changeFM': text = fill(E.changeFM, { day: d.from.day, hh: pad(d.from.hour), mm: pad(d.from.minute) }); break;
    case 'changeIndicator': text = fill(E[d.value === 'PROB' && d.tempo ? 'PROBTEMPO' : d.value] ?? E.PROB, { p: d.prob ?? '' }); break;
    case 'changePeriod': text = fill(E.changePeriod, { d1: d.from.day, h1: pad(d.from.hour), d2: d.to.day, h2: pad(d.to.hour) }); break;
    case 'extremeTemp': text = fill(E[d.which], { v: d.value, day: d.at.day, hh: pad(d.at.hour) }); break;
    default: return explainGroup(g, M, lang);
  }
  if (g.status === 'invalid') text += ' ' + M.explain.invalidNote;
  return text;
}

export function tafTableHtml(taf, M, lang, ui) {
  const rows = [];
  let current = -1;
  taf.groups.forEach((g, i) => {
    if (g.period !== current) {
      current = g.period;
      const title = current === 0 ? M.taf.sections.BASE : periodTitle(taf.periods[current], M);
      rows.push(`<tr class="mt-sec"><th colspan="3" scope="rowgroup">${esc(title)}</th></tr>`);
    }
    const status = g.status === 'ok' ? '' : ` <span class="mt-flag mt-flag--${g.status}">${esc(ui.status[g.status])}</span>`;
    rows.push(
      `<tr id="mt-g${i}" class="mt-row"><td><code>${esc(g.raw)}</code></td><td>${esc(M.kinds[g.kind] ?? g.kind)}${status}</td><td>${esc(explainTafGroup(g, M, lang, taf))}</td></tr>`
    );
  });
  return `<table class="mt-table"><caption class="visually-hidden">${esc(ui.tableCaption)}</caption><thead><tr><th scope="col">${esc(ui.colGroup)}</th><th scope="col">${esc(ui.colKind)}</th><th scope="col">${esc(ui.colMeaning)}</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

/** Plain-language list of the elements in a set of conditions. */
export function conditionsHtml(c, M, lang) {
  const G = (kind, data) => explainGroup({ kind, data, status: 'ok' }, M, lang);
  const items = [];
  if (c.wind) items.push(G('wind', c.wind));
  if (c.cavok) items.push(G('cavok', {}));
  else if (c.visibility) items.push(G('visibility', c.visibility));
  for (const w of c.weather) items.push(G('weather', w));
  if (!c.cavok) for (const cl of c.clouds) items.push(G('clouds', cl));
  return `<ul class="tf-cond">${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
}

/** "What is forecast at hour h" panel. */
export function atHtml(taf, h, M, lang, ui) {
  if (!taf.validity || !taf.periods[0]?.conditions) return `<p>${esc(ui.noTimeline)}</p>`;
  const t = timeAt(taf, h);
  const c = conditionsAt(taf, h);
  const parts = [`<p class="tf-at__when">${esc(fill(ui.atLabel, { day: t.day, hh: pad(t.hour), mm: pad(t.minute) }))}</p>`];
  parts.push(`<div class="tf-box tf-box--prevailing"><h4>${esc(ui.prevailing)}</h4>${conditionsHtml(c.prevailing, M, lang)}</div>`);
  for (const b of c.becoming) parts.push(`<div class="tf-box tf-box--becmg"><h4>${esc(ui.becoming)}</h4>${conditionsHtml(b.conditions, M, lang)}</div>`);
  for (const x of c.temporary) {
    const title = x.kind === 'TEMPO' ? ui.temporary : fill(x.tempo ? ui.possibleTempo : ui.possible, { p: x.prob });
    parts.push(`<div class="tf-box tf-box--${x.kind === 'TEMPO' ? 'tempo' : 'prob'}"><h4>${esc(title)}</h4>${conditionsHtml(x.conditions, M, lang)}</div>`);
  }
  return parts.join('');
}

/** Timeline: one row per period, cursor at hour h. */
export function timelineSvg(taf, h, M, ui) {
  const total = validityHours(taf);
  if (!taf.validity || total <= 0) return `<p>${esc(ui.noTimeline)}</p>`;
  const segs = segments(taf);
  const W = 680;
  const left = 92;
  const right = 12;
  const rowH = 30;
  const top = 26;
  const H = top + segs.length * rowH + 8;
  const x = (hr) => left + (Math.min(Math.max(hr, 0), total) / total) * (W - left - right);
  const step = total > 18 ? 6 : 3;
  const ticks = [];
  for (let k = 0; k <= total; k += step) {
    const t = timeAt(taf, k);
    ticks.push(`<line x1="${x(k).toFixed(1)}" y1="${top - 6}" x2="${x(k).toFixed(1)}" y2="${H - 4}" class="tf-grid" /><text x="${x(k).toFixed(1)}" y="${top - 10}" text-anchor="middle" class="tf-tick">${pad(t.day)}/${pad(t.hour)}Z</text>`);
  }
  const label = (s) => (s.kind === 'PROB' ? `PROB${s.prob}${s.tempo ? ' TEMPO' : ''}` : s.kind === 'BASE' ? 'BASE' : s.kind);
  const rows = segs
    .map((s, r) => {
      const y = top + r * rowH + 6;
      const w = Math.max(x(s.end) - x(s.start), 4);
      return `<text x="8" y="${y + 13}" class="tf-label">${esc(label(s))}</text><rect x="${x(s.start).toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${rowH - 12}" rx="5" class="tf-bar tf-bar--${s.kind.toLowerCase()}" />`;
    })
    .join('');
  const cursor = `<line x1="${x(h).toFixed(1)}" y1="${top - 4}" x2="${x(h).toFixed(1)}" y2="${H - 2}" class="tf-cursor" />`;
  const aria = fill(ui.timelineAria, { periods: taf.periods.map((p, i) => (i === 0 ? M.taf.sections.BASE : periodTitle(p, M))).join('; ') });
  return `<svg viewBox="0 0 ${W} ${H}" class="tf-svg" role="img" aria-label="${esc(aria)}">${ticks.join('')}${rows}${cursor}</svg>`;
}

export function issuesHtml(taf, M, ui) {
  if (!taf.issues.length) return `<p class="mt-ok">${esc(ui.noIssues)}</p>`;
  return `<ul class="mt-issues">${taf.issues.map((i) => `<li class="mt-issue mt-issue--${i.level}"><strong>${esc(ui.level[i.level])}:</strong> ${esc(explainIssue(i, M))}</li>`).join('')}</ul>`;
}

export function renderTaf(taf, h, M, lang, ui) {
  return {
    highlighted: highlightedHtml(taf, M),
    table: tafTableHtml(taf, M, lang, ui),
    issues: issuesHtml(taf, M, ui),
    timeline: timelineSvg(taf, h, M, ui),
    at: atHtml(taf, h, M, lang, ui),
    hours: validityHours(taf),
  };
}
