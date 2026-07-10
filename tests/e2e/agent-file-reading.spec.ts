import { test, expect } from '@playwright/test';

test.describe('[9.1] Agent File Reading E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('lapdev-ai-models', JSON.stringify({
        models: [{
          id: 'test-model',
          name: 'Test Model',
          provider: 'openai',
          apiKey: 'test-key',
          baseUrl: 'https://api.openai.com/v1',
          model: 'gpt-4o',
          isActive: true,
        }],
        activeModelId: 'test-model',
      }));
      localStorage.setItem('lapdev-agent-mode', 'false');
    });
    
    await page.goto('/');
    
    await page.waitForSelector('[data-testid="ai-panel-button"]', { timeout: 10000 });
    await page.locator('[data-testid="ai-panel-button"]').click();
    await page.waitForSelector('[data-testid="ai-chat-panel"]', { timeout: 10000 });
  });

  test('[P0] E2E-9.1.2 should enable agent mode and show search UI', async ({ page }) => {
    const searchInput = page.locator('[data-testid="agent-search-input"]');
    await expect(searchInput).toBeHidden();

    await page.locator('[data-testid="agent-mode-toggle"]').click();

    const searchInputVisible = page.locator('[data-testid="agent-search-input"]');
    await expect(searchInputVisible).toBeVisible({ timeout: 2000 });
  });

  test('[P0] E2E-9.1.3 should show search input when AI panel is open and agent mode enabled', async ({ page }) => {
    await page.locator('[data-testid="agent-mode-toggle"]').click();
    
    const searchInput = page.locator('[data-testid="agent-search-input"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test('[P1] E2E-9.1.4 should allow typing in search input', async ({ page }) => {
    await page.locator('[data-testid="agent-mode-toggle"]').click();
    
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
});
