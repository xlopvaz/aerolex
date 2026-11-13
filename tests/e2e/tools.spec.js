import { test, expect } from '@playwright/test';

test.describe('tools', () => {
  test('the tools hub only lists tools that exist', async ({ page }) => {
    await page.goto('es/herramientas/');
    await expect(page.locator('h1')).toHaveText('Laboratorio de herramientas');
    await expect(page.locator('[data-tool]')).toHaveCount(12);
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

test.describe('Live METAR/TAF', () => {
  test('shows live stations (or the no-data message) and links to the decoders as live', async ({ page }) => {
    await page.goto('es/herramientas/metar-taf-en-directo/');
    await expect(page.locator('h1')).toHaveText('METAR y TAF en directo');
    await expect(page.locator('.callout').first()).toContainText('no aptos para uso operacional');
    const cards = page.locator('[data-station]');
    if ((await cards.count()) === 0) {
      await expect(page.locator('[data-live-empty]')).toBeVisible();
      return;
    }
    const first = cards.first();
    await expect(first.locator('.lw-raw').first()).not.toBeEmpty();
    const badge = first.locator('.lw-badge').first();
    if (await badge.count()) await expect(badge).toHaveText(/En directo|Antiguo/);
    await first.getByRole('link', { name: 'Descodificar' }).click();
    await expect(page).toHaveURL(/decodificador-metar\/\?m=.+&live=1/);
    await expect(page.locator('[data-source]')).toHaveText('En directo (NOAA/NWS)');
  });
});

test.describe('Airport finder', () => {
  test('finds airports by code and city, in both languages', async ({ page }) => {
    await page.goto('es/herramientas/aeropuertos/');
    const q = page.locator('[data-q]');
    await q.fill('LEST');
    const first = page.locator('[data-results] tbody tr').first();
    await expect(first).toContainText('SCQ');
    await expect(first).toContainText('España');
    await q.fill('coruña');
    await expect(page.locator('[data-results]')).toContainText('LCG');
    await page.locator('[data-results] summary').first().click();
    await expect(page.locator('[data-results] details').first()).toContainText('Región OACI (L)');
    await q.fill('zzzzzz');
    await expect(page.locator('[data-status]')).toHaveText('No se ha encontrado ningún aeropuerto.');
    await page.goto('en/tools/airports/?q=JFK');
    await expect(page.locator('[data-results] tbody tr').first()).toContainText('KJFK');
    await expect(page.locator('[data-results] tbody tr').first()).toContainText('United States');
  });
});

test.describe('ATC phraseology trainer', () => {
  test('pilot role: checks a read-back element by element', async ({ page }) => {
    await page.goto('en/tools/atc-phraseology/');
    await expect(page.locator('[data-atc-text]')).toContainText('cleared to Madrid via ROSAL one alpha departure');
    await page.locator('[data-readback]').fill('Cleared Madrid ROSAL 1A, FL80, squawk 4512, Lexair 123');
    await page.locator('[data-check]').click();
    await expect(page.locator('[data-feedback]')).toContainText('Missing or not matching: transponder code.');
    await page.locator('[data-next]').click();
    await page.locator('[data-readback]').fill('Taxi holding point runway one seven via alpha, QNH one zero one three, Lexair one two three');
    await page.locator('[data-check]').click();
    await expect(page.locator('[data-feedback]')).toContainText('Complete read-back.');
    await expect(page.locator('[data-score]')).toHaveText('1/2');
  });
  test('controller role and scenario change (Spanish)', async ({ page }) => {
    await page.goto('es/herramientas/fraseologia-atc/');
    await page.locator('[data-mode="controller"]').click();
    await expect(page.locator('[data-pilot-text]')).not.toBeEmpty();
    await page.locator('[data-answer]').first().click();
    await expect(page.locator('[data-feedback]')).toContainText('Colación modelo');
    await expect(page.locator('.pr-opt.is-correct')).toHaveCount(1);
    await page.locator('[data-scenario]').selectOption('arrival-lemd');
    await expect(page.locator('[data-atc-text]')).toContainText('descend flight level seven zero');
  });
});

test.describe('Aircraft identification game', () => {
  test('plays rounds and links to the Hangar', async ({ page }) => {
    await page.goto('es/herramientas/que-avion-es/');
    for (let i = 0; i < 3; i++) {
      await expect(page.locator('[data-opt]').first()).toBeVisible();
      await page.locator('[data-opt]').first().click();
      await expect(page.locator('.pr-opt.is-correct')).toHaveCount(1);
      await expect(page.locator('[data-feedback] a').first()).toHaveAttribute('href', /\/es\/hangar\//);
      await page.locator('[data-next]').click();
    }
    await expect(page.locator('[data-score]')).toContainText('de 3');
  });

  test('photo mode: recognise the aircraft, then learn what to look for', async ({ page }) => {
    await page.goto('en/tools/which-aircraft/');
    const img = page.locator('[data-photo-img]');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('alt', 'Photo of the aircraft to identify');
    await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
    await expect(page.locator('[data-photo-credit]')).toContainText('Wikimedia Commons');
    await expect(page.locator('[data-opt]')).toHaveCount(4);
    await page.locator('[data-opt]').first().click();
    await expect(page.locator('[data-feedback]')).toContainText('What to look for');
    await expect(img).not.toHaveAttribute('alt', 'Photo of the aircraft to identify');
    await page.locator('label:has(input[value="figures"])').click();
    await expect(page.locator('[data-photo]')).toBeHidden();
    await expect(page.locator('[data-opt]').first()).toBeVisible();
  });
});

test.describe('Flashcards', () => {
  test('reviews cards with spaced repetition and keeps progress', async ({ page }) => {
    await page.goto('es/herramientas/flashcards/');
    await page.locator('[data-deck]').selectOption('meteorology');
    const stats = page.locator('[data-stats]');
    await expect(stats).toContainText('Pendientes: 0');
    const front = await page.locator('[data-front]').textContent();
    await page.locator('[data-reveal]').click();
    await expect(page.locator('[data-back] a')).toHaveAttribute('href', /\/es\/diccionario\//);
    await expect(page.locator('[data-int="good"]')).toHaveText('1 día');
    await page.keyboard.press('2');
    await expect(page.locator('[data-front]')).not.toHaveText(front ?? '');
    await page.locator('[data-reveal]').click();
    await page.locator('[data-grade="again"]').click();
    await expect(stats).toContainText('Pendientes: 1');
    await page.reload();
    await page.locator('[data-deck]').selectOption('meteorology');
    await expect(stats).toContainText('Pendientes: 1');
  });
  test('favourites deck is empty until terms are starred', async ({ page }) => {
    await page.goto('en/tools/flashcards/');
    await page.locator('[data-deck]').selectOption('favorites');
    await expect(page.locator('[data-done]')).toHaveText('You have no favourites yet. Star them in the dictionary.');
  });
});

test.describe('Weather glossary', () => {
  test('explains a group, searches and keeps the query in the URL', async ({ page }) => {
    await page.goto('en/tools/weather-glossary/');
    await expect(page.locator('h1')).toHaveText('Weather glossary');
    await expect(page.locator('[data-row="br"]')).toBeVisible();
    await page.locator('[data-q]').fill('+TSRA');
    const box = page.locator('[data-explain]');
    await expect(box).toBeVisible();
    await expect(box.locator('li')).toHaveCount(3);
    await expect(box).toContainText('Thunderstorm');
    await expect(page.locator('[data-row="br"]')).toBeHidden();
    await expect(page).toHaveURL(/q=%2BTSRA/);
    await page.locator('[data-q]').fill('BKN012CB');
    await expect(box).toContainText('1,200 ft');
    await page.locator('[data-q]').fill('volcanic');
    await expect(box).toBeHidden();
    await expect(page.locator('[data-row="va"]')).toBeVisible();
    await expect(page.locator('[data-count]')).toHaveText('1 codes');
    await page.locator('[data-q]').fill('zzzz');
    await expect(page.locator('[data-empty]')).toBeVisible();
  });

  test('weather glossary works from a shared link in Spanish', async ({ page }) => {
    await page.goto('es/herramientas/glosario-meteorologico/?q=FZFG');
    await expect(page.locator('[data-explain]')).toContainText('Engelante');
    await expect(page.locator('[data-explain] li')).toHaveCount(2);
  });
});

test.describe('Aviation timeline', () => {
  test('sourced events grouped by century and filtered by theme', async ({ page }) => {
    await page.goto('es/herramientas/cronologia/');
    await expect(page.locator('h1')).toHaveText('Cronología de la aviación');
    const all = await page.locator('[data-event]').count();
    expect(all).toBeGreaterThanOrEqual(15);
    await expect(page.locator('#wright-flyer time')).toHaveText('17 de diciembre de 1903');
    await expect(page.locator('#cierva-autogiro time')).toHaveText('enero de 1923');
    await expect(page.locator('#wright-flyer .tl-event__sources a').first()).toHaveAttribute('href', /si\.edu/);
    await page.locator('label:has(input[value="regulation"])').click();
    await expect(page.locator('[data-event]:visible')).toHaveCount(3);
    await expect(page.locator('[data-count]')).toHaveText('3 hitos');
    await expect(page.locator('#wright-flyer')).toBeHidden();
    await page.locator('label:has(input[value="all"])').click();
    await expect(page.locator('[data-event]:visible')).toHaveCount(all);
  });
});
