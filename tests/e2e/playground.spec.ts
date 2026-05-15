import { test, expect } from '@playwright/test';
import { denyExternalCalls, installApiMocks } from './helpers/mock-api';

test.describe('/playground', () => {
  test('smoke: page loads and Monaco editor mounts', async ({ page }) => {
    await denyExternalCalls(page);
    await installApiMocks(page);

    await page.goto('/playground');

    await expect(page).toHaveTitle(/Playground.*RankLand/, { timeout: 20_000 });

    // Monaco editor 是动态加载的，给它较长 timeout
    await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 60_000 });
  });
});
