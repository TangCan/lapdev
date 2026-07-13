import { test, expect } from '@playwright/test';

test.describe('[9.2] Agent Operation Confirmation E2E Tests (ATDD - RED PHASE)', () => {
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
      localStorage.setItem('lapdev-agent-mode', 'true');
    });

    await page.goto('/');
    await page.waitForSelector('[data-testid="ai-panel-button"]', { timeout: 10000 });
    await page.locator('[data-testid="ai-panel-button"]').click();
    await page.waitForSelector('[data-testid="ai-chat-panel"]', { timeout: 10000 });
  });

  test.skip('[P0] E2E-9.2.1 should show confirmation dialog when AI prepares to modify file', async ({ page }) => {
    await page.route('/api/v1/ai/chat/stream', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: {"type":"agent-operation","operation":{"type":"write","filePath":"test-file.ts","diff":"+ new line"}}\ndata: {"type":"content","content":"I need to modify the file"}\ndata: {"type":"done"}\n',
      });
    });

    await page.locator('[data-testid="ai-chat-input"]').fill('Modify the test file');
    await page.locator('[data-testid="ai-send-button"]').click();

    const confirmationDialog = page.locator('[data-testid="operation-confirmation-dialog"]');
    await expect(confirmationDialog).toBeVisible({ timeout: 5000 });

    const diffPreview = page.locator('[data-testid="operation-diff-preview"]');
    await expect(diffPreview).toBeVisible();
    await expect(diffPreview).toContainText('+ new line');
  });

  test.skip('[P0] E2E-9.2.2 should execute modification when user approves', async ({ page }) => {
    await page.route('/api/v1/ai/chat/stream', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: {"type":"agent-operation","operation":{"type":"write","filePath":"test-file.ts","diff":"+ new line"}}\ndata: {"type":"content","content":"I need to modify the file"}\ndata: {"type":"done"}\n',
      });
    });

    await page.route('/api/v1/agent/write-file', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'success', data: { filePath: 'test-file.ts' } }),
      });
    });

    await page.locator('[data-testid="ai-chat-input"]').fill('Modify the test file');
    await page.locator('[data-testid="ai-send-button"]').click();

    const confirmationDialog = page.locator('[data-testid="operation-confirmation-dialog"]');
    await expect(confirmationDialog).toBeVisible({ timeout: 5000 });

    const approveButton = page.locator('[data-testid="operation-approve-button"]');
    await approveButton.click();

    await expect(page.locator('[data-testid="operation-success-message"]')).toBeVisible({ timeout: 5000 });
  });

  test.skip('[P0] E2E-9.2.3 should cancel modification when user rejects', async ({ page }) => {
    await page.route('/api/v1/ai/chat/stream', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: {"type":"agent-operation","operation":{"type":"write","filePath":"test-file.ts","diff":"+ new line"}}\ndata: {"type":"content","content":"I need to modify the file"}\ndata: {"type":"done"}\n',
      });
    });

    await page.locator('[data-testid="ai-chat-input"]').fill('Modify the test file');
    await page.locator('[data-testid="ai-send-button"]').click();

    const confirmationDialog = page.locator('[data-testid="operation-confirmation-dialog"]');
    await expect(confirmationDialog).toBeVisible({ timeout: 5000 });

    const rejectButton = page.locator('[data-testid="operation-reject-button"]');
    await rejectButton.click();

    await expect(page.locator('[data-testid="operation-rejected-message"]')).toBeVisible({ timeout: 5000 });
  });

  test.skip('[P1] E2E-9.2.4 should approve all operations at once', async ({ page }) => {
    await page.route('/api/v1/ai/chat/stream', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: {"type":"agent-operation","operation":{"type":"write","filePath":"file1.ts","diff":"+ line1"}}\ndata: {"type":"agent-operation","operation":{"type":"write","filePath":"file2.ts","diff":"+ line2"}}\ndata: {"type":"content","content":"I need to modify multiple files"}\ndata: {"type":"done"}\n',
      });
    });

    await page.route('/api/v1/agent/write-file', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'success', data: { filePath: 'file1.ts' } }),
      });
    });

    await page.locator('[data-testid="ai-chat-input"]').fill('Modify multiple files');
    await page.locator('[data-testid="ai-send-button"]').click();

    const confirmationDialog = page.locator('[data-testid="operation-confirmation-dialog"]');
    await expect(confirmationDialog).toBeVisible({ timeout: 5000 });

    const approveAllButton = page.locator('[data-testid="operation-approve-all-button"]');
    await approveAllButton.click();

    await expect(page.locator('[data-testid="operation-success-message"]')).toBeVisible({ timeout: 5000 });
  });

  test.skip('[P1] E2E-9.2.5 should show operation type and scope in dialog', async ({ page }) => {
    await page.route('/api/v1/ai/chat/stream', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: {"type":"agent-operation","operation":{"type":"write","filePath":"src/utils/helper.ts","diff":"+ export function newHelper()"}}\ndata: {"type":"content","content":"I need to add a new helper function"}\ndata: {"type":"done"}\n',
      });
    });

    await page.locator('[data-testid="ai-chat-input"]').fill('Add a new helper function');
    await page.locator('[data-testid="ai-send-button"]').click();

    const confirmationDialog = page.locator('[data-testid="operation-confirmation-dialog"]');
    await expect(confirmationDialog).toBeVisible({ timeout: 5000 });

    const operationType = page.locator('[data-testid="operation-type"]');
    await expect(operationType).toContainText('修改');

    const operationTarget = page.locator('[data-testid="operation-target"]');
    await expect(operationTarget).toContainText('src/utils/helper.ts');
  });
});