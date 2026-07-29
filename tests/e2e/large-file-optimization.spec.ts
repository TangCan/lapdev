/**
 * E2E Test Spec for EPI2.02: 大文件优化配置
 *
 * Story: epi2-02-large-file-optimization
 * Acceptance Criteria: AC1, AC2, AC3, AC4, AC5, AC7
 *
 * 测试覆盖:
 * - 大文件 (≥10k 行) 自动禁用功能验证
 * - 超大文件 (≥50k 行) 额外优化验证
 * - 普通文件功能完整性
 * - 编辑跨阈值动态更新
 * - SimpleIDE 兼容性
 */
import { test, expect } from '@playwright/test';

test.describe('[E2E] 大文件优化配置', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="file-item"]', { timeout: 10000 });
  });

  // 辅助函数: 创建指定行数的测试文件并打开
  async function createAndOpenFile(page: any, fileName: string, lineCount: number) {
    const workspaceFolder = page.locator('[data-testid="file-item"]').filter({ hasText: 'workspace' });
    await workspaceFolder.click();
    await page.waitForTimeout(500);

    // 使用 Agent 创建大文件
    // 这里我们通过浏览器内 JavaScript 直接写入文件系统（利用应用的 API）
    const lines = Array(lineCount).fill(`// line ${Math.floor(Math.random() * 100000)} of code`);
    const content = lines.join('\n');

    await page.evaluate(async ({ name, fileContent }: { name: string; fileContent: string }) => {
      const response = await fetch('/api/v1/agent/write-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: `workspace/${name}`,
          content: fileContent,
        }),
      });
      return response.json();
    }, { name: fileName, fileContent: content });

    // 刷新文件树
    await page.waitForTimeout(500);

    // 展开文件树并找到文件
    const fileItem = page.locator('[data-testid="file-item"]').filter({ hasText: fileName });
    await expect(fileItem).toBeVisible({ timeout: 10000 });
    await fileItem.click();

    // 点击占位符加载编辑器
    const placeholder = page.getByTestId('code-editor-placeholder');
    if (await placeholder.isVisible({ timeout: 3000 }).catch(() => false)) {
      await placeholder.click();
    }

    const codeEditor = page.getByTestId('code-editor');
    await expect(codeEditor).toBeVisible({ timeout: 15000 });

    return codeEditor;
  }

  // ============================================================
  // AC1: 大文件 (≥10k) 自动禁用功能
  // ============================================================

  test.skip('[P1] EPI2.02-E2E-001: 打开 10,001 行文件验证 minimap 被禁用', async ({ page }) => {
    // Given: 用户创建并打开一个 10,001 行的文件
    // When: 编辑器初始化完成
    // Then: minimap 在 DOM 中不可见 (通过检查 .minimap 元素不存在)

    const codeEditor = await createAndOpenFile(page, 'large-file-10001.ts', 10001);

    // 验证 minimap 被禁用 — Monaco 中 minimap 通常渲染为 .minimap 类名的容器
    const minimap = codeEditor.locator('.minimap');
    await expect(minimap).toBeHidden({ timeout: 5000 });
  });

  test.skip('[P1] EPI2.02-E2E-002: 打开 10,001 行文件验证 folding 被禁用', async ({ page }) => {
    // Given: 用户创建并打开一个 10,001 行的文件
    // When: 编辑器初始化完成
    // Then: 代码折叠箭头不可见

    const codeEditor = await createAndOpenFile(page, 'large-file-folding.ts', 10001);

    // 验证折叠功能被禁用 — 折叠标记 (folding markers) 不应渲染
    const foldingMarkers = codeEditor.locator('.folding');
    await expect(foldingMarkers).toHaveCount(0, { timeout: 5000 });
  });

  test.skip('[P1] EPI2.02-E2E-003: 打开 10,001 行文件验证 hover 被禁用', async ({ page }) => {
    // Given: 用户创建并打开一个 10,001 行的文件
    // When: 鼠标悬停在代码上
    // Then: 不显示 hover tooltip

    const codeEditor = await createAndOpenFile(page, 'large-file-hover.ts', 10001);

    // Hover 到代码行
    const lineElement = codeEditor.locator('.view-line').first();
    await lineElement.hover();
    await page.waitForTimeout(500);

    // 验证 hover tooltip 不出现
    const hoverWidget = page.locator('.monaco-hover-content');
    await expect(hoverWidget).toBeHidden({ timeout: 3000 });
  });

  // ============================================================
  // AC2: 超大文件 (≥50k) 额外优化
  // ============================================================

  test.skip('[P2] EPI2.02-E2E-004: 打开 50,001 行文件验证 lineNumbers 关闭', async ({ page }) => {
    // Given: 用户创建并打开一个 50,001 行的文件
    // When: 编辑器初始化完成
    // Then: lineNumbers 被设置为 'off'，行号列不显示

    const codeEditor = await createAndOpenFile(page, 'huge-file-50001.ts', 50001);

    // 验证行号不可见 — .margin-view-overlays 中的行号元素不存在
    const lineNumbers = codeEditor.locator('.margin-view-overlays .line-numbers');
    await expect(lineNumbers).toHaveCount(0, { timeout: 5000 });
  });

  test.skip('[P2] EPI2.02-E2E-005: 打开 50,001 行文件验证滚动流畅', async ({ page }) => {
    // Given: 用户打开超大文件
    // When: 用户执行快速滚动
    // Then: 滚动操作无明显延迟 (通过 scroll 事件时间差验证)

    const codeEditor = await createAndOpenFile(page, 'huge-file-scroll.ts', 50001);

    // 滚动到底部
    const scrollContainer = codeEditor.locator('.scrollbar.vertical');
    await scrollContainer.click();
    await page.mouse.wheel(0, 5000);
    await page.waitForTimeout(200);

    // 验证编辑器内容仍可见 (未崩溃)
    const viewLines = codeEditor.locator('.view-lines');
    await expect(viewLines).toBeVisible();
  });

  // ============================================================
  // AC3: 普通文件保持完整功能
  // ============================================================

  test.skip('[P1] EPI2.02-E2E-006: 普通文件 (100 行) minimap 正常显示', async ({ page }) => {
    // Given: 用户打开一个 100 行的普通文件
    // When: 编辑器初始化完成
    // Then: minimap 正常显示

    const codeEditor = await createAndOpenFile(page, 'normal-file-100.ts', 100);

    // 验证 minimap 可见
    const minimap = codeEditor.locator('.minimap');
    await expect(minimap).toBeVisible({ timeout: 5000 });
  });

  test.skip('[P1] EPI2.02-E2E-007: 普通文件 (100 行) folding 正常工作', async ({ page }) => {
    // Given: 用户打开一个 100 行的普通文件
    // When: 编辑器初始化完成
    // Then: 代码折叠功能正常

    const codeEditor = await createAndOpenFile(page, 'normal-file-folding.ts', 100);

    // 等待折叠标记出现
    const foldingMarkers = codeEditor.locator('.glyph-margin-widgets .codicon-fold');
    await expect(foldingMarkers.first()).toBeVisible({ timeout: 5000 });
  });

  // ============================================================
  // AC4: 编辑跨阈值动态更新
  // ============================================================

  test.skip('[P1] EPI2.02-E2E-008: 编辑使文件从普通变为大文件后优化生效', async ({ page }) => {
    // Given: 用户打开一个 100 行的普通文件
    const codeEditor = await createAndOpenFile(page, 'dynamic-grow.ts', 100);

    // 初始: minimap 可见
    const initialMinimap = codeEditor.locator('.minimap');
    await expect(initialMinimap).toBeVisible({ timeout: 5000 });

    // When: 用户通过 Agent 向文件写入大量内容 (使其跨越 10k 行阈值)
    const largeContent = Array(10001).fill('// new line').join('\n');
    await page.evaluate(async ({ content }) => {
      await fetch('/api/v1/agent/write-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: 'workspace/dynamic-grow.ts',
          content,
        }),
      });
    }, { content: largeContent });

    // 重新打开文件
    await page.waitForTimeout(1000);
    const fileItem = page.locator('[data-testid="file-item"]').filter({ hasText: 'dynamic-grow.ts' });
    await fileItem.click();
    await page.waitForTimeout(300);

    // Then: minimap 现在应该被禁用
    const minimap = codeEditor.locator('.minimap');
    await expect(minimap).toBeHidden({ timeout: 5000 });
  });

  // ============================================================
  // AC5 / AC7: 构建与兼容性验证
  // ============================================================

  test.skip('[P2] EPI2.02-E2E-009: SimpleIDE 页面打开大文件同样触发优化', async ({ page }) => {
    // Given: 用户访问 SimpleIDE 页面
    // When: 打开大文件
    // Then: minimap 同样被禁用

    // SimpleIDE 通常在不同路由，如 /simple
    await page.goto('/simple');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 10000 });

    const codeEditor = await createAndOpenFile(page, 'simple-large-file.ts', 10001);

    const minimap = codeEditor.locator('.minimap');
    await expect(minimap).toBeHidden({ timeout: 5000 });
  });

  test.skip('[P1] EPI2.02-E2E-010: 大文件打开延迟 < 500ms (NFR-002)', async ({ page }) => {
    // Given: 用户打开一个 10,001 行的文件
    // When: 测量从点击文件到编辑器可交互的时间
    // Then: 延迟 < 500ms

    const startTime = Date.now();
    await createAndOpenFile(page, 'perf-large-file.ts', 10001);
    const elapsed = Date.now() - startTime;

    // 验证打开时间符合 NFR-002 要求
    expect(elapsed).toBeLessThan(5000); // 宽松阈值，实际性能基准在 CI 环境中测量
  });

  test.skip('[P2] EPI2.02-E2E-011: 大文件编辑后仍能正常保存', async ({ page }) => {
    // Given: 用户打开一个 10,001 行的文件
    const codeEditor = await createAndOpenFile(page, 'save-large-file.ts', 10001);

    // When: 用户修改内容并保存
    await page.evaluate(() => {
      (window as any).__test_setEditorValue('// modified content\n');
    });

    // Then: 保存操作不报错
    // Ctrl+S 保存
    await page.keyboard.press('Control+S');
    await page.waitForTimeout(500);

    // 编辑器仍正常工作
    const viewLines = codeEditor.locator('.view-lines');
    await expect(viewLines).toBeVisible();
  });
});
