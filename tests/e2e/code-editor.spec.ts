import { test, expect } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('[E2E] Code Editor', () => {
  test.skip('[P0] should display empty editor on startup', async ({ page }) => {
    await page.goto(baseURL);

    const editor = page.getByTestId('code-editor');
    await expect(editor).toBeVisible();

    const lineNumbers = page.getByTestId('editor-line-numbers');
    await expect(lineNumbers).toBeVisible();
  });

  test.skip('[P0] should open file in editor when clicked', async ({ page }) => {
    await page.goto(baseURL);

    const fileTree = page.getByTestId('file-tree');
    await fileTree.getByRole('treeitem', { name: 'test-file.txt' }).click();

    const editor = page.getByTestId('code-editor');
    const content = await editor.locator('textarea').inputValue();
    expect(content).toContain('Test file content');
  });

  test.skip('[P0] should allow editing file content', async ({ page }) => {
    await page.goto(baseURL);

    await page.getByTestId('file-tree').getByRole('treeitem', { name: 'test-file.txt' }).click();
    
    const editor = page.getByTestId('code-editor');
    await editor.locator('textarea').fill('New content');

    const modifiedIndicator = page.getByTestId('modified-indicator');
    await expect(modifiedIndicator).toBeVisible();
  });

  test.skip('[P0] should display syntax highlighting for JavaScript', async ({ page }) => {
    await page.goto(baseURL);

    await page.getByTestId('file-tree').getByRole('treeitem', { name: 'test.js' }).click();

    const editor = page.getByTestId('code-editor');
    const keywords = editor.locator('.token-keyword');
    await expect(keywords).toHaveCountGreaterThan(0);
  });

  test.skip('[P0] should display syntax highlighting for TypeScript', async ({ page }) => {
    await page.goto(baseURL);

    await page.getByTestId('file-tree').getByRole('treeitem', { name: 'test.ts' }).click();

    const editor = page.getByTestId('code-editor');
    const types = editor.locator('.token-type');
    await expect(types).toHaveCountGreaterThan(0);
  });

  test.skip('[P0] should display syntax highlighting for Python', async ({ page }) => {
    await page.goto(baseURL);

    await page.getByTestId('file-tree').getByRole('treeitem', { name: 'test.py' }).click();

    const editor = page.getByTestId('code-editor');
    const keywords = editor.locator('.token-keyword');
    await expect(keywords).toHaveCountGreaterThan(0);
  });

  test.skip('[P0] should format code with Ctrl+Shift+F', async ({ page }) => {
    await page.goto(baseURL);

    await page.getByTestId('file-tree').getByRole('treeitem', { name: 'test.js' }).click();

    const editor = page.getByTestId('code-editor');
    await editor.locator('textarea').fill('function foo(){return 1}');

    await page.keyboard.press('Control+Shift+F');

    const formattedContent = await editor.locator('textarea').inputValue();
    expect(formattedContent).toContain('\n');
    expect(formattedContent).toContain('  ');
  });

  test.skip('[P0] should format code via context menu', async ({ page }) => {
    await page.goto(baseURL);

    await page.getByTestId('file-tree').getByRole('treeitem', { name: 'test.js' }).click();

    const editor = page.getByTestId('code-editor');
    await editor.locator('textarea').fill('function foo(){return 1}');

    await editor.click({ button: 'right' });
    await page.getByText('Format Document').click();

    const formattedContent = await editor.locator('textarea').inputValue();
    expect(formattedContent).toContain('\n');
  });

  test.skip('[P1] should collapse code blocks', async ({ page }) => {
    await page.goto(baseURL);

    await page.getByTestId('file-tree').getByRole('treeitem', { name: 'test.js' }).click();

    const collapseButton = page.getByTestId('collapse-button');
    await collapseButton.click();

    const collapsedRegion = page.getByTestId('collapsed-region');
    await expect(collapsedRegion).toBeVisible();
  });

  test.skip('[P1] should expand collapsed code blocks', async ({ page }) => {
    await page.goto(baseURL);

    await page.getByTestId('file-tree').getByRole('treeitem', { name: 'test.js' }).click();

    const collapseButton = page.getByTestId('collapse-button');
    await collapseButton.click();
    await collapseButton.click();

    const collapsedRegion = page.getByTestId('collapsed-region');
    await expect(collapsedRegion).not.toBeVisible();
  });

  test.skip('[P1] should support line selection', async ({ page }) => {
    await page.goto(baseURL);

    await page.getByTestId('file-tree').getByRole('treeitem', { name: 'test.txt' }).click();

    const editor = page.getByTestId('code-editor');
    await editor.locator('textarea').click({ clickCount: 3 });

    const selectedText = await editor.evaluate(() => window.getSelection()?.toString());
    expect(selectedText).toContain('\n');
  });

  test.skip('[P1] should support column selection (multi-cursor)', async ({ page }) => {
    await page.goto(baseURL);

    await page.getByTestId('file-tree').getByRole('treeitem', { name: 'test.txt' }).click();

    const editor = page.getByTestId('code-editor');
    await page.keyboard.down('Alt');
    await editor.locator('textarea').dragTo(editor.locator('textarea'), {
      sourcePosition: { x: 0, y: 10 },
      targetPosition: { x: 50, y: 50 }
    });
    await page.keyboard.up('Alt');

    const cursors = page.getByTestId('cursor');
    await expect(cursors).toHaveCountGreaterThan(1);
  });

  test.skip('[P1] should display line numbers', async ({ page }) => {
    await page.goto(baseURL);

    await page.getByTestId('file-tree').getByRole('treeitem', { name: 'test.txt' }).click();

    const lineNumbers = page.getByTestId('editor-line-numbers');
    const lineCount = await lineNumbers.locator('.line-number').count();
    expect(lineCount).toBeGreaterThan(0);
  });

  test.skip('[P2] should handle large files efficiently', async ({ page }) => {
    await page.goto(baseURL);

    await page.getByTestId('file-tree').getByRole('treeitem', { name: 'large-file.txt' }).click();

    const editor = page.getByTestId('code-editor');
    await expect(editor).toBeVisible();

    const scrollbar = page.getByTestId('editor-scrollbar');
    await expect(scrollbar).toBeVisible();
  });

  test.skip('[P2] should show encoding indicator', async ({ page }) => {
    await page.goto(baseURL);

    await page.getByTestId('file-tree').getByRole('treeitem', { name: 'test.txt' }).click();

    const encodingIndicator = page.getByTestId('encoding-indicator');
    await expect(encodingIndicator).toBeVisible();
    await expect(encodingIndicator).toHaveText('UTF-8');
  });

  test.skip('[P2] should show line ending indicator', async ({ page }) => {
    await page.goto(baseURL);

    await page.getByTestId('file-tree').getByRole('treeitem', { name: 'test.txt' }).click();

    const lineEndingIndicator = page.getByTestId('line-ending-indicator');
    await expect(lineEndingIndicator).toBeVisible();
  });
});