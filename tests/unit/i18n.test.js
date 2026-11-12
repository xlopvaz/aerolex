import { describe, it, expect } from 'vitest';
import { LOCALES } from '../../src/i18n/config.js';
import { ROUTES, routeKeys } from '../../src/i18n/routes.js';
import { withBase, routePath, href, alternates, t, pick, DICTS } from '../../src/i18n/index.js';
import roadmap from '../../src/content/site/roadmap.json';

/** Flatten nested keys: { a: { b: 'x' } } -> ['a.b'] (arrays count as leaves). */
function keys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v) ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );
}

describe('UI translations', () => {
  it('every key exists in every language (full bilingual parity)', () => {
    const [first, ...rest] = LOCALES;
    const base = keys(DICTS[first]).sort();
    for (const l of rest) expect(keys(DICTS[l]).sort()).toEqual(base);
  });

  it('no translation is empty and arrays have the same length', () => {
    for (const k of keys(DICTS.en)) {
      const values = LOCALES.map((l) => k.split('.').reduce((o, p) => o[p], DICTS[l]));
      for (const v of values) {
        if (Array.isArray(v)) expect(v.length).toBeGreaterThan(0);
        else expect(String(v).trim()).not.toBe('');
      }
      if (Array.isArray(values[0])) expect(new Set(values.map((v) => v.length)).size).toBe(1);
    }
  });

  it('t() interpolates and falls back to the key when missing', () => {
    expect(t('en', 'nav.home')).toBe('Home');
    expect(t('es', 'nav.home')).toBe('Inicio');
    expect(t('es', 'does.not.exist')).toBe('does.not.exist');
  });

  it('pick() selects the language of a bilingual field', () => {
    expect(pick({ es: 'Hola', en: 'Hello' }, 'es')).toBe('Hola');
  });
});

describe('routes', () => {
  it('every route has a unique slug per language', () => {
    for (const l of LOCALES) {
      const slugs = routeKeys().map((k) => ROUTES[k].slug[l]);
      expect(slugs.every((s) => typeof s === 'string')).toBe(true);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it('every navigable route has a translated label', () => {
    for (const k of routeKeys()) for (const l of LOCALES) expect(t(l, `nav.${k}`)).not.toBe(`nav.${k}`);
  });

  it('builds paths with the GitHub Pages base', () => {
    expect(withBase('es/panel/', '/aerolex')).toBe('/aerolex/es/panel/');
    expect(withBase('/favicon.svg', '/aerolex/')).toBe('/aerolex/favicon.svg');
    expect(routePath('home', 'en')).toBe('en/');
    expect(href('dashboard', 'es', '/aerolex/')).toBe('/aerolex/es/panel/');
    expect(alternates('dashboard', '/aerolex/')).toEqual({ es: '/aerolex/es/panel/', en: '/aerolex/en/dashboard/' });
  });

  it('throws on unknown routes instead of producing a broken link', () => {
    expect(() => routePath('nope', 'es')).toThrow();
  });
});

describe('site content', () => {
  it('roadmap entries are bilingual and use known statuses', () => {
    for (const f of roadmap.flights) {
      for (const l of LOCALES) expect(f.destination[l]).toBeTruthy();
      expect(['live', 'boarding', 'scheduled']).toContain(f.status);
      for (const l of LOCALES) expect(t(l, `status.${f.status}`)).not.toBe(`status.${f.status}`);
    }
  });
});
