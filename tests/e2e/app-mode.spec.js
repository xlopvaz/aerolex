import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Home-screen app: icon and manifest, and the back/forward buttons that only appear when the site
 * is opened from the home screen (standalone display mode). Playwright cannot launch a real
 * standalone window, so `matchMedia('(display-mode: standalone)')` is made to match.
 */
const standalone = () => {
  const original = window.matchMedia.bind(window);
  window.matchMedia = (q) =>
    q.includes('display-mode: standalone')
      ? { matches: true, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }
      : original(q);
};

test.describe('home-screen app', () => {
  test('publishes the icon and a standalone manifest', async ({ page, request }) => {
    await page.goto('es/');
    const icon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
    expect(icon).toBe('/aerolex/icons/apple-touch-icon.png');
    expect((await request.get(icon)).status()).toBe(200);

    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    const manifest = await (await request.get(manifestHref)).json();
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/aerolex/');
    for (const { src } of manifest.icons) expect((await request.get(src)).status(), src).toBe(200);
  });

  test('back/forward buttons are hidden in a normal browser tab', async ({ page }) => {
    await page.goto('es/');
    await expect(page.locator('[data-history-nav]')).toBeHidden();
  });

  test('back/forward buttons navigate in app mode @mobile', async ({ page }) => {
    await page.addInitScript(standalone);
    await page.goto('es/');
    const back = page.getByRole('button', { name: 'Atrás' });
    const forward = page.getByRole('button', { name: 'Adelante' });
    await expect(back).toBeVisible();
    await expect(back).toBeDisabled();

    await page.goto('es/academia/');
    await expect(back).toBeEnabled();
    await back.click();
    await expect(page).toHaveURL(/\/aerolex\/es\/$/);
    await expect(forward).toBeEnabled();
    await forward.click();
    await expect(page).toHaveURL(/\/aerolex\/es\/academia\/$/);
  });

  test('app-mode header has no detectable WCAG A/AA problems @mobile', async ({ page }) => {
    await page.addInitScript(standalone);
    await page.goto('en/academy/');
    await page.goto('en/dictionary/');
    await expect(page.getByRole('button', { name: 'Back' })).toBeEnabled();
    const { violations } = await new AxeBuilder({ page }).include('.site-header').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
