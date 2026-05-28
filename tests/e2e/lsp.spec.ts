import { test, expect } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('[E2E] LSP Code Intelligence', () => {
  test.describe('AC-1: 代码补全功能', () => {
    test('[P0] should show completion suggestions on typing', async ({ page }) => {
      await page.goto(baseURL);
      
      // Open a test file
      await page.click('[data-testid="file-tree"] li:text("test.ts")');
      
      // Type in the editor
      await page.click('[data-testid="code-editor"]');
      await page.type('[data-testid="code-editor"]', 'const x = ');
      
      // Wait for completion popup
      await page.waitForSelector('.monaco-editor .suggest-widget');
      
      // Verify completion suggestions are shown
      const suggestions = await page.$$('.suggest-widget .monaco-list-row');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    test('[P0] should show signature help on function call', async ({ page }) => {
      await page.goto(baseURL);
      
      await page.click('[data-testid="file-tree"] li:text("test.ts")');
      await page.click('[data-testid="code-editor"]');
      await page.type('[data-testid="code-editor"]', 'console.log(');
      
      // Wait for signature help
      await page.waitForSelector('.monaco-editor .signature-help-widget');
      
      const signature = await page.textContent('.signature-help-widget');
      expect(signature).toContain('log');
    });

    test('[P1] should show auto-import suggestions', async ({ page }) => {
      await page.goto(baseURL);
      
      await page.click('[data-testid="file-tree"] li:text("test.ts")');
      await page.click('[data-testid="code-editor"]');
      await page.type('[data-testid="code-editor"]', 'React.');
      
      await page.waitForSelector('.monaco-editor .suggest-widget');
      
      const suggestions = await page.$$('.suggest-widget .monaco-list-row');
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  test.describe('AC-2: 代码导航功能', () => {
    test('[P0] should navigate to definition on click', async ({ page }) => {
      await page.goto(baseURL);
      
      await page.click('[data-testid="file-tree"] li:text("test.ts")');
      await page.click('[data-testid="code-editor"]');
      
      // Write test code
      await page.type('[data-testid="code-editor"]', 'const myVar = 1;\nconsole.log(myVar);');
      
      // Click on the variable usage
      await page.click('[data-testid="code-editor"]', { position: { x: 150, y: 28 } });
      
      // Trigger go to definition
      await page.click('[data-testid="context-menu"] >> text="Go to Definition"');
      
      // Verify cursor moved to definition
      const lineNumber = await page.evaluate(() => {
        const editor = window.monaco?.editor.getEditors()[0];
        return editor?.getPosition()?.lineNumber;
      });
      
      expect(lineNumber).toBe(1);
    });

    test('[P0] should show references count', async ({ page }) => {
      await page.goto(baseURL);
      
      await page.click('[data-testid="file-tree"] li:text("test.ts")');
      await page.click('[data-testid="code-editor"]');
      
      await page.type('[data-testid="code-editor"]', 'const x = 1;\nconsole.log(x);\nconst y = x;');
      
      await page.click('[data-testid="code-editor"]', { position: { x: 50, y: 14 } });
      
      // Trigger find references
      await page.click('[data-testid="context-menu"] >> text="Find References"');
      
      // Verify references panel shows
      await page.waitForSelector('[data-testid="references-panel"]');
      
      const referenceCount = await page.textContent('[data-testid="references-count"]');
      expect(referenceCount).toContain('2');
    });
  });

  test.describe('AC-3: 代码重构功能', () => {
    test('[P0] should rename symbol across file', async ({ page }) => {
      await page.goto(baseURL);
      
      await page.click('[data-testid="file-tree"] li:text("test.ts")');
      await page.click('[data-testid="code-editor"]');
      
      await page.type('[data-testid="code-editor"]', 'const oldName = 1;\nconsole.log(oldName);');
      
      await page.click('[data-testid="code-editor"]', { position: { x: 50, y: 14 } });
      
      // Trigger rename
      await page.click('[data-testid="context-menu"] >> text="Rename Symbol"');
      
      // Type new name
      await page.type('[data-testid="rename-input"]', 'newName');
      await page.click('[data-testid="rename-apply"]');
      
      // Verify changes
      const content = await page.evaluate(() => {
        const editor = window.monaco?.editor.getEditors()[0];
        return editor?.getValue();
      });
      
      expect(content).toContain('newName');
      expect(content).not.toContain('oldName');
    });

    test('[P0] should format code on shortcut', async ({ page }) => {
      await page.goto(baseURL);
      
      await page.click('[data-testid="file-tree"] li:text("test.ts")');
      await page.click('[data-testid="code-editor"]');
      
      await page.type('[data-testid="code-editor"]', 'const x=1;const y=2;');
      
      // Trigger format (Ctrl+Shift+I or Alt+Shift+F)
      await page.keyboard.press('Control+Shift+I');
      
      await page.waitForTimeout(500);
      
      const content = await page.evaluate(() => {
        const editor = window.monaco?.editor.getEditors()[0];
        return editor?.getValue();
      });
      
      expect(content).toContain('\n');
    });

    test('[P1] should show quick fix suggestions', async ({ page }) => {
      await page.goto(baseURL);
      
      await page.click('[data-testid="file-tree"] li:text("test.ts")');
      await page.click('[data-testid="code-editor"]');
      
      await page.type('[data-testid="code-editor"]', 'const x: number = "string";');
      
      // Wait for error indicator
      await page.waitForSelector('.monaco-editor .squiggly-error');
      
      // Click on error indicator
      await page.click('.monaco-editor .squiggly-error');
      
      // Verify quick fix menu
      await page.waitForSelector('.monaco-editor .quickfix-widget');
      
      const fixButton = await page.$('.quickfix-widget text="Fix"');
      expect(fixButton).not.toBeNull();
    });
  });

  test.describe('AC-4: 实时诊断功能', () => {
    test('[P0] should show error squiggles for type errors', async ({ page }) => {
      await page.goto(baseURL);
      
      await page.click('[data-testid="file-tree"] li:text("test.ts")');
      await page.click('[data-testid="code-editor"]');
      
      await page.type('[data-testid="code-editor"]', 'const x: number = "string";');
      
      // Wait for squiggly error
      await page.waitForSelector('.monaco-editor .squiggly-error');
      
      const errorCount = await page.$$('.monaco-editor .squiggly-error');
      expect(errorCount.length).toBeGreaterThan(0);
    });

    test('[P0] should show problems panel', async ({ page }) => {
      await page.goto(baseURL);
      
      await page.click('[data-testid="file-tree"] li:text("test.ts")');
      await page.click('[data-testid="code-editor"]');
      
      await page.type('[data-testid="code-editor"]', 'const x: number = "string";\nconst unused = 1;');
      
      // Open problems panel
      await page.click('[data-testid="panel-tabs"] >> text="Problems"');
      
      await page.waitForSelector('[data-testid="problems-panel"]');
      
      const problemCount = await page.textContent('[data-testid="problems-count"]');
      expect(problemCount).toMatch(/\d+/);
    });

    test('[P1] should jump to problem location', async ({ page }) => {
      await page.goto(baseURL);
      
      await page.click('[data-testid="file-tree"] li:text("test.ts")');
      await page.click('[data-testid="code-editor"]');
      
      await page.type('[data-testid="code-editor"]', 'const x: number = "string";');
      
      await page.click('[data-testid="panel-tabs"] >> text="Problems"');
      
      // Click on first problem
      await page.click('[data-testid="problems-panel"] li:first-child');
      
      // Verify cursor position
      const lineNumber = await page.evaluate(() => {
        const editor = window.monaco?.editor.getEditors()[0];
        return editor?.getPosition()?.lineNumber;
      });
      
      expect(lineNumber).toBe(1);
    });
  });
});