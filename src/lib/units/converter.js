/**
 * Generic unit converter used by the Converter tool. Each linear unit is defined by its size in
 * the category's base SI unit; temperature is handled separately. Exact definitions:
 *   1 kt = 1852/3600 m/s · 1 mph = 0.44704 m/s · 1 NM = 1852 m · 1 SM = 1609.344 m · 1 ft = 0.3048 m
 *   1 lb = 0.45359237 kg · 1 inHg = 3386.38866667 Pa · 1 mmHg = 133.322387415 Pa
 *   1 US gal = 3.785411784 L · 1 imp gal = 4.54609 L
 * Educational use only.
 */
export const CATEGORIES = {
  speed: { base: 'mps', units: { kt: 1852 / 3600, kmh: 1 / 3.6, mph: 0.44704, mps: 1 } },
  distance: { base: 'm', units: { nm: 1852, km: 1000, sm: 1609.344, m: 1 } },
  altitude: { base: 'm', units: { ft: 0.3048, m: 1 } },
  mass: { base: 'kg', units: { kg: 1, lb: 0.45359237, t: 1000 } },
  pressure: { base: 'pa', units: { hpa: 100, inhg: 3386.38866667, mmhg: 133.322387415 } },
  volume: { base: 'l', units: { l: 1, usgal: 3.785411784, impgal: 4.54609 } },
  temperature: { base: 'c', units: { c: null, f: null, k: null } },
};

const toCelsius = { c: (v) => v, f: (v) => ((v - 32) * 5) / 9, k: (v) => v - 273.15 };
const fromCelsius = { c: (v) => v, f: (v) => (v * 9) / 5 + 32, k: (v) => v + 273.15 };

/**
 * @param {keyof typeof CATEGORIES} category
 * @param {string} from unit id
 * @param {string} to unit id
 * @param {number} value
 */
export function convert(category, from, to, value) {
  const cat = CATEGORIES[category];
  if (!cat || !(from in cat.units) || !(to in cat.units)) throw new Error(`Unknown conversion ${category}:${from}->${to}`);
  if (!Number.isFinite(value)) return NaN;
  if (category === 'temperature') return fromCelsius[to](toCelsius[from](value));
  return (value * cat.units[from]) / cat.units[to];
}

/** Values in every unit of the category. */
export function convertAll(category, from, value) {
  return Object.fromEntries(Object.keys(CATEGORIES[category].units).map((u) => [u, convert(category, from, u, value)]));
}

/** Sensible number of decimals for display. */
export function displayDecimals(v) {
  const a = Math.abs(v);
  if (a === 0) return 0;
  if (a >= 10000) return 0;
  if (a >= 100) return 1;
  if (a >= 1) return 2;
  return 4;
}
