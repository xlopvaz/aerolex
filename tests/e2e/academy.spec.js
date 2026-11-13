import { test, expect } from '@playwright/test';

test.describe('academy', () => {
  test('academy lists the METAR course and only paths with content', async ({ page }) => {
    await page.goto('es/academia/');
    await expect(page.locator('.path')).toHaveCount(3);
    await page.locator('.course-card', { hasText: 'METAR' }).click();
    await expect(page).toHaveURL(/\/es\/academia\/metar-speci\/$/);
    await expect(page.locator('.lesson-list li')).toHaveCount(9);
  });

  test('answering a lesson quiz completes the lesson and updates progress everywhere', async ({ page }) => {
    await page.goto('en/academy/metar-speci/wind/');
    const quiz = page.locator('[data-quiz="metar-speci-03"]');
    // q1: correct answer "b"; q2: "a"; q3: wrong on purpose ("a"), then retry with "b"
    await quiz.locator('[data-q="q1"] [data-opt="b"]').click();
    await expect(quiz.locator('[data-q="q1"] .quiz__verdict')).toHaveText('Correct!');
    await quiz.locator('[data-q="q2"] [data-opt="a"]').click();
    await quiz.locator('[data-q="q3"] [data-opt="a"]').click();
    await expect(quiz.locator('[data-q="q3"] .quiz__verdict')).toHaveText('Not quite.');
    await expect(quiz.locator('[data-quiz-score]')).toHaveText('2/3 correct');
    await expect(page.locator('[data-complete]')).toHaveAttribute('aria-pressed', 'true');

    await quiz.locator('[data-quiz-retry]').click();
    await quiz.locator('[data-q="q3"] [data-opt="b"]').click();
    await expect(quiz.locator('[data-quiz-score]')).toHaveText('3/3 correct');

    // Progress is shared across languages and pages
    await page.locator('.site-header [data-set-lang="es"]').click();
    await expect(page).toHaveURL(/\/es\/academia\/metar-speci\/wind\/$/);
    await expect(page.locator('[data-complete]')).toHaveAttribute('aria-pressed', 'true');
    await page.goto('es/academia/metar-speci/');
    await expect(page.locator('[data-lesson-row="metar-speci/wind"]')).toHaveClass(/is-done/);
    await expect(page.locator('.glide__value')).toHaveText('11%');
    await expect(page.locator('[data-course-cta]')).toContainText('Continuar');
    await page.goto('es/panel/');
    await expect(page.locator('#stat-lessons')).toHaveText('1');
  });

  test('mark as completed toggles and lesson navigation works', async ({ page }) => {
    await page.goto('es/academia/metar-speci/what-is-metar/');
    const btn = page.locator('[data-complete]');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await page.locator('a[rel="next"]').click();
    await expect(page).toHaveURL(/identification-and-time\/$/);
    await expect(page.locator('h1')).toHaveText('Identificación, fecha y hora');
  });

  test('lesson terms link to the dictionary', async ({ page }) => {
    await page.goto('en/academy/metar-speci/clouds/');
    await page.locator('.prose a.term', { hasText: 'ceiling' }).first().click();
    await expect(page).toHaveURL(/\/en\/dictionary\/ceiling\/$/);
  });
});

test.describe('TAF academy', () => {
  test('is listed in the meteorology path and its lessons work in both languages', async ({ page }) => {
    await page.goto('en/academy/');
    await expect(page.locator('.course-card')).toHaveCount(5);
    await page.locator('.course-card', { hasText: 'TAF Academy' }).click();
    await expect(page.locator('.lesson-list li')).toHaveCount(6);
    await page.locator('.lesson-list a', { hasText: 'Change groups' }).click();
    await expect(page.locator('h1')).toHaveText('Change groups: FM, BECMG and TEMPO');
    await page.locator('.site-header [data-set-lang="es"]').click();
    await expect(page).toHaveURL(/\/es\/academia\/taf\/change-groups\/$/);
    await page.locator('.prose a.term', { hasText: 'BECMG' }).first().click();
    await expect(page).toHaveURL(/\/es\/diccionario\/becmg\/$/);
  });

  test('final assessment scores answers', async ({ page }) => {
    await page.goto('es/academia/taf/full-decode/');
    const quiz = page.locator('[data-quiz="taf-final"]');
    await expect(quiz.locator('.quiz__q')).toHaveCount(8);
    await quiz.locator('[data-q="q1"] [data-opt="a"]').click();
    await quiz.locator('[data-q="q2"] [data-opt="a"]').click();
    await expect(quiz.locator('[data-quiz-score]')).toHaveText('1/8 correctas');
  });
});

test.describe('Aviation Fundamentals', () => {
  test('opens the academy, links terms to the dictionary and keeps the lesson across languages', async ({ page }) => {
    await page.goto('es/academia/');
    await expect(page.locator('.path').first()).toContainText('Introducción a la aviación');
    await page.locator('.course-card', { hasText: 'Fundamentos de la aviación' }).click();
    await expect(page).toHaveURL(/\/es\/academia\/aviation-fundamentals\/$/);
    await expect(page.locator('.lesson-list li')).toHaveCount(7);
    await page.locator('.lesson-list a', { hasText: 'Quién dicta las normas' }).click();
    await expect(page.locator('.prose .mb .badge')).toHaveCount(0); // summaries are not labelled as invented examples
    await page.locator('.site-header [data-set-lang="en"]').click();
    await expect(page).toHaveURL(/\/en\/academy\/aviation-fundamentals\/who-sets-the-rules\/$/);
    await expect(page.locator('h1')).toHaveText('Who sets the rules');
    await page.locator('.prose a.term', { hasText: 'ICAO' }).first().click();
    await expect(page).toHaveURL(/\/en\/dictionary\/icao\/$/);
  });

  test('final assessment covers the whole course', async ({ page }) => {
    await page.goto('en/academy/aviation-fundamentals/codes-and-language/');
    const quiz = page.locator('[data-quiz="aviation-fundamentals-final"]');
    await expect(quiz.locator('.quiz__q')).toHaveCount(8);
    await quiz.locator('[data-q="q8"] [data-opt="c"]').click();
    await expect(quiz.locator('[data-quiz-score]')).toHaveText('1/8 correct');
  });
});

test.describe('Pilot Academy', () => {
  test('lists modules 1 and 2 in order and opens an ATPL-style quiz', async ({ page }) => {
    await page.goto('es/academia/');
    const path = page.locator('.path', { hasText: 'Formación de pilotos' });
    await expect(path.locator('.course-card')).toHaveCount(2);
    await expect(path.locator('.course-card').first()).toContainText('Módulo 1');
    await path.locator('.course-card', { hasText: 'Módulo 2' }).click();
    await expect(page).toHaveURL(/\/es\/academia\/aerodynamics\/$/);
    await expect(page.locator('.lesson-list li')).toHaveCount(5);
    await page.goto('en/academy/principles-of-flight/turns-and-load-factor/');
    const quiz = page.locator('[data-quiz="principles-of-flight-final"]');
    await expect(quiz.locator('.quiz__q')).toHaveCount(8);
    await quiz.locator('[data-q="q5"] [data-opt="b"]').click();
    await expect(quiz.locator('[data-quiz-score]')).toHaveText('1/8 correct');
  });
});
