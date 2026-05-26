import { test, expect } from '@playwright/test';

test.describe('[Story 1.1] 文件树 E2E 用户旅程 (ATDD)', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';

  test.skip('[P0] should display file tree on IDE home page', async ({ page }) => {
    await page.goto(baseURL);

    const fileTree = page.getByTestId('file-tree');
    await expect(fileTree).toBeVisible();

    const treeItems = fileTree.getByRole('treeitem');
    const count = await treeItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test.skip('[P0] should expand and collapse folders', async ({ page }) => {
    await page.goto(baseURL);

    const fileTree = page.getByTestId('file-tree');
    const folder = fileTree.getByRole('treeitem').filter({ hasText: 'frontend' });

    await folder.click();

    const expandedChildren = fileTree.getByRole('treeitem').filter({ hasText: 'src' });
    await expect(expandedChildren).toBeVisible();

    await folder.click();

    await expect(expandedChildren).not.toBeVisible();
  });

  test.skip('[P1] should respect .gitignore rules', async ({ page }) => {
    await page.goto(baseURL);

    const fileTree = page.getByTestId('file-tree');
    const treeContent = await fileTree.textContent();

    expect(treeContent).not.toContain('node_modules');
    expect(treeContent).not.toContain('.git');
  });

  test.skip('[P0] should refresh file tree within 3 seconds when file is created externally', async ({ page, request }) => {
    await page.goto(baseURL);

    const fileTree = page.getByTestId('file-tree');
    const initialCount = await fileTree.getByRole('treeitem').count();

    await request.post(`${baseURL}/api/v1/files/create`, {
      data: { path: '/workspace/test-new-file.txt', type: 'file', content: 'test' }
    });

    await page.waitForTimeout(3000);

    const newCount = await fileTree.getByRole('treeitem').count();
    expect(newCount).toBe(initialCount + 1);

    const newFile = fileTree.getByRole('treeitem').filter({ hasText: 'test-new-file.txt' });
    await expect(newFile).toBeVisible();
  });

  test.skip('[P0] should refresh file tree within 3 seconds when file is modified externally', async ({ page, request }) => {
    await page.goto(baseURL);

    const fileTree = page.getByTestId('file-tree');
    const existingFile = fileTree.getByRole('treeitem').filter({ hasText: 'package.json' });

    await request.post(`${baseURL}/api/v1/files/create`, {
      data: { path: '/workspace/package.json', type: 'file', content: '{"modified": true}' }
    });

    await page.waitForTimeout(3000);

    await expect(existingFile).toBeVisible();
  });

  test.skip('[P0] should refresh file tree within 3 seconds when file is deleted externally', async ({ page, request }) => {
    await page.goto(baseURL);

    await request.post(`${baseURL}/api/v1/files/create`, {
      data: { path: '/workspace/test-delete.txt', type: 'file', content: 'test' }
    });

    const fileTree = page.getByTestId('file-tree');
    const fileToDelete = fileTree.getByRole('treeitem').filter({ hasText: 'test-delete.txt' });
    await expect(fileToDelete).toBeVisible();

    await request.delete(`${baseURL}/api/v1/files/delete`, {
      data: { path: '/workspace/test-delete.txt' }
    });

    await page.waitForTimeout(3000);

    await expect(fileToDelete).not.toBeVisible();
  });

  test.skip('[P0] should show context menu on right-click', async ({ page }) => {
    await page.goto(baseURL);

    const fileTree = page.getByTestId('file-tree');
    const file = fileTree.getByRole('treeitem').filter({ hasText: 'package.json' });

    await file.click({ button: 'right' });

    const contextMenu = page.getByTestId('context-menu');
    await expect(contextMenu).toBeVisible();

    await expect(contextMenu.getByRole('menuitem', { name: 'New File' })).toBeVisible();
    await expect(contextMenu.getByRole('menuitem', { name: 'New Folder' })).toBeVisible();
    await expect(contextMenu.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
    await expect(contextMenu.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
  });

  test.skip('[P0] should create new file via context menu', async ({ page }) => {
    await page.goto(baseURL);

    const fileTree = page.getByTestId('file-tree');
    const workspace = fileTree.getByRole('treeitem').filter({ hasText: 'workspace' });

    await workspace.click({ button: 'right' });

    const contextMenu = page.getByTestId('context-menu');
    await contextMenu.getByRole('menuitem', { name: 'New File' }).click();

    const modal = page.getByTestId('create-file-modal');
    await expect(modal).toBeVisible();

    await modal.getByRole('textbox', { name: 'File Name' }).fill('test-new.txt');
    await modal.getByRole('button', { name: 'Create' }).click();

    const newFile = fileTree.getByRole('treeitem').filter({ hasText: 'test-new.txt' });
    await expect(newFile).toBeVisible();
  });

  test.skip('[P0] should create new folder via context menu', async ({ page }) => {
    await page.goto(baseURL);

    const fileTree = page.getByTestId('file-tree');
    const workspace = fileTree.getByRole('treeitem').filter({ hasText: 'workspace' });

    await workspace.click({ button: 'right' });

    const contextMenu = page.getByTestId('context-menu');
    await contextMenu.getByRole('menuitem', { name: 'New Folder' }).click();

    const modal = page.getByTestId('create-folder-modal');
    await expect(modal).toBeVisible();

    await modal.getByRole('textbox', { name: 'Folder Name' }).fill('test-new-folder');
    await modal.getByRole('button', { name: 'Create' }).click();

    const newFolder = fileTree.getByRole('treeitem').filter({ hasText: 'test-new-folder' });
    await expect(newFolder).toBeVisible();
  });

  test.skip('[P0] should rename file via context menu', async ({ page }) => {
    await page.goto(baseURL);

    const fileTree = page.getByTestId('file-tree');
    const file = fileTree.getByRole('treeitem').filter({ hasText: 'package.json' });

    await file.click({ button: 'right' });

    const contextMenu = page.getByTestId('context-menu');
    await contextMenu.getByRole('menuitem', { name: 'Rename' }).click();

    const modal = page.getByTestId('rename-modal');
    await expect(modal).toBeVisible();

    const nameInput = modal.getByRole('textbox', { name: 'New Name' });
    await nameInput.fill('renamed-package.json');
    await modal.getByRole('button', { name: 'Rename' }).click();

    const renamedFile = fileTree.getByRole('treeitem').filter({ hasText: 'renamed-package.json' });
    await expect(renamedFile).toBeVisible();
  });

  test.skip('[P0] should delete file via context menu', async ({ page }) => {
    await page.goto(baseURL);

    const fileTree = page.getByTestId('file-tree');
    const file = fileTree.getByRole('treeitem').filter({ hasText: 'test-delete-me.txt' });

    await file.click({ button: 'right' });

    const contextMenu = page.getByTestId('context-menu');
    await contextMenu.getByRole('menuitem', { name: 'Delete' }).click();

    const confirmModal = page.getByTestId('delete-confirm-modal');
    await expect(confirmModal).toBeVisible();

    await confirmModal.getByRole('button', { name: 'Delete' }).click();

    await expect(file).not.toBeVisible();
  });

  test.skip('[P0] should open file in editor when clicked', async ({ page }) => {
    await page.goto(baseURL);

    const fileTree = page.getByTestId('file-tree');
    const file = fileTree.getByRole('treeitem').filter({ hasText: 'package.json' });

    await file.click();

    const editor = page.getByTestId('editor');
    await expect(editor).toBeVisible();

    const editorContent = editor.getByTestId('editor-content');
    await expect(editorContent).toBeVisible();

    const fileName = editor.getByTestId('editor-file-name');
    await expect(fileName).toHaveText('package.json');
  });

  test.skip('[P1] should close context menu when clicking outside', async ({ page }) => {
    await page.goto(baseURL);

    const fileTree = page.getByTestId('file-tree');
    const file = fileTree.getByRole('treeitem').filter({ hasText: 'package.json' });

    await file.click({ button: 'right' });

    const contextMenu = page.getByTestId('context-menu');
    await expect(contextMenu).toBeVisible();

    await page.mouse.click(10, 10);

    await expect(contextMenu).not.toBeVisible();
  });

  test.skip('[P1] should show error when creating file with invalid name', async ({ page }) => {
    await page.goto(baseURL);

    const fileTree = page.getByTestId('file-tree');
    const workspace = fileTree.getByRole('treeitem').filter({ hasText: 'workspace' });

    await workspace.click({ button: 'right' });

    const contextMenu = page.getByTestId('context-menu');
    await contextMenu.getByRole('menuitem', { name: 'New File' }).click();

    const modal = page.getByTestId('create-file-modal');
    await modal.getByRole('textbox', { name: 'File Name' }).fill('../../../etc/passwd');
    await modal.getByRole('button', { name: 'Create' }).click();

    const errorMessage = modal.getByTestId('error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText(/invalid path/i);
  });

  test.skip('[P1] should show error when renaming to existing name', async ({ page }) => {
    await page.goto(baseURL);

    const fileTree = page.getByTestId('file-tree');
    const file = fileTree.getByRole('treeitem').filter({ hasText: 'package.json' });

    await file.click({ button: 'right' });

    const contextMenu = page.getByTestId('context-menu');
    await contextMenu.getByRole('menuitem', { name: 'Rename' }).click();

    const modal = page.getByTestId('rename-modal');
    await modal.getByRole('textbox', { name: 'New Name' }).fill('vite.config.ts');
    await modal.getByRole('button', { name: 'Rename' }).click();

    const errorMessage = modal.getByTestId('error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText(/already exists/i);
  });

  test.skip('[P1] should show confirmation when deleting non-empty folder', async ({ page }) => {
    await page.goto(baseURL);

    const fileTree = page.getByTestId('file-tree');
    const folder = fileTree.getByRole('treeitem').filter({ hasText: 'frontend' });

    await folder.click({ button: 'right' });

    const contextMenu = page.getByTestId('context-menu');
    await contextMenu.getByRole('menuitem', { name: 'Delete' }).click();

    const confirmModal = page.getByTestId('delete-confirm-modal');
    await expect(confirmModal).toBeVisible();

    const warningMessage = confirmModal.getByTestId('warning-message');
    await expect(warningMessage).toHaveText(/not empty/i);
  });

  test.skip('[P2] should handle large file tree performance', async ({ page, request }) => {
    for (let i = 0; i < 100; i++) {
      await request.post(`${baseURL}/api/v1/files/create`, {
        data: { path: `/workspace/file-${i}.txt`, type: 'file', content: `content ${i}` }
      });
    }

    const startTime = Date.now();
    await page.goto(baseURL);

    const fileTree = page.getByTestId('file-tree');
    await expect(fileTree).toBeVisible();

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });
});