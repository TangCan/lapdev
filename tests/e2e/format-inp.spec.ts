/**
 * EPI3.03 性能度量：格式化 / LSP 更新期间的交互响应（INP / interaction latency）
 *
 * Story: epi3-03-complex-operation-concurrent-processing
 * Acceptance Criteria: AC1（格式化 startTransition 保持 UI 响应）, AC2, AC3
 *
 * 度量口径：
 * - 在浏览器注入 PerformanceObserver 监听 `event` / `first-input` 两个 entryType，
 *   采集每次离散交互（keydown/pointerdown/mousedown）的 interaction duration
 *   （事件处理开始到下一帧渲染完成的延迟，即 INP 的底层指标）。
 * - 触发大文件格式化后，立即连续输入 + 点击，模拟「重计算期间用户不阻塞」，
 *   统计这些交互的 p75（以及 max）作为证据。
 *
 * 阈值与噪声控制：
 * - 默认 p75 阈值 500ms（Google INP 评级的「需改进」上界；大文件 + 冷启动下放宽），
 *   可用环境变量 INP_P75_THRESHOLD_MS 覆盖；严格场景可设 200ms。
 * - observer 使用 durationThreshold: 16（一帧）过滤掉瞬时噪声交互，聚焦真实阻塞。
 *
 * 说明：INP 属运行时度量，受 CI 资源竞争与 Monaco 冷启动影响，阈值已按宽裕设定；
 * 本文件专注「证据采集」，不做脆弱的分位数极端断言。
 */
import { test, expect } from '@playwright/test';

const P75_THRESHOLD_MS = Number(process.env.INP_P75_THRESHOLD_MS ?? 500);

/**
 * 创建并打开一个大文件（供格式化产生足够重的重计算压力）
 */
async function createAndOpenLargeFile(page: any, fileName: string, lineCount: number) {
  const content = Array(lineCount).fill('function test(){const x=1;return x;}').join('\n');

  let created = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const result = await page.evaluate(
      async ({ name, fileContent }: { name: string; fileContent: string }) => {
        try {
          const response = await fetch('/api/v1/agent/write-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: name, content: fileContent }),
          });
          if (!response.ok) return null;
          const text = await response.text();
          if (!text) return null;
          return { status: response.status, data: JSON.parse(text) };
        } catch {
          return null;
        }
      },
      { name: fileName, fileContent: content }
    );
    if (result?.data?.status === 'success') {
      created = true;
      break;
    }
    await page.waitForTimeout(500 * attempt);
  }
  if (!created) {
    throw new Error(`[createAndOpenLargeFile] 文件创建失败 (${fileName})`);
  }

  // 文件树不会自动刷新，reload 后重新定位并展开 workspace
  await page.reload();
  await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });
  await page.waitForSelector('[data-testid="file-item"]', { timeout: 10000 });

  const workspaceFolder = page.locator('[data-testid="file-item"]').filter({ hasText: 'workspace' });
  if (await workspaceFolder.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    const hasChildren = await workspaceFolder.locator('xpath=../div[contains(@class,"children")]').count();
    if (hasChildren === 0) {
      await workspaceFolder.first().click();
      await page.waitForTimeout(800);
    }
  }

  const fileItem = page.locator('[data-testid="file-item"]').filter({ hasText: fileName });
  await expect(fileItem).toBeVisible({ timeout: 15000 });
  await fileItem.click();

  // Monaco 懒加载：点击占位符触发加载，再等待真实编辑器挂载
  const placeholder = page.getByTestId('code-editor-placeholder');
  await expect(placeholder).toBeVisible({ timeout: 10000 });
  await placeholder.click();
  await page.waitForSelector('[data-testid="code-editor"]', { timeout: 15000 });

  const codeEditor = page.locator('[data-testid="code-editor"]');
  await expect(codeEditor).toBeVisible({ timeout: 10000 });
  return codeEditor;
}

/** 读取采集到的交互延迟样本，返回排序后的数组与统计量 */
async function collectStats(page: any) {
  const samples: number[] = await page.evaluate(() =>
    Array.from((window as any).__inpSamples || [])
  );
  if (samples.length === 0) {
    return { samples, p75: 0, max: 0 };
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const p75 = sorted[Math.floor(sorted.length * 0.75)];
  const max = sorted[sorted.length - 1];
  return { samples: sorted, p75, max };
}

test.describe('[PERF] EPI3.03 并发处理交互响应 (INP)', () => {
  test.beforeEach(async ({ page }) => {
    // 必须在 goto 前注入，才能捕获起始交互
    await page.addInitScript(() => {
      (window as any).__inpSamples = [];
      try {
        const po = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'event' || entry.entryType === 'first-input') {
              (window as any).__inpSamples.push((entry as any).duration);
            }
          }
        });
        po.observe({ type: 'event', buffered: true, durationThreshold: 16 } as any);
        po.observe({ type: 'first-input', buffered: true } as any);
        (window as any).__inpObserver = po;
      } catch (e) {
        // 环境不支持 event timing 时静默降级
        (window as any).__inpSupported = false;
      }
    });

    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="file-item"]', { timeout: 10000 });
  });

  test('[PERF] EPI3.03-INP-001: 格式化大文件期间连续输入不阻塞', async ({ page }) => {
    const codeEditor = await createAndOpenLargeFile(page, 'inp-format-big.ts', 5000);

    const viewLines = codeEditor.locator('.view-lines');
    await expect(viewLines).toBeVisible({ timeout: 10000 });

    // 清空历史样本，聚焦本次交互窗口
    await page.evaluate(() => {
      (window as any).__inpSamples = [];
    });

    // 触发格式化（后端异步返回后 startTransition 提交大文件内容更新）
    await page.keyboard.press('Control+Shift+F');

    // 立即连续输入 + 点击，模拟「重计算期间用户不被阻塞」
    await codeEditor.click();
    await page.keyboard.type('// concurrent input while formatting');
    await codeEditor.click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('ArrowDown');

    // 等待 transition settle + observer 回调送达
    await page.waitForTimeout(800);

    const { samples, p75, max } = await collectStats(page);

    // 证据输出（供 review / NFR 审计引用）
    console.log(`[INP-001] samples=${samples.length} p75=${p75.toFixed(2)}ms max=${max.toFixed(2)}ms threshold=${P75_THRESHOLD_MS}ms`);

    // 编辑器在重计算后仍存活可交互
    await expect(viewLines).toBeVisible({ timeout: 5000 });

    expect(samples.length).toBeGreaterThan(0);
    expect(p75).toBeLessThan(P75_THRESHOLD_MS);
  });

  test('[PERF] EPI3.03-INP-002: 连续多次格式化期间交互 p75 收敛在阈值内', async ({ page }) => {
    const codeEditor = await createAndOpenLargeFile(page, 'inp-format-repeat.ts', 3000);

    const viewLines = codeEditor.locator('.view-lines');
    await expect(viewLines).toBeVisible({ timeout: 10000 });

    await page.evaluate(() => {
      (window as any).__inpSamples = [];
    });

    // 连续两轮格式化 + 输入，放大 transition 重渲染压力
    for (let round = 0; round < 2; round++) {
      await page.keyboard.press('Control+Shift+F');
      await codeEditor.click();
      await page.keyboard.type(`// round ${round}`);
      await page.waitForTimeout(600);
    }

    const { samples, p75, max } = await collectStats(page);
    console.log(`[INP-002] samples=${samples.length} p75=${p75.toFixed(2)}ms max=${max.toFixed(2)}ms threshold=${P75_THRESHOLD_MS}ms`);

    await expect(viewLines).toBeVisible({ timeout: 5000 });

    expect(samples.length).toBeGreaterThan(0);
    expect(p75).toBeLessThan(P75_THRESHOLD_MS);
  });
});