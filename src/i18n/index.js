import { LOCALES, FALLBACK_LOCALE } from './config.js';
import { ROUTES } from './routes.js';
import es from './ui/es.json';
import en from './ui/en.json';

const DICTS = { es, en };

/** Base path of the site ('/aerolex/'), always with a trailing slash. */
export const BASE = withTrailingSlash(import.meta.env?.BASE_URL ?? '/');

/** @param {string} s */
function withTrailingSlash(s) {
  return s.endsWith('/') ? s : `${s}/`;
}

/**
 * Prefix an internal path with the site base. Use for EVERY internal link and asset.
 * withBase('es/panel/') -> '/aerolex/es/panel/'
 * @param {string} path
 * @param {string} [base]
 */
export function withBase(path = '', base = BASE) {
  const b = withTrailingSlash(base);
  return b + String(path).replace(/^\/+/, '');
}

/**
 * Path (without base) of a registered page in a given language.
 * @param {import('./routes.js').RouteKey} key
 * @param {string} lang
 */
export function routePath(key, lang) {
  const route = ROUTES[key];
  if (!route) throw new Error(`Unknown route key: ${key}`);
  const slug = route.slug[lang];
  if (slug === undefined) throw new Error(`Route "${key}" has no slug for "${lang}"`);
  return slug ? `${lang}/${slug}/` : `${lang}/`;
}

/**
 * Full href (with base) of a registered page.
 * @param {import('./routes.js').RouteKey} key
 * @param {string} lang
 * @param {string} [base]
 */
export function href(key, lang, base = BASE) {
  return withBase(routePath(key, lang), base);
}

/**
 * Equivalent URL of a page in every language: used by the language switcher and hreflang.
 * @param {import('./routes.js').RouteKey} key
 * @param {string} [base]
 */
export function alternates(key, base = BASE) {
  return Object.fromEntries(LOCALES.map((l) => [l, href(key, l, base)]));
}

/**
 * Translate a UI key ("home.hero.title"). Falls back to the other language, then to the key
 * itself, so a missing string is visible instead of silently empty. Tests enforce parity.
 * @param {string} lang
 * @param {string} key
 * @param {Record<string, string|number>} [vars]
 */
export function t(lang, key, vars) {
  const value = lookup(DICTS[lang], key) ?? lookup(DICTS[FALLBACK_LOCALE], key) ?? key;
  if (typeof value !== 'string') return value;
  return vars ? value.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : value;
}

/** Translator bound to a language: const tr = useT('es'); tr('nav.home') */
export function useT(lang) {
  return (key, vars) => t(lang, key, vars);
}

/**
 * Pick the right language from a bilingual content field { es, en }.
 * @param {Record<string, any>} field
 * @param {string} lang
 */
export function pick(field, lang) {
  if (!field || typeof field !== 'object') return field;
  return field[lang] ?? field[FALLBACK_LOCALE];
}

/** @param {any} obj @param {string} key */
function lookup(obj, key) {
  return key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
}

export { DICTS };
