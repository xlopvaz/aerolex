/**
 * Language configuration.
 * Every page exists in every locale listed here.
 */
export const LOCALES = /** @type {const} */ (['es', 'en']);
export const FALLBACK_LOCALE = 'en';

export const LOCALE_META = {
  es: { label: 'Español', short: 'ES', htmlLang: 'es', ogLocale: 'es_ES' },
  en: { label: 'English', short: 'EN', htmlLang: 'en', ogLocale: 'en_GB' },
};

/** @param {string} value */
export function isLocale(value) {
  return LOCALES.includes(/** @type {any} */ (value));
}
