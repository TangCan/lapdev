import { test, expect } from '@playwright/test';

test.describe('[Story 1.1] 文件树 E2E 用户旅程 (ATDD)', () => {
  test('[P0] should display file tree on IDE home page', async ({ page, context }) => {
    const baseURL = context.baseURL || 'http://localhost:5173';
    await page.goto(baseURL);

    const fileTree = page.getByTestId('file-tree');
    await expect(fileTree).toBeVisible();

    // 等待文件树加载完成（最多等待5秒）
    const treeItems = fileTree.getByRole('treeitem');
    await expect(treeItems.first()).toBeVisible({ timeout: 5000 });
  });

  test('[P0] should expand and collapse folders', async ({ page, context }) => {
    const baseURL = context.baseURL || 'http://localhost:5173';
    await page.goto(baseURL);

    const fileTree = page.getByTestId('file-tree');
    
    // 等待文件树加载
    const treeItems = fileTree.getByRole('treeitem');
    await expect(treeItems.first()).toBeVisible({ timeout: 5000 });

    // 使用工作区中实际存在的文件夹
    const folder = fileTree.getByRole('treeitem').filter({ hasText: 'test-test' });
    await expect(folder).toBeVisible();

    // 记录初始子元素数量
    const initialCount = await treeItems.count();
    expect(initialCount).toBeGreaterThan(0);

    // 点击展开文件夹
    await folder.click();

    // 等待一下让UI更新
    await page.waitForTimeout(500);

    // 验证子元素数量增加（文件夹展开了）
    const expandedCount = await treeItems.count();
    expect(expandedCount).toBeGreaterThan(initialCount);

    // 再次点击折叠文件夹
    await folder.click();

    // 等待一下让UI更新
    await page.waitForTimeout(500);

    // 验证子元素数量恢复到初始值（文件夹折叠了）
    const collapsedCount = await treeItems.count();
    expect(collapsedCount).toBe(initialCount);
  });

  test.skip('[P1] should respect .gitignore rules', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    const treeContent = await fileTree.textContent();

    expect(treeContent).not.toContain('node_modules');
    expect(treeContent).not.toContain('.git');
  });

  test.skip('[P0] should refresh file tree within 3 seconds when file is created externally', async ({ page, request }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    const initialCount = await fileTree.getByRole('treeitem').count();

    await request.post(`${process.env.BASE_URL || 'http://localhost:5173'}/api/v1/files/create`, {
      data: {
        path: '/workspace/test-refresh.txt',
        type: 'file',
        content: 'test'
      }
    });

    await page.waitForTimeout(3000);

    const newCount = await fileTree.getByRole('treeitem').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test.skip('[P0] should refresh file tree within 3 seconds when file is modified externally', async ({ page, request }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    
    await request.post(`${process.env.BASE_URL || 'http://localhost:5173'}/api/v1/files/write`, {
      data: {
        path: '/workspace/test-file.txt',
        content: `Modified at ${Date.now()}`
      }
    });

    await page.waitForTimeout(3000);

    const fileItem = fileTree.getByText('test-file.txt');
    await expect(fileItem).toBeVisible();
  });

  test.skip('[P0] should refresh file tree within 3 seconds when file is deleted externally', async ({ page, request }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    const initialCount = await fileTree.getByRole('treeitem').count();

    await request.delete(`${process.env.BASE_URL || 'http://localhost:5173'}/api/v1/files/delete`, {
      data: {
        path: '/workspace/test-file.txt'
      }
    });

    await page.waitForTimeout(3000);

    const newCount = await fileTree.getByRole('treeitem').count();
    expect(newCount).toBeLessThan(initialCount);
  });

  test.skip('[P0] should show context menu on right-click', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    const fileItem = fileTree.getByRole('treeitem').first();

    await fileItem.click({ button: 'right' });

    const contextMenu = page.locator('[data-testid="context-menu"]');
    await expect(contextMenu).toBeVisible();
  });

  test.skip('[P0] should create new file via context menu', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    const folder = fileTree.getByRole('treeitem').filter({ hasText: 'test-test' });

    await folder.click({ button: 'right' });

    const contextMenu = page.locator('[data-testid="context-menu"]');
    await expect(contextMenu).toBeVisible();

    const newFileOption = contextMenu.getByText('New File');
    await newFileOption.click();

    const dialog = page.locator('[data-testid="create-file-dialog"]');
    await expect(dialog).toBeVisible();

    const filenameInput = dialog.getByPlaceholder('filename');
    await filenameInput.fill('new-test-file.txt');

    const createButton = dialog.getByText('Create');
    await createButton.click();

    const newFile = fileTree.getByText('new-test-file.txt');
    await expect(newFile).toBeVisible();
  });

  test.skip('[P0] should create new folder via context menu', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    const folder = fileTree.getByRole('treeitem').filter({ hasText: 'test-test' });

    await folder.click({ button: 'right' });

    const contextMenu = page.locator('[data-testid="context-menu"]');
    await expect(contextMenu).toBeVisible();

    const newFolderOption = contextMenu.getByText('New Folder');
    await newFolderOption.click();

    const dialog = page.locator('[data-testid="create-folder-dialog"]');
    await expect(dialog).toBeVisible();

    const foldernameInput = dialog.getByPlaceholder('foldername');
    await foldernameInput.fill('new-test-folder');

    const createButton = dialog.getByText('Create');
    await createButton.click();

    const newFolder = fileTree.getByText('new-test-folder');
    await expect(newFolder).toBeVisible();
  });

  test.skip('[P0] should rename file via context menu', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    const file = fileTree.getByText('test-file.txt');

    await file.click({ button: 'right' });

    const contextMenu = page.locator('[data-testid="context-menu"]');
    await expect(contextMenu).toBeVisible();

    const renameOption = contextMenu.getByText('Rename');
    await renameOption.click();

    const dialog = page.locator('[data-testid="rename-dialog"]');
    await expect(dialog).toBeVisible();

    const nameInput = dialog.getByPlaceholder('new name');
    await nameInput.fill('renamed-file.txt');

    const renameButton = dialog.getByText('Rename');
    await renameButton.click();

    const renamedFile = fileTree.getByText('renamed-file.txt');
    await expect(renamedFile).toBeVisible();
    await expect(file).not.toBeVisible();
  });

  test.skip('[P0] should delete file via context menu', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    const file = fileTree.getByText('test-file.txt');

    await file.click({ button: 'right' });

    const contextMenu = page.locator('[data-testid="context-menu"]');
    await expect(contextMenu).toBeVisible();

    const deleteOption = contextMenu.getByText('Delete');
    await deleteOption.click();

    const confirmDialog = page.locator('[data-testid="confirm-delete-dialog"]');
    await expect(confirmDialog).toBeVisible();

    const confirmButton = confirmDialog.getByText('Delete');
    await confirmButton.click();

    await expect(file).not.toBeVisible();
  });

  test.skip('[P0] should open file in editor when clicked', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    const file = fileTree.getByText('test-file.txt');

    await file.click();

    const editor = page.locator('[data-testid="editor-content"]');
    await expect(editor).toBeVisible();

    const tab = page.locator('[data-testid="editor-tab"]').filter({ hasText: 'test-file.txt' });
    await expect(tab).toBeVisible();
  });

  test.skip('[P1] should close context menu when clicking outside', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    const fileItem = fileTree.getByRole('treeitem').first();

    await fileItem.click({ button: 'right' });

    const contextMenu = page.locator('[data-testid="context-menu"]');
    await expect(contextMenu).toBeVisible();

    await page.click('body');

    await expect(contextMenu).not.toBeVisible();
  });

  test.skip('[P1] should show error when creating file with invalid name', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    const folder = fileTree.getByRole('treeitem').filter({ hasText: 'test-test' });

    await folder.click({ button: 'right' });

    const contextMenu = page.locator('[data-testid="context-menu"]');
    await expect(contextMenu).toBeVisible();

    const newFileOption = contextMenu.getByText('New File');
    await newFileOption.click();

    const dialog = page.locator('[data-testid="create-file-dialog"]');
    await expect(dialog).toBeVisible();

    const filenameInput = dialog.getByPlaceholder('filename');
    await filenameInput.fill('');

    const createButton = dialog.getByText('Create');
    await createButton.click();

    const errorMessage = dialog.locator('.error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText('Filename is required');
  });

  test.skip('[P1] should show error when renaming to existing name', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    const file = fileTree.getByText('test-file.txt');

    await file.click({ button: 'right' });

    const contextMenu = page.locator('[data-testid="context-menu"]');
    await expect(contextMenu).toBeVisible();

    const renameOption = contextMenu.getByText('Rename');
    await renameOption.click();

    const dialog = page.locator('[data-testid="rename-dialog"]');
    await expect(dialog).toBeVisible();

    const nameInput = dialog.getByPlaceholder('new name');
    await nameInput.fill('existing-file.txt');

    const renameButton = dialog.getByText('Rename');
    await renameButton.click();

    const errorMessage = dialog.locator('.error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText('File already exists');
  });

  test.skip('[P1] should show confirmation when deleting non-empty folder', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    const folder = fileTree.getByRole('treeitem').filter({ hasText: 'test-test' });

    await folder.click({ button: 'right' });

    const contextMenu = page.locator('[data-testid="context-menu"]');
    await expect(contextMenu).toBeVisible();

    const deleteOption = contextMenu.getByText('Delete');
    await deleteOption.click();

    const confirmDialog = page.locator('[data-testid="confirm-delete-dialog"]');
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog).toContainText('This folder is not empty');
  });

  test.skip('[P2] should handle large file tree performance', async ({ page }) => {
    await page.goto('/');

    const fileTree = page.getByTestId('file-tree');
    
    const startTime = Date.now();
    const treeItems = fileTree.getByRole('treeitem');
    await expect(treeItems.first()).toBeVisible();
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(1000);

    const count = await treeItems.count();
    expect(count).toBeGreaterThan(100);
  });
});
