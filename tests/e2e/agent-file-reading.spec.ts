import { test, expect } from '@playwright/test';

test.describe('[9.1] Agent File Reading E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="ai-chat-panel"]', { timeout: 10000 });
  });

  test('[P0] E2E-9.1.1 should show agent mode warning when disabled', async ({ page }) => {
    await page.locator('[data-testid="ai-chat-input"]').fill('Read my file');
    await page.locator('[data-testid="ai-send-button"]').click();

    const warning = page.locator('[data-testid="agent-mode-warning"]');
    await expect(warning).toBeVisible({ timeout: 3000 });
    await expect(warning).toContainText('请先开启Agent模式');
  });

  test('[P0] E2E-9.1.2 should enable agent mode and show search UI', async ({ page }) => {
    const searchInput = page.locator('[data-testid="agent-search-input"]');
    await expect(searchInput).toBeHidden();

    await page.locator('[data-testid="ai-chat-panel"]').click();

    const searchInputVisible = page.locator('[data-testid="agent-search-input"]');
    await expect(searchInputVisible).toBeVisible({ timeout: 2000 });
  });

  test('[P0] E2E-9.1.3 should show search input when AI panel is open', async ({ page }) => {
    const searchInput = page.locator('[data-testid="agent-search-input"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test('[P1] E2E-9.1.4 should allow typing in search input', async ({ page }) => {
    const searchInput = page.locator('[data-testid="agent-search-input"]');
    await searchInput.fill('function');

    await expect(searchInput).toHaveValue('function');
  });

  test('[P1] E2E-9.1.5 should display chat panel correctly', async ({ page }) => {
    const chatPanel = page.locator('[data-testid="ai-chat-panel"]');
    await expect(chatPanel).toBeVisible();

    const chatHeader = page.locator('[data-testid="ai-chat-header"]');
    await expect(chatHeader).toBeVisible();
  });

  test('[P1] E2E-9.1.6 should allow sending messages', async ({ page }) => {
    await page.locator('[data-testid="ai-chat-input"]').fill('Hello');
    await page.locator('[data-testid="ai-send-button"]').click();

    const messageList = page.locator('[data-testid="ai-message-list"]');
    await expect(messageList).toBeVisible();
  });
});
