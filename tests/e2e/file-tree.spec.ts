import { test, expect } from '@playwright/test';

test.describe('[Story 1.1] 文件树 E2E 用户旅程 (ATDD)', () => {
  test('[P0] should display file tree on IDE home page', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    await expect(fileTree).toBeVisible({ timeout: 10000 });

    const treeItems = fileTree.getByRole('treeitem');
    await expect(treeItems.first()).toBeVisible({ timeout: 10000 });
  });

  test('[P0] should expand and collapse folders', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    await expect(fileTree).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(2000);

    const treeItems = fileTree.getByRole('treeitem');
    await expect(treeItems.first()).toBeVisible({ timeout: 10000 });

    const initialCount = await treeItems.count();

    const expandIcons = fileTree.locator('[data-testid="folder-expand"]');
    const expandIconCount = await expandIcons.count();
    
    if (expandIconCount > 0) {
      await expandIcons.first().click();
      
      await page.waitForTimeout(500);
      await expect(treeItems.first()).toBeVisible({ timeout: 5000 });
      
      const expandedCount = await fileTree.getByRole('treeitem').count();
      expect(expandedCount).toBeGreaterThan(initialCount);

      await expandIcons.first().click();
      
      await page.waitForTimeout(500);
      await expect(treeItems.first()).toBeVisible({ timeout: 5000 });
      
      const collapsedCount = await fileTree.getByRole('treeitem').count();
      expect(collapsedCount).toBe(initialCount);
    }
  });

  test.skip('[P1] should respect .gitignore rules', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    const treeContent = await fileTree.textContent();
    expect(treeContent).not.toContain('.git');
  });

  test.skip('[P1] should show file size and modification time', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    await fileTree.locator('[data-testid="folder-expand"]').first().click();

    const fileItem = fileTree.locator('.file-item.file').first();
    await expect(fileItem).toBeVisible();

    const fileInfo = await fileItem.textContent();
    expect(fileInfo).toBeTruthy();
  });

  test.skip('[P1] should open file in editor when clicked', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    await fileTree.locator('[data-testid="folder-expand"]').first().click();

    const fileItem = fileTree.locator('.file-item.file', { hasText: 'test.txt' }).first();
    await fileItem.click();

    const editor = page.getByTestId('editor');
    await expect(editor).toBeVisible();
  });

  test.skip('[P2] should allow right-click context menu', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    const fileItem = fileTree.locator('.file-item').first();
    
    await fileItem.click({ button: 'right' });

    const contextMenu = page.getByTestId('context-menu');
    await expect(contextMenu).toBeVisible();
  });

  test.skip('[P2] should allow creating new file', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    await fileTree.locator('[data-testid="folder-expand"]').first().click();

    await fileTree.click({ button: 'right' });

    const newFileOption = page.getByText('New File');
    await newFileOption.click();

    const fileNameInput = page.getByTestId('file-name-input');
    await fileNameInput.fill('new-test-file.txt');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(1000);

    const newFile = fileTree.locator('.file-item.file', { hasText: 'new-test-file.txt' });
    await expect(newFile).toBeVisible();
  });

  test.skip('[P2] should allow creating new folder', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    await fileTree.locator('[data-testid="folder-expand"]').first().click();

    await fileTree.click({ button: 'right' });

    const newFolderOption = page.getByText('New Folder');
    await newFolderOption.click();

    const folderNameInput = page.getByTestId('folder-name-input');
    await folderNameInput.fill('new-test-folder');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(1000);

    const newFolder = fileTree.locator('.file-item.directory', { hasText: 'new-test-folder' });
    await expect(newFolder).toBeVisible();
  });

  test.skip('[P2] should allow renaming file', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    await fileTree.locator('[data-testid="folder-expand"]').first().click();

    const fileItem = fileTree.locator('.file-item.file', { hasText: 'test.txt' }).first();
    await fileItem.dblclick();

    const renameInput = page.getByTestId('rename-input');
    await renameInput.fill('renamed-test.txt');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(1000);

    const renamedFile = fileTree.locator('.file-item.file', { hasText: 'renamed-test.txt' });
    await expect(renamedFile).toBeVisible();
  });

  test.skip('[P2] should allow deleting file', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    await fileTree.locator('[data-testid="folder-expand"]').first().click();

    const fileItem = fileTree.locator('.file-item.file', { hasText: 'test.txt' }).first();
    await fileItem.click({ button: 'right' });

    const deleteOption = page.getByText('Delete');
    await deleteOption.click();

    const confirmButton = page.getByText('Yes');
    await confirmButton.click();

    await page.waitForTimeout(1000);

    const deletedFile = fileTree.locator('.file-item.file', { hasText: 'test.txt' });
    await expect(deletedFile).not.toBeVisible();
  });

  test.skip('[P3] should show loading state', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    const loadingIndicator = fileTree.locator('.loading');
    await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
  });

  test.skip('[P3] should show error state when tree fails to load', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    const errorIndicator = fileTree.locator('.error');
    await expect(errorIndicator).not.toBeVisible();
  });

  test.skip('[P3] should refresh file tree when refresh button clicked', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    const refreshButton = fileTree.locator('.refresh-button');
    await refreshButton.click();

    const loadingIndicator = fileTree.locator('.loading');
    await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
  });

  test.skip('[P3] should handle large file trees efficiently', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    const startTime = Date.now();
    
    await fileTree.locator('[data-testid="folder-expand"]').first().click();
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test.skip('[P3] should highlight selected file', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    await fileTree.locator('[data-testid="folder-expand"]').first().click();

    const fileItem = fileTree.locator('.file-item.file').first();
    await fileItem.click();

    expect(fileItem).toHaveClass('selected');
  });
});
