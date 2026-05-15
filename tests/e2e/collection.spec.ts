import { test, expect } from '@playwright/test';
import { denyExternalCalls, installApiMocks } from './helpers/mock-api';

test.describe('/collection/:id', () => {
  test('renders the navigation menu and selected ranklist', async ({ page }) => {
    await denyExternalCalls(page);
    await installApiMocks(page);

    await page.goto('/collection/official?rankId=test-key');

    await expect(page.locator('.srk-collection-nav-menu .ant-menu-submenu-open').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-id="collection-menu-item-test-key"][href="/collection/official?rankId=test-key"]')).toBeVisible();
    await expect(page.locator('[data-id="collection-ranklist-content"][data-row-count="2"]')).toBeVisible();
  });

  test('prompts to select a ranklist when no rankId in URL', async ({ page }) => {
    await denyExternalCalls(page);
    await installApiMocks(page);

    await page.goto('/collection/official');

    await expect(page.locator('[data-id="collection-empty-state"]')).toBeVisible({ timeout: 20_000 });
  });
});
