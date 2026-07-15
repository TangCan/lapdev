import { test, expect } from '@playwright/test';
import {
  setupAIConfig,
  setupOperationLogs,
  setupAgentMode,
  openAIPanel,
  openOperationLogPanel,
  confirmClearLogs,
  waitForCount,
  waitForText,
} from './utils/testUtils';

test.describe('Agent Operation Log E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });
    await setupAIConfig(page);
    await setupAgentMode(page, false);
    await setupOperationLogs(page);
    await page.reload();
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });
    await openAIPanel(page);
  });

  test('[E2E-9.3.1] Operation Log panel displays when opened', async ({ page }) => {
    await openOperationLogPanel(page);
    await expect(page.locator('[data-testid="operation-log-panel"]')).toBeVisible();
  });

  test('[E2E-9.3.2] Operation Log shows log entries with time, type, path, result', async ({ page }) => {
    await openOperationLogPanel(page);
    
    const logEntries = page.locator('[data-testid^="log-entry-"]');
    await waitForCount(page, '[data-testid^="log-entry-"]', 5);

    const firstEntry = logEntries.first();
    await expect(firstEntry.locator('[data-testid="log-type"]')).toHaveText('读取文件');
    await expect(firstEntry.locator('[data-testid="log-path"]')).toHaveText('src/utils.ts');
    await expect(firstEntry.locator('[data-testid="log-result"]')).toHaveText('成功');
  });

  test('[E2E-9.3.3] Clear logs button removes all entries', async ({ page }) => {
    await openOperationLogPanel(page);
    
    const logEntries = page.locator('[data-testid^="log-entry-"]');
    await waitForCount(page, '[data-testid^="log-entry-"]', 5);

    await page.locator('[data-testid="clear-logs-button"]').click();
    await confirmClearLogs(page);
    
    await page.waitForSelector('[data-testid="no-logs-message"]', { timeout: 5000 });
    await waitForCount(page, '[data-testid^="log-entry-"]', 0);
  });

  test('[E2E-9.3.4] Clear logs shows "暂无操作记录"', async ({ page }) => {
    await openOperationLogPanel(page);
    
    await page.locator('[data-testid="clear-logs-button"]').click();
    await confirmClearLogs(page);
    
    await page.waitForSelector('[data-testid="no-logs-message"]', { timeout: 5000 });
    await waitForText(page, '[data-testid="no-logs-message"]', '暂无操作记录');
  });

  test('[E2E-9.3.5] Filter by operation type shows only matching entries', async ({ page }) => {
    await openOperationLogPanel(page);
    
    await page.locator('[data-testid="filter-select"]').selectOption('read');
    
    const logEntries = page.locator('[data-testid^="log-entry-"]');
    await waitForCount(page, '[data-testid^="log-entry-"]', 2);
    
    await page.locator('[data-testid="filter-select"]').selectOption('write');
    await waitForCount(page, '[data-testid^="log-entry-"]', 2);
    
    await page.locator('[data-testid="filter-select"]').selectOption('all');
    await waitForCount(page, '[data-testid^="log-entry-"]', 5);
  });

  test('[E2E-9.3.6] Export button downloads JSON file', async ({ page }) => {
    await openOperationLogPanel(page);
    
    const downloadPromise = page.waitForEvent('download');
    
    await page.locator('[data-testid="export-logs-button"]').click();
    
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^agent-logs-\d{4}-\d{2}-\d{2}\.json$/);
    
    const path = await download.path();
    expect(path).toBeTruthy();
    
    const fs = require('fs');
    const content = fs.readFileSync(path, 'utf-8');
    const logs = JSON.parse(content);
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBe(5);
  });
});
