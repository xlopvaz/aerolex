import { test, expect } from '@playwright/test';

const PAGES = [
  'es/', 'es/panel/', 'es/acerca-de/', 'es/guia-de-estilo/', 'es/aviso-legal/',
  'es/diccionario/', 'es/diccionario/acronimos/', 'es/diccionario/qnh/',
  'es/academia/', 'es/academia/metar-speci/', 'es/academia/metar-speci/full-decode/', 'es/academia/taf/', 'es/academia/taf/change-groups/',
  'es/hangar/', 'es/hangar/comparador/', 'es/hangar/boeing-737/', 'es/fuentes/', 'es/panel/repaso/', 'es/herramientas/diagramas-de-aeropuerto/', 'es/herramientas/cabina-de-vuelo/', 'es/academia/apuntes/', 'es/academia/apuntes/taf/',
  'en/', 'en/dashboard/', 'en/about/', 'en/styleguide/', 'en/legal/',
  'en/dictionary/', 'en/dictionary/acronyms/', 'en/dictionary/go-around/',
  'en/academy/', 'en/academy/metar-speci/', 'en/academy/metar-speci/present-weather/', 'en/academy/taf/full-decode/',
  'en/hangar/', 'en/hangar/compare/', 'en/hangar/a320neo-family/', 'en/sources/', 'en/dashboard/review/', 'en/tools/airport-diagrams/', 'en/tools/flight-deck/', 'en/academy/notes/', 'en/academy/notes/aerodynamics/',
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

test.describe('gamification', () => {
  test('completing a lesson earns XP and a badge, shown in the toast and the dashboard', async ({ page }) => {
    await page.goto('en/academy/aviation-fundamentals/what-is-an-aircraft/');
    await page.locator('[data-complete]').click();
    const toast = page.locator('[data-toast-box]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('+50 XP');
    await expect(toast).toContainText('First Flight');
    // Undoing and redoing does not earn the XP again
    await page.locator('[data-complete]').click();
    await page.locator('[data-complete]').click();

    await page.goto('en/dashboard/');
    await expect(page.locator('[data-toast-box]')).toBeHidden(); // nothing earned on this page yet
    await expect(page.locator('#stat-xp')).toHaveText('50');
    await expect(page.locator('#stat-today')).toHaveText('50');
    await expect(page.locator('#stat-streak')).toHaveText('1');
    await expect(page.locator('[data-badge="first-flight"]')).toHaveClass(/is-earned/);
    await expect(page.locator('[data-badge-count]')).toHaveText('1/9');
    await expect(page.locator('[data-goal-text]')).toContainText('50 of 50 XP today');
    await expect(page.locator('[data-activity] li')).toHaveCount(1);
    await expect(page.locator('[data-week] li')).toHaveCount(7);

    // Raising the daily goal is saved
    await page.locator('input[name="dailyGoal"][value="100"]').check({ force: true });
    await expect(page.locator('[data-goal-text]')).toContainText('50 of 100 XP today');
    await page.reload();
    await expect(page.locator('input[name="dailyGoal"][value="100"]')).toBeChecked();
  });
});

test.describe('review', () => {
  test('wrong answers can be answered again and leave the list; history lists completed lessons', async ({ page }) => {
    await page.goto('en/dashboard/review/');
    await expect(page.locator('[data-review-empty]')).toBeVisible();
    await expect(page.locator('[data-history-empty]')).toBeVisible();

    // Get one question wrong in a lesson, and complete the lesson
    await page.goto('en/academy/aviation-fundamentals/what-is-an-aircraft/');
    const q = page.locator('.quiz__q').first();
    const answer = await q.getAttribute('data-answer');
    await q.locator(`.quiz__opt:not([data-opt="${answer}"])`).first().click();
    await page.locator('[data-complete]').click();

    await page.goto('en/dashboard/');
    await expect(page.locator('[data-review-pending]')).toHaveText('Wrong answers to review: 1.');
    await page.locator('.dash__review a').click();
    await expect(page).toHaveURL(/\/en\/dashboard\/review\/$/);
    await expect(page.locator('#rv-pending')).toHaveText('1');
    await expect(page.locator('.rq')).toHaveCount(1);
    await expect(page.locator('.hd__list li')).toHaveCount(1);
    await page.locator(`.rq .rq__opt[data-opt="${answer}"]`).click();
    await expect(page.locator('.rq__verdict')).toContainText('It leaves your review list.');
    await expect(page.locator('#rv-pending')).toHaveText('0');
    await expect(page.locator('[data-review-empty]')).toBeVisible();
    await page.reload();
    await expect(page.locator('.rq')).toHaveCount(0);
  });
});

test.describe('airport diagrams', () => {
  test('draws the runways of an airport found by code, and links from the finder', async ({ page }) => {
    await page.goto('en/tools/airport-diagrams/?q=MAD');
    await expect(page.locator('[data-title]')).toContainText('MAD · LEMD');
    await expect(page.locator('[data-rows] tr')).toHaveCount(4);
    await expect(page.locator('[data-svg] svg line.ad-rwy')).toHaveCount(4);
    await expect(page.locator('[data-svg] svg')).toHaveAttribute('aria-label', /4 runways/);
    await expect(page.locator('[data-svg] text.ad-lbl', { hasText: '36L' })).toHaveCount(1);
    await expect(page.locator('[data-learn-example]')).toContainText('runway');

    await page.locator('[data-q]').fill('heathrow');
    await page.locator('.ad__match', { hasText: 'LHR' }).click();
    await expect(page.locator('[data-rows] tr')).toHaveCount(2);
    await expect(page).toHaveURL(/\?q=LHR$/);

    await page.goto('en/tools/airports/?q=SCQ');
    await page.locator('details summary').first().click();
    await page.locator('details a', { hasText: 'Runway diagram' }).first().click();
    await expect(page.locator('[data-title]')).toContainText('SCQ');
  });
});

test.describe('flight deck', () => {
  test('explores both flight decks and plays "Where is…?"', async ({ page }) => {
    await page.goto('en/tools/flight-deck/');
    const airbus = page.locator('[data-deck="airbus"]');
    await airbus.locator('.ck-item[data-item="sidestick"] rect').first().click();
    await expect(airbus.locator('[data-card="sidestick"]')).toBeVisible();
    await expect(airbus.locator('[data-card="sidestick"]')).toContainText('fly-by-wire');
    await expect(airbus.locator('[data-pick="sidestick"]')).toHaveAttribute('aria-pressed', 'true');

    await page.locator('label:has(input[name="ck-type"][value="boeing"])').click();
    const boeing = page.locator('[data-deck="boeing"]');
    await expect(boeing).toBeVisible();
    await expect(airbus).toBeHidden();
    await boeing.locator('[data-pick="mcp"]').click();
    await expect(boeing.locator('[data-card="mcp"]')).toContainText('glareshield');

    await page.locator('label:has(input[name="ck-mode"][value="quiz"])').click();
    const prompt = await boeing.locator('[data-prompt]').textContent();
    const target = await boeing.locator('[data-pick]').evaluateAll((els, p) => els.find((e) => p?.includes(e.querySelector('.ck__name').textContent))?.getAttribute('data-pick'), prompt);
    expect(target).toBeTruthy();
    await expect(boeing.locator(`[data-pick="${target}"] .ck__name`)).toBeHidden(); // names are hidden while playing
    await boeing.locator(`[data-pick="${target}"]`).click();
    await expect(boeing.locator('[data-feedback]')).toHaveText('Correct!');
    await expect(boeing.locator('[data-score]')).toHaveText('1 of 1');
    await boeing.locator('[data-next]').click();
    await expect(boeing.locator('[data-feedback]')).toHaveText('');
  });
});

test.describe('academy notes', () => {
  test('lead from the academy to each course\'s notes and back to the lessons', async ({ page }) => {
    await page.goto('es/academia/');
    await page.locator('.academy__notes').click();
    await expect(page).toHaveURL(/\/es\/academia\/apuntes\/$/);
    await expect(page.locator('.nidx__card')).toHaveCount(8);
    await page.locator('.nidx__card', { hasText: 'Academia TAF' }).click();
    await expect(page).toHaveURL(/\/es\/academia\/apuntes\/taf\/$/);
    await expect(page.locator('.cn__lesson')).toHaveCount(6);
    await expect(page.locator('.cn__lesson').first().locator('.cn__key')).toContainText('pronóstico');
    await expect(page.locator('.quiz')).toHaveCount(0); // notes have no quizzes
    await page.locator('.cn__lesson').first().locator('.cn__full').click();
    await expect(page).toHaveURL(/\/es\/academia\/taf\/what-is-taf\/$/);

    // Same notes in English through the language switcher, and from the course page
    await page.goto('es/academia/apuntes/taf/');
    await page.locator('.site-header [data-set-lang="en"]').click();
    await expect(page).toHaveURL(/\/en\/academy\/notes\/taf\/$/);
    await expect(page.locator('h1')).toHaveText('Notes: TAF Academy');
    await page.goto('en/academy/taf/');
    await page.locator('.course__notes a').click();
    await expect(page).toHaveURL(/\/en\/academy\/notes\/taf\/$/);
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

test.describe('sources', () => {
  test('lists every source with what cites it, and filters as you type', async ({ page }) => {
    await page.goto('en/sources/');
    await expect(page.locator('h1')).toHaveText('Sources and bibliography');
    const all = await page.locator('[data-bib-item]').count();
    expect(all).toBeGreaterThan(100);
    await page.locator('[data-bib-q]').fill('icao annex 3');
    await expect(page.locator('[data-bib-item]:visible')).toHaveCount(1);
    const item = page.locator('#src-icao-annex-3');
    await item.locator('summary').click();
    await item.locator('.src__area a', { hasText: 'METAR' }).first().click();
    await expect(page).toHaveURL(/\/en\/dictionary\/metar\/$/);
    await page.goto('es/fuentes/');
    await page.locator('[data-bib-q]').fill('zzzz');
    await expect(page.locator('[data-bib-empty]')).toBeVisible();
  });
});

test('@mobile no page scrolls sideways on a 360 px screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  const paths = [
    'es/', 'en/academy/taf/full-decode/', 'es/academia/metar-speci/full-decode/', 'es/hangar/boeing-737/', 'en/hangar/compare/',
    'es/diccionario/acronimos/', 'es/herramientas/diagramas-de-aeropuerto/?q=AMS', 'en/tools/airports/?q=london', 'es/panel/',
    'es/panel/repaso/', 'es/fuentes/', 'en/styleguide/', 'en/tools/flight-deck/', 'en/this-does-not-exist/', 'es/herramientas/cronologia/',
  ];
  for (const path of paths) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const { scroll, width } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: document.documentElement.clientWidth }));
    expect(scroll, path).toBeLessThanOrEqual(width);
  }
});
