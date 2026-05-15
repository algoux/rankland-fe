import { test, expect } from '@playwright/test';
import { denyExternalCalls, installApiMocks } from './helpers/mock-api';

test.describe('/ranklist/:id', () => {
  test('renders the ranklist with mocked data', async ({ page }) => {
    await denyExternalCalls(page);
    await installApiMocks(page);

    await page.goto('/ranklist/test-key');

    // Helmet 标题（异步同步到 document.title）
    await expect(page).toHaveTitle(/Test Contest 2024.*RankLand/, { timeout: 20_000 });

    await expect(page.locator('[data-id="ranklist-content"][data-ranklist-id="test-key"][data-row-count="2"]')).toBeVisible({
      timeout: 20_000,
    });
  });

  test('shows Ranklist Not Found when API returns code=11', async ({ page }) => {
    await denyExternalCalls(page);
    await installApiMocks(page, { ranklistInfo: null });

    await page.goto('/ranklist/missing-key');

    await expect(page.locator('[data-id="ranklist-not-found"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-id="ranklist-not-found-home-link"][href="/"]')).toBeVisible();
  });
});
