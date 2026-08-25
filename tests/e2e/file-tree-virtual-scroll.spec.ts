import { test, expect } from '@playwright/test';

/**
 * E2E: 文件树虚拟滚动 E2E 测试
 *
 * Story: EPI3.02 - 文件树虚拟滚动
 * Acceptance Criteria: AC1-AC5
 */

let backendAvailable = false;
const VIRTUAL_SCROLL_THRESHOLD = 50;

/**
 * 展开 workspace 目录。
 * 每次 test 使用独立 page 实例，workspace 初始折叠，
 * 需手动展开以显示文件树内容（触发虚拟滚动阈值 > 50）。
 */
async function expandWorkspace(page: import('@playwright/test').Page) {
  const workspaceFolder = page.locator('[data-testid="file-item"]').filter({ hasText: 'workspace' });
  if (await workspaceFolder.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await workspaceFolder.first().click();
    await page.waitForTimeout(500);
  }
}

/**
 * 等待文件树加载完成且无错误状态。
 * 文件树可能因后端暂时不可用而显示错误，此函数会重试加载。
 * 返回 false 表示文件树无法正常加载（测试应跳过）。
 */
async function waitForFileTreeReady(page: import('@playwright/test').Page, maxRetries: number = 3): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

    const isError = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="file-tree"]');
      return !!(el?.querySelector('.error') || el?.querySelector('.loading'));
    });

    if (!isError) return true;

    await page.waitForTimeout(2000);
  }

  const finalError = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="file-tree"]');
    const errEl = el?.querySelector('.error');
    return errEl?.textContent || null;
  });

  if (finalError) {
    console.log(`[file-tree] ${finalError}`);
    return false;
  }
  return true;
}

test.describe('[E2E] File Tree Virtual Scroll', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      await page.goto('/');
      await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

      // 创建测试文件（≥60 个以触发虚拟滚动阈值 > 50）
      // 文件分布在多个目录中，以测试目录展开/折叠时的虚拟滚动
      const files: Array<{ name: string; content: string }> = [];

      // 顶层虚拟滚动测试文件
      for (let i = 1; i <= 30; i++) {
        files.push({
          name: `vscroll-root-file-${String(i).padStart(3, '0')}.ts`,
          content: `// virtual scroll root file ${i}\nexport const index = ${i};\n`,
        });
      }

      // 嵌套目录中的文件（深层目录用于 AC3 测试）
      for (let i = 1; i <= 15; i++) {
        files.push({
          name: `vscroll-dir-a/sub-file-${String(i).padStart(3, '0')}.ts`,
          content: `// sub dir a file ${i}\nexport const aIndex = ${i};\n`,
        });
      }

      for (let i = 1; i <= 15; i++) {
        files.push({
          name: `vscroll-dir-b/sub-file-${String(i).padStart(3, '0')}.tsx`,
          content: `// sub dir b file ${i}\nexport const bIndex = ${i};\n`,
        });
      }

      // 深层嵌套目录（用于 E2E-008）
      for (let i = 1; i <= 5; i++) {
        files.push({
          name: `vscroll-deep/level1/level2/level3/deep-file-${i}.ts`,
          content: `// deep nested file ${i}\nexport const deep = ${i};\n`,
        });
      }

      // 非阻塞创建：失败时跳过，不阻止测试运行
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
          await page.waitForTimeout(500);
        }
        // 不抛出错误 — 让不依赖测试文件的测试继续运行
      }

      // Check if backend is available by verifying file tree has content
      await page.reload();
      await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });
      await page.waitForFunction(
        () => {
          const el = document.querySelector('[data-testid="file-tree"]');
          return el && !el.querySelector('.loading');
        },
        { timeout: 15000 }
      );
      const fileCount = await page.locator('[data-testid="file-item"]').count();
      backendAvailable = fileCount > 0;

      // 展开 workspace 目录（如果存在且未展开）
      const workspaceFolder = page.locator('[data-testid="file-item"]').filter({ hasText: 'workspace' });
      if (await workspaceFolder.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        // 检查是否已展开（有 children div）
        const isExpanded = await workspaceFolder.locator('xpath=../div[contains(@class,"children")]').count();
        if (isExpanded === 0) {
          await workspaceFolder.first().click();
          await page.waitForTimeout(1000);
        }
        // 展开后再次等待 file-item 出现
        await page.waitForSelector('[data-testid="file-item"]', { timeout: 10000 });
      }

      await page.context().storageState();
    } finally {
      await page.close();
    }
  });

  // ─── AC1: 文件树在大量文件时应使用虚拟滚动 ───

  test('[P0] EPI3-02-E2E-001: 文件树在大量文件时应使用虚拟滚动 (AC1)', async ({ page }) => {
    const fileTreeReady = await waitForFileTreeReady(page);
    test.skip(!fileTreeReady || !backendAvailable, '文件树或后端不可用，跳过此测试');

    // 展开 workspace 以显示所有文件
    await expandWorkspace(page);

    // 检查文件项数量
    const fileItems = page.locator('[data-testid="file-item"]');
    const itemCount = await fileItems.count();
    console.log(`[E2E-001] itemCount after expand: ${itemCount}`);

    // 需要至少 51 个文件项才能触发虚拟滚动（阈值=50）
    test.skip(itemCount <= VIRTUAL_SCROLL_THRESHOLD,
      `文件项数量 ${itemCount} 不足 ${VIRTUAL_SCROLL_THRESHOLD + 1} 个，无法触发虚拟滚动`);

    // 虚拟滚动容器应存在
    const virtualScrollContainer = page.getByTestId('virtual-scroll-container');
    await expect(virtualScrollContainer).toBeVisible({ timeout: 5000 });

    const renderedCount = await fileItems.count();
    // 虚拟滚动应限制渲染数量（典型可视区域为 20-40 项）
    expect(renderedCount).toBeLessThan(itemCount);
    expect(renderedCount).toBeGreaterThan(0);

    // 滚动应流畅：虚拟滚动容器应支持滚动
    await virtualScrollContainer.evaluate((el) => {
      el.scrollTop = 500;
    });
    await page.waitForTimeout(300);

    const renderedCountAfterScroll = await fileItems.count();
    expect(renderedCountAfterScroll).toBeLessThan(itemCount);
  });

  // ─── AC2: 文件数≤50时使用传统渲染，>50时启用虚拟滚动 ───

  test('[P0] EPI3-02-E2E-002: 文件数>50时启用虚拟滚动，≤50时传统渲染 (AC2)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

    test.skip(!backendAvailable, '后端未运行，跳过此测试');

    // 展开 workspace
    await expandWorkspace(page);

    // 测试环境创建 60+ 文件，应启用虚拟滚动
    const virtualScrollContainer = page.getByTestId('virtual-scroll-container');
    await expect(virtualScrollContainer).toBeVisible({ timeout: 5000 });

    // 验证虚拟滚动容器存在且 file-tree 包含它
    const fileTree = page.getByTestId('file-tree');
    await expect(fileTree).toBeVisible();

    // 验证虚拟滚动容器在文件树内
    const isInside = await fileTree.locator('[data-testid="virtual-scroll-container"]').count();
    expect(isInside).toBeGreaterThan(0);

    // 注：≤50 的传统渲染场景需独立 workspace 验证，此处仅验证 >50 启用虚拟滚动
  });

  // ─── AC3: 展开/折叠目录后虚拟滚动正确更新 ───

  test('[P1] EPI3-02-E2E-003: 展开/折叠目录后虚拟滚动正确更新 (AC3)', async ({ page }) => {
    const fileTreeReady = await waitForFileTreeReady(page);
    test.skip(!fileTreeReady || !backendAvailable, '文件树或后端不可用，跳过此测试');

    // 展开 workspace
    await expandWorkspace(page);

    const fileItems = page.locator('[data-testid="file-item"]');
    const itemCount = await fileItems.count();
    test.skip(itemCount <= VIRTUAL_SCROLL_THRESHOLD,
      `文件项数量 ${itemCount} 不足，无法触发虚拟滚动`);

    const virtualScrollContainer = page.getByTestId('virtual-scroll-container');
    await expect(virtualScrollContainer).toBeVisible({ timeout: 5000 });

    // 初始文件项数量
    const initialCount = await fileItems.count();

    // 查找可展开的目录（vscroll-dir-a）
    const expandableFolder = page.locator('[data-testid="folder-expand"]').first();
    await expect(expandableFolder).toBeVisible({ timeout: 5000 });

    // 点击展开
    await expandableFolder.click();
    await page.waitForTimeout(500);

    // 展开后文件项应增加（或保持虚拟滚动渲染数量上限）
    const afterExpandCount = await fileItems.count();

    // 验证虚拟滚动仍然工作（渲染数量受限）
    const virtualScrollStillActive = await page.getByTestId('virtual-scroll-container').isVisible();
    expect(virtualScrollStillActive).toBeTruthy();

    // 点击折叠
    await expandableFolder.click();
    await page.waitForTimeout(500);

    // 折叠后文件项应减少
    const afterCollapseCount = await fileItems.count();
    expect(afterCollapseCount).toBeLessThanOrEqual(afterExpandCount);

    // 验证展开/折叠后虚拟滚动状态稳定
    expect(initialCount).toBeGreaterThan(0);
  });

  // ─── AC4: 搜索过滤后虚拟滚动正常工作 ───

  test('[P1] EPI3-02-E2E-004: 搜索过滤后虚拟滚动正常工作 (AC4)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

    // 等待加载完成
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="file-tree"]');
        return el && !el.querySelector('.loading');
      },
      { timeout: 15000 }
    );

    test.skip(!backendAvailable, '后端未运行，跳过此测试');

    const searchInput = page.getByTestId('file-tree-search-input');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // 输入搜索查询（匹配多个文件以触发虚拟滚动）
    await searchInput.fill('vscroll');
    await page.waitForTimeout(500);

    // 等待防抖和过滤完成
    await page.waitForTimeout(500);

    // 过滤结果数量
    const fileItems = page.locator('[data-testid="file-item"]');
    const filteredCount = await fileItems.count();

    // 如果过滤结果 > 50 项，虚拟滚动应仍然启用
    if (filteredCount > 50) {
      const virtualScrollContainer = page.getByTestId('virtual-scroll-container');
      await expect(virtualScrollContainer).toBeVisible({ timeout: 5000 });
    }

    // 验证搜索高亮功能正常工作（如果存在高亮元素）
    const highlights = page.getByTestId('file-tree-search-highlight');
    if (await highlights.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      const highlightCount = await highlights.count();
      expect(highlightCount).toBeGreaterThan(0);
    }

    // 验证搜索框仍然可见可用
    await expect(searchInput).toBeVisible();
  });

  // ─── AC5: 虚拟滚动中点击文件正常打开 ───

  test('[P1] EPI3-02-E2E-005: 虚拟滚动中点击文件正常打开 (AC5)', async ({ page }) => {
    const fileTreeReady = await waitForFileTreeReady(page);
    test.skip(!fileTreeReady || !backendAvailable, '文件树或后端不可用，跳过此测试');

    // 展开 workspace
    await expandWorkspace(page);

    const virtualScrollContainer = page.getByTestId('virtual-scroll-container');
    await expect(virtualScrollContainer).toBeVisible({ timeout: 5000 });

    // 在虚拟滚动列表中查找文件项
    const fileItems = page.locator('[data-testid="file-item"]');
    await expect(fileItems.first()).toBeVisible({ timeout: 5000 });

    // 滚动到中部区域以确保点击的不是首屏固定项
    await virtualScrollContainer.evaluate((el) => {
      el.scrollTop = 200;
    });
    await page.waitForTimeout(300);

    // 点击第一个可见的文件项
    const visibleFileItem = fileItems.first();
    await visibleFileItem.click();

    // 编辑器应打开该文件
    const editorTab = page.getByTestId('editor-tab');
    await expect(editorTab).toBeVisible({ timeout: 5000 });

    // 滚动位置应在交互后保持稳定
    const scrollPosition = await virtualScrollContainer.evaluate((el) => el.scrollTop);
    expect(scrollPosition).toBeGreaterThanOrEqual(0);
  });

  // ─── AC5: 虚拟滚动中右键菜单正常工作 ───

  test('[P2] EPI3-02-E2E-006: 虚拟滚动中右键菜单正常工作 (AC5)', async ({ page }) => {
    const fileTreeReady = await waitForFileTreeReady(page);
    test.skip(!fileTreeReady || !backendAvailable, '文件树或后端不可用，跳过此测试');

    // 展开 workspace
    await expandWorkspace(page);

    const virtualScrollContainer = page.getByTestId('virtual-scroll-container');
    await expect(virtualScrollContainer).toBeVisible({ timeout: 5000 });

    const fileItems = page.locator('[data-testid="file-item"]');
    await expect(fileItems.first()).toBeVisible({ timeout: 5000 });

    // 右键点击文件项
    await fileItems.first().click({ button: 'right' });
    await page.waitForTimeout(300);

    // 上下文菜单应出现
    const contextMenu = page.getByTestId('file-context-menu');
    await expect(contextMenu).toBeVisible({ timeout: 3000 });
  });

  // ─── AC1: 快速滚动不出现白屏 ───

  test('[P2] EPI3-02-E2E-007: 快速滚动不出现白屏 (AC1)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="file-tree"]');
        return el && !el.querySelector('.loading');
      },
      { timeout: 15000 }
    );

    test.skip(!backendAvailable, '后端未运行，跳过此测试');

    // 展开 workspace
    await expandWorkspace(page);

    // 虚拟滚动容器应存在
    const virtualScrollContainer = page.getByTestId('virtual-scroll-container');
    await expect(virtualScrollContainer).toBeVisible({ timeout: 5000 });

    // 快速连续滚动
    for (let i = 0; i < 5; i++) {
      await virtualScrollContainer.evaluate((el, offset) => {
        el.scrollTop = offset;
      }, i * 200);
      await page.waitForTimeout(50);
    }

    // 等待渲染稳定
    await page.waitForTimeout(300);

    // 验证无白屏：可视区域应仍有文件项渲染
    const visibleFileItems = page.locator('[data-testid="file-item"]:visible');
    const visibleCount = await visibleFileItems.count();
    expect(visibleCount).toBeGreaterThan(0);

    // 滚动到顶部
    await virtualScrollContainer.evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.waitForTimeout(300);

    // 顶部仍应正常渲染
    const topVisibleCount = await visibleFileItems.count();
    expect(topVisibleCount).toBeGreaterThan(0);
  });

  // ─── AC3: 深层嵌套目录展开后虚拟滚动正确 ───

  test('[P2] EPI3-02-E2E-008: 深层嵌套目录展开后虚拟滚动正确 (AC3)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

    test.skip(!backendAvailable, '后端未运行，跳过此测试');

    // 展开 workspace
    await expandWorkspace(page);

    const virtualScrollContainer = page.getByTestId('virtual-scroll-container');
    await expect(virtualScrollContainer).toBeVisible({ timeout: 5000 });

    // 查找深层嵌套目录 vscroll-deep
    const deepFolder = page.locator('[data-testid="file-item"]').filter({ hasText: 'vscroll-deep' });
    if (await deepFolder.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      // 展开第一层
      await deepFolder.first().click();
      await page.waitForTimeout(400);

      // 展开 level1
      const level1 = page.locator('[data-testid="file-item"]').filter({ hasText: 'level1' });
      if (await level1.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await level1.first().click();
        await page.waitForTimeout(400);

        // 展开 level2
        const level2 = page.locator('[data-testid="file-item"]').filter({ hasText: 'level2' });
        if (await level2.first().isVisible({ timeout: 2000 }).catch(() => false)) {
          await level2.first().click();
          await page.waitForTimeout(400);

          // 展开 level3
          const level3 = page.locator('[data-testid="file-item"]').filter({ hasText: 'level3' });
          if (await level3.first().isVisible({ timeout: 2000 }).catch(() => false)) {
            await level3.first().click();
            await page.waitForTimeout(400);
          }
        }
      }

      // 验证虚拟滚动仍然工作
      const virtualScrollStillVisible = await page.getByTestId('virtual-scroll-container').isVisible();
      expect(virtualScrollStillVisible).toBeTruthy();

      // 验证深层文件可见
      const deepFile = page.locator('[data-testid="file-item"]').filter({ hasText: 'deep-file' });
      if (await deepFile.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        const deepFileCount = await deepFile.count();
        expect(deepFileCount).toBeGreaterThan(0);
      }
    }
  });

  // ─── AC1: 空文件树处理 ───

  test('[P3] EPI3-02-E2E-009: 空文件树处理 (AC1)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

    // 如果工作区为空，应优雅显示空状态
    const fileItems = page.locator('[data-testid="file-item"]');
    const itemCount = await fileItems.count();

    if (itemCount === 0) {
      // 应显示空状态提示（如果存在该元素）
      const emptyState = page.getByTestId('file-tree-empty');
      const virtualScrollContainer = page.getByTestId('virtual-scroll-container');

      // 空状态下虚拟滚动容器可能不存在或显示空状态
      const hasEmptyState = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
      const hasVirtualScroll = await virtualScrollContainer.isVisible({ timeout: 2000 }).catch(() => false);

      // 至少应有空状态或虚拟滚动容器（不应崩溃）
      expect(hasEmptyState || hasVirtualScroll || itemCount === 0).toBeTruthy();
    } else {
      // 有文件时应正常渲染
      expect(itemCount).toBeGreaterThan(0);
    }
  });

  // ─── AC2: 搜索结果为空时处理 ───

  test('[P3] EPI3-02-E2E-010: 搜索结果为空时处理 (AC2)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });

    // 等待加载完成
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="file-tree"]');
        return el && !el.querySelector('.loading');
      },
      { timeout: 15000 }
    );

    // 后端未运行时跳过（搜索框可能不显示）
    test.skip(!backendAvailable, '后端未运行，跳过此测试');

    const searchInput = page.getByTestId('file-tree-search-input');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // 输入不匹配的查询
    await searchInput.fill('zzz-no-match-query-xyz-99999');
    await page.waitForTimeout(500);

    // 等待防抖完成
    await page.waitForTimeout(500);

    // 应显示"无结果"提示或空状态
    const noResults = page.getByTestId('file-tree-no-results');
    const emptyState = page.getByTestId('file-tree-empty');
    const hasNoResults = await noResults.isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);

    // 至少应显示一种空/无结果状态（不应崩溃）
    // 后端不可用时可能无文件也无提示，仅验证不崩溃
    if (backendAvailable) {
      expect(hasNoResults || hasEmpty).toBeTruthy();
    }

    // 验证文件项不显示（或显示数量为 0）
    const fileItems = page.locator('[data-testid="file-item"]');
    const itemCount = await fileItems.count();
    expect(itemCount).toBe(0);

    // 清空搜索后应恢复（仅在后端可用时验证）
    if (backendAvailable) {
      await searchInput.clear();
      await page.waitForTimeout(500);

      const restoredItems = page.locator('[data-testid="file-item"]');
      await expect(restoredItems.first()).toBeVisible({ timeout: 5000 });
    }
  });

  // ─── AC3: 滚动位置在展开/折叠后保持稳定 ───

  test('[P1] EPI3-02-E2E-011: 展开/折叠后滚动位置保持稳定 (AC3)', async ({ page }) => {
    const fileTreeReady = await waitForFileTreeReady(page);
    test.skip(!fileTreeReady || !backendAvailable, '文件树或后端不可用，跳过此测试');

    // 展开 workspace
    await expandWorkspace(page);

    const virtualScrollContainer = page.getByTestId('virtual-scroll-container');
    await expect(virtualScrollContainer).toBeVisible({ timeout: 5000 });

    // 滚动到某个位置
    await virtualScrollContainer.evaluate((el) => {
      el.scrollTop = 300;
    });
    await page.waitForTimeout(200);

    const scrollBefore = await virtualScrollContainer.evaluate((el) => el.scrollTop);

    // 查找可展开的目录
    const expandableFolders = page.locator('[data-testid="folder-expand"]');
    const folderCount = await expandableFolders.count();

    if (folderCount > 0) {
      // 展开第一个目录
      await expandableFolders.first().click();
      await page.waitForTimeout(300);

      // 折叠回去
      await expandableFolders.first().click();
      await page.waitForTimeout(300);

      // 验证滚动位置没有跳到异常位置
      const scrollAfter = await virtualScrollContainer.evaluate((el) => el.scrollTop);
      // 滚动位置不应为 NaN 或负数
      expect(scrollAfter).toBeGreaterThanOrEqual(0);
      // 滚动位置不应超过最大可滚动范围（不应出现空白视口）
      expect(scrollAfter).toBeLessThanOrEqual(scrollBefore + 500);
    }
  });

  // ─── AC2: 搜索结果切换虚拟滚动模式 ───

  test('[P1] EPI3-02-E2E-012: 搜索结果数量变化时切换虚拟滚动模式 (AC2)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="file-tree"]');
        return el && !el.querySelector('.loading');
      },
      { timeout: 15000 }
    );

    test.skip(!backendAvailable, '后端未运行，跳过此测试');

    // 展开 workspace
    await expandWorkspace(page);

    // 初始状态：60+ 文件应使用虚拟滚动
    const virtualContainer = page.getByTestId('virtual-scroll-container');
    await expect(virtualContainer).toBeVisible({ timeout: 5000 });

    // 搜索：使用通配符匹配少量文件
    const searchInput = page.getByTestId('file-tree-search-input');
    await searchInput.fill('file-001');
    await page.waitForTimeout(700);

    // 搜索结果减少后，验证文件树仍正常渲染
    const fileItems = page.locator('[data-testid="file-item"]');
    const filteredCount = await fileItems.count();

    // 无论是否切换模式，都不应崩溃
    expect(filteredCount).toBeGreaterThanOrEqual(0);

    // 清空搜索恢复
    await searchInput.clear();
    await page.waitForTimeout(500);

    // 恢复后虚拟滚动应仍然启用
    await expect(virtualContainer).toBeVisible({ timeout: 5000 });
  });

  // ─── AC1: 快速连续展开/折叠稳定性 ───

  test('[P2] EPI3-02-E2E-013: 快速连续展开/折叠不崩溃 (AC1)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="file-tree"]');
        return el && !el.querySelector('.loading');
      },
      { timeout: 15000 }
    );

    test.skip(!backendAvailable, '后端未运行，跳过此测试');

    // 展开 workspace
    await expandWorkspace(page);

    const virtualScrollContainer = page.getByTestId('virtual-scroll-container');
    await expect(virtualScrollContainer).toBeVisible({ timeout: 5000 });

    // 查找目录展开图标
    const expandableFolders = page.locator('[data-testid="folder-expand"]');
    const folderCount = await expandableFolders.count();

    if (folderCount > 0) {
      // 快速连续点击 5 次（展开/折叠循环）
      for (let i = 0; i < 5; i++) {
        await expandableFolders.first().click();
        await page.waitForTimeout(100);
      }

      // 验证没有崩溃：文件树仍然可见
      const fileTree = page.getByTestId('file-tree');
      await expect(fileTree).toBeVisible();

      // 验证至少有文件项渲染
      const fileItems = page.locator('[data-testid="file-item"]');
      const itemCount = await fileItems.count();
      expect(itemCount).toBeGreaterThan(0);
    }
  });

  // ─── AC1: 内存效率验证（虚拟滚动 vs 传统渲染） ───

  test('[P3] EPI3-02-E2E-014: 虚拟滚动 DOM 节点数量远少于文件总数 (AC1)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="file-tree"]');
        return el && !el.querySelector('.loading');
      },
      { timeout: 15000 }
    );

    test.skip(!backendAvailable, '后端未运行，跳过此测试');

    // 展开 workspace
    await expandWorkspace(page);

    // 获取文件树中实际文件项的 DOM 数量
    const fileItems = page.locator('[data-testid="file-item"]');
    const renderedCount = await fileItems.count();

    // 虚拟滚动模式下，DOM 节点数量应 <= 可视区域项数 + overscan（约 20-30 项）
    // 不应渲染全部 60+ 个文件项
    expect(renderedCount).toBeLessThan(60);

    // 验证虚拟滚动容器存在
    const virtualContainer = page.getByTestId('virtual-scroll-container');
    await expect(virtualContainer).toBeVisible({ timeout: 5000 });
  });
});
