/**
 * E2E Test Spec for EPI3.03: 复杂操作并发处理
 *
 * Story: epi3-03-complex-operation-concurrent-processing
 * Acceptance Criteria: AC1 (格式化 startTransition), AC4 (回归)
 *
 * 说明: startTransition 将格式化结果的内容更新标记为低优先级，
 * 保证 UI 在重计算期间保持响应。E2E 层面聚焦功能回归：
 * - 格式化后编辑器内容正确更新（AC1）
 * - 格式化后编辑器仍可交互、可继续输入（AC1 / 并发响应）
 * - 格式化期间编辑器可见且不卡死（AC4）
 *
 * 注: 精确 INP/交互延迟量化属于 tests/performance/ 独立性能测试范畴，
 * 不在本 E2E spec 中做不可靠的耗时断言。
 */
import { test, expect } from '@playwright/test';

test.describe('[E2E] 复杂操作并发处理 (EPI3.03)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="file-item"]', { timeout: 10000 });
  });

  async function createAndOpenFile(page: any, fileName: string, content: string) {
    const result = await page.evaluate(
      async ({ name, fileContent }: { name: string; fileContent: string }) => {
        const response = await fetch('/api/v1/agent/write-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: name, content: fileContent }),
        });
        const data = await response.json();
        return { status: response.status, data };
      },
      { name: fileName, fileContent: content }
    );

    if (result.status !== 200 || result.data.status !== 'success') {
      throw new Error(`[createAndOpenFile] 文件创建失败`);
    }

    await page.waitForTimeout(500);

    const fileItem = page.locator('[data-testid="file-item"]').filter({ hasText: fileName });
    await expect(fileItem).toBeVisible({ timeout: 15000 });
    await fileItem.click();

    const codeEditor = page.locator('[data-testid="code-editor"]');
    await expect(codeEditor).toBeVisible({ timeout: 10000 });
    return codeEditor;
  }

  test('[P0] EPI3.03-E2E-001: 格式化后编辑器内容正确更新', async ({ page }) => {
    const content = Array(100).fill('function test(){const x=1;return x;}').join('\n');
    const codeEditor = await createAndOpenFile(page, 'concurrent-format.ts', content);

    const viewLines = codeEditor.locator('.view-lines');
    await expect(viewLines).toBeVisible({ timeout: 10000 });

    // 触发格式化
    await page.keyboard.press('Control+Shift+F');
    await page.waitForTimeout(1000);

    // 格式化后编辑器内容应展示格式化结果（formatter 会给 = 补空格）
    const editorContent = await viewLines.innerText();
    expect(editorContent).toContain('const x = 1');
    expect(editorContent).not.toContain('const x=1');

    const firstLine = viewLines.locator('.view-line').first();
    await expect(firstLine).toBeVisible({ timeout: 5000 });
  });

  test('[P0] EPI3.03-E2E-002: 格式化后编辑器仍可交互输入', async ({ page }) => {
    const content = Array(200).fill('// concurrent input line').join('\n');
    const codeEditor = await createAndOpenFile(page, 'concurrent-input.ts', content);

    // 触发格式化
    await page.keyboard.press('Control+Shift+F');
    await page.waitForTimeout(500);

    // 格式化后编辑器仍可聚焦并输入（UI 未被阻塞）
    await codeEditor.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type('\n// appended after format');
    await page.waitForTimeout(500);

    const editorContent = await codeEditor.locator('.view-lines').innerText();
    expect(editorContent).toContain('appended after format');
  });

  test('[P1] EPI3.03-E2E-003: 格式化期间编辑器不卡死', async ({ page }) => {
    const content = Array(1000).fill('function big(){return 42;}').join('\n');
    const codeEditor = await createAndOpenFile(page, 'concurrent-big.ts', content);

    // 触发格式化后立即检查编辑器仍可见
    await page.keyboard.press('Control+Shift+F');

    const viewLines = codeEditor.locator('.view-lines');
    await expect(viewLines).toBeVisible({ timeout: 5000 });

    // 编辑器仍响应，内容非空且保留代码（格式化不破坏原有代码）
    const editorContent = await viewLines.innerText();
    expect(editorContent.length).toBeGreaterThan(0);
    expect(editorContent).toContain('function big');
  });
});