import { test, expect } from '@playwright/test';

// ─── EPI1.03: 移除手动 Memoization 回归测试 ────────────────────────────────────
// TDD RED PHASE: All tests use test.skip() until implementation begins.
// These tests verify that removing redundant useMemo/useCallback preserves
// all existing application behavior under React Compiler compilationMode: 'infer'.

test.describe('EPI1.03: 移除手动 Memoization 回归测试 (ATDD Red Phase)', () => {

  // ═══════════════════════════════════════════════════════════════════
  // P0 — Critical CRUD Regression (must pass after memo cleanup)
  // ═══════════════════════════════════════════════════════════════════

  test.skip('[P0] AI Config: 添加模型在移除 memo 后正常工作', async ({ page }) => {
    // TDD RED: After removing useMemo/useCallback from AIConfigPanel,
    // verify that adding a new AI model configuration works correctly.
    // This is a historically fragile area (see aiService immutability fix).
    await page.goto('/settings');
    await expect(page.getByTestId('ai-config-section')).toBeVisible({ timeout: 15000 });

    // Fill in model details
    await page.getByTestId('model-name-input').fill('Test Model');
    await page.getByTestId('model-provider-select').selectOption('openai');
    await page.getByTestId('model-api-key-input').fill('sk-test-key-123');

    // Save and verify model appears in list
    await page.getByTestId('save-model-button').click();
    await expect(page.getByTestId('model-list')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Test Model')).toBeVisible({ timeout: 5000 });
  });

  test.skip('[P0] AI Config: 编辑模型在移除 memo 后正常工作', async ({ page }) => {
    // TDD RED: Edit model configuration after memo removal.
    await page.goto('/settings');
    await expect(page.getByTestId('ai-config-section')).toBeVisible({ timeout: 15000 });

    // Find and edit existing model
    const modelItem = page.getByTestId('model-item').first();
    await expect(modelItem).toBeVisible({ timeout: 5000 });
    await modelItem.getByTestId('edit-model-button').click();

    // Modify and save
    await page.getByTestId('model-name-input').fill('Updated Model');
    await page.getByTestId('save-model-button').click();

    // Verify update
    await expect(page.getByText('Updated Model')).toBeVisible({ timeout: 5000 });
  });

  test.skip('[P0] AI Config: 删除模型在移除 memo 后正常工作', async ({ page }) => {
    // TDD RED: Delete model after memo removal.
    await page.goto('/settings');
    await expect(page.getByTestId('ai-config-section')).toBeVisible({ timeout: 15000 });

    const modelItem = page.getByTestId('model-item').first();
    await modelItem.getByTestId('delete-model-button').click();

    // Confirm deletion
    await page.getByTestId('confirm-delete-button').click();
    await expect(modelItem).not.toBeVisible({ timeout: 5000 });
  });

  test.skip('[P0] AI Config: API key 遮罩显示在移除 memo 后正常', async ({ page }) => {
    // TDD RED: API key masking should work correctly after memo removal.
    await page.goto('/settings');
    await expect(page.getByTestId('ai-config-section')).toBeVisible({ timeout: 15000 });

    // Create a model with API key
    await page.getByTestId('model-name-input').fill('Mask Test');
    await page.getByTestId('model-provider-select').selectOption('deepseek');
    await page.getByTestId('model-api-key-input').fill('sk-secret-key-456');
    await page.getByTestId('save-model-button').click();

    // Verify key is masked in display
    await expect(page.getByTestId('api-key-masked')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('api-key-masked')).not.toHaveTextContent('sk-secret-key-456');
  });

  test.skip('[P0] FileTree 导航在移除 memo 后正常', async ({ page }) => {
    // TDD RED: FileTree navigation works after removing useMemo from FileTreeNode/FileTree.
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    // Navigate through file tree
    const firstFile = page.getByTestId('file-node').first();
    await firstFile.click();
    await expect(page.getByTestId('editor-content')).toBeVisible({ timeout: 10000 });

    // Verify no React errors
    const reactErrors = errors.filter(e =>
      e.includes('React') || e.includes('react-dom') || e.includes('Minified React error')
    );
    expect(reactErrors).toHaveLength(0);
  });

  test.skip('[P0] 代码编辑器打开与编辑在移除 memo 后正常', async ({ page }) => {
    // TDD RED: CodeEditor works after removing useMemo/useCallback wrappers.
    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    // Open a file
    const fileNode = page.getByTestId('file-node').first();
    await fileNode.click();
    await expect(page.getByTestId('editor-content')).toBeVisible({ timeout: 10000 });

    // Verify editor is interactive
    const editor = page.getByTestId('editor-content');
    await expect(editor).toBeEditable({ timeout: 5000 });
  });

  // ═══════════════════════════════════════════════════════════════════
  // P1 — High Priority Feature Regression
  // ═══════════════════════════════════════════════════════════════════

  test.skip('[P1] Terminal 标签管理在移除 memo 后正常', async ({ page }) => {
    // TDD RED: Terminal.tsx has 15 useMemo/useCallback calls.
    // After cleanup, verify tab management still works.
    await page.goto('/');
    await expect(page.getByTestId('terminal-panel')).toBeVisible({ timeout: 15000 });

    // Create new tab
    await page.getByTestId('new-terminal-tab').click();
    await expect(page.getByTestId('terminal-tab-1')).toBeVisible({ timeout: 5000 });

    // Switch tabs
    await page.getByTestId('terminal-tab-0').click();
    await expect(page.getByTestId('terminal-content-0')).toBeVisible({ timeout: 5000 });
  });

  test.skip('[P1] Agent 操作日志正确显示', async ({ page }) => {
    // TDD RED: Agent context hooks cleaned - verify operation log displays.
    await page.goto('/');
    await expect(page.getByTestId('agent-operation-log')).toBeVisible({ timeout: 15000 });

    // Trigger an agent operation
    await page.getByTestId('ai-panel-button').click();
    await expect(page.getByTestId('agent-operation-log')).toBeVisible({ timeout: 10000 });

    // Verify log entries exist
    const logEntries = page.getByTestId('log-entry');
    await expect(logEntries.first()).toBeVisible({ timeout: 5000 });
  });

  test.skip('[P1] Git 面板正确显示', async ({ page }) => {
    // TDD RED: Git context memoization cleaned - verify git panel.
    await page.goto('/');
    await expect(page.getByTestId('git-panel')).toBeVisible({ timeout: 15000 });

    // Verify git status content loads
    await expect(page.getByTestId('git-branch-name')).toBeVisible({ timeout: 10000 });
  });

  test.skip('[P1] Settings 面板多区段导航正常', async ({ page }) => {
    // TDD RED: Settings navigation after memo cleanup.
    await page.goto('/settings');

    // Navigate between settings sections
    await page.getByTestId('settings-ai-section').click();
    await expect(page.getByTestId('ai-config-section')).toBeVisible({ timeout: 10000 });

    await page.getByTestId('settings-general-section').click();
    await expect(page.getByTestId('general-settings-section')).toBeVisible({ timeout: 10000 });
  });

  // ═══════════════════════════════════════════════════════════════════
  // P2 — Stability and Error Checking
  // ═══════════════════════════════════════════════════════════════════

  test.skip('[P2] 快速多路由切换稳定性', async ({ page }) => {
    // TDD RED: Rapid navigation after memo removal should not cause issues.
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const routes = ['/', '/settings', '/', '/settings', '/'];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });
    }

    // No React or React Compiler errors
    const criticalErrors = errors.filter(e =>
      e.includes('React') || e.includes('react-dom') || e.includes('React Compiler')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test.skip('[P2] 控制台零 React/React Compiler 错误', async ({ page }) => {
    // TDD RED: Full session without React or React Compiler console errors.
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Full user journey
    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('editor-content')).toBeVisible({ timeout: 10000 });

    await page.goto('/settings');
    await expect(page.getByTestId('ai-config-section')).toBeVisible({ timeout: 15000 });

    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    // Filter for critical errors
    const criticalErrors = errors.filter(e =>
      e.includes('React') ||
      e.includes('react-dom') ||
      e.includes('Minified React error') ||
      e.includes('React Compiler') ||
      e.includes('babel-plugin-react-compiler')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});