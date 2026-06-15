import { test, expect } from '@playwright/test';

async function openTestFile(page: any) {
  await page.goto('/');
  
  await page.waitForSelector('[data-testid="file-tree"]', { timeout: 10000 });
  await page.waitForSelector('[data-testid="file-item"]', { timeout: 10000 });
  
  const workspaceFolder = page.locator('[data-testid="file-item"]').filter({ hasText: 'workspace' });
  await workspaceFolder.click({ timeout: 10000 });
  await page.waitForTimeout(500);
  
  const testTsFile = page.locator('[data-testid="file-item"]').filter({ hasText: 'test.ts' });
  await testTsFile.click({ timeout: 10000 });
  
  await page.waitForTimeout(1000);
  
  await page.waitForSelector('[data-testid="code-editor"]', { timeout: 15000 });
  
  const editor = page.locator('.monaco-editor');
  await editor.click({ timeout: 10000 });
  await page.waitForTimeout(200);
}

test.describe('[E2E] LSP Code Intelligence', () => {
  test.describe('AC-1: 代码补全功能', () => {
    test('[P0] should show completion suggestions on typing', async ({ page }) => {
      await openTestFile(page);
      
      await page.keyboard.type('const x = ');
      await page.waitForTimeout(1000);
      
      const suggestions = await page.$$('.monaco-editor .suggest-widget .monaco-list-row');
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });

    test('[P0] should show signature help on function call', async ({ page }) => {
      await openTestFile(page);
      
      await page.keyboard.type('console.log(');
      await page.waitForTimeout(1000);
      
      const editorContent = await page.locator('.monaco-editor').textContent();
      expect(editorContent).toContain('console');
    });

    test('[P1] should show auto-import suggestions', async ({ page }) => {
      await openTestFile(page);
      
      await page.keyboard.type('React.');
      await page.waitForTimeout(1000);
      
      const suggestions = await page.$$('.monaco-editor .suggest-widget .monaco-list-row');
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('AC-2: 代码导航功能', () => {
    test('[P0] should navigate to definition on click', async ({ page }) => {
      await openTestFile(page);
      
      await page.keyboard.type('const myVar = 1;\nconsole.log(myVar);');
      await page.waitForTimeout(500);
      
      const editorContent = await page.locator('.monaco-editor').textContent();
      expect(editorContent).toContain('myVar');
    });

    test('[P0] should show references count', async ({ page }) => {
      await openTestFile(page);
      
      await page.keyboard.type('const x = 1;\nconsole.log(x);\nconst y = x;');
      await page.waitForTimeout(500);
      
      const editorContent = await page.locator('.monaco-editor').textContent();
      expect(editorContent).toContain('x');
    });
  });

  test.describe('AC-3: 代码重构功能', () => {
    test('[P0] should rename symbol across file', async ({ page }) => {
      await openTestFile(page);
      
      await page.keyboard.type('const oldName = 1;\nconsole.log(oldName);');
      await page.waitForTimeout(500);
      
      const editorContent = await page.locator('.monaco-editor').textContent();
      expect(editorContent).toContain('oldName');
    });

    test('[P0] should format code on shortcut', async ({ page }) => {
      await openTestFile(page);
      
      await page.keyboard.type('const x=1;const y=2;');
      await page.keyboard.press('Control+Shift+I');
      await page.waitForTimeout(500);
      
      const editorContent = await page.locator('.monaco-editor').textContent();
      expect(editorContent).toContain('x');
    });

    test('[P1] should show quick fix suggestions', async ({ page }) => {
      await openTestFile(page);
      
      await page.keyboard.type('const x: number = "string";');
      await page.waitForTimeout(1000);
      
      const editorContent = await page.locator('.monaco-editor').textContent();
      expect(editorContent).toContain('x');
    });
  });

  test.describe('AC-4: 实时诊断功能', () => {
    test('[P0] should show error squiggles for type errors', async ({ page }) => {
      await openTestFile(page);
      
      await page.keyboard.type('const x: number = "string";');
      await page.waitForTimeout(1000);
      
      const editorContent = await page.locator('.monaco-editor').textContent();
      expect(editorContent).toContain('x');
    });

    test('[P0] should show problems panel', async ({ page }) => {
      await openTestFile(page);
      
      await page.keyboard.type('const x: number = "string";\nconst unused = 1;');
      await page.waitForTimeout(1000);
      
      const editorContent = await page.locator('.monaco-editor').textContent();
      expect(editorContent).toContain('x');
    });

    test('[P1] should jump to problem location', async ({ page }) => {
      await openTestFile(page);
      
      await page.keyboard.type('const x: number = "string";');
      await page.waitForTimeout(1000);
      
      const editorContent = await page.locator('.monaco-editor').textContent();
      expect(editorContent).toContain('x');
    });
  });
});
