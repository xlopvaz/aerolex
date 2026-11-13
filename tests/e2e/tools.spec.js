import { test, expect } from '@playwright/test';

test.describe('tools', () => {
  test('the tools hub only lists tools that exist', async ({ page }) => {
    await page.goto('es/herramientas/');
    await expect(page.locator('h1')).toHaveText('Laboratorio de herramientas');
    await expect(page.locator('[data-tool]')).toHaveCount(4);
    await page.locator('[data-tool="metarDecoder"]').click();
    await expect(page).toHaveURL(/\/es\/herramientas\/decodificador-metar\/$/);
  });

  test('METAR decoder: example, typing, unknown groups and shareable link', async ({ page }) => {
    await page.goto('en/tools/metar-decoder/');
    const input = page.locator('[data-input]');
    const table = page.locator('[data-out="table"]');
    // First didactic example is decoded on load and labelled as didactic.
    await expect(page.locator('[data-source]')).toHaveText('Didactic example');
    await expect(table).toContainText('Wind from 240° at 12 kt');
    // Another example.
    await page.locator('[data-example]', { hasText: 'Fog with RVR' }).click();
    await expect(table).toContainText('RVR for runway 27L: 450 m.');
    await expect(page.locator('[data-out="ceiling"]')).toHaveText('100 ft');
    // A message typed by the user, with an unknown group.
    await input.fill('METAR LEBL 131200Z 13010KT 9999 ZZZZ FEW020 19/12 Q1015');
    await expect(page.locator('[data-source]')).toHaveText('Message entered by you');
    await expect(page.locator('.mt-tok--unknown')).toHaveText('ZZZZ');
    await expect(page.locator('[data-out="issues"]')).toContainText('Group not recognised: ZZZZ.');
    // Shareable link.
    await page.locator('[data-copy]').click();
    await expect(page).toHaveURL(/\?m=METAR\+LEBL/);
    await page.reload();
    await expect(input).toHaveValue('METAR LEBL 131200Z 13010KT 9999 ZZZZ FEW020 19/12 Q1015');
    await expect(table).toContainText('QNH 1015 hPa');
  });

  test('METAR decoder explains in Spanish and clears the input', async ({ page }) => {
    await page.goto('es/herramientas/decodificador-metar/?m=METAR%20KJFK%20131151Z%2031015KT%201%201%2F2SM%20-RA%20BR%20OVC008%2008%2FM03%20A3012');
    await expect(page.locator('[data-out="table"]')).toContainText('Visibilidad de 1,5 millas terrestres');
    await expect(page.locator('[data-out="table"]')).toContainText('Lluvia (intensidad ligera).');
    await page.locator('[data-clear]').click();
    await expect(page.locator('[data-out="issues"]')).toContainText('Escribe o pega un mensaje METAR o SPECI.');
  });
});

test.describe('TAF decoder', () => {
  test('timeline, conditions at a given hour and group table', async ({ page }) => {
    await page.goto('en/tools/taf-decoder/');
    await expect(page.locator('.tf-svg')).toBeVisible();
    await expect(page.locator('[data-out="table"]')).toContainText('Valid from day 12 at 18:00 UTC to day 13 at 24:00 UTC (30 hours).');
    const slider = page.locator('[data-hour]');
    await slider.fill('12');
    await expect(page.locator('[data-out="at"]')).toContainText('Forecast for day 13 at 06:00 UTC');
    await expect(page.locator('[data-out="at"]')).toContainText('Temporarily (TEMPO)');
    await page.locator('[data-example]', { hasText: 'New York' }).click();
    await expect(page.locator('[data-out="table"]')).toContainText('FM: from day 13 at 22:00 UTC');
  });

  test('flags a METAR pasted by mistake (Spanish)', async ({ page }) => {
    await page.goto('es/herramientas/decodificador-taf/');
    await page.locator('[data-input]').fill('METAR LEMD 131030Z 24012KT 9999 18/09 Q1017');
    await expect(page.locator('[data-out="issues"]')).toContainText('Parece un METAR o SPECI, no un TAF.');
    await expect(page.locator('[data-source]')).toHaveText('Mensaje introducido por ti');
  });
});

test.describe('METAR/TAF practice', () => {
  test('answers a question in each level and keeps the history across languages', async ({ page }) => {
    await page.goto('es/herramientas/practica-metar-taf/');
    for (const level of ['1', '2', '3', '4']) {
      await page.locator(`[data-level="${level}"]`).click();
      await expect(page.locator(`[data-level="${level}"]`)).toHaveAttribute('aria-pressed', 'true');
      await page.locator('[data-opt]').first().click();
      await expect(page.locator('[data-feedback]')).toBeVisible();
      await expect(page.locator('.pr-opt.is-correct')).toHaveCount(1);
      await expect(page.locator('[data-score]')).toContainText('de 1');
    }
    await page.locator('[data-next]').click();
    await expect(page.locator('[data-feedback]')).toBeHidden();
    await page.goto('en/tools/metar-taf-practice/');
    await page.locator('[data-level="4"]').click();
    await expect(page.locator('[data-saved]')).toContainText('Your history at this level:');
  });
});

test.describe('Unit converter', () => {
  test('converts in every direction and rejects invalid input', async ({ page }) => {
    await page.goto('en/tools/converter/');
    const speed = page.locator('[data-cat="speed"]');
    await speed.locator('[data-unit="kt"]').fill('250');
    await expect(speed.locator('[data-unit="kmh"]')).toHaveValue('463');
    const pressure = page.locator('[data-cat="pressure"]');
    await pressure.locator('[data-unit="inhg"]').fill('29.92');
    await expect(pressure.locator('[data-unit="hpa"]')).toHaveValue('1013.2');
    const temp = page.locator('[data-cat="temperature"]');
    await temp.locator('[data-unit="f"]').fill('-40');
    await expect(temp.locator('[data-unit="c"]')).toHaveValue('-40');
    await temp.locator('[data-unit="c"]').fill('abc');
    await expect(temp.locator('[data-error]')).toHaveText('Enter a valid number.');
  });
  test('accepts a decimal comma in Spanish', async ({ page }) => {
    await page.goto('es/herramientas/conversor/');
    const alt = page.locator('[data-cat="altitude"]');
    await alt.locator('[data-unit="m"]').fill('304,8');
    await expect(alt.locator('[data-unit="ft"]')).toHaveValue('1000');
  });
});
