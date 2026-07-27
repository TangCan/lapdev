import { test, expect } from '@playwright/test';

test.describe('EPI1.02: React Compiler 冒烟测试', () => {

  test('[P0] 应用加载时不应出现 React Compiler 相关控制台错误', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    const compilerErrors = errors.filter(
      (e) =>
        e.includes('React Compiler') ||
        e.includes('babel-plugin-react-compiler') ||
        e.includes('react-compiler')
    );

    expect(compilerErrors).toHaveLength(0);
  });

  test('[P0] React Compiler 优化后组件应正确渲染', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('editor-content')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('status-bar')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('ai-panel-button')).toBeVisible({ timeout: 10000 });
  });

  test('[P0] React Compiler 不应导致组件重渲染异常', async ({ page }) => {
    const renderCounts: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning' && msg.text().includes('React')) {
        renderCounts.push(msg.text());
      }
    });

    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    await page.getByTestId('ai-panel-button').click();
    await expect(page.getByTestId('ai-chat-panel')).toBeVisible({ timeout: 10000 });

    await page.getByTestId('ai-close-panel').click();
    await expect(page.getByTestId('ai-chat-panel')).not.toBeVisible({ timeout: 5000 });

    const renderWarnings = renderCounts.filter(
      (w) =>
        w.includes('render') ||
        w.includes('re-render') ||
        w.includes('memoization')
    );

    expect(renderWarnings).toHaveLength(0);
  });

  test('[P1] React Compiler 启用后交互操作应正常工作', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    await page.getByTestId('ai-panel-button').click();
    await expect(page.getByTestId('ai-chat-panel')).toBeVisible({ timeout: 10000 });

    await page.getByTestId('ai-close-panel').click();
    await expect(page.getByTestId('ai-chat-panel')).not.toBeVisible({ timeout: 5000 });

    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /设置|Settings/i })).toBeVisible({ timeout: 15000 });
  });

  test('[P1] React Compiler 与 React 19 Concurrent Features 兼容', async ({ page }) => {
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

    const reactErrors = errors.filter(
      (e) =>
        e.includes('React') ||
        e.includes('react-dom') ||
        e.includes('Minified React error')
    );

    expect(reactErrors).toHaveLength(0);
  });

  test('[P1] React Compiler 启用后 Fast Refresh 应正常工作', async ({ page }) => {
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
    await expect(page.getByTestId('editor-content')).toBeVisible({ timeout: 10000 });

    const compilerErrors = errors.filter(
      (e) =>
        e.includes('React Compiler') ||
        e.includes('babel-plugin-react-compiler')
    );

    expect(compilerErrors).toHaveLength(0);
  });

  test('[P2] React Compiler 不应影响 useId 格式（React 19 下划线格式）', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    const ids = await page.evaluate(() => {
      const allElements = document.querySelectorAll('[id]');
      return Array.from(allElements).map((el) => el.id);
    });

    const oldFormatIds = ids.filter((id) => /:r\d+:/.test(id));
    expect(oldFormatIds).toHaveLength(0);
  });
});