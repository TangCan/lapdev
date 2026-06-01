import { test, expect } from '@playwright/test';

test.describe('[P0] AI内联代码补全', () => {
  // Mock 补全响应
  const mockCompletionResponse = {
    completion: 'bar',
    stopReason: 'length',
    model: 'gpt-4o'
  };

  test.beforeEach(async ({ page }) => {
    // 清除localStorage（处理可能的安全限制）
    try {
      await page.evaluate(() => localStorage.clear());
    } catch {
      // 忽略localStorage访问错误（某些浏览器环境可能禁止访问）
    }
    
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

    // Then 验证幽灵文本不出现
    const ghostText = page.locator('[data-testid="inline-completion-ghost"]');
    const isVisible = await ghostText.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  // ============ 扩展测试用例 ============

  test('[P1] 空输入不触发补全', async ({ page }) => {
    // Given 用户打开编辑器
    const editor = page.locator('[data-testid="code-editor"]');
    await editor.waitFor({ state: 'visible', timeout: 10000 });

    // When 用户只输入空格
    await page.keyboard.type('   ', { delay: 100 });
    await page.waitForTimeout(1000);

    // Then 验证幽灵文本不出现
    const ghostText = page.locator('[data-testid="inline-completion-ghost"]');
    const isVisible = await ghostText.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('[P1] 功能开关localStorage持久化', async ({ page }) => {
    // Given 用户打开设置页面
    const settingsButton = page.locator('[data-testid="settings-button"]');
    await settingsButton.waitFor({ state: 'visible', timeout: 10000 });
    await settingsButton.click();

    // When 关闭内联补全开关
    const toggle = page.locator('[data-testid="inline-completion-toggle"]');
    await toggle.waitFor({ state: 'visible', timeout: 5000 });
    await toggle.click();

    // Then 验证localStorage已更新（处理可能的安全限制）
    let storedValue: string | null = null;
    try {
      storedValue = await page.evaluate(() => localStorage.getItem('inline-completion-enabled'));
    } catch {
      // 忽略localStorage访问错误，跳过此验证
      console.log('localStorage access denied, skipping localStorage validation');
    }
    
    // 如果能访问localStorage，验证值
    if (storedValue !== null) {
      expect(storedValue).toBe('false');
    }

    // 刷新页面
    await page.reload();

    // 验证开关状态保持关闭
    await settingsButton.waitFor({ state: 'visible', timeout: 10000 });
    await settingsButton.click();
    
    const isChecked = await toggle.isChecked();
    expect(isChecked).toBe(false);
  });

  test('[P1] 网络错误处理', async ({ page }) => {
    // Given 模拟网络错误
    await page.route('**/api/v1/ai/completion', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'error', message: 'Server error' })
      });
    });

    const editor = page.locator('[data-testid="code-editor"]');
    await editor.waitFor({ state: 'visible', timeout: 10000 });

    // When 用户输入代码
    await page.keyboard.type('const foo = ', { delay: 100 });
    await page.waitForTimeout(1000);

    // Then 验证没有幽灵文本显示（错误被处理）
    const ghostText = page.locator('[data-testid="inline-completion-ghost"]');
    const isVisible = await ghostText.isVisible().catch(() => false);
    expect(isVisible).toBe(false);

    // 验证页面没有崩溃
    expect(page).not.toHaveTitle(/Error/);
  });

  test('[P2] 快速输入防抖效果', async ({ page }) => {
    // Given 用户在编辑器中
    const editor = page.locator('[data-testid="code-editor"]');
    await editor.waitFor({ state: 'visible', timeout: 10000 });

    let requestCount = 0;
    await page.route('**/api/v1/ai/completion', async (route) => {
      requestCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCompletionResponse)
      });
    });

    // When 用户快速输入多个字符
    await page.keyboard.type('const foo = bar', { delay: 50 }); // 50ms间隔，快于500ms防抖
    await page.waitForTimeout(800); // 等待防抖延迟

    // Then 验证只发送了一次请求（防抖生效）
    expect(requestCount).toBe(1);
  });

  test('[P2] 不支持的语言不触发补全', async ({ page }) => {
    // Given 用户在编辑器中打开非支持语言文件
    const editor = page.locator('[data-testid="code-editor"]');
    await editor.waitFor({ state: 'visible', timeout: 10000 });

    // 切换到不支持的语言（假设HTML不支持）
    await page.evaluate(() => {
      // 模拟切换语言
      window.dispatchEvent(new CustomEvent('language-change', { detail: 'html' }));
    });

    // When 用户输入代码
    await page.keyboard.type('<div>', { delay: 100 });
    await page.waitForTimeout(1000);

    // Then 验证幽灵文本不出现
    const ghostText = page.locator('[data-testid="inline-completion-ghost"]');
    const isVisible = await ghostText.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('[P2] 连续Tab键多次接受', async ({ page }) => {
    // Given 用户在编辑器中
    const editor = page.locator('[data-testid="code-editor"]');
    await editor.waitFor({ state: 'visible', timeout: 10000 });

    // 设置连续补全响应
    let completionCount = 0;
    await page.route('**/api/v1/ai/completion', async (route) => {
      completionCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          completion: completionCount === 1 ? 'bar' : 'baz',
          stopReason: 'length',
          model: 'gpt-4o'
        })
      });
    });

    // When 用户输入并连续按Tab
    await page.keyboard.type('const foo = ', { delay: 100 });
    await page.waitForTimeout(1000);
    
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);
    
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);

    // Then 验证两次补全都被接受
    const editorContent = await page.evaluate(() => {
      const textarea = document.querySelector('.monaco-editor textarea');
      return textarea?.value || '';
    });
    expect(editorContent).toContain('const foo = barbaz');
  });

  test('[P2] 补全响应为空时不显示幽灵文本', async ({ page }) => {
    // Given 模拟空响应
    await page.route('**/api/v1/ai/completion', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ completion: '', stopReason: 'length', model: 'gpt-4o' })
      });
    });

    // When 用户输入代码
    const editor = page.locator('[data-testid="code-editor"]');
    await editor.waitFor({ state: 'visible', timeout: 10000 });

    await page.keyboard.type('const foo = ', { delay: 100 });
    await page.waitForTimeout(1000);

    // Then 验证幽灵文本不出现
    const ghostText = page.locator('[data-testid="inline-completion-ghost"]');
    const isVisible = await ghostText.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });
});