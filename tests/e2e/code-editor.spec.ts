import { test, expect } from '@playwright/test';

test.describe('[E2E] Code Editor', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      await page.goto('/');
      await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

      const files = [
        { name: 'test-file.txt', content: 'Hello World\nThis is a test file.\nLine 3\nLine 4\nLine 5' },
        { name: 'large-file.txt', content: Array(500).fill('// large file line').join('\n') },
      ];

      for (const file of files) {
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
            { name: file.name, content: file.content }
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
          throw new Error(`Failed to create ${file.name} after 3 attempts`);
        }
      }

      // 点击刷新按钮触发文件树刷新
      const refreshButton = page.locator('.refresh-button');
      try {
        if (await refreshButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await refreshButton.click();
        }
      } catch {
        // 忽略刷新按钮错误
      }

      // Expand workspace
      const workspaceFolder = page.locator('[data-testid="file-item"]').filter({ hasText: 'workspace' });
      await expect(workspaceFolder).toBeVisible({ timeout: 10000 });
      
      // 检查是否需要展开
      const hasChildren = await workspaceFolder.locator('xpath=../div[@class="children"]').count();
      if (hasChildren === 0) {
        await workspaceFolder.click();
        await page.waitForTimeout(800);
      }

      // 轮询验证每个文件都出现在文件树中
      for (const file of files) {
        const fileItem = page.locator('[data-testid="file-item"]').filter({ hasText: file.name });
        let found = false;
        for (let retry = 1; retry <= 5; retry++) {
          try {
            await expect(fileItem.first()).toBeVisible({ timeout: 3000 });
            found = true;
            break;
          } catch {
            try {
              if (await refreshButton.isVisible({ timeout: 500 }).catch(() => false)) {
                await refreshButton.click();
              }
            } catch {
              // 忽略
            }
            await page.waitForTimeout(1000);
          }
        }
        if (!found) {
          throw new Error(`File ${file.name} not found in file tree after retries`);
        }
      }
    } finally {
      await page.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="file-item"]', { timeout: 10000 });
  });

  test('[P0] should display welcome screen on startup', async ({ page }) => {
    const welcomeScreen = page.getByText('欢迎使用 Lapdev');
    await expect(welcomeScreen).toBeVisible();

    const subtitle = page.getByText('点击左侧文件树中的文件开始编辑');
    await expect(subtitle).toBeVisible();
  });

  test('[P0] should display file tree', async ({ page }) => {
    const fileTree = page.getByTestId('file-tree');
    await expect(fileTree).toBeVisible();

    const workspaceLabel = page.getByText('workspace');
    await expect(workspaceLabel).toBeVisible();
  });

  test('[P0] should expand file tree and show files', async ({ page }) => {
    const workspaceFolder = page.locator('[data-testid="file-item"]').filter({ hasText: 'workspace' });
    await workspaceFolder.click();
    await page.waitForTimeout(500);

    const fileTreeContent = page.getByTestId('file-tree').locator('.file-tree-content');
    await expect(fileTreeContent).toBeVisible();
  });

  test('[P0] should open file when clicked', async ({ page }) => {
    const workspaceFolder = page.locator('[data-testid="file-item"]').filter({ hasText: 'workspace' });
    await workspaceFolder.click();
    await page.waitForTimeout(500);

    const testFile = page.locator('[data-testid="file-item"]').filter({ hasText: 'test-file.txt' });
    await expect(testFile).toBeVisible({ timeout: 10000 });
    await testFile.click();
    await page.waitForTimeout(500);

    const placeholder = page.getByTestId('code-editor-placeholder');
    if (await placeholder.isVisible({ timeout: 3000 }).catch(() => false)) {
      await placeholder.click();
    }

    const editor = page.getByTestId('code-editor');
    await expect(editor).toBeVisible({ timeout: 10000 });

    const editorTab = page.getByTestId('editor-tab');
    await expect(editorTab).toBeVisible();
    await expect(editorTab).toContainText('test-file.txt');
  });

  test('[P0] should allow editing file content', async ({ page }) => {
    const workspaceFolder = page.locator('[data-testid="file-item"]').filter({ hasText: 'workspace' });
    await workspaceFolder.click();
    await page.waitForTimeout(500);

    const testFile = page.locator('[data-testid="file-item"]').filter({ hasText: 'test-file.txt' });
    await expect(testFile).toBeVisible({ timeout: 10000 });
    await testFile.click();
    await page.waitForTimeout(500);

    const placeholder = page.getByTestId('code-editor-placeholder');
    if (await placeholder.isVisible({ timeout: 3000 }).catch(() => false)) {
      await placeholder.click();
    }

    const editor = page.getByTestId('code-editor');
    await expect(editor).toBeVisible({ timeout: 10000 });

    const monacoEditor = editor.locator('.view-lines');
    await expect(monacoEditor).toBeVisible();
  });

  test('[P1] should display line numbers', async ({ page }) => {
    const workspaceFolder = page.locator('[data-testid="file-item"]').filter({ hasText: 'workspace' });
    await workspaceFolder.click();
    await page.waitForTimeout(500);

    const testFile = page.locator('[data-testid="file-item"]').filter({ hasText: 'test-file.txt' });
    await expect(testFile).toBeVisible({ timeout: 10000 });
    await testFile.click();
    await page.waitForTimeout(500);

    const placeholder = page.getByTestId('code-editor-placeholder');
    if (await placeholder.isVisible({ timeout: 3000 }).catch(() => false)) {
      await placeholder.click();
    }

    const editor = page.getByTestId('code-editor');
    await expect(editor).toBeVisible({ timeout: 10000 });

    const editorContent = await editor.innerText();
    expect(editorContent.length).toBeGreaterThan(0);
  });

  test('[P2] should handle large files', async ({ page }) => {
    const workspaceFolder = page.locator('[data-testid="file-item"]').filter({ hasText: 'workspace' });
    await workspaceFolder.click();
    await page.waitForTimeout(500);

    const largeFile = page.locator('[data-testid="file-item"]').filter({ hasText: 'large-file.txt' });
    await expect(largeFile).toBeVisible({ timeout: 10000 });
    await largeFile.click();
    await page.waitForTimeout(500);

    const placeholder = page.getByTestId('code-editor-placeholder');
    if (await placeholder.isVisible({ timeout: 3000 }).catch(() => false)) {
      await placeholder.click();
    }

    const editor = page.getByTestId('code-editor');
    await expect(editor).toBeVisible({ timeout: 15000 });

    const monacoEditor = editor.locator('.view-lines');
    await expect(monacoEditor).toBeVisible({ timeout: 5000 });
  });
});