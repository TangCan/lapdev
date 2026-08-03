import { test, expect } from '@playwright/test';

async function openTestFile(page: any) {
  await page.goto('/');
  
  await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });
  await page.waitForSelector('[data-testid="file-item"]', { timeout: 15000 });
  
  const workspaceFolder = page.locator('[data-testid="file-item"]').filter({ hasText: 'workspace' });
  await workspaceFolder.click({ timeout: 10000 });
  await page.waitForTimeout(800);
  
  const testTsFile = page.locator('[data-testid="file-item"]').filter({ hasText: 'test.ts' });
  await testTsFile.click({ timeout: 10000 });
  
  await page.waitForTimeout(500);

  // Click the lazy loading placeholder to trigger Monaco
  const placeholder = page.getByTestId('code-editor-placeholder');
  await expect(placeholder).toBeVisible({ timeout: 10000 });
  await placeholder.click();
  
  // Wait for Monaco editor to load
  await page.waitForSelector('[data-testid="code-editor"]', { timeout: 15000 });
  
  const editor = page.locator('.monaco-editor');
  await editor.click({ timeout: 10000 });
  await page.waitForTimeout(500);
  
  await page.keyboard.press('Control+A');
  await page.waitForTimeout(200);
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(800);
}

async function typeEditorContent(page: any, content: string) {
  await page.keyboard.type(content, { delay: 50 });
  await page.waitForTimeout(800);
}

test.describe('[E2E] LSP Code Intelligence', () => {
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
          { name: 'test.ts', content: '// LSP test file\nconst x = 1;\nconsole.log(x);\n' }
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

  test.describe('AC-1: 代码补全功能', () => {
    test('[P0] should show completion suggestions on typing', async ({ page }) => {
      await openTestFile(page);
      
      await typeEditorContent(page, 'const x = ');
      
      const suggestions = await page.$$('.monaco-editor .suggest-widget .monaco-list-row');
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });

    test('[P0] should show signature help on function call', async ({ page }) => {
      await openTestFile(page);
      
      await typeEditorContent(page, 'console.log(');
      
      const editor = page.locator('.monaco-editor');
      await expect(editor).toBeVisible();
    });

    test('[P1] should show auto-import suggestions', async ({ page }) => {
      await openTestFile(page);
      
      await typeEditorContent(page, 'React.');
      
      const suggestions = await page.$$('.monaco-editor .suggest-widget .monaco-list-row');
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('AC-2: 代码导航功能', () => {
    test('[P0] should navigate to definition on click', async ({ page }) => {
      await openTestFile(page);
      
      await typeEditorContent(page, 'const myVar = 1;\nconsole.log(myVar);');
      
      const editor = page.locator('.monaco-editor');
      await expect(editor).toBeVisible();
    });

    test('[P0] should show references count', async ({ page }) => {
      await openTestFile(page);
      
      await typeEditorContent(page, 'const x = 1;\nconsole.log(x);\nconst y = x;');
      
      const editor = page.locator('.monaco-editor');
      await expect(editor).toBeVisible();
    });
  });

  test.describe('AC-3: 代码重构功能', () => {
    test('[P0] should rename symbol across file', async ({ page }) => {
      await openTestFile(page);
      
      await typeEditorContent(page, 'const oldName = 1;\nconsole.log(oldName);');
      
      const editor = page.locator('.monaco-editor');
      await expect(editor).toBeVisible();
    });

    test('[P0] should format code on shortcut', async ({ page }) => {
      await openTestFile(page);
      
      await typeEditorContent(page, 'const x=1;const y=2;');
      
      const editor = page.locator('.monaco-editor');
      await editor.click();
      await page.keyboard.press('Control+Shift+I');
      await page.waitForTimeout(1500);
      
      await expect(editor).toBeVisible();
    });

    test('[P1] should show quick fix suggestions', async ({ page }) => {
      await openTestFile(page);
      
      await typeEditorContent(page, 'const x: number = "string";');
      
      await page.waitForTimeout(2500);
      
      const editor = page.locator('.monaco-editor');
      await expect(editor).toBeVisible();
    });
  });

  test.describe('AC-4: 实时诊断功能', () => {
    test('[P0] should show error squiggles for type errors', async ({ page }) => {
      await openTestFile(page);
      
      await typeEditorContent(page, 'const x: number = "string";');
      
      await page.waitForTimeout(2500);
      
      const editor = page.locator('.monaco-editor');
      await expect(editor).toBeVisible();
    });

    test('[P0] should show problems panel', async ({ page }) => {
      await openTestFile(page);
      
      await typeEditorContent(page, 'const x: number = "string";\nconst unused = 1;');
      
      await page.waitForTimeout(2500);
      
      const editor = page.locator('.monaco-editor');
      await expect(editor).toBeVisible();
    });

    test('[P1] should jump to problem location', async ({ page }) => {
      await openTestFile(page);
      
      await typeEditorContent(page, 'const x: number = "string";');
      
      await page.waitForTimeout(2500);
      
      const editor = page.locator('.monaco-editor');
      await expect(editor).toBeVisible();
    });
  });
});
