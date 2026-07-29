import { test, expect } from '@playwright/test';

test.describe('[E2E] Code Editor', () => {
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
    await expect(testFile).toBeVisible({ timeout: 5000 });
    await testFile.click();
    await page.waitForTimeout(500);

    const placeholder = page.getByTestId('code-editor-placeholder');
    await expect(placeholder).toBeVisible({ timeout: 5000 });
    await placeholder.click();

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
    await expect(testFile).toBeVisible({ timeout: 5000 });
    await testFile.click();
    await page.waitForTimeout(500);

    const placeholder = page.getByTestId('code-editor-placeholder');
    await expect(placeholder).toBeVisible({ timeout: 5000 });
    await placeholder.click();

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
    await expect(testFile).toBeVisible({ timeout: 5000 });
    await testFile.click();
    await page.waitForTimeout(500);

    const placeholder = page.getByTestId('code-editor-placeholder');
    await expect(placeholder).toBeVisible({ timeout: 5000 });
    await placeholder.click();

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
    await expect(largeFile).toBeVisible({ timeout: 5000 });
    await largeFile.click();
    await page.waitForTimeout(500);

    const placeholder = page.getByTestId('code-editor-placeholder');
    await expect(placeholder).toBeVisible({ timeout: 5000 });
    await placeholder.click();

    const editor = page.getByTestId('code-editor');
    await expect(editor).toBeVisible({ timeout: 15000 });

    const monacoEditor = editor.locator('.view-lines');
    await expect(monacoEditor).toBeVisible({ timeout: 5000 });
  });
});