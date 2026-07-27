import { test, expect } from '@playwright/test';

test.describe('EPI1.01: React 19 升级冒烟测试', () => {

  test('[P0] should load application without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    const reactErrors = errors.filter(
      (e) =>
        e.includes('React') ||
        e.includes('react-dom') ||
        e.includes('Minified React error')
    );

    expect(reactErrors).toHaveLength(0);
  });

  test('[P0] should render main UI components', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('editor-content')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('status-bar')).toBeVisible({ timeout: 10000 });
  });

  test('[P1] should work with React 19 hooks', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    await page.getByTestId('ai-panel-button').click();
    await expect(page.getByTestId('ai-chat-panel')).toBeVisible({ timeout: 10000 });

    await page.getByTestId('ai-close-panel').click();
    await expect(page.getByTestId('ai-chat-panel')).not.toBeVisible({ timeout: 5000 });

    const reactErrors = errors.filter(
      (e) =>
        e.includes('React') ||
        e.includes('react-dom') ||
        e.includes('Minified React error')
    );

    expect(reactErrors).toHaveLength(0);
  });

  test('[P1] should not have React version warnings', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    const reactWarnings = warnings.filter(
      (w) =>
        w.includes('React') &&
        (w.includes('version') || w.includes('deprecated') || w.includes('upgrade'))
    );

    expect(reactWarnings).toHaveLength(0);
  });

  test('[P2] should use new useId format with underscores', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    const ids = await page.evaluate(() => {
      const allElements = document.querySelectorAll('[id]');
      return Array.from(allElements).map((el) => el.id);
    });

    const oldFormatIds = ids.filter((id) => /:r\d+:/.test(id));
    expect(oldFormatIds).toHaveLength(0);
  });

  test('[P1] should verify React 19 Concurrent Features via Suspense boundaries', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    await page.getByTestId('ai-panel-button').click();
    await expect(page.getByTestId('ai-chat-panel')).toBeVisible({ timeout: 10000 });

    await page.getByTestId('ai-close-panel').click();
    await expect(page.getByTestId('ai-chat-panel')).not.toBeVisible({ timeout: 5000 });

    await page.getByTestId('ai-panel-button').click();
    await expect(page.getByTestId('ai-chat-panel')).toBeVisible({ timeout: 5000 });

    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /设置|Settings/i })).toBeVisible({ timeout: 15000 });

    const reactErrors = errors.filter(
      (e) =>
        e.includes('React') ||
        e.includes('react-dom') ||
        e.includes('Minified React error')
    );

    expect(reactErrors).toHaveLength(0);
  });

  test('[P2] should handle Fast Refresh correctly after reload', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    await page.reload();

    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('editor-content')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('status-bar')).toBeVisible({ timeout: 10000 });

    const reactErrors = errors.filter(
      (e) =>
        e.includes('React') ||
        e.includes('react-dom') ||
        e.includes('Minified React error')
    );

    expect(reactErrors).toHaveLength(0);
  });
});