/**
 * Route registry: one stable key per page, with a localized slug per language.
 * The language switcher, hreflang tags and every internal link are built from here,
 * so a page is never linked under a URL that does not exist.
 *
 * `nav`: where the page appears ('main' header, 'mobile' bottom bar, 'footer', or none).
 * Only pages that exist and have real content are registered.
 * Child pages (e.g. one page per dictionary entry) are built with childHref().
 */
export const ROUTES = {
  home:       { slug: { es: '',               en: '' },             nav: ['main', 'mobile'], icon: 'plane-takeoff' },
  academy:    { slug: { es: 'academia',       en: 'academy' },      nav: ['main', 'mobile'], icon: 'graduation-cap' },
  dictionary: { slug: { es: 'diccionario',    en: 'dictionary' },   nav: ['main', 'mobile'], icon: 'book-a' },
  hangar:     { slug: { es: 'hangar',         en: 'hangar' },       nav: ['main', 'mobile'], icon: 'plane' },
  tools:      { slug: { es: 'herramientas',   en: 'tools' },        nav: ['main', 'mobile'], icon: 'flask-conical' },
  metarDecoder: { slug: { es: 'herramientas/decodificador-metar', en: 'tools/metar-decoder' }, nav: [], icon: 'cloud-sun' },
  tafDecoder: { slug: { es: 'herramientas/decodificador-taf', en: 'tools/taf-decoder' }, nav: [], icon: 'calendar-clock' },
  liveWeather: { slug: { es: 'herramientas/metar-taf-en-directo', en: 'tools/live-metar-taf' }, nav: [], icon: 'radio-tower' },
  airportFinder: { slug: { es: 'herramientas/aeropuertos', en: 'tools/airports' }, nav: [], icon: 'map-pin' },
  atcTrainer: { slug: { es: 'herramientas/fraseologia-atc', en: 'tools/atc-phraseology' }, nav: [], icon: 'headset' },
  aircraftGame: { slug: { es: 'herramientas/que-avion-es', en: 'tools/which-aircraft' }, nav: [], icon: 'plane' },
  flashcards: { slug: { es: 'herramientas/flashcards', en: 'tools/flashcards' }, nav: [], icon: 'layers' },
  converter:  { slug: { es: 'herramientas/conversor', en: 'tools/converter' }, nav: [], icon: 'arrow-left-right' },
  practice:   { slug: { es: 'herramientas/practica-metar-taf', en: 'tools/metar-taf-practice' }, nav: [], icon: 'target' },
  compare:    { slug: { es: 'hangar/comparador', en: 'hangar/compare' }, nav: [], icon: 'columns-3' },
  acronyms:   { slug: { es: 'diccionario/acronimos', en: 'dictionary/acronyms' }, nav: [], icon: 'case-upper' },
  dashboard:  { slug: { es: 'panel',          en: 'dashboard' },    nav: ['main', 'mobile'], icon: 'layout-dashboard' },
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
 * @param {'main'|'mobile'|'footer'} area
 * @returns {RouteKey[]}
 */
export function navRoutes(area) {
  return routeKeys().filter((k) => ROUTES[k].nav.includes(area));
}
