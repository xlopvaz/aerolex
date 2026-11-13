import { test, expect } from '@playwright/test';

test.describe('hangar', () => {
  test('lists families and opens a family with its variant table', async ({ page }) => {
    await page.goto('es/hangar/');
    await expect(page.locator('.fam')).toHaveCount(8);
    await expect(page.locator('.fam img.ph--card')).toHaveCount(8);
    await page.locator('.fam', { hasText: 'Familia A320neo' }).click();
    await expect(page).toHaveURL(/\/es\/hangar\/a320neo-family\/$/);
    await expect(page.locator('.cmp__table thead th')).toHaveCount(6); // label + 5 variants
    await expect(page.locator('.cmp__table')).toContainText('37,57 m');
    // language switch keeps the same family
    await page.locator('.site-header [data-set-lang="en"]').click();
    await expect(page).toHaveURL(/\/en\/hangar\/a320neo-family\/$/);
    await expect(page.locator('.cmp__table')).toContainText('37.57 m');
  });

  test('widebody comparison hides rows nobody has and shows entry into service', async ({ page }) => {
    await page.goto('en/hangar/compare/?v=a350-family:a350-1000,boeing-787:787-10');
    const table = page.locator('[data-compare-table] .cmp__table');
    await expect(table).toContainText('73.78 m');
    await expect(table.locator('tbody tr', { hasText: 'Length' }).locator('td.is-top')).toContainText('73.78 m');
    await expect(table.locator('tbody tr', { hasText: 'Entry into service' })).toContainText('Feb 24, 2018');
    await expect(table.locator('tbody tr', { hasText: 'First delivery' })).toContainText('Qatar Airways');
    // The A350 has no two-class figure, the 787-10 does: the row is kept
    await expect(table.locator('tbody tr', { hasText: 'Typical seats' })).toContainText('300–375');
  });

  test('comparator: selection, highlighting, units and shareable URL', async ({ page }) => {
    await page.goto('en/hangar/compare/');
    const table = page.locator('[data-compare-table] .cmp__table');
    await expect(table.locator('thead th')).toHaveCount(3); // default: A320neo vs 737-8
    await page.locator('[data-pick="2"]').selectOption('boeing-737:737-10');
    await expect(table.locator('thead th')).toHaveCount(4);
    await expect(page).toHaveURL(/v=a320neo-family%3Aa320neo%2Cboeing-737%3A737-8%2Cboeing-737%3A737-10|v=a320neo-family:a320neo,boeing-737:737-8,boeing-737:737-10/);
    // 737-10 is the longest of the three
    const lengthRow = table.locator('tbody tr', { hasText: 'Length' });
    await expect(lengthRow.locator('td.is-top')).toContainText('43.8 m');
    await page.locator('label', { hasText: 'Imperial (approx.)' }).click();
    await expect(lengthRow.locator('td.is-top')).toContainText('≈ 144 ft');
    // Reload keeps the selection and units
    await page.reload();
    await expect(table.locator('thead th')).toHaveCount(4);
    await expect(lengthRow.locator('td.is-top')).toContainText('ft');
    // Fewer than two aircraft shows the hint
    await page.locator('[data-pick="1"]').selectOption('');
    await page.locator('[data-pick="2"]').selectOption('');
    await expect(page.locator('[data-compare-empty]')).toBeVisible();
  });

  test('family pages teach recognition with attributed photos', async ({ page }) => {
    await page.goto('es/hangar/boeing-787/');
    const hero = page.locator('.fam__hero figure');
    await expect(hero.locator('img')).toHaveAttribute('alt', /Boeing 787/);
    await expect(hero).toContainText('En qué fijarte');
    await expect(hero.locator('.ph__credit a').first()).toHaveAttribute('href', /commons\.wikimedia\.org\/wiki\/File:/);
    const gallery = page.locator('#recognise figure');
    expect(await gallery.count()).toBeGreaterThanOrEqual(2);
    for (const img of await page.locator('#recognise img').all()) {
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
    }
  });
});
