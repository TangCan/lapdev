/**
 * EPI1.01: React 19 依赖升级 - E2E 冒烟测试
 *
 * 此测试验证 React 19 升级后应用的基本功能正常运行
 *
 * 注意: 需安装 @playwright/test 并配置 playwright.config.ts 后启用。
 *  当前项目未集成 Playwright，测试保留为 .skip() 状态。
 *  集成 Playwright 后，移除 .skip() 激活测试。
 */

import { test, expect } from '@playwright/test';

test.describe('EPI1.01: React 19 升级冒烟测试', () => {

  /**
   * AC1: 验证应用正常启动
   * Given: React 19 已升级
   * When: 用户访问应用首页
   * Then: 应用正常加载，无 JavaScript 错误
   */
  test.skip('should load application without errors', async ({ page }) => {
    // 监听控制台错误
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // 访问首页
    await page.goto('/');

    // 等待应用加载
    await page.waitForSelector('[data-testid="app-loaded"], .loading-app', {
      timeout: 30000,
    });

    // 验证无 React 相关错误
    const reactErrors = errors.filter(
      (e) =>
        e.includes('React') ||
        e.includes('react-dom') ||
        e.includes('Minified React error')
    );

    expect(reactErrors).toHaveLength(0);
  });

  /**
   * AC1: 验证主要 UI 组件渲染
   * Given: React 19 已升级
   * When: 应用加载完成
   * Then: 文件树、编辑器、终端等主要组件正常渲染
   */
  test.skip('should render main UI components', async ({ page }) => {
    await page.goto('/');

    // 等待文件树加载
    const fileTree = page.locator('[data-testid="file-tree"], .file-tree');
    await expect(fileTree).toBeVisible({ timeout: 10000 });

    // 验证编辑器区域存在
    const editorArea = page.locator('[data-testid="code-editor"], .editor-container');
    await expect(editorArea).toBeVisible({ timeout: 10000 });
  });

  /**
   * AC3: 验证 React 19 hooks 正常工作
   * Given: React 19 已升级
   * When: 使用新的 React 19 特性（如 useEffectEvent）
   * Then: hooks 正常执行，无运行时错误
   */
  test.skip('should work with React 19 hooks', async ({ page }) => {
    await page.goto('/');

    // 等待应用完全加载
    await page.waitForLoadState('networkidle');

    // 执行简单的交互测试
    const fileTree = page.locator('[data-testid="file-tree"], .file-tree');
    if (await fileTree.isVisible()) {
      // 点击文件树项测试事件处理
      const firstItem = fileTree.locator('li').first();
      if (await firstItem.isVisible()) {
        await firstItem.click();

        // 验证无 React 错误
        const errorDialog = page.locator('[role="alert"], .error-message');
        await expect(errorDialog).not.toBeVisible({ timeout: 5000 });
      }
    }
  });

  /**
   * AC2: 验证无 React 相关 console 警告
   * Given: React 19 已升级
   * When: 应用运行时
   * Then: 无 React 版本相关警告
   */
  test.skip('should not have React version warnings', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 检查是否有 React 版本相关警告
    const reactWarnings = warnings.filter(
      (w) =>
        w.includes('React') &&
        (w.includes('version') || w.includes('deprecated') || w.includes('upgrade'))
    );

    expect(reactWarnings).toHaveLength(0);
  });

  /**
   * 辅助测试: 验证 useId 格式变化
   * React 19 中 useId 生成的 ID 格式从 `:r0:` 变为 `_r0_`
   */
  test.skip('should use new useId format with underscores', async ({ page }) => {
    await page.goto('/');

    // 获取所有元素 id
    const ids = await page.evaluate(() => {
      const allElements = document.querySelectorAll('[id]');
      return Array.from(allElements).map((el) => el.id);
    });

    // React 19 的 useId 使用下划线格式 _r0_（React 18 为 :r0:）
    const newFormatPattern = /_\d+_/;
    const oldFormatPattern = /:r\d+:/;
    const reactGeneratedIds = ids.filter(
      (id) => newFormatPattern.test(id) || oldFormatPattern.test(id)
    );

    if (reactGeneratedIds.length > 0) {
      // 验证所有 React 生成的 ID 均使用新格式（下划线）
      const allUseNewFormat = reactGeneratedIds.every((id) => newFormatPattern.test(id));
      expect(allUseNewFormat).toBe(true);
    }
    // 如果没有 React 生成的 ID，跳过此断言（非失败）
  });
});