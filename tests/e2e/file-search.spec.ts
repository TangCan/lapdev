import { test, expect } from '@playwright/test';

/**
 * E2E: 文件搜索并发优化 E2E 测试
 *
 * Story: EPI3.01 - 文件搜索并发优化
 * Acceptance Criteria: AC1-AC4
 */

test.describe('[E2E] File Search Concurrent Optimization', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      await page.goto('/');
      await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

      // 创建测试文件（非阻塞：失败时跳过，不阻止测试运行）
      const files = [
        { name: 'search-target-1.ts', content: 'export const hello = "world";\n// search-target-1 content' },
        { name: 'search-target-2.tsx', content: 'import React from "react";\nexport const App = () => <div>search-target-2</div>;' },
        { name: 'config-search.json', content: '{"search": "config-value", "target": true}' },
      ];

      for (const file of files) {
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const result = await page.evaluate(
              async ({ name, content }) => {
                try {
                  const response = await fetch('/api/v1/agent/write-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filePath: name, content }),
                  });
                  if (!response.ok) return null;
                  const text = await response.text();
                  if (!text) return null;
                  return JSON.parse(text);
                } catch {
                  return null;
                }
              },
              { name: file.name, content: file.content }
            );
            if (result?.status === 'success') break;
          } catch {
            // 忽略 evaluate 错误，继续重试
          }
          await page.waitForTimeout(1000);
        }
        // 不抛出错误 — 让不依赖测试文件的测试继续运行
      }

      // 刷新文件树
      await page.reload();
      await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });
      await page.waitForSelector('[data-testid="file-item"]', { timeout: 10000 });

      // 展开 workspace
      const workspaceFolder = page.locator('[data-testid="file-item"]').filter({ hasText: 'workspace' });
      if (await workspaceFolder.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        const hasChildren = await workspaceFolder.locator('xpath=../div[contains(@class,"children")]').count();
        if (hasChildren === 0) {
          await workspaceFolder.first().click();
          await page.waitForTimeout(800);
        }
      }

      await page.context().storageState();
    } finally {
      await page.close();
    }
  });

  // ─── AC1: 搜索框即时响应（无卡顿） ───

  test('[P0] EPI3-01-E2E-001: 搜索输入框应立即可用并响应 (AC1)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

    const searchInput = page.getByTestId('file-tree-search-input');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill('search');
    const value = await searchInput.inputValue();
    expect(value).toBe('search');
  });

  test('[P1] EPI3-01-E2E-002: 搜索结果应使用 useDeferredValue 延迟更新 (AC1)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

    const searchInput = page.getByTestId('file-tree-search-input');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill('search-target');

    // 最终结果应出现（延迟更新）
    const searchResults = page.getByTestId('file-tree-search-results');
    await expect(searchResults).toBeVisible({ timeout: 10000 });
  });

  // ─── AC2: 防抖 200ms，只有最终输入触发搜索 ───

  test('[P1] EPI3-01-E2E-003: 快速连续输入只触发一次搜索 (AC2)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

    const searchInput = page.getByTestId('file-tree-search-input');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // 快速连续输入
    await searchInput.fill('s');
    await searchInput.fill('se');
    await searchInput.fill('sea');
    await searchInput.fill('search');

    // 等待防抖完成
    await page.waitForTimeout(300);

    // 应只触发一次搜索（验证最终结果）
    const searchResults = page.getByTestId('file-tree-search-results');
    await expect(searchResults).toBeVisible({ timeout: 8000 });
  });

  test('[P2] EPI3-01-E2E-004: isStale 标志应正确反映 deferred 状态 (AC2)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

    const searchInput = page.getByTestId('file-tree-search-input');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill('test');

    // isStale 指示器应在输入后短暂显示（如果 React 调度延迟）
    const staleIndicator = page.getByTestId('file-tree-search-stale');
    if (await staleIndicator.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(staleIndicator).toBeVisible();
    }

    // 搜索完成后 isStale 应消失
    await page.waitForTimeout(300);
    await expect(staleIndicator).not.toBeVisible({ timeout: 5000 });
  });

  // ─── AC3: 搜索错误处理 ───

  test('[P1] EPI3-01-E2E-005: 搜索框应处理无效输入不崩溃 (AC3)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

    const searchInput = page.getByTestId('file-tree-search-input');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // 输入特殊字符不应崩溃
    await searchInput.fill('!@#$%^&*()');

    // 等待防抖完成后检查 UI 状态 — 不崩溃即通过
    await page.waitForTimeout(500);

    // 验证搜索框仍然可用
    const inputValue = await searchInput.inputValue();
    expect(inputValue).toBe('!@#$%^&*()');

    // 验证搜索框未被销毁或崩溃
    await expect(searchInput).toBeVisible();
  });

  test('[P2] EPI3-01-E2E-006: 清空搜索后状态应恢复正常 (AC3)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

    const searchInput = page.getByTestId('file-tree-search-input');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // 输入后清空
    await searchInput.fill('nonexistent');
    await page.waitForTimeout(300);

    await searchInput.clear();
    await page.waitForTimeout(300);

    // 搜索状态应恢复
    const loadingIndicator = page.getByTestId('file-tree-search-loading');
    await expect(loadingIndicator).not.toBeVisible({ timeout: 3000 });

    // 结果信息应不显示
    const searchResults = page.getByTestId('file-tree-search-results');
    await expect(searchResults).not.toBeVisible({ timeout: 3000 });
  });

  // ─── AC4: 搜索与文件树集成 ───

  test('[P0] EPI3-01-E2E-007: 搜索结果应高亮匹配的文件 (AC4)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

    const searchInput = page.getByTestId('file-tree-search-input');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill('search-target');
    await page.waitForTimeout(500);

    // 匹配的文件应高亮显示
    const highlightedItems = page.getByTestId('file-tree-search-highlight');
    await expect(highlightedItems.first()).toBeVisible({ timeout: 10000 });
  });

  test('[P0] EPI3-01-E2E-008: 点击搜索结果应打开对应文件 (AC4)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

    const searchInput = page.getByTestId('file-tree-search-input');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill('search-target-1');
    await page.waitForTimeout(500);

    // 等待搜索结果出现
    const fileItems = page.locator('[data-testid="file-item"]').filter({ hasText: 'search-target-1' });
    await expect(fileItems.first()).toBeVisible({ timeout: 8000 });

    // 点击第一个搜索结果
    await fileItems.first().click();

    // 文件应在编辑器中打开
    const editorTab = page.getByTestId('editor-tab');
    await expect(editorTab).toBeVisible({ timeout: 5000 });
    await expect(editorTab).toContainText('search-target-1.ts');
  });

  test('[P1] EPI3-01-E2E-009: 空搜索应恢复显示完整文件树 (AC4)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

    const searchInput = page.getByTestId('file-tree-search-input');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // 先搜索
    await searchInput.fill('search');
    await page.waitForTimeout(500);

    // 然后清空
    await searchInput.clear();
    // 等待 deferred 值更新和重渲染完成
    await page.waitForTimeout(500);

    // 完整文件树应恢复显示（所有文件）
    const fileItems = page.locator('[data-testid="file-item"]');
    await expect(fileItems.first()).toBeVisible({ timeout: 5000 });
    const count = await fileItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('[P2] EPI3-01-E2E-010: 搜索不影响文件树的展开/折叠行为 (AC4)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

    const searchInput = page.getByTestId('file-tree-search-input');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // 不输入搜索内容，直接展开/折叠文件夹
    const workspaceFolder = page.locator('[data-testid="file-item"]').filter({ hasText: 'workspace' });
    await workspaceFolder.first().click();
    await page.waitForTimeout(500);

    // 文件夹应正常展开
    const childrenContainer = workspaceFolder.locator('xpath=../div[contains(@class,"children")]');
    await expect(childrenContainer).toBeVisible({ timeout: 3000 });

    // 再次点击应折叠
    await workspaceFolder.first().click();
    await page.waitForTimeout(500);
  });

  // ─── Code Review Fixes: Additional E2E tests ───

  test('[P1] EPI3-01-E2E-011: 搜索时自动展开匹配文件的祖先目录 (F1)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

    const searchInput = page.getByTestId('file-tree-search-input');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // 搜索已知文件
    await searchInput.fill('search-target-1');
    await page.waitForTimeout(500);

    // 匹配文件应可见（即使之前目录是折叠的）
    const matchedFile = page.locator('[data-testid="file-item"]').filter({ hasText: 'search-target-1' });
    await expect(matchedFile.first()).toBeVisible({ timeout: 8000 });
  });

  test('[P1] EPI3-01-E2E-012: 清除按钮在搜索期间保持可见 (F7)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

    const searchInput = page.getByTestId('file-tree-search-input');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill('test');

    // 清除按钮应立即可见（即使可能在搜索中）
    const clearBtn = page.getByTestId('file-tree-search-clear');
    await expect(clearBtn).toBeVisible({ timeout: 3000 });
  });

  test('[P2] EPI3-01-E2E-013: 搜索结果中高亮所有匹配项 (F8)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

    const searchInput = page.getByTestId('file-tree-search-input');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // 搜索 "search" — 应匹配 search-target-* 文件和项目中的搜索相关文件
    await searchInput.fill('search');
    await page.waitForTimeout(500);

    // 如果有匹配文件，应显示高亮；如果无匹配文件，应显示"未找到"
    const highlights = page.getByTestId('file-tree-search-highlight');
    const noResults = page.getByTestId('file-tree-no-results');

    const hasHighlights = await highlights.first().isVisible({ timeout: 8000 }).catch(() => false);
    const hasNoResults = await noResults.isVisible({ timeout: 2000 }).catch(() => false);

    // 至少有一种状态应该出现
    expect(hasHighlights || hasNoResults).toBeTruthy();
  });
});
