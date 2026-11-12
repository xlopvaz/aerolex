import { test, expect } from '@playwright/test';

test.describe('dictionary', () => {
  test('searches in Spanish without accents and opens the entry', async ({ page }) => {
    await page.goto('es/diccionario/');
    await page.locator('[data-dict-q]').fill('sustentacion');
    const results = page.locator('[data-dict-results] .dict__item');
    // "sustentación" first; "pérdida (de sustentación)" also matches
    await expect(results).toHaveCount(2);
    await expect(results.first()).toContainText('sustentación');
    await expect(page.locator('[data-dict-status]')).toHaveText('2 resultados');
    await results.first().locator('a').click();
    await expect(page).toHaveURL(/\/es\/diccionario\/lift\/$/);
    await expect(page.locator('h1')).toHaveText('sustentación');
  });

  test('shows a clear message when nothing matches', async ({ page }) => {
    await page.goto('en/dictionary/');
    await page.locator('[data-dict-q]').fill('zzzz');
    await expect(page.locator('.dict__empty')).toContainText('No entries match');
  });

  test('filters by category and keeps it in the URL', async ({ page }) => {
    await page.goto('en/dictionary/');
    const visible = page.locator('[data-dict-az] .dict__item:visible');
    const all = await visible.count();
    await page.locator('[data-cat="meteorology"]').click();
    await expect(page).toHaveURL(/cat=meteorology/);
    const filtered = await visible.count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(all);
    await page.reload();
    await expect(page.locator('[data-cat="meteorology"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('home autocomplete navigates with the keyboard', async ({ page }) => {
    await page.goto('en/');
    const input = page.locator('#home-search');
    await input.fill('qnh');
    await expect(page.locator('#home-search-list [role="option"]').first()).toContainText('QNH');
    await input.press('ArrowDown');
    await input.press('Enter');
    await expect(page).toHaveURL(/\/en\/dictionary\/qnh\/$/);
  });

  test('favourites survive a language switch', async ({ page }) => {
    await page.goto('es/diccionario/qnh/');
    const star = page.locator('[data-fav="qnh"]');
    await star.click();
    await expect(star).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.site-header [data-set-lang="en"]').click();
    await expect(page).toHaveURL(/\/en\/dictionary\/qnh\/$/);
    await expect(page.locator('[data-fav="qnh"]')).toHaveAttribute('aria-pressed', 'true');
    await page.goto('en/dictionary/');
    await expect(page.locator('[data-dict-favorites] a')).toHaveText(['QNH']);
  });

  test('entry pages show both languages and their sources', async ({ page }) => {
    await page.goto('en/dictionary/go-around/');
    await expect(page.locator('h1')).toHaveText('go-around');
    await expect(page.locator('.entry__other')).toHaveText('motor y al aire');
    await expect(page.locator('.bi__col[lang="es"]').first()).toBeVisible();
    await expect(page.locator('.entry__sources li').first()).toBeVisible();
    // related links resolve
    await page.locator('.entry__side a', { hasText: 'ILS' }).click();
    await expect(page).toHaveURL(/\/en\/dictionary\/ils\/$/);
  });

  test('acronym list filters as you type', async ({ page }) => {
    await page.goto('en/dictionary/acronyms/');
    await page.locator('[data-acr-q]').fill('tcas');
    await expect(page.locator('[data-acr-row]:visible')).toHaveCount(1);
    await expect(page.locator('[data-acr-row]:visible a')).toHaveText('TCAS');
  });
});
