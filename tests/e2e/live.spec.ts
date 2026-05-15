import { test, expect } from '@playwright/test';
import { denyExternalCalls, installApiMocks, stubWebSocket } from './helpers/mock-api';

test.describe('/live/:id', () => {
  test('renders the live ranklist (with WebSocket stubbed out)', async ({ page }) => {
    await stubWebSocket(page);
    await denyExternalCalls(page);
    await installApiMocks(page);

    await page.goto('/live/live-test-key');

    // 标题应包含 Live: 前缀
    await expect(page).toHaveTitle(/Live: Test Contest 2024.*RankLand/, { timeout: 20_000 });

    await expect(page.locator('[data-id="live-ranklist-content"][data-ranklist-id="live-test-key"][data-row-count="2"]')).toBeVisible({
      timeout: 20_000,
    });
  });
});
