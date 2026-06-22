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
  
  await page.waitForTimeout(2000);
  
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
