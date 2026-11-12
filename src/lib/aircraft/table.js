/**
 * Builds the comparison table HTML. Shared by the server render (default comparison)
 * and the browser (when the user changes the selection), so both look identical.
 */
import { METRICS, leaders } from './compare.js';
import { mToFt, nmToKm, kgToLb } from '../units/convert.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * @param {object[]} variants flattened variants (see flattenVariants)
 * @param {{ lang: string, units: 'metric'|'imperial', labels: Record<string, any> }} opts
 */
export function compareTableHtml(variants, { lang, units, labels }) {
  const nf = (n, d = 0) => new Intl.NumberFormat(lang, { maximumFractionDigits: d, minimumFractionDigits: 0 }).format(n);
  const dash = `<span class="na" title="${esc(labels.notPublished)}">—</span>`;
  const lead = leaders(variants);
  const fmtDate = (d) => (d ? new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`)) : dash);
  const approx = (s) => `<span title="${esc(labels.approx)}">≈ ${s}</span>`;

  const fmt = {
    lengthM: (v) => (units === 'metric' ? `${nf(v, 2)} m` : approx(`${nf(mToFt(v))} ft`)),
    wingspanM: (v) => (units === 'metric' ? `${nf(v, 2)} m` : approx(`${nf(mToFt(v))} ft`)),
    heightM: (v) => (units === 'metric' ? `${nf(v, 2)} m` : approx(`${nf(mToFt(v))} ft`)),
    seatsMax: (v) => nf(v),
    rangeNm: (v, row) => `${nf(v)} NM <small>(${nf(row.rangeKm ?? Math.round(nmToKm(v)))} km)</small>`,
    mtowT: (v) => (units === 'metric' ? `${nf(v, 2)} t` : approx(`${nf(Math.round(kgToLb(v * 1000) / 100) * 100)} lb`)),
  };
  const labelOf = { lengthM: labels.length, wingspanM: labels.wingspan, heightM: labels.height, seatsMax: labels.seatsMax, rangeNm: labels.range, mtowT: labels.mtow };

  const head = `<tr><th scope="col">${esc(labels.metric)}</th>${variants
    .map((v) => `<th scope="col"><span class="cmp__maker">${esc(v.manufacturer)}</span>${esc(v.name)}</th>`)
    .join('')}</tr>`;

  const row = (label, cells) => `<tr><th scope="row">${esc(label)}</th>${cells.join('')}</tr>`;
  const rows = [
    row(labels.statusLabel, variants.map((v) => `<td>${v.status ? esc(labels.status[v.status]) : dash}</td>`)),
    ...METRICS.slice(0, 3).map(({ key }) =>
      row(labelOf[key], variants.map((v) => cell(v, key)))
    ),
    row(labels.seatsTypical, variants.map((v) => `<td>${v.seatsTypical ? esc(v.seatsTypical) : dash}</td>`)),
    ...METRICS.slice(3).map(({ key }) => row(labelOf[key], variants.map((v) => cell(v, key)))),
    row(labels.engines, variants.map((v) => `<td>${v.engines.map(esc).join('<br />')}</td>`)),
    row(labels.firstFlight, variants.map((v) => `<td>${fmtDate(v.milestones.firstFlight)}</td>`)),
    row(labels.firstDelivery, variants.map((v) => `<td>${v.milestones.firstDelivery ? `${fmtDate(v.milestones.firstDelivery)}${v.milestones.firstOperator ? `<br /><small>${esc(v.milestones.firstOperator)}</small>` : ''}` : dash}</td>`)),
  ];

  function cell(v, key) {
    const val = v[key];
    if (typeof val !== 'number') return `<td>${dash}</td>`;
    const top = lead[key]?.includes(v.id);
    return `<td${top ? ' class="is-top"' : ''}>${fmt[key](val, v)}${top ? `<span class="visually-hidden"> (${esc(labels.highest)})</span>` : ''}</td>`;
  }

  return `<table class="cmp__table"><thead>${head}</thead><tbody>${rows.join('')}</tbody></table>`;
}
