import { test, expect } from '@playwright/test';

test.describe('[P0] AI内联代码补全', () => {
  const mockCompletionResponse = {
    completion: 'bar',
    stopReason: 'length',
    model: 'gpt-4o'
  };

  const getEditorContent = async (page: any) => {
    return page.evaluate(() => {
      const viewLines = document.querySelector('.monaco-editor .view-lines');
      return viewLines?.textContent || '';
    });
  };

  const openEditorWithFile = async (page: any) => {
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="file-item"]', { timeout: 10000 });

    const workspaceFolder = page.locator('[data-testid="file-item"]').filter({ hasText: 'workspace' });
    await workspaceFolder.click({ timeout: 10000 });
    await page.waitForTimeout(500);

    const testTsFile = page.locator('[data-testid="file-item"]').filter({ hasText: 'test.ts' });

    try {
      await testTsFile.click({ timeout: 5000 });
    } catch {
      const testFile = page.locator('[data-testid="file-item"]').filter({ hasText: 'test-completion.ts' });
      await testFile.click({ timeout: 5000 });
    }

    await page.waitForTimeout(500);

    // Click the lazy loading placeholder to trigger Monaco
    const placeholder = page.getByTestId('code-editor-placeholder');
    await expect(placeholder).toBeVisible({ timeout: 5000 });
    await placeholder.click();

    await page.waitForSelector('[data-testid="code-editor"]', { timeout: 15000 });

    // Monaco 编辑器的焦点在内部的 textarea 上
    await page.waitForSelector('.monaco-editor textarea', { timeout: 5000 });
    
    // 点击编辑器区域
    const editor = page.locator('.monaco-editor');
    await editor.click({ timeout: 10000 });
    await page.waitForTimeout(200);
    
    // 聚焦到 Monaco 的 textarea
    const textarea = page.locator('.monaco-editor textarea');
    await textarea.focus();
    await page.waitForTimeout(200);

    // 检查焦点状态
    const isFocused = await page.evaluate(() => {
      const active = document.activeElement;
      return active?.classList.contains('inputarea') || active?.closest('.monaco-editor') !== null;
    });
    console.log('Editor is focused:', isFocused);
  };

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      await page.goto('/');
      await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

      // 创建 test.ts 文件
      let created = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        const result = await page.evaluate(
          async ({ name, content }) => {
            const response = await fetch('/api/v1/agent/write-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filePath: name, content }),
            });
            const data = await response.json();
            return { status: response.status, data };
          },
          { name: 'test.ts', content: '// AI completion test file\nconst foo = 1;\n' }
        );

        if (result.status === 200 && result.data.status === 'success') {
          created = true;
          break;
        }
        if (attempt < 3) {
          await page.waitForTimeout(1000 * attempt);
        }
      }
      if (!created) {
        throw new Error('Failed to create test.ts after 3 attempts');
      }

      // 刷新文件树
      await page.waitForTimeout(1000);
      const refreshButton = page.locator('.refresh-button');
      try {
        if (await refreshButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await refreshButton.click();
        }
      } catch {}

      // 验证文件可见
      const workspaceFolder = page.locator('[data-testid="file-item"]').filter({ hasText: 'workspace' });
      await expect(workspaceFolder).toBeVisible({ timeout: 10000 });
      const hasChildren = await workspaceFolder.locator('xpath=../div[@class="children"]').count();
      if (hasChildren === 0) {
        await workspaceFolder.click();
        await page.waitForTimeout(800);
      }

      const testTsFile = page.locator('[data-testid="file-item"]').filter({ hasText: 'test.ts' });
      for (let retry = 1; retry <= 5; retry++) {
        try {
          await expect(testTsFile.first()).toBeVisible({ timeout: 3000 });
          break;
        } catch {
          try {
            if (await refreshButton.isVisible({ timeout: 500 }).catch(() => false)) {
              await refreshButton.click();
            }
          } catch {}
          await page.waitForTimeout(1000);
        }
      }
    } finally {
      await page.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const mockAIConfig = {
        models: [
          {
            id: 'mock-model-1',
            name: 'Mock AI',
            provider: 'openai' as const,
            apiKey: 'sk-mock-key',
            baseUrl: 'https://api.mock.com/v1',
            model: 'mock-model',
            isActive: true
          }
        ],
        currentModelId: 'mock-model-1'
      };
      sessionStorage.setItem('lapdev-ai-models', JSON.stringify(mockAIConfig));
      localStorage.setItem('lapdev-inline-completion-enabled', JSON.stringify(true));
    });

    // 捕获浏览器 console 日志
    page.on('console', (msg: any) => {
      console.log('Browser console:', msg.text());
    });

    await page.route('**/api/v1/ai/completion', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: mockCompletionResponse
        })
      });
    });

    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 10000 });
  });

  test('[P0] 自动触发补全', async ({ page }) => {
    await openEditorWithFile(page);

    // 检查当前状态值
    const state = await page.evaluate(() => {
      const aiModels = sessionStorage.getItem('lapdev-ai-models');
      const inlineEnabled = localStorage.getItem('lapdev-inline-completion-enabled');
      return JSON.stringify({
        aiModelsExists: aiModels !== null,
        inlineCompletionEnabled: inlineEnabled
      });
    });
    console.log('Current state:', state);

    // 使用全局测试方法设置编辑器值并触发补全
    await page.evaluate(() => {
      if (window.__test_setEditorValue) {
        window.__test_setEditorValue('const foo = ');
      } else {
        console.log('__test_setEditorValue not available');
      }
    });

    await page.waitForTimeout(500);

    // 在触发补全之前开始等待请求（关键修复：必须在请求发送前调用）
    const requestPromise = page.waitForRequest('**/api/v1/ai/completion', { timeout: 15000 });

    // 触发补全
    await page.evaluate(() => {
      if (window.__test_triggerCompletion) {
        window.__test_triggerCompletion();
      } else {
        console.log('__test_triggerCompletion not available');
      }
    });

    // 等待请求完成
    const request = await requestPromise;

    // 验证补全请求已发送
    const requestBody = JSON.parse(request.postData() || '{}');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    expect(requestBody.prompt).toContain('const foo = ');
    expect(requestBody.language).toBe('typescript');

    // 等待补全结果显示
    await page.waitForTimeout(1000);

    // 检查编辑器内容
    const content = await getEditorContent(page);
    console.log('Editor content:', JSON.stringify(content));
  });
});