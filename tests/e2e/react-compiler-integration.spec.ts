import { test, expect } from '@playwright/test';

test.describe('EPI1.03: React Compiler 集成测试', () => {

  // ────────────────────────────────────────────────
  // @p0  React Compiler 不应破坏路由导航
  // ────────────────────────────────────────────────

  test('[P0] React Compiler 不应破坏路由导航', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('editor-content')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('status-bar')).toBeVisible({ timeout: 10000 });

    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /设置|Settings/i })).toBeVisible({ timeout: 15000 });

    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('editor-content')).toBeVisible({ timeout: 10000 });

    const compilerErrors = errors.filter(
      (e) =>
        e.includes('React Compiler') ||
        e.includes('babel-plugin-react-compiler') ||
        e.includes('react-compiler')
    );
    expect(compilerErrors).toHaveLength(0);

    const reactErrors = errors.filter(
      (e) =>
        e.includes('React') ||
        e.includes('react-dom') ||
        e.includes('Minified React error')
    );
    expect(reactErrors).toHaveLength(0);
  });

  // ────────────────────────────────────────────────
  // @p0  React Compiler 不应破坏组件状态管理
  // ────────────────────────────────────────────────

  test('[P0] React Compiler 不应破坏组件状态管理', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    await page.getByTestId('ai-panel-button').click();
    await expect(page.getByTestId('ai-chat-panel')).toBeVisible({ timeout: 10000 });

    await page.getByTestId('ai-close-panel').click();
    await expect(page.getByTestId('ai-chat-panel')).not.toBeVisible({ timeout: 5000 });

    await page.getByTestId('ai-panel-button').click();
    await expect(page.getByTestId('ai-chat-panel')).toBeVisible({ timeout: 10000 });

    await page.getByTestId('ai-close-panel').click();
    await expect(page.getByTestId('ai-chat-panel')).not.toBeVisible({ timeout: 5000 });

    const staleClosureWarnings = warnings.filter(
      (w) =>
        w.includes('stale') ||
        w.includes('closure') ||
        w.includes('memoization') ||
        w.includes('Memoized')
    );
    expect(staleClosureWarnings).toHaveLength(0);
  });

  // ────────────────────────────────────────────────
  // @p1  React Compiler 与 React 19 并发特性兼容
  // ────────────────────────────────────────────────

  test('[P1] React Compiler 与 React 19 并发特性兼容', async ({ page }) => {
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

    const concurrencyErrors = errors.filter(
      (e) =>
        e.includes('startTransition') ||
        e.includes('useTransition') ||
        e.includes('concurrent') ||
        e.includes('pending')
    );
    expect(concurrencyErrors).toHaveLength(0);

    const reactErrors = errors.filter(
      (e) =>
        e.includes('React') ||
        e.includes('react-dom') ||
        e.includes('Minified React error')
    );
    expect(reactErrors).toHaveLength(0);
  });

  // ────────────────────────────────────────────────
  // @p1  React Compiler 与 Error Boundary 兼容
  // ────────────────────────────────────────────────

  test('[P1] React Compiler 与 Error Boundary 兼容', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    const hasErrorBoundary = await page.evaluate(() => {
      return !!document.querySelector('[data-testid="error-boundary"], [data-testid="error-fallback"]');
    });

    if (hasErrorBoundary) {
      const errorTrigger = page.getByTestId('error-trigger');
      if (await errorTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
        await errorTrigger.click();
        await expect(page.getByTestId('error-fallback')).toBeVisible({ timeout: 10000 });
      }
    }

    const compilerErrors = errors.filter(
      (e) =>
        e.includes('React Compiler') ||
        e.includes('babel-plugin-react-compiler')
    );
    expect(compilerErrors).toHaveLength(0);
  });

  // ────────────────────────────────────────────────
  // @p1  React Compiler 与 Suspense / 懒加载兼容
  // ────────────────────────────────────────────────

  test('[P1] React Compiler 与 Suspense / 懒加载兼容', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /设置|Settings/i })).toBeVisible({ timeout: 15000 });

    const hasSuspenseFallback = await page.evaluate(() => {
      return !!document.querySelector('[data-testid="suspense-fallback"], [data-testid="loading"]');
    });

    if (hasSuspenseFallback) {
      await expect(page.getByTestId('editor-content')).toBeVisible({ timeout: 15000 });
    }

    const suspenseErrors = errors.filter(
      (e) =>
        e.includes('Suspense') ||
        e.includes('suspense') ||
        e.includes('lazy') ||
        e.includes('React.lazy')
    );
    expect(suspenseErrors).toHaveLength(0);

    const compilerErrors = errors.filter(
      (e) =>
        e.includes('React Compiler') ||
        e.includes('babel-plugin-react-compiler')
    );
    expect(compilerErrors).toHaveLength(0);
  });

  // ────────────────────────────────────────────────
  // @p2  React Compiler 长期稳定性
  // ────────────────────────────────────────────────

  test('[P2] React Compiler 长期稳定性 - 多次快速导航', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    const navRoutes = ['/', '/settings', '/'];

    for (let i = 0; i < navRoutes.length; i++) {
      await page.goto(navRoutes[i]);
      if (i === 0 || i === 2) {
        await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });
        await expect(page.getByTestId('editor-content')).toBeVisible({ timeout: 10000 });
      } else {
        await expect(page.getByRole('heading', { name: /设置|Settings/i })).toBeVisible({ timeout: 15000 });
      }
    }

    const performanceMetrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      return {
        loadTime: nav ? nav.loadEventEnd - nav.startTime : 0,
        domContentLoaded: nav ? nav.domContentLoadedEventEnd - nav.startTime : 0,
      };
    });

    expect(performanceMetrics.loadTime).toBeLessThan(10000);

    const compilerErrors = errors.filter(
      (e) =>
        e.includes('React Compiler') ||
        e.includes('babel-plugin-react-compiler')
    );
    expect(compilerErrors).toHaveLength(0);

    const reactErrors = errors.filter(
      (e) =>
        e.includes('React') ||
        e.includes('react-dom') ||
        e.includes('Minified React error')
    );
    expect(reactErrors).toHaveLength(0);
  });
});