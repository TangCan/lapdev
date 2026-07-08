import { test, expect } from '@playwright/test';

async function openTestFile(page: any) {
  await page.goto('/');

  await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });
  await page.waitForSelector('[data-testid="file-item"]', { timeout: 15000 });

  const workspaceFolder = page.locator('[data-testid="file-item"]').filter({ hasText: 'workspace' });
  await workspaceFolder.click({ timeout: 10000 });
  await page.waitForTimeout(800);

  const testTsFile = page.locator('[data-testid="file-item"]').filter({ hasText: 'test.ts' });
  await testTsFile.click({ timeout: 10000 });

  await page.waitForTimeout(2000);

  await page.waitForSelector('[data-testid="code-editor"]', { timeout: 15000 });

  const editor = page.locator('.monaco-editor');
  await editor.click({ timeout: 10000 });
  await page.waitForTimeout(500);

  await page.keyboard.press('Control+A');
  await page.waitForTimeout(200);
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(800);
}

async function typeEditorContent(page: any, content: string) {
  await page.keyboard.type(content, { delay: 50 });
  await page.waitForTimeout(800);
}

test.describe('[E2E] LSP Hover Provider', () => {
  test.describe('AC-1: 基本悬停提示', () => {
    test.skip('[P0] TC-8.1.1 should show hover info when hovering over variable', async ({ page }) => {
      await openTestFile(page);

      await typeEditorContent(page, 'const x: number = 42;');

      await page.waitForTimeout(1000);

      const editor = page.locator('.monaco-editor');
      await editor.hover({ position: { x: 100, y: 20 } });

      await page.waitForTimeout(500);

      const hoverWidget = page.locator('.monaco-editor .hover-widget');
      await expect(hoverWidget).toBeVisible();
      await expect(hoverWidget).toContainText('number');
    });

    test.skip('[P0] TC-8.1.2 should show documentation when hovering over function with JSDoc', async ({ page }) => {
      await openTestFile(page);

      await typeEditorContent(page, '/**\n * Adds two numbers\n */\nfunction add(a: number, b: number): number {\n  return a + b;\n}');

      await page.waitForTimeout(1000);

      const editor = page.locator('.monaco-editor');
      await editor.hover({ position: { x: 100, y: 60 } });

      await page.waitForTimeout(500);

      const hoverWidget = page.locator('.monaco-editor .hover-widget');
      await expect(hoverWidget).toBeVisible();
      await expect(hoverWidget).toContainText('add');
      await expect(hoverWidget).toContainText('Adds two numbers');
    });
  });

  test.describe('AC-2: 导入模块悬停', () => {
    test.skip('[P0] TC-8.1.4 should show exports when hovering over imported module', async ({ page }) => {
      await openTestFile(page);

      await typeEditorContent(page, 'import { useState } from \'react\';');

      await page.waitForTimeout(1500);

      const editor = page.locator('.monaco-editor');
      await editor.hover({ position: { x: 80, y: 20 } });

      await page.waitForTimeout(500);

      const hoverWidget = page.locator('.monaco-editor .hover-widget');
      await expect(hoverWidget).toBeVisible();
    });
  });

  test.describe('AC-3: 错误符号悬停', () => {
    test.skip('[P0] TC-8.1.6 should show error info when hovering over type error', async ({ page }) => {
      await openTestFile(page);

      await typeEditorContent(page, 'const x: number = "string";');

      await page.waitForTimeout(2000);

      const editor = page.locator('.monaco-editor');
      await editor.hover({ position: { x: 150, y: 20 } });

      await page.waitForTimeout(500);

      const hoverWidget = page.locator('.monaco-editor .hover-widget');
      await expect(hoverWidget).toBeVisible();
    });
  });

  test.describe('AC-4: 泛型参数悬停', () => {
    test.skip('[P1] TC-8.1.8 should show type constraints when hovering over generic parameter', async ({ page }) => {
      await openTestFile(page);

      await typeEditorContent(page, 'function identity<T extends string>(arg: T): T {\n  return arg;\n}');

      await page.waitForTimeout(1000);

      const editor = page.locator('.monaco-editor');
      await editor.hover({ position: { x: 200, y: 20 } });

      await page.waitForTimeout(500);

      const hoverWidget = page.locator('.monaco-editor .hover-widget');
      await expect(hoverWidget).toBeVisible();
    });
  });

  test.describe('Hover Widget Behavior', () => {
    test.skip('[P1] should hide hover widget when moving mouse away', async ({ page }) => {
      await openTestFile(page);

      await typeEditorContent(page, 'const x: number = 42;');

      await page.waitForTimeout(1000);

      const editor = page.locator('.monaco-editor');
      await editor.hover({ position: { x: 100, y: 20 } });

      await page.waitForTimeout(500);

      const hoverWidget = page.locator('.monaco-editor .hover-widget');
      await expect(hoverWidget).toBeVisible();

      await editor.hover({ position: { x: 5, y: 5 } });
      await page.waitForTimeout(500);

      await expect(hoverWidget).not.toBeVisible();
    });

    test.skip('[P2] should update hover info when moving between symbols', async ({ page }) => {
      await openTestFile(page);

      await typeEditorContent(page, 'const x: number = 42;\nconst y: string = "hello";');

      await page.waitForTimeout(1000);

      const editor = page.locator('.monaco-editor');

      await editor.hover({ position: { x: 100, y: 20 } });
      await page.waitForTimeout(500);

      let hoverWidget = page.locator('.monaco-editor .hover-widget');
      await expect(hoverWidget).toBeVisible();
      await expect(hoverWidget).toContainText('number');

      await editor.hover({ position: { x: 100, y: 40 } });
      await page.waitForTimeout(500);

      hoverWidget = page.locator('.monaco-editor .hover-widget');
      await expect(hoverWidget).toBeVisible();
      await expect(hoverWidget).toContainText('string');
    });
  });
});
