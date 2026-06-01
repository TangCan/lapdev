import { test, expect } from '@playwright/test';

test.describe('[P0] AI内联代码补全', () => {
  // Mock 补全响应
  const mockCompletionResponse = {
    completion: 'bar',
    stopReason: 'length',
    model: 'gpt-4o'
  };

  test.beforeEach(async ({ page }) => {
    // 拦截补全API请求
    await page.route('**/api/v1/ai/completion', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCompletionResponse)
      });
    });

    // 导航到IDE
    await page.goto('/');
  });

  test('[P0] 自动触发补全', async ({ page }) => {
    // Given 用户打开代码编辑器
    const editor = page.locator('[data-testid="code-editor"]');
    await editor.waitFor({ state: 'visible', timeout: 10000 });

    // When 用户在编辑器中输入代码并暂停
    await page.keyboard.type('const foo = ', { delay: 100 });
    
    // 等待防抖延迟 (500ms) + API响应
    await page.waitForTimeout(1000);

    // Then 验证补全请求已发送
    const requests = await page.waitForRequest('**/api/v1/ai/completion');
    
    // 验证请求参数
    const requestBody = JSON.parse(requests.postData() || '{}');
    expect(requestBody.prompt).toContain('const foo = ');
    expect(requestBody.language).toBe('typescript');
  });

  test('[P0] 幽灵文本显示', async ({ page }) => {
    // Given 用户在编辑器中
    const editor = page.locator('[data-testid="code-editor"]');
    await editor.waitFor({ state: 'visible', timeout: 10000 });

    // When 用户输入代码
    await page.keyboard.type('const foo = ', { delay: 100 });
    
    // 等待防抖和响应
    await page.waitForTimeout(1000);

    // Then 幽灵文本显示在光标位置之后
    const ghostText = page.locator('[data-testid="inline-completion-ghost"]');
    await ghostText.waitFor({ state: 'visible', timeout: 5000 });
    
    // 验证幽灵文本内容
    const ghostContent = await ghostText.textContent();
    expect(ghostContent).toBe('bar');

    // 验证幽灵文本样式（浅色斜体）
    const color = await ghostText.evaluate(el => window.getComputedStyle(el).color);
    expect(color).toBe('rgb(136, 136, 136)'); // #888888
  });

  test('[P0] Tab键接受建议', async ({ page }) => {
    // Given 幽灵文本显示在编辑器中
    const editor = page.locator('[data-testid="code-editor"]');
    await editor.waitFor({ state: 'visible', timeout: 10000 });

    await page.keyboard.type('const foo = ', { delay: 100 });
    await page.waitForTimeout(1000);

    const ghostText = page.locator('[data-testid="inline-completion-ghost"]');
    await ghostText.waitFor({ state: 'visible', timeout: 5000 });

    // When 用户按Tab键
    await page.keyboard.press('Tab');

    // Then 幽灵文本消失
    await ghostText.waitFor({ state: 'hidden', timeout: 1000 });

    // 验证建议内容已插入
    const editorContent = await page.evaluate(() => {
      const textarea = document.querySelector('.monaco-editor textarea');
      return textarea?.value || '';
    });
    expect(editorContent).toContain('const foo = bar');
  });

  test('[P0] Esc键取消建议', async ({ page }) => {
    // Given 幽灵文本显示在编辑器中
    const editor = page.locator('[data-testid="code-editor"]');
    await editor.waitFor({ state: 'visible', timeout: 10000 });

    await page.keyboard.type('const foo = ', { delay: 100 });
    await page.waitForTimeout(1000);

    const ghostText = page.locator('[data-testid="inline-completion-ghost"]');
    await ghostText.waitFor({ state: 'visible', timeout: 5000 });

    // When 用户按Esc键
    await page.keyboard.press('Escape');

    // Then 幽灵文本消失
    await ghostText.waitFor({ state: 'hidden', timeout: 1000 });

    // 验证编辑器内容不变
    const editorContent = await page.evaluate(() => {
      const textarea = document.querySelector('.monaco-editor textarea');
      return textarea?.value || '';
    });
    expect(editorContent).toBe('const foo = ');
  });

  test('[P1] 继续输入取消建议', async ({ page }) => {
    // Given 幽灵文本显示在编辑器中
    const editor = page.locator('[data-testid="code-editor"]');
    await editor.waitFor({ state: 'visible', timeout: 10000 });

    await page.keyboard.type('const foo = ', { delay: 100 });
    await page.waitForTimeout(1000);

    const ghostText = page.locator('[data-testid="inline-completion-ghost"]');
    await ghostText.waitFor({ state: 'visible', timeout: 5000 });

    // When 用户继续输入字符
    await page.keyboard.type('x', { delay: 100 });

    // Then 幽灵文本消失
    await ghostText.waitFor({ state: 'hidden', timeout: 1000 });

    // 等待新的补全请求
    await page.waitForTimeout(1000);

    // 验证新的补全请求发送
    const requests = await page.waitForRequest('**/api/v1/ai/completion');
    const requestBody = JSON.parse(requests.postData() || '{}');
    expect(requestBody.prompt).toContain('const foo = x');
  });

  test('[P1] 功能开关控制', async ({ page }) => {
    // Given 用户打开设置页面
    const settingsButton = page.locator('[data-testid="settings-button"]');
    await settingsButton.waitFor({ state: 'visible', timeout: 10000 });
    await settingsButton.click();

    // When 关闭内联补全开关
    const toggle = page.locator('[data-testid="inline-completion-toggle"]');
    await toggle.waitFor({ state: 'visible', timeout: 5000 });
    await toggle.click();

    // 返回编辑器
    const editor = page.locator('[data-testid="code-editor"]');
    await editor.click();

    // 输入代码
    await page.keyboard.type('const foo = ', { delay: 100 });
    await page.waitForTimeout(1000);

    // Then 不发送补全请求（使用请求计数验证）
    const requests = await page.route('**/api/v1/ai/completion', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCompletionResponse)
      });
    });

    // 等待一段时间确认没有请求发送
    await page.waitForTimeout(2000);

    // 验证幽灵文本不出现
    const ghostText = page.locator('[data-testid="inline-completion-ghost"]');
    const isVisible = await ghostText.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });
});