/**
 * Runway geometry for the educational airport diagrams (Phase 5).
 * Data: OurAirports runway ends (public domain). Pure functions, shared by the page,
 * the build script and the tests.
 */

const R = 6371008.8; // mean Earth radius, m
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

/** Great-circle distance in metres. */
export function distanceM(lat1, lon1, lat2, lon2) {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial true bearing from point 1 to point 2, 0–360°. */
export function bearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin(rad(lon2 - lon1)) * Math.cos(rad(lat2));
  const x = Math.cos(rad(lat1)) * Math.sin(rad(lat2)) - Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(rad(lon2 - lon1));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Parses a runway designator such as "09L", "27", "36C".
 * @returns {{ number: number, side: 'L' | 'C' | 'R' | null } | null} null if it is not a numbered runway
 */
export function parseRunwayIdent(ident) {
  const m = /^(0?[1-9]|[12]\d|3[0-6])([LCR])?$/.exec(String(ident ?? '').trim().toUpperCase());
  return m ? { number: Number(m[1]), side: /** @type {any} */ (m[2] ?? null) } : null;
}

/** Whether two designators are the two ends of one runway (numbers 18 apart, L↔R, C↔C). */
export function areReciprocal(a, b) {
  const x = parseRunwayIdent(a);
  const y = parseRunwayIdent(b);
  if (!x || !y) return false;
  const diff = Math.abs(x.number - y.number);
  const sides = { L: 'R', R: 'L', C: 'C' };
  return diff === 18 && (x.side === null ? y.side === null : sides[x.side] === y.side);
}

/** Magnetic heading suggested by the designator: number × 10° (36 → 360°). */
export function designatorHeading(ident) {
  const p = parseRunwayIdent(ident);
  return p ? p.number * 10 : null;
}

/** Normalised surface category from the free-text OurAirports surface field. */
export function surfaceCategory(raw) {
  const s = String(raw ?? '').trim().toUpperCase();
  if (!s) return 'unknown';
  if (/^(ASP|ASPH|ASPHALT|BIT|BITUMEN|BITUMINOUS|TAR|MAC)/.test(s)) return 'asphalt';
  if (/^(CON|CONC|CONCRETE)/.test(s)) return 'concrete';
  if (/^(GRS|GRASS|TURF)/.test(s)) return 'grass';
  if (/^(GVL|GRV|GRVL|GRAVEL)/.test(s)) return 'gravel';
  if (/^(WATER|WAT)/.test(s)) return 'water';
  return 'other';
}

/** A "round" scale-bar length (1, 2 or 5 × 10ⁿ m) not longer than `maxM`. */
export function niceScale(maxM) {
  if (!(maxM > 0)) return 0;
  const p = 10 ** Math.floor(Math.log10(maxM));
  return [5, 2, 1].map((k) => k * p).find((v) => v <= maxM) ?? p;
}

/**
 * Turns runway rows into a fitted drawing.
 * @param {[string, string, number, number, number, number, number|null, number|null, string][]} rows
 * @param {{ size?: number, pad?: number }} [opts] square drawing of `size` units with `pad` margin
 * @returns {{ size: number, metresPerUnit: number, runways: { le: string, he: string, x1: number, y1: number, x2: number, y2: number,
 *   lengthM: number, widthM: number | null, lengthFt: number | null, widthFt: number | null, surface: string, bearing: number }[],
 *   scale: { metres: number, units: number } } | null}
 */
export function layoutRunways(rows, { size = 400, pad = 48 } = {}) {
  if (!rows?.length) return null;
  const lat0 = rows.reduce((n, r) => n + r[2] + r[4], 0) / (rows.length * 2);
  const lon0 = rows.reduce((n, r) => n + r[3] + r[5], 0) / (rows.length * 2);
  const k = Math.cos(rad(lat0));
  // Local plane in metres: x east, y north
  const xy = (lat, lon) => [rad(lon - lon0) * k * R, rad(lat - lat0) * R];
  const pts = rows.map((r) => [xy(r[2], r[3]), xy(r[4], r[5])]);
  const xs = pts.flat().map((p) => p[0]);
  const ys = pts.flat().map((p) => p[1]);
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 500);
  const mpu = span / (size - 2 * pad);
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  // SVG: y grows downwards, so north is up
  const toSvg = ([x, y]) => [size / 2 + (x - cx) / mpu, size / 2 - (y - cy) / mpu];
  const runways = rows.map((r, i) => {
    const [[x1, y1], [x2, y2]] = pts[i].map(toSvg);
    return {
      le: r[0], he: r[1],
      x1, y1, x2, y2,
      lengthM: distanceM(r[2], r[3], r[4], r[5]),
      lengthFt: r[6], widthFt: r[7],
      widthM: r[7] === null ? null : r[7] * 0.3048,
      surface: r[8],
      bearing: bearing(r[2], r[3], r[4], r[5]),
    };
  });
  const metres = niceScale(span / 3);
  return { size, metresPerUnit: mpu, runways, scale: { metres, units: metres / mpu } };
}

/**
 * Positions for the runway designators, just beyond each runway end along its axis.
 * A label that would overlap one already placed is pushed further out (up to `tries` steps),
 * and every label is kept inside the drawing.
 * @param {{ le: string, he: string, x1: number, y1: number, x2: number, y2: number }[]} runways
 * @param {{ size: number, offset?: number, step?: number, gapX?: number, gapY?: number, tries?: number }} opts
 * @returns {{ id: string, x: number, y: number }[]}
 */
export function placeLabels(runways, { size, offset = 16, step = 14, gapX = 30, gapY = 15, tries = 5 }) {
  const placed = [];
  const clamp = (v) => Math.min(size - 16, Math.max(16, v));
  const clash = (x, y) => placed.some((p) => Math.abs(p.x - x) < gapX && Math.abs(p.y - y) < gapY);
  for (const r of runways) {
    const len = Math.hypot(r.x2 - r.x1, r.y2 - r.y1) || 1;
    const ux = (r.x2 - r.x1) / len;
    const uy = (r.y2 - r.y1) / len;
    for (const [id, x0, y0, s] of [[r.le, r.x1, r.y1, -1], [r.he, r.x2, r.y2, 1]]) {
      let x = clamp(x0 + s * ux * offset);
      let y = clamp(y0 + s * uy * offset);
      for (let i = 1; i <= tries && clash(x, y); i++) {
        x = clamp(x0 + s * ux * (offset + i * step));
        y = clamp(y0 + s * uy * (offset + i * step));
      }
      placed.push({ id, x, y });
    }
  }
  return placed;
}
