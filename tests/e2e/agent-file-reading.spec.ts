import { test, expect } from '@playwright/test';

test.describe('[9.1] Agent File Reading E2E Tests (ATDD RED PHASE)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 10000 });
  });

  test('[P0] E2E-9.1.1 should automatically read file when Agent mode is enabled', async ({ page }) => {
    await test.skip();
    
    const agentToggle = page.locator('[data-testid="agent-mode-toggle"]');
    await agentToggle.click();
    await page.waitForTimeout(1000);
    
    await expect(page.locator('[data-testid="agent-mode-active"]')).toBeVisible();
    
    const testFile = page.locator('[data-testid="file-item-test-file.ts"]');
    await testFile.click();
    await page.waitForTimeout(2000);
    
    await page.locator('[data-testid="ai-chat-input"]').fill('What is this file about?');
    await page.locator('[data-testid="ai-chat-send"]').click();
    
    await page.waitForTimeout(3000);
    
    const operationLog = page.locator('[data-testid="operation-log"]');
    await expect(operationLog).toContainText('读取文件: test-file.ts');
  });

  test('[P0] E2E-9.1.2 should search code when Agent mode is enabled', async ({ page }) => {
    await test.skip();
    
    const agentToggle = page.locator('[data-testid="agent-mode-toggle"]');
    await agentToggle.click();
    await page.waitForTimeout(1000);
    
    await expect(page.locator('[data-testid="agent-mode-active"]')).toBeVisible();
    
    const searchInput = page.locator('[data-testid="agent-search-input"]');
    await searchInput.fill('function');
    await searchInput.press('Enter');
    
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 5000 });
    const searchResults = page.locator('[data-testid="search-results"]');
    
    await expect(searchResults).toBeVisible();
    await expect(searchResults).toHaveCount(1);
  });

  test('[P1] E2E-9.1.3 should show warning when Agent mode is disabled and trying to read file', async ({ page }) => {
    await test.skip();
    
    await expect(page.locator('[data-testid="agent-mode-inactive"]')).toBeVisible();
    
    await page.locator('[data-testid="ai-chat-input"]').fill('Read my file');
    await page.locator('[data-testid="ai-chat-send"]').click();
    
    await page.waitForSelector('[data-testid="agent-mode-warning"]', { timeout: 3000 });
    const warning = page.locator('[data-testid="agent-mode-warning"]');
    
    await expect(warning).toBeVisible();
    await expect(warning).toContainText('请先开启Agent模式');
  });
});