import { test, expect } from '@playwright/test';

test.describe('tools', () => {
  test('the tools hub only lists tools that exist', async ({ page }) => {
    await page.goto('es/herramientas/');
    await expect(page.locator('h1')).toHaveText('Laboratorio de herramientas');
    await expect(page.locator('[data-tool]')).toHaveCount(1);
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
