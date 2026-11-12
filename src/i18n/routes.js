/**
 * Route registry: one stable key per page, with a localized slug per language.
 * The language switcher, hreflang tags and every internal link are built from here,
 * so a page is never linked under a URL that does not exist.
 *
 * `nav`: where the page appears ('main' header/mobile nav, 'footer', or none).
 * Only pages that exist and have real content are registered.
 */
export const ROUTES = {
  home:       { slug: { es: '',               en: '' },             nav: ['main'], icon: 'plane-takeoff' },
  dashboard:  { slug: { es: 'panel',          en: 'dashboard' },    nav: ['main'], icon: 'layout-dashboard' },
  about:      { slug: { es: 'acerca-de',      en: 'about' },        nav: ['main', 'footer'], icon: 'book-open' },
  styleguide: { slug: { es: 'guia-de-estilo', en: 'styleguide' },   nav: ['footer'], icon: 'palette' },
  legal:      { slug: { es: 'aviso-legal',    en: 'legal' },        nav: ['footer'], icon: 'shield-check' },
};

/** @typedef {keyof typeof ROUTES} RouteKey */

/** @returns {RouteKey[]} */
export function routeKeys() {
  return /** @type {RouteKey[]} */ (Object.keys(ROUTES));
}

/**
 * @param {'main'|'footer'} area
 * @returns {RouteKey[]}
 */
export function navRoutes(area) {
  return routeKeys().filter((k) => ROUTES[k].nav.includes(area));
}
