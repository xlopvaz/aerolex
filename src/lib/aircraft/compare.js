/**
 * Aircraft comparison helpers (pure functions, used by the comparator and tests).
 */

/** Numeric metrics that can be compared, in display order. */
export const METRICS = [
  { key: 'lengthM', unit: 'm' },
  { key: 'wingspanM', unit: 'm' },
  { key: 'heightM', unit: 'm' },
  { key: 'seatsMax', unit: '' },
  { key: 'rangeNm', unit: 'NM' },
  { key: 'mtowT', unit: 't' },
];

/** Flatten families into a list of variants carrying family metadata. */
export function flattenVariants(families) {
  return families.flatMap((f) =>
    f.variants.map((v) => ({ ...v, familyId: f.id, manufacturer: f.manufacturer, family: f.family }))
  );
}

/**
 * For each metric, the ID(s) of the variant(s) with the highest known value.
 * Null values are ignored; a metric with fewer than two known values has no leader.
 */
export function leaders(variants) {
  const out = {};
  for (const { key } of METRICS) {
    const known = variants.filter((v) => typeof v[key] === 'number');
    if (known.length < 2) { out[key] = []; continue; }
    const max = Math.max(...known.map((v) => v[key]));
    out[key] = known.filter((v) => v[key] === max).map((v) => v.id);
  }
  return out;
}

/** Difference between two values, or null if either is unknown. */
export function diff(a, b) {
  return typeof a === 'number' && typeof b === 'number' ? Math.round((a - b) * 100) / 100 : null;
}
