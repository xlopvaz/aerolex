import { LOCALES, FALLBACK_LOCALE } from './config.js';
import { BASE } from './index.js';

/** Language of the page being rendered, from its URL (/aerolex/es/... -> 'es'). */
export function langFromUrl(url) {
  const path = new URL(url).pathname;
  const rest = path.startsWith(BASE) ? path.slice(BASE.length) : path.replace(/^\//, '');
  const seg = rest.split('/')[0];
  return LOCALES.includes(seg) ? seg : FALLBACK_LOCALE;
}
