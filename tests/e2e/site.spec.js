import { test, expect } from '@playwright/test';

const PAGES = [
  'es/', 'es/panel/', 'es/acerca-de/', 'es/guia-de-estilo/', 'es/aviso-legal/',
  'es/diccionario/', 'es/diccionario/acronimos/', 'es/diccionario/qnh/',
  'en/', 'en/dashboard/', 'en/about/', 'en/styleguide/', 'en/legal/',
  'en/dictionary/', 'en/dictionary/acronyms/', 'en/dictionary/go-around/',
];

test.describe('language', () => {
  test('root sends a Spanish browser to /es/', async ({ browser }) => {
    const ctx = await browser.newContext({ locale: 'es-ES' });
    const page = await ctx.newPage();
    await page.goto('./');
    await expect(page).toHaveURL(/\/aerolex\/es\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await ctx.close();
  });

  test('root sends an English browser to /en/', async ({ browser }) => {
    const ctx = await browser.newContext({ locale: 'en-US' });
    const page = await ctx.newPage();
    await page.goto('./');
    await expect(page).toHaveURL(/\/aerolex\/en\/$/);
    await ctx.close();
  });

  test('switcher opens the equivalent page and the choice is remembered', async ({ browser }) => {
    const ctx = await browser.newContext({ locale: 'es-ES' });
    const page = await ctx.newPage();
    await page.goto('es/panel/');
    await page.locator('.site-header [data-set-lang="en"]').click();
    await expect(page).toHaveURL(/\/aerolex\/en\/dashboard\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your dashboard');
    // A Spanish browser returning to the root now goes to English
    await page.goto('./');
    await expect(page).toHaveURL(/\/aerolex\/en\/$/);
    await ctx.close();
  });
});

test.describe('theme', () => {
  test('toggle switches theme and persists after reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('en/');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await page.locator('.site-header [data-theme-toggle]').click();
    await expect(html).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'light');
    // Choosing "System" in the dashboard follows the OS again
    await page.goto('en/dashboard/');
    await page.locator('label', { hasText: 'System' }).click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('dashboard', () => {
  test('export, import (valid and invalid) and reset', async ({ page }) => {
    await page.goto('en/dashboard/');
    await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('aerolex:v1') || 'null');
      const state = raw ?? { schemaVersion: 1 };
      state.xp = { total: 250, log: [] };
      localStorage.setItem('aerolex:v1', JSON.stringify(state));
    });
    await page.reload();
    await expect(page.locator('#stat-xp')).toHaveText('250');

    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('[data-export]').click()]);
    expect(download.suggestedFilename()).toMatch(/^aerolex-progress-\d{4}-\d{2}-\d{2}\.json$/);
    const backup = await (await download.createReadStream()).toArray();
    const backupText = Buffer.concat(backup).toString('utf8');
    expect(JSON.parse(backupText).data.xp.total).toBe(250);

    // Reset through the confirmation dialog
    await page.locator('[data-open-modal="reset-modal"]').click();
    await expect(page.locator('#reset-modal')).toBeVisible();
    await page.locator('#reset-modal button[value="confirm"]').click();
    await expect(page.locator('#stat-xp')).toHaveText('0');

    // Invalid file is rejected
    await page.locator('[data-import-file]').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
    await expect(page.locator('[data-status]')).toHaveAttribute('data-tone', 'error');
    await expect(page.locator('#stat-xp')).toHaveText('0');

    // Valid backup restores progress
    await page.locator('[data-import-file]').setInputFiles({ name: 'ok.json', mimeType: 'application/json', buffer: Buffer.from(backupText) });
    await expect(page.locator('#stat-xp')).toHaveText('250');
  });
});

test.describe('components', () => {
  test('tabs work with the keyboard', async ({ page }) => {
    await page.goto('en/styleguide/');
    const airbus = page.getByRole('tab', { name: 'Airbus' });
    await airbus.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Boeing' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toContainText('EICAS');
  });

  test('dialog opens and closes with Escape', async ({ page }) => {
    await page.goto('es/guia-de-estilo/');
    await page.locator('[data-open-modal="sg-modal"]').click();
    await expect(page.locator('#sg-modal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#sg-modal')).toBeHidden();
  });
});

test('every page loads without JavaScript errors', async ({ page }) => {
  const problems = [];
  page.on('pageerror', (e) => problems.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  for (const p of PAGES) {
    const res = await page.goto(p);
    expect(res?.status(), p).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
  }
  expect(problems).toEqual([]);
});

test('unknown pages show the bilingual 404', async ({ page }) => {
  const res = await page.goto('en/this-does-not-exist/');
  expect(res?.status()).toBe(404);
  await expect(page.getByText('Page not found')).toBeVisible();
  await expect(page.getByText('Página no encontrada')).toBeVisible();
});

test('@mobile bottom navigation replaces the header menu', async ({ page }) => {
  await page.goto('es/');
  await expect(page.locator('.mobile-nav')).toBeVisible();
  await expect(page.locator('.site-nav')).toBeHidden();
  await page.locator('.mobile-nav a', { hasText: 'Panel' }).click();
  await expect(page).toHaveURL(/\/es\/panel\/$/);
  await expect(page.locator('.mobile-nav a[aria-current="page"]')).toHaveText('Panel');
});
