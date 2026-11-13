/**
 * Present / recent / forecast weather groups (WMO FM 15 / FM 51, code table 4678).
 * Shared by the METAR and TAF decoders. Returns structured data only: the words shown to the
 * user come from src/i18n (metar.wx.*), never from here.
 */
export const INTENSITY = ['-', '+', 'VC'];
export const DESCRIPTORS = ['MI', 'BC', 'PR', 'DR', 'BL', 'SH', 'TS', 'FZ'];
export const PRECIPITATION = ['DZ', 'RA', 'SN', 'SG', 'PL', 'GR', 'GS', 'UP', 'IC'];
export const OBSCURATION = ['BR', 'FG', 'FU', 'VA', 'DU', 'SA', 'HZ', 'PY'];
export const OTHER = ['PO', 'SQ', 'FC', 'SS', 'DS'];
export const PHENOMENA = [...PRECIPITATION, ...OBSCURATION, ...OTHER];

const RE = new RegExp(
  `^(-|\\+|VC)?(${DESCRIPTORS.join('|')})?((?:${PHENOMENA.join('|')})*)$`
);

/**
 * @param {string} token e.g. "-SHRA", "VCTS", "FZFG", "+TSRAGR"
 * @returns {{ intensity: 'light'|'moderate'|'heavy'|null, vicinity: boolean, descriptor: string|null, phenomena: string[] } | null}
 */
export function parseWeather(token) {
  const m = RE.exec(token);
  if (!m) return null;
  const [, sign, descriptor = null, rest] = m;
  const phenomena = rest.match(/../g) ?? [];
  if (!descriptor && phenomena.length === 0) return null;
  // Repeated phenomena ("RARA") are not valid.
  if (new Set(phenomena).size !== phenomena.length) return null;
  const hasPrecip = phenomena.some((p) => PRECIPITATION.includes(p)) || descriptor === 'TS' || descriptor === 'SH';
  let intensity = null;
  if (sign === '-') intensity = 'light';
  else if (sign === '+') intensity = 'heavy';
  else if (sign !== 'VC' && hasPrecip && phenomena.some((p) => PRECIPITATION.includes(p))) intensity = 'moderate';
  return { intensity, vicinity: sign === 'VC', descriptor, phenomena };
}
