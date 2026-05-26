import { test, expect } from '@playwright/test';

test.describe('文件树浏览与管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // AC-1: 初始文件树显示
  test.skip('should display file tree on workspace load', async ({ page }) => {
    // Given 用户打开工作区
    // When 进入IDE首页
    // Then 文件树立即显示根目录下的所有文件和文件夹
    const fileTree = page.locator('[data-testid="file-tree"]');
    await expect(fileTree).toBeVisible();
    
    // And 文件夹支持展开/折叠
    const expandButton = page.locator('[data-testid="folder-expand"]').first();
    await expect(expandButton).toBeVisible();
    
    // And 遵循.gitignore忽略规则
    const gitIgnoreItem = page.locator('[data-testid="file-item"]', { hasText: '.git' });
    await expect(gitIgnoreItem).not.toBeVisible();
  });

  // AC-2: 实时刷新
  test.skip('should auto-refresh file tree when files change externally', async ({ page }) => {
    // Given 文件树已显示
    const fileTree = page.locator('[data-testid="file-tree"]');
    await expect(fileTree).toBeVisible();
    
    // When 外部创建/修改/删除文件
    // (通过API创建测试文件)
    await page.request.post('/api/v1/files/create', {
      data: {
        path: '/workspace/test-new-file.txt',
        type: 'file',
        content: 'test content'
      }
    });
    
    // Then 文件树3秒内自动刷新
    const newFile = page.locator('[data-testid="file-item"]', { hasText: 'test-new-file.txt' });
    await expect(newFile).toBeVisible({ timeout: 3000 });
  });

  // AC-3: 右键菜单操作 - 新建文件
  test.skip('should show context menu and create new file', async ({ page }) => {
    // Given 用户右键点击文件/文件夹
    const folderItem = page.locator('[data-testid="file-item"]', { hasText: 'src' });
    await folderItem.click({ button: 'right' });
    
    // When 选择新建文件选项
    const newFileOption = page.locator('[data-testid="context-menu-item"]', { hasText: '新建文件' });
    await expect(newFileOption).toBeVisible();
    await newFileOption.click();
    
    // Then 新建文件输入框出现并可输入
    const input = page.locator('[data-testid="new-file-input"]');
    await expect(input).toBeVisible();
    await input.fill('newfile.ts');
    await input.press('Enter');
    
    // 验证文件创建
    const newFile = page.locator('[data-testid="file-item"]', { hasText: 'newfile.ts' });
    await expect(newFile).toBeVisible();
  });

  // AC-3: 右键菜单操作 - 重命名
  test.skip('should rename file via context menu', async ({ page }) => {
    // Given 用户右键点击文件
    const fileItem = page.locator('[data-testid="file-item"]', { hasText: 'main.ts' });
    await fileItem.click({ button: 'right' });
    
    // When 选择重命名选项
    const renameOption = page.locator('[data-testid="context-menu-item"]', { hasText: '重命名' });
    await renameOption.click();
    
    // Then 输入新名称
    const input = page.locator('[data-testid="rename-input"]');
    await input.fill('main-renamed.ts');
    await input.press('Enter');
    
    // 验证重命名成功
    const renamedFile = page.locator('[data-testid="file-item"]', { hasText: 'main-renamed.ts' });
    await expect(renamedFile).toBeVisible();
  });

  // AC-3: 右键菜单操作 - 删除
  test.skip('should delete file via context menu', async ({ page }) => {
    // Given 用户右键点击文件
    const fileItem = page.locator('[data-testid="file-item"]', { hasText: 'temp.txt' });
    await fileItem.click({ button: 'right' });
    
    // When 选择删除选项
    const deleteOption = page.locator('[data-testid="context-menu-item"]', { hasText: '删除' });
    await deleteOption.click();
    
    // Then 确认对话框出现并确认
    const confirmButton = page.locator('[data-testid="confirm-delete"]');
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();
    
    // 验证文件已删除
    await expect(fileItem).not.toBeVisible();
  });

  // AC-4: 文件打开
  test.skip('should open file in editor when clicked', async ({ page }) => {
    // Given 用户单击文件
    const fileItem = page.locator('[data-testid="file-item"]', { hasText: 'main.ts' });
    
    // When 文件被点击
    await fileItem.click();
    
    // Then 文件在编辑器中打开
    const editorTab = page.locator('[data-testid="editor-tab"]', { hasText: 'main.ts' });
    await expect(editorTab).toBeVisible();
    
    const editorContent = page.locator('[data-testid="editor-content"]');
    await expect(editorContent).toBeVisible();
  });

  // 文件夹展开/折叠测试
  test.skip('should expand and collapse folders', async ({ page }) => {
    // Given 文件树显示
    const fileTree = page.locator('[data-testid="file-tree"]');
    await expect(fileTree).toBeVisible();
    
    // When 点击文件夹展开按钮
    const expandButton = page.locator('[data-testid="folder-expand"]').first();
    await expandButton.click();
    
    // Then 子文件可见
    const childItems = page.locator('[data-testid="file-item"]');
    const countBefore = await childItems.count();
    
    // When 点击文件夹折叠按钮
    await expandButton.click();
    
    // Then 子文件不可见
    const countAfter = await childItems.count();
    expect(countAfter).toBeLessThan(countBefore);
  });
});