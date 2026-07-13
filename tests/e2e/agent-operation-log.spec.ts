import { test, expect } from '@playwright/test';

test.describe('Agent Operation Log E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('lapdev-ai-models', JSON.stringify({
        models: [{ id: 'test-model', name: 'Test Model', provider: 'openai', apiKey: 'test-key', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o', isActive: true }],
        activeModelId: 'test-model',
      }));
      localStorage.setItem('lapdev-agent-mode', 'false');
      localStorage.setItem('lapdev-agent-logs', JSON.stringify([
        { id: 'log-1', type: 'read', filePath: 'src/utils.ts', result: 'success', timestamp: Date.now() - 3600000 },
        { id: 'log-2', type: 'write', filePath: 'src/components/App.tsx', result: 'success', timestamp: Date.now() - 1800000 },
        { id: 'log-3', type: 'search', filePath: 'src/', result: 'success', timestamp: Date.now() - 600000 },
        { id: 'log-4', type: 'write', filePath: 'src/hooks/useAuth.ts', result: 'rejected', timestamp: Date.now() - 300000 },
        { id: 'log-5', type: 'read', filePath: 'src/config.ts', result: 'failed', timestamp: Date.now() - 60000 },
      ]));
    });
    await page.goto('/');
    await page.waitForSelector('[data-testid="ai-panel-button"]', { timeout: 10000 });
    await page.locator('[data-testid="ai-panel-button"]').click();
    await page.waitForSelector('[data-testid="ai-chat-panel"]', { timeout: 10000 });
  });

  test('[E2E-9.3.1] Operation Log panel displays when opened', async ({ page }) => {
    await page.locator('[data-testid="operation-log-toggle"]').click();
    
    await page.waitForSelector('[data-testid="operation-log-panel"]', { timeout: 5000 });
    expect(page.locator('[data-testid="operation-log-panel"]')).toBeVisible();
  });

  test('[E2E-9.3.2] Operation Log shows log entries with time, type, path, result', async ({ page }) => {
    await page.locator('[data-testid="operation-log-toggle"]').click();
    await page.waitForSelector('[data-testid="operation-log-panel"]', { timeout: 5000 });
    
    const logEntries = page.locator('[data-testid^="log-entry-"]');
    await expect(logEntries).toHaveCount(5);

    const firstEntry = logEntries.first();
    await expect(firstEntry.locator('[data-testid="log-type"]')).toHaveText('读取文件');
    await expect(firstEntry.locator('[data-testid="log-path"]')).toHaveText('src/utils.ts');
    await expect(firstEntry.locator('[data-testid="log-result"]')).toHaveText('成功');
  });

  test('[E2E-9.3.3] Clear logs button removes all entries', async ({ page }) => {
    await page.locator('[data-testid="operation-log-toggle"]').click();
    await page.waitForSelector('[data-testid="operation-log-panel"]', { timeout: 5000 });
    
    const logEntries = page.locator('[data-testid^="log-entry-"]');
    await expect(logEntries).toHaveCount(5);

    await page.locator('[data-testid="clear-logs-button"]').click();
    
    await page.waitForSelector('[data-testid="no-logs-message"]', { timeout: 5000 });
    await expect(logEntries).toHaveCount(0);
  });

  test('[E2E-9.3.4] Clear logs shows "暂无操作记录"', async ({ page }) => {
    await page.locator('[data-testid="operation-log-toggle"]').click();
    await page.waitForSelector('[data-testid="operation-log-panel"]', { timeout: 5000 });
    
    await page.locator('[data-testid="clear-logs-button"]').click();
    
    await page.waitForSelector('[data-testid="no-logs-message"]', { timeout: 5000 });
    expect(page.locator('[data-testid="no-logs-message"]')).toHaveText('暂无操作记录');
  });

  test('[E2E-9.3.5] Filter by operation type shows only matching entries', async ({ page }) => {
    await page.locator('[data-testid="operation-log-toggle"]').click();
    await page.waitForSelector('[data-testid="operation-log-panel"]', { timeout: 5000 });
    
    await page.locator('[data-testid="filter-select"]').selectOption('read');
    
    const logEntries = page.locator('[data-testid^="log-entry-"]');
    await expect(logEntries).toHaveCount(2);
    
    await page.locator('[data-testid="filter-select"]').selectOption('write');
    await expect(logEntries).toHaveCount(2);
    
    await page.locator('[data-testid="filter-select"]').selectOption('all');
    await expect(logEntries).toHaveCount(5);
  });

  test('[E2E-9.3.6] Export button downloads JSON file', async ({ page }) => {
    await page.locator('[data-testid="operation-log-toggle"]').click();
    await page.waitForSelector('[data-testid="operation-log-panel"]', { timeout: 5000 });
    
    const downloadPromise = page.waitForEvent('download');
    
    await page.locator('[data-testid="export-logs-button"]').click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('agent-logs.json');
    
    const content = await download.text();
    const logs = JSON.parse(content);
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBe(5);
  });
});
