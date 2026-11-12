import { test, expect } from '@playwright/test';

test.describe('academy', () => {
  test('academy lists the METAR course and only paths with content', async ({ page }) => {
    await page.goto('es/academia/');
    await expect(page.locator('.path')).toHaveCount(1);
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
