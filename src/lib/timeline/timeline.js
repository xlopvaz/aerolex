/**
 * Aviation timeline (Phase 4). Pure helpers: date precision, ordering, filtering and grouping.
 * Dates come from src/content/timeline/events.json with the precision the sources give
 * (YYYY, YYYY-MM or YYYY-MM-DD); they are never padded to a fake day.
 */
export const THEMES = ['flight', 'airline', 'regulation'];

const DATE_RE = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;

/**
 * @param {string} date
 * @returns {{ year: number, month: number|null, day: number|null, precision: 'year'|'month'|'day' } | null}
 */
export function parseEventDate(date) {
  const m = DATE_RE.exec(String(date ?? ''));
  if (!m) return null;
  const year = Number(m[1]);
  const month = m[2] ? Number(m[2]) : null;
  const day = m[3] ? Number(m[3]) : null;
  if (month !== null && (month < 1 || month > 12)) return null;
  if (day !== null) {
    const d = new Date(Date.UTC(year, month - 1, day));
    if (d.getUTCMonth() !== month - 1) return null;
  }
  return { year, month, day, precision: day !== null ? 'day' : month !== null ? 'month' : 'year' };
}

/** Localised date at the precision the sources give ("17 de diciembre de 1903", "enero de 1923", "2002"). */
export function formatEventDate(date, lang) {
  const p = parseEventDate(date);
  if (!p) return String(date);
  if (p.precision === 'year') return String(p.year);
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day ?? 1));
  const opts = p.precision === 'day'
    ? { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }
    : { month: 'long', year: 'numeric', timeZone: 'UTC' };
  return new Intl.DateTimeFormat(lang, opts).format(d);
}

/** Chronological order; for the same day/month/year, the less precise date goes first, then by id. */
export function sortEvents(events) {
  return [...events].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : String(a.id).localeCompare(String(b.id))));
}

/** @param {'all'|string} theme */
export function filterEvents(events, theme) {
  return !theme || theme === 'all' ? events : events.filter((e) => e.theme === theme);
}

/** Century number (1903 → 20, 2002 → 21, 1783 → 18). */
export function centuryOf(year) {
  return Math.floor((year - 1) / 100) + 1;
}

/** Sorted events grouped by century: [{ century, events }]. */
export function groupByCentury(events) {
  const groups = [];
  for (const e of sortEvents(events)) {
    const c = centuryOf(parseEventDate(e.date).year);
    const last = groups[groups.length - 1];
    if (last && last.century === c) last.events.push(e);
    else groups.push({ century: c, events: [e] });
  }
  return groups;
}

/** Whole years between the event and `now` (by year only, so it never depends on the missing day). */
export function yearsSince(date, now = new Date()) {
  const p = parseEventDate(date);
  return p ? now.getUTCFullYear() - p.year : null;
}
