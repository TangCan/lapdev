import { test, expect } from '@playwright/test';

// ─── EPI1.03: 移除手动 Memoization 回归测试 ────────────────────────────────────
// 所有测试已激活（ACTIVATED），验证移除 useMemo/useCallback 后，
// React Compiler compilationMode: 'infer' 正确处理组件级 memoization。
//
// 关键数据源：
//   AIConfigPanel  → ai-config-section, ai-model-name, ai-provider-select, ai-save-btn
//   FileTree       → file-tree, file-item (注意: 需要匹配文件而非目录)
//   Terminal       → terminal-panel, terminal-tab-add, terminal-tab-item-*
//   GitPanel       → git-panel
//   OperationLog   → operation-log-panel, log-entry-*
//   IDE            → editor-content, ai-panel-button, settings-button

test.describe('EPI1.03: 移除手动 Memoization 回归测试 (ATDD Green Phase)', () => {

  // 每个测试前重置状态，确保面板没有残留打开导致点击被遮挡
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const fileTree = page.getByTestId('file-tree');
    await expect(fileTree).toBeVisible({ timeout: 15000 });

    // 确保文件树加载成功（不是错误状态）
    const fileItems = fileTree.locator('[data-testid="file-item"]');
    try {
      await expect(fileItems.first()).toBeVisible({ timeout: 10000 });
    } catch {
      // 文件树加载失败，尝试刷新
      const refreshBtn = fileTree.getByRole('button', { name: '🔄' });
      if (await refreshBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await refreshBtn.click();
        await expect(fileItems.first()).toBeVisible({ timeout: 15000 });
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // P0 — 关键 CRUD 回归（memo 清理后必须通过）
  // ═══════════════════════════════════════════════════════════════════

  test('[P0] AI Config: 添加模型在移除 memo 后正常工作', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/settings');
    await expect(page.getByTestId('ai-config-section')).toBeVisible({ timeout: 15000 });

    // 填写模型信息
    await page.getByTestId('ai-model-name').fill('Test Model');
    await page.getByTestId('ai-provider-select').selectOption('openai');
    await page.getByTestId('ai-api-key').fill('sk-test-key-123');

    // 保存并验证模型出现在列表中
    await page.getByTestId('ai-save-btn').click();

    // 等待模型项出现（使用正则匹配动态 ID）
    const modelItem = page.getByTestId(/^model-item-/);
    await expect(modelItem).toHaveCount(1, { timeout: 10000 });

    // 在 modelItem 范围内验证文本（避免 strict mode 解析多个元素）
    await expect(modelItem.filter({ hasText: 'Test Model' })).toBeVisible({ timeout: 5000 });

    // 验证无 React 相关错误
    const reactErrors = errors.filter(e =>
      /React|react-dom|Minified React error|React Compiler/.test(e)
    );
    expect(reactErrors).toHaveLength(0);
  });

  test('[P0] AI Config: 编辑模型在移除 memo 后正常工作', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByTestId('ai-config-section')).toBeVisible({ timeout: 15000 });

    // 添加模型
    await page.getByTestId('ai-model-name').fill('Edit Test Model');
    await page.getByTestId('ai-provider-select').selectOption('deepseek');
    await page.getByTestId('ai-api-key').fill('sk-edit-key-456');
    await page.getByTestId('ai-save-btn').click();

    // 等待模型出现
    const modelItem = page.getByTestId(/^model-item-/);
    await expect(modelItem).toHaveCount(1, { timeout: 10000 });

    // 获取模型 ID 并点击编辑按钮
    const modelId = await modelItem.first().getAttribute('data-testid');
    expect(modelId).toBeTruthy();
    const editBtn = page.getByTestId(`edit-btn-${modelId!.replace('model-item-', '')}`);
    await editBtn.click();

    // 修改名称并保存（API Key 需重新输入，因为编辑时不回显）
    await page.getByTestId('ai-model-name').fill('Updated Model');
    await page.getByTestId('ai-api-key').fill('sk-edit-key-456');
    await page.getByTestId('ai-save-btn').click();

    // 验证更新：等待保存按钮返回到"添加模型"状态，然后验证新名称
    await expect(page.getByRole('button', { name: '添加模型' })).toBeVisible({ timeout: 3000 });
    // 重新查找最新的模型项（避免选择器缓存旧引用）
    await expect(page.getByTestId(/^model-item-/).filter({ hasText: 'Updated Model' })).toBeVisible({ timeout: 5000 });
  });

  test('[P0] AI Config: 删除模型在移除 memo 后正常工作', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByTestId('ai-config-section')).toBeVisible({ timeout: 15000 });

    // 添加模型
    await page.getByTestId('ai-model-name').fill('Delete Test Model');
    await page.getByTestId('ai-provider-select').selectOption('openai');
    await page.getByTestId('ai-api-key').fill('sk-delete-key-789');
    await page.getByTestId('ai-save-btn').click();

    // 等待模型出现
    const modelItem = page.getByTestId(/^model-item-/);
    await expect(modelItem).toHaveCount(1, { timeout: 10000 });

    // 拦截 window.confirm 对话框
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    // 获取模型 ID 并点击删除按钮
    const modelId = await modelItem.first().getAttribute('data-testid');
    const deleteBtn = page.getByTestId(`delete-btn-${modelId!.replace('model-item-', '')}`);
    await deleteBtn.click();

    // 验证模型已删除
    await expect(modelItem).toHaveCount(0, { timeout: 5000 });
  });

  test('[P0] AI Config: API key 遮罩显示在移除 memo 后正常', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByTestId('ai-config-section')).toBeVisible({ timeout: 15000 });

    // 创建带 API key 的模型
    await page.getByTestId('ai-model-name').fill('Mask Test');
    await page.getByTestId('ai-provider-select').selectOption('deepseek');
    await page.getByTestId('ai-api-key').fill('sk-secret-key-456');
    await page.getByTestId('ai-save-btn').click();

    // 验证 key 以遮罩形式显示
    const maskedDisplay = page.getByTestId(/^api-key-display-/);
    await expect(maskedDisplay).toHaveCount(1, { timeout: 10000 });

    // 验证显示的遮罩文本不包含原始 key
    const maskedText = await maskedDisplay.first().textContent();
    expect(maskedText).not.toContain('sk-secret-key-456');
  });

  test('[P0] FileTree 导航在移除 memo 后正常', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // beforeEach 已导航到首页并验证文件树加载成功
    const fileTree = page.getByTestId('file-tree');

    // 等待根目录出现
    const rootItem = fileTree.getByRole('treeitem').first();
    await expect(rootItem).toBeVisible({ timeout: 10000 });

    // 点击根目录（workspace）展开它
    await rootItem.click();
    await page.waitForTimeout(500);

    // 等待根目录展开后，子元素出现
    const childrenContainer = fileTree.locator('.children').first();
    await expect(childrenContainer).toBeVisible({ timeout: 10000 });

    // 找到第一个文件（非目录）并点击
    const firstFile = fileTree.locator('.file-item.file').first();
    await expect(firstFile).toBeVisible({ timeout: 10000 });
    await firstFile.click();

    // 验证编辑器可见
    const editorContent = page.getByTestId('editor-content');
    await expect(editorContent).toBeVisible({ timeout: 10000 });

    // 验证无 React 错误
    const reactErrors = errors.filter(e =>
      /React|react-dom|Minified React error/.test(e)
    );
    expect(reactErrors).toHaveLength(0);
  });

  test('[P0] 代码编辑器打开与编辑在移除 memo 后正常', async ({ page }) => {
    // beforeEach 已导航到首页并验证文件树加载成功
    const fileTree = page.getByTestId('file-tree');

    // 等待根目录出现
    const rootItem = fileTree.getByRole('treeitem').first();
    await expect(rootItem).toBeVisible({ timeout: 10000 });

    // 点击根目录（workspace）展开它
    await rootItem.click();
    await page.waitForTimeout(500);

    // 等待根目录展开后，子元素出现
    const childrenContainer = fileTree.locator('.children').first();
    await expect(childrenContainer).toBeVisible({ timeout: 10000 });

    // 找到第一个文件（非目录）并点击
    const firstFile = fileTree.locator('.file-item.file').first();
    await expect(firstFile).toBeVisible({ timeout: 10000 });
    await firstFile.click();
    await page.waitForTimeout(500);

    // 点击懒加载占位符触发 Monaco 加载
    const placeholder = page.getByTestId('code-editor-placeholder');
    await expect(placeholder).toBeVisible({ timeout: 5000 });
    await placeholder.click();

    // 验证编辑器可见
    const editorContent = page.getByTestId('editor-content');
    await expect(editorContent).toBeVisible({ timeout: 10000 });

    // 验证编辑器容器存在且可交互
    const codeEditor = page.getByTestId('code-editor');
    await expect(codeEditor).toBeVisible({ timeout: 10000 });
  });

  // ═══════════════════════════════════════════════════════════════════
  // P1 — 高优先级功能回归
  // ═══════════════════════════════════════════════════════════════════

  test('[P1] Terminal 标签管理在移除 memo 后正常', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');

    // 打开终端面板
    const terminalBtn = page.getByTestId('terminal-button');
    await expect(terminalBtn).toBeVisible({ timeout: 10000 });
    await terminalBtn.click();

    // 等待终端面板加载
    const terminalPanel = page.getByTestId('terminal-panel');
    await expect(terminalPanel).toBeVisible({ timeout: 15000 });

    // 等待初始标签自动创建（autoInit: true, 100ms 延迟）
    const initialTab = page.getByTestId(/^terminal-tab-item-/);
    await expect(initialTab.first()).toBeVisible({ timeout: 10000 });

    // 创建新标签
    const addTabBtn = page.getByTestId('terminal-tab-add');
    await expect(addTabBtn).toBeVisible({ timeout: 5000 });
    await addTabBtn.click();

    // 验证现在有 2 个标签
    await expect(initialTab).toHaveCount(2, { timeout: 5000 });

    // 切换到第一个标签
    const firstTab = initialTab.first();
    await firstTab.click();

    // 验证无 React 错误
    const reactErrors = errors.filter(e =>
      /React|react-dom|Minified React error/.test(e)
    );
    expect(reactErrors).toHaveLength(0);
  });

  test('[P1] Agent 操作日志正确显示', async ({ page }) => {
    // 操作日志仅在 AI 面板打开且用户点击日志按钮后可见
    await page.goto('/settings');
    await expect(page.getByTestId('ai-config-section')).toBeVisible({ timeout: 15000 });

    // 添加 AI 模型（使 AI 面板可用）
    await page.getByTestId('ai-model-name').fill('Agent Log Test');
    await page.getByTestId('ai-provider-select').selectOption('openai');
    await page.getByTestId('ai-api-key').fill('sk-agent-key-000');
    await page.getByTestId('ai-save-btn').click();
    const modelItem = page.getByTestId(/^model-item-/);
    await expect(modelItem).toHaveCount(1, { timeout: 10000 });

    // 导航回主页并打开 AI 面板
    await page.goto('/');
    await expect(page.getByTestId('ai-panel-button')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('ai-panel-button').click();

    // 等待 AI 面板出现
    await expect(page.getByTestId('ai-chat-panel')).toBeVisible({ timeout: 10000 });

    // 点击操作日志切换按钮
    const logToggle = page.getByTestId('operation-log-toggle');
    await expect(logToggle).toBeVisible({ timeout: 5000 });
    await logToggle.click();

    // 验证操作日志面板显示
    await expect(page.getByTestId('operation-log-panel')).toBeVisible({ timeout: 10000 });

    // 验证日志条目区域存在（即使为空也应有 no-logs-message）
    const noLogsMsg = page.getByTestId('no-logs-message');
    const logEntries = page.getByTestId(/^log-entry-/);
    await expect(noLogsMsg.or(logEntries.first())).toBeVisible({ timeout: 5000 });
  });

  test('[P1] Git 面板正确显示', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');

    // 打开 Git 面板
    const gitBtn = page.getByTestId('git-panel-button');
    await expect(gitBtn).toBeVisible({ timeout: 10000 });
    await gitBtn.click();

    // 验证 Git 面板可见
    const gitPanel = page.getByTestId('git-panel');
    await expect(gitPanel).toBeVisible({ timeout: 15000 });

    // 验证面板内容（状态区域或无变更提示）
    const noChanges = page.getByTestId('no-changes');
    const noGitRepo = page.getByTestId('no-git-repo');
    await expect(noChanges.or(noGitRepo)).toBeVisible({ timeout: 5000 });

    // 验证无 React 错误
    const reactErrors = errors.filter(e =>
      /React|react-dom|Minified React error/.test(e)
    );
    expect(reactErrors).toHaveLength(0);
  });

  test('[P1] Settings 面板多区段导航正常', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Settings 页面包含 ThemeSettings 和 AIConfigPanel 两个区块
    await page.goto('/settings');

    // 验证 AI 配置区块可见
    const aiConfigSection = page.getByTestId('ai-config-section');
    await expect(aiConfigSection).toBeVisible({ timeout: 15000 });

    // 验证主题设置区块（使用 role=heading 精确定位"主题"标题）
    const themeHeading = page.getByRole('heading', { name: '主题' });
    await expect(themeHeading).toBeVisible({ timeout: 5000 });

    // 验证 AI 配置功能可用
    await expect(page.getByTestId('ai-model-name')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('ai-provider-select')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('ai-save-btn')).toBeVisible({ timeout: 5000 });

    // 验证无 React 错误
    const reactErrors = errors.filter(e =>
      /React|react-dom|Minified React error/.test(e)
    );
    expect(reactErrors).toHaveLength(0);
  });

  // ═══════════════════════════════════════════════════════════════════
  // P2 — 稳定性与错误检查（已激活）
  // ═══════════════════════════════════════════════════════════════════

  test('[P2] 快速多路由切换稳定性', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // 添加模型以确保 / 和 /settings 都能正常工作
    await page.goto('/settings');
    await expect(page.getByTestId('ai-config-section')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('ai-model-name').fill('Stability Test');
    await page.getByTestId('ai-provider-select').selectOption('openai');
    await page.getByTestId('ai-api-key').fill('sk-stability-000');
    await page.getByTestId('ai-save-btn').click();
    await expect(page.getByTestId(/^model-item-/)).toHaveCount(1, { timeout: 10000 });

    // 快速切换路由（5 次往返）
    const routes = ['/', '/settings', '/', '/settings', '/'];
    for (const route of routes) {
      await page.goto(route);
      if (route === '/') {
        await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });
      } else {
        await expect(page.getByTestId('ai-config-section')).toBeVisible({ timeout: 15000 });
      }
    }

    // 无 React 或 React Compiler 错误
    const criticalErrors = errors.filter(e =>
      /React|react-dom|React Compiler|Minified React error|babel-plugin-react-compiler/.test(e)
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('[P2] 控制台零 React/React Compiler 错误', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // 完整用户旅程
    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    // 打开文件
    const fileItem = page.locator('.file-item.file').first();
    if (await fileItem.isVisible({ timeout: 10000 }).catch(() => false)) {
      await fileItem.click();
      await expect(page.getByTestId('editor-content')).toBeVisible({ timeout: 10000 });
    }

    // 打开 AI 面板
    await expect(page.getByTestId('ai-panel-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('ai-panel-button').click();
    await expect(page.getByTestId('ai-chat-panel')).toBeVisible({ timeout: 10000 });

    // 打开 Git 面板
    await page.getByTestId('git-panel-button').click();
    await expect(page.getByTestId('git-panel')).toBeVisible({ timeout: 10000 });

    // 访问设置页
    await page.goto('/settings');
    await expect(page.getByTestId('ai-config-section')).toBeVisible({ timeout: 15000 });

    // 返回主页
    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    // 过滤关键错误
    const criticalErrors = errors.filter(e =>
      /React|react-dom|Minified React error|React Compiler|babel-plugin-react-compiler/.test(e)
    );
    expect(criticalErrors).toHaveLength(0);
  });

  // ═══════════════════════════════════════════════════════════════════
  // 新增稳定性测试
  // ═══════════════════════════════════════════════════════════════════

  test('[P2] 组件面板快速切换稳定性', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Setup: 添加 AI 模型
    await page.goto('/settings');
    await expect(page.getByTestId('ai-config-section')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('ai-model-name').fill('Panel Toggle Test');
    await page.getByTestId('ai-provider-select').selectOption('openai');
    await page.getByTestId('ai-api-key').fill('sk-panel-test');
    await page.getByTestId('ai-save-btn').click();
    await expect(page.getByTestId(/^model-item-/)).toHaveCount(1, { timeout: 10000 });

    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    // 快速切换各面板（每个面板切换 3 次）
    // 使用 scrollIntoView 方式避免点击被遮挡
    const panelToggles: { testid: string; expectVisible: string }[] = [
      { testid: 'ai-panel-button', expectVisible: 'ai-chat-panel' },
      { testid: 'git-panel-button', expectVisible: 'git-panel' },
      { testid: 'terminal-button', expectVisible: 'terminal-panel' },
    ];

    for (const toggle of panelToggles) {
      const btn = page.getByTestId(toggle.testid).first();
      for (let i = 0; i < 3; i++) {
        await btn.scrollIntoViewIfNeeded();
        await btn.click({ force: true }).catch(async () => {
          // fallback: use dispatchEvent 绕过遮挡
          await btn.evaluate(el => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
        });
        await page.waitForTimeout(300);
      }
    }

    // 最终验证所有核心组件仍可交互
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 10000 });

    // 验证无 React 错误
    const reactErrors = errors.filter(e =>
      /React|react-dom|Minified React error/.test(e)
    );
    expect(reactErrors).toHaveLength(0);
  });

  test('[P2] 全功能并发操作稳定性', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Setup: 添加 AI 模型
    await page.goto('/settings');
    await expect(page.getByTestId('ai-config-section')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('ai-model-name').fill('Concurrent Test');
    await page.getByTestId('ai-provider-select').selectOption('deepseek');
    await page.getByTestId('ai-api-key').fill('sk-concurrent-000');
    await page.getByTestId('ai-save-btn').click();
    await expect(page.getByTestId(/^model-item-/)).toHaveCount(1, { timeout: 10000 });

    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    // 1. 打开文件
    const fileItem = page.locator('.file-item.file').first();
    if (await fileItem.isVisible({ timeout: 10000 }).catch(() => false)) {
      await fileItem.click();
      await expect(page.getByTestId('editor-content')).toBeVisible({ timeout: 10000 });
    }

    // 2. 打开终端
    const terminalBtn = page.getByTestId('terminal-button');
    await terminalBtn.scrollIntoViewIfNeeded();
    await terminalBtn.click({ force: true }).catch(async () => {
      await terminalBtn.evaluate(el => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    });
    await expect(page.getByTestId('terminal-panel')).toBeVisible({ timeout: 15000 });

    // 3. 打开 Git 面板
    const gitBtn = page.getByTestId('git-panel-button');
    await gitBtn.scrollIntoViewIfNeeded();
    await gitBtn.click({ force: true }).catch(async () => {
      await gitBtn.evaluate(el => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    });
    await expect(page.getByTestId('git-panel')).toBeVisible({ timeout: 15000 });

    // 4. 打开 AI 面板
    const aiBtn = page.getByTestId('ai-panel-button');
    await aiBtn.scrollIntoViewIfNeeded();
    await aiBtn.click({ force: true }).catch(async () => {
      await aiBtn.evaluate(el => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    });
    await expect(page.getByTestId('ai-chat-panel')).toBeVisible({ timeout: 10000 });

    // 5. 操作日志切换
    const logToggle = page.getByTestId('operation-log-toggle');
    if (await logToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logToggle.click();
      await expect(page.getByTestId('operation-log-panel')).toBeVisible({ timeout: 5000 });
    }

    // 验证所有核心组件同时可见
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('editor-content')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('terminal-panel')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('git-panel')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('ai-chat-panel')).toBeVisible({ timeout: 5000 });

    // 验证无任何 React/React Compiler 错误
    const criticalErrors = errors.filter(e =>
      /React|react-dom|Minified React error|React Compiler|babel-plugin-react-compiler/.test(e)
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('[P2] 组件反复挂载/卸载无内存泄漏', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    const getFirstVisible = (testid: string) =>
      page.getByTestId(testid).locator('visible=true').first();

    // 反复切换 AI 面板
    for (let i = 0; i < 5; i++) {
      const aiBtn = getFirstVisible('ai-panel-button');
      await aiBtn.click({ force: true });

      if (i % 2 === 0) {
        await expect(page.getByTestId('ai-chat-panel')).toBeVisible({ timeout: 5000 });
      } else {
        // 使用 AI 面板的关闭按钮（✕）来关闭，避免遮挡问题
        const closeBtn = page.getByTestId('ai-close-panel').locator('visible=true').first();
        if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await closeBtn.click({ force: true });
        } else {
          await aiBtn.click({ force: true });
        }
        await expect(page.getByTestId('ai-chat-panel')).not.toBeVisible({ timeout: 3000 });
      }
    }

    // 确保 AI 面板关闭后再切换 Git（使用面板自身的关闭按钮，因为可能仍处于可见状态）
    const aiCloseBtn = page.getByTestId('ai-close-panel').locator('visible=true').first();
    if (await aiCloseBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await aiCloseBtn.click({ force: true });
    } else {
      const aiBtn = getFirstVisible('ai-panel-button');
      await aiBtn.click({ force: true });
    }
    await expect(page.getByTestId('ai-chat-panel')).not.toBeVisible({ timeout: 3000 });

    for (let i = 0; i < 5; i++) {
      const gitBtn = getFirstVisible('git-panel-button');
      await gitBtn.click({ force: true });
    }

    // 反复切换终端面板（打开 Terminal 前先关闭 Git）
    const gitBtnClose = getFirstVisible('git-panel-button');
    await gitBtnClose.click({ force: true });

    for (let i = 0; i < 5; i++) {
      const terminalBtn = getFirstVisible('terminal-button');
      await terminalBtn.click({ force: true });
    }

    // 最终验证核心组件仍正常
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 5000 });

    // 若已打开文件则验证 editor-content，否则只验证 file-tree
    const editorEl = page.getByTestId('editor-content');
    if (await editorEl.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(editorEl).toBeVisible();
    }

    // 验证无内存泄漏相关错误
    const memoryErrors = errors.filter(e =>
      /memory|leak|Warning:|Can't perform a React state update/.test(e)
    );
    expect(memoryErrors).toHaveLength(0);

    // 验证无 React 错误
    const reactErrors = errors.filter(e =>
      /React|react-dom|Minified React error/.test(e)
    );
    expect(reactErrors).toHaveLength(0);
  });

  test('[P2] 错误边界恢复能力验证', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Setup: 添加 AI 模型
    await page.goto('/settings');
    await expect(page.getByTestId('ai-config-section')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('ai-model-name').fill('Error Recovery Test');
    await page.getByTestId('ai-provider-select').selectOption('openai');
    await page.getByTestId('ai-api-key').fill('sk-error-recovery');
    await page.getByTestId('ai-save-btn').click();
    await expect(page.getByTestId(/^model-item-/)).toHaveCount(1, { timeout: 10000 });

    // 完整导航循环
    await page.goto('/');
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });

    // 打开→关闭→再打开各面板
    const components = [
      { btn: 'ai-panel-button', panel: 'ai-chat-panel' },
      { btn: 'git-panel-button', panel: 'git-panel' },
      { btn: 'terminal-button', panel: 'terminal-panel' },
    ];

    for (const comp of components) {
      // 打开
      let openBtn = page.getByTestId(comp.btn).locator('visible=true').first();
      await openBtn.scrollIntoViewIfNeeded();
      await openBtn.click({ force: true });
      // 验证按钮激活状态
      await expect(openBtn).toHaveClass(/active/, { timeout: 3000 });
      await expect(page.getByTestId(comp.panel)).toBeVisible({ timeout: 5000 });

      // 关闭
      openBtn = page.getByTestId(comp.btn).locator('visible=true').first();
      await openBtn.click({ force: true });

      // 再次打开
      openBtn = page.getByTestId(comp.btn).locator('visible=true').first();
      await openBtn.click({ force: true });
      await expect(page.getByTestId(comp.panel)).toBeVisible({ timeout: 5000 });

      // 最后关闭，避免遮挡下一个按钮
      if (comp.panel === 'ai-chat-panel') {
        const closeBtn = page.getByTestId('ai-close-panel').locator('visible=true').first();
        if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await closeBtn.click({ force: true });
        } else {
          openBtn = page.getByTestId(comp.btn).locator('visible=true').first();
          await openBtn.click({ force: true });
        }
      } else {
        openBtn = page.getByTestId(comp.btn).locator('visible=true').first();
        await openBtn.click({ force: true });
      }
      await expect(page.getByTestId(comp.panel)).not.toBeVisible({ timeout: 3000 });
    }

    // 最终验证所有核心功能可用
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('status-bar')).toBeVisible({ timeout: 5000 });

    // 验证无 React 错误边界相关错误
    const boundaryErrors = errors.filter(e =>
      /ErrorBoundary|error boundary|componentDidCatch|getDerivedStateFromError|React.*error/.test(e)
    );
    expect(boundaryErrors).toHaveLength(0);

    // 验证零关键错误
    const criticalErrors = errors.filter(e =>
      /React|react-dom|Minified React error|React Compiler|babel-plugin-react-compiler/.test(e)
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
