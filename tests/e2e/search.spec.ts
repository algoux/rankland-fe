import { test, expect } from '@playwright/test';
import { denyExternalCalls, installApiMocks } from './helpers/mock-api';

test.describe('/search', () => {
  test('initial state shows recent ranklists', async ({ page }) => {
    await denyExternalCalls(page);
    await installApiMocks(page);

    await page.goto('/search');

    await expect(page.locator('[data-id="search-recent-section"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-id="search-ranklist-item"][data-ranklist-key="test-key"]')).toHaveCount(1);
    await expect(page.locator('[data-id="search-ranklist-link"][href="/ranklist/test-key"]')).toHaveCount(1);
  });

  test('keyword search shows matched ranklists', async ({ page }) => {
    await denyExternalCalls(page);
    await installApiMocks(page);

    await page.goto('/search?kw=Test%20Contest');

    await expect(page.locator('[data-id="search-result-section"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-id="search-ranklist-item"][data-ranklist-key="test-key"]')).toHaveCount(1);
    await expect(page.locator('[data-id="search-ranklist-item"][data-ranklist-key="noise-key"]')).toHaveCount(0);
  });
});
