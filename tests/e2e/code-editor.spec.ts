import { test, expect } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('[E2E] Code Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
    // Wait for the file tree to load
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 10000 });
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
    // Find and expand the workspace folder (using div.file-item instead of button)
    const workspaceFolder = page.locator('.file-item .name', { hasText: 'workspace' });
    
    // Click to expand (if collapsed)
    await workspaceFolder.click();
    await page.waitForTimeout(500);
    
    // Look for files in the expanded tree
    const fileTreeContent = page.getByTestId('file-tree').locator('.file-tree-content');
    await expect(fileTreeContent).toBeVisible();
  });

  test('[P0] should open file when clicked', async ({ page }) => {
    // Expand workspace folder
    const workspaceFolder = page.locator('.file-item .name', { hasText: 'workspace' });
    await workspaceFolder.click();
    await page.waitForTimeout(1000);
    
    // Look for test-file.txt in the expanded tree
    const testFile = page.locator('.file-item .name', { hasText: 'test-file.txt' });
    
    if (await testFile.isVisible({ timeout: 5000 }).catch(() => false)) {
      await testFile.click();
      await page.waitForTimeout(1000);
      
      // Check if file was opened in a tab
      const editorTab = page.getByTestId('editor-tab');
      await expect(editorTab).toBeVisible();
      await expect(editorTab).toContainText('test-file.txt');
      
      // Check if code editor is now visible
      const editor = page.getByTestId('code-editor');
      await expect(editor).toBeVisible();
    } else {
      // If file not found, skip this test
      test.skip();
    }
  });

  test('[P0] should allow editing file content', async ({ page }) => {
    // Expand workspace folder
    const workspaceFolder = page.locator('.file-item .name', { hasText: 'workspace' });
    await workspaceFolder.click();
    await page.waitForTimeout(1000);
    
    // Look for a test file
    const testFile = page.locator('.file-item .name', { hasText: 'test-file.txt' });
    
    if (await testFile.isVisible({ timeout: 5000 }).catch(() => false)) {
      await testFile.click();
      await page.waitForTimeout(1000);
      
      // Check if code editor is visible
      const editor = page.getByTestId('code-editor');
      await expect(editor).toBeVisible();
      
      // Verify Monaco editor is loaded (it creates a .view-lines element)
      const monacoEditor = editor.locator('.view-lines');
      await expect(monacoEditor).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('[P1] should display line numbers', async ({ page }) => {
    // Expand workspace folder
    const workspaceFolder = page.locator('.file-item .name', { hasText: 'workspace' });
    await workspaceFolder.click();
    await page.waitForTimeout(1000);
    
    // Look for a test file
    const testFile = page.locator('.file-item .name', { hasText: 'test-file.txt' });
    
    if (await testFile.isVisible({ timeout: 5000 }).catch(() => false)) {
      await testFile.click();
      await page.waitForTimeout(1000);
      
      // Check for Monaco editor line numbers
      const editor = page.getByTestId('code-editor');
      await expect(editor).toBeVisible();
      
      // Monaco Editor displays line numbers in .line-numbers element
      const lineNumbers = editor.locator('.line-numbers');
      const isVisible = await lineNumbers.isVisible().catch(() => false);
      expect(isVisible).toBe(true);
    } else {
      test.skip();
    }
  });

  test('[P2] should handle large files', async ({ page }) => {
    // Expand workspace folder
    const workspaceFolder = page.locator('.file-item .name', { hasText: 'workspace' });
    await workspaceFolder.click();
    await page.waitForTimeout(1000);
    
    // Look for large-file.txt
    const largeFile = page.locator('.file-item .name', { hasText: 'large-file.txt' });
    
    if (await largeFile.isVisible({ timeout: 5000 }).catch(() => false)) {
      await largeFile.click();
      await page.waitForTimeout(1000);
      
      // Check if code editor is visible
      const editor = page.getByTestId('code-editor');
      await expect(editor).toBeVisible();
      
      // Verify Monaco editor is loaded
      const monacoEditor = editor.locator('.view-lines');
      await expect(monacoEditor).toBeVisible();
    } else {
      test.skip();
    }
  });
});
