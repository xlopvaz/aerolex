import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Automated accessibility check (axe-core, WCAG 2.2 A/AA rules) on one page of each kind,
 * in both themes. Automated checks catch only part of the problems; keyboard and screen
 * reader reviews still matter.
 */
const PAGES = [
  'es/', 'en/dictionary/', 'es/diccionario/metar/', 'en/dictionary/acronyms/', 'es/academia/', 'en/academy/taf/',
  'es/academia/metar-speci/full-decode/', 'en/hangar/', 'es/hangar/boeing-737/', 'en/hangar/compare/', 'es/herramientas/',
  'en/tools/metar-decoder/', 'es/herramientas/diagramas-de-aeropuerto/?q=MAD', 'en/tools/flight-deck/', 'es/herramientas/cronologia/',
  'en/dashboard/', 'es/panel/repaso/', 'es/academia/apuntes/', 'en/academy/notes/metar-speci/', 'en/sources/', 'es/guia-de-estilo/',
];

for (const scheme of ['dark', 'light']) {
  test(`no automatically detectable WCAG A/AA problems (${scheme} theme)`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ colorScheme: scheme });
    for (const path of PAGES) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`), path).toEqual([]);
    }
  });
}
