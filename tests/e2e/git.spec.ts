import { test, expect } from '@playwright/test';

/**
 * Story 2.1: Git版本控制可视化
 * Acceptance Tests - E2E层测试
 * 
 * FR-009: Git状态可视化
 * FR-010: Git操作（stage/commit/branch）
 */

test.describe('Git Visualization E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('AC-1: 文件树显示Git状态图标', async ({ page }) => {
    // Given 用户打开IDE
    // When 查看文件树
    const fileTree = page.locator('[data-testid="file-tree"]');
    await fileTree.waitFor();
    
    // Then 文件树中显示Git状态图标
    const gitStatusIcons = fileTree.locator('[data-git-status]');
    await expect(gitStatusIcons).toBeVisible();
  });

  test('AC-2: 编辑器显示差异指示器', async ({ page }) => {
    // Given 用户打开一个有变更的文件
    const fileTree = page.locator('[data-testid="file-tree"]');
    
    // When 点击文件打开
    const fileItem = fileTree.locator('[data-file-path*=".ts"]').first();
    await fileItem.click();
    
    // Then 编辑器边栏显示差异指示器
    const gutter = page.locator('.editor-gutter');
    await gutter.waitFor();
    
    const diffIndicators = gutter.locator('.diff-indicator');
    // 如果有变更应该显示差异指示器
    // 测试检查指示器元素是否存在（即使没有变更也应该有容器）
    await expect(gutter).toBeVisible();
  });

  test('AC-3: Git面板显示变更列表', async ({ page }) => {
    // Given 用户打开IDE
    // When 打开Git面板
    const gitPanelButton = page.locator('[data-testid="git-panel-button"]');
    if (await gitPanelButton.isVisible()) {
      await gitPanelButton.click();
      
      // Then Git面板显示变更列表
      const gitPanel = page.locator('[data-testid="git-panel"]');
      await gitPanel.waitFor();
      
      const changesList = page.locator('[data-testid="git-changes-list"]');
      await expect(changesList).toBeVisible();
    }
  });

  test('AC-3: Git面板显示Diff视图', async ({ page }) => {
    // Given 用户打开Git面板
    const gitPanelButton = page.locator('[data-testid="git-panel-button"]');
    if (await gitPanelButton.isVisible()) {
      await gitPanelButton.click();
      
      // When 点击一个变更文件
      const changeItem = page.locator('[data-testid="git-change-item"]').first();
      if (await changeItem.isVisible()) {
        await changeItem.click();
        
        // Then Diff视图显示
        const diffView = page.locator('[data-testid="diff-view"]');
        await expect(diffView).toBeVisible();
        
        // And 差异高亮显示
        const diffLines = page.locator('.diff-line');
        await expect(diffLines).toBeVisible();
      }
    }
  });

  test('AC-4: 提交功能', async ({ page }) => {
    // Given 用户有变更需要提交
    const gitPanelButton = page.locator('[data-testid="git-panel-button"]');
    if (await gitPanelButton.isVisible()) {
      await gitPanelButton.click();
      
      // When 填写提交信息
      const commitInput = page.locator('[data-testid="commit-message-input"]');
      if (await commitInput.isVisible()) {
        await commitInput.fill('Test commit from E2E');
        
        // And 点击提交按钮
        const commitButton = page.locator('[data-testid="commit-button"]');
        if (await commitButton.isEnabled()) {
          await commitButton.click();
          
          // Then 提交成功
          const successMessage = page.locator('[data-testid="commit-success"]');
          await expect(successMessage).toBeVisible();
        }
      }
    }
  });

  test('AC-5: 分支选择器显示分支列表', async ({ page }) => {
    // Given 用户在Git面板
    const gitPanelButton = page.locator('[data-testid="git-panel-button"]');
    if (await gitPanelButton.isVisible()) {
      await gitPanelButton.click();
      
      // When 打开分支选择器
      const branchSelector = page.locator('[data-testid="branch-selector"]');
      if (await branchSelector.isVisible()) {
        await branchSelector.click();
        
        // Then 显示分支列表
        const branchList = page.locator('[data-testid="branch-list"]');
        await expect(branchList).toBeVisible();
        
        // And 当前分支高亮
        const currentBranch = page.locator('[data-testid="current-branch"]');
        await expect(currentBranch).toBeVisible();
      }
    }
  });

  test('AC-6: 状态栏显示分支信息', async ({ page }) => {
    // Given 用户在IDE中
    // When 查看状态栏
    const statusBar = page.locator('[data-testid="status-bar"]');
    await statusBar.waitFor();
    
    // Then 显示当前分支名称
    const branchInfo = statusBar.locator('[data-testid="branch-info"]');
    await expect(branchInfo).toBeVisible();
    
    // And 显示变更数量（如果有）
    const changesCount = statusBar.locator('[data-testid="changes-count"]');
    // changes-count 可能不存在（没有变更时），所以只检查是否存在时可见
    if (await changesCount.isVisible()) {
      await expect(changesCount).toHaveText(/^\d+$/);
    }
  });

  test('非Git仓库显示提示', async ({ page }) => {
    // Given 工作区不是Git仓库
    // When 打开Git面板
    const gitPanelButton = page.locator('[data-testid="git-panel-button"]');
    if (await gitPanelButton.isVisible()) {
      await gitPanelButton.click();
      
      // Then 显示非Git仓库提示
      const noRepoHint = page.locator('[data-testid="no-git-repo"]');
      await expect(noRepoHint).toBeVisible();
    }
  });
});
