import { test, expect } from '@playwright/test';
import { safeGoto, safeWaitForSelector, safeClick } from './utils/testUtils';

test.describe('[7.1] Terminal Tab Management - Extended Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      console.log('[Browser Console]', msg.text());
    });
    
    await safeGoto(page, '/');
    await safeWaitForSelector(page, '[data-testid="file-tree"]', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    await safeClick(page, '[data-testid="terminal-button"]');
    await page.waitForTimeout(3000);
    
    const showTerminalState = await page.evaluate(() => (window as any).__test_showTerminalState);
    console.log('[Test] showTerminal state:', showTerminalState);
    
    const terminalPanelExists = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid="terminal-panel"]');
      return panel ? 'exists' : 'not found';
    });
    console.log('[Test] terminal-panel:', terminalPanelExists);
    
    const terminalContainerExists = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="terminal-container"]');
      return container ? 'exists' : 'not found';
    });
    console.log('[Test] terminal-container:', terminalContainerExists);
    
    const allTerminalElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-testid*="terminal"]');
      return Array.from(elements).map(el => {
        const htmlEl = el as HTMLElement;
        return {
          testid: el.getAttribute('data-testid'),
          visible: htmlEl.offsetParent !== null,
          display: window.getComputedStyle(el).display,
          visibility: window.getComputedStyle(el).visibility,
          hidden: htmlEl.hidden
        };
      });
    });
    console.log('[Test] All terminal elements:', JSON.stringify(allTerminalElements, null, 2));
    
    await safeWaitForSelector(page, '[data-testid="terminal-panel"]', { timeout: 15000 });
  });

  test('[P0] should maintain terminal state across tab switches', async ({ page }) => {
    const terminalPanel = page.locator('[data-testid="terminal-panel"]');

    await terminalPanel.locator('[data-testid="terminal-tab-add"]').click();
    await terminalPanel.locator('[data-testid="terminal-tab-add"]').click();

    const firstTab = terminalPanel.locator('[data-testid^="terminal-tab-item-"]').nth(0);
    const secondTab = terminalPanel.locator('[data-testid^="terminal-tab-item-"]').nth(1);
    const thirdTab = terminalPanel.locator('[data-testid^="terminal-tab-item-"]').nth(2);

    await secondTab.click();
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      (window as any).__terminalInput('echo "Tab 2 Output"\r');
    });
    await page.waitForTimeout(2000);

    await thirdTab.click();
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      (window as any).__terminalInput('echo "Tab 3 Output"\r');
    });
    await page.waitForTimeout(2000);

    await secondTab.click();
    await page.waitForTimeout(1000);

    const content = await page.evaluate(() => (window as any).__getTerminalOutput());
    expect(content).toContain('Tab 2 Output');
    expect(content).not.toContain('Tab 3 Output');
  });

  test('[P0] should create multiple tabs rapidly', async ({ page }) => {
    const terminalPanel = page.locator('[data-testid="terminal-panel"]');

    for (let i = 0; i < 5; i++) {
      await terminalPanel.locator('[data-testid="terminal-tab-add"]').click();
      await page.waitForTimeout(500);
    }

    await expect(terminalPanel.locator('[data-testid^="terminal-tab-item-"]')).toHaveCount(6);
    await expect(terminalPanel.locator('[data-testid^="terminal-tab-item-"].active')).toHaveCount(1);
  });

  test('[P1] should close tabs in reverse order', async ({ page }) => {
    const terminalPanel = page.locator('[data-testid="terminal-panel"]');

    await terminalPanel.locator('[data-testid="terminal-tab-add"]').click();
    await terminalPanel.locator('[data-testid="terminal-tab-add"]').click();
    await expect(terminalPanel.locator('[data-testid^="terminal-tab-item-"]')).toHaveCount(3);

    const thirdTab = terminalPanel.locator('[data-testid^="terminal-tab-item-"]').nth(2);
    const closeButton3 = thirdTab.locator('[data-testid^="terminal-tab-close-"]');
    await closeButton3.click();
    await expect(terminalPanel.locator('[data-testid^="terminal-tab-item-"]')).toHaveCount(2);

    const secondTab = terminalPanel.locator('[data-testid^="terminal-tab-item-"]').nth(1);
    const closeButton2 = secondTab.locator('[data-testid^="terminal-tab-close-"]');
    await closeButton2.click();
    await expect(terminalPanel.locator('[data-testid^="terminal-tab-item-"]')).toHaveCount(1);
  });

  test('[P1] should cancel rename with Escape', async ({ page }) => {
    const terminalPanel = page.locator('[data-testid="terminal-panel"]');
    const firstTab = terminalPanel.locator('[data-testid^="terminal-tab-item-"]').first();

    await firstTab.click({ button: 'right' });
    await page.locator('.terminal-context-menu-item:has-text("Rename")').click();

    const renameInput = page.locator('.terminal-rename-input');
    await expect(renameInput).toBeVisible();
    await renameInput.fill('New Name');
    await renameInput.press('Escape');

    await expect(firstTab).toContainText('Terminal 1');
    await expect(renameInput).not.toBeVisible();
  });

  test('[P2] should prevent empty tab names', async ({ page }) => {
    const terminalPanel = page.locator('[data-testid="terminal-panel"]');
    const firstTab = terminalPanel.locator('[data-testid^="terminal-tab-item-"]').first();

    await firstTab.click({ button: 'right' });
    await page.locator('.terminal-context-menu-item:has-text("Rename")').click();

    const renameInput = page.locator('.terminal-rename-input');
    await renameInput.fill('');
    await renameInput.press('Enter');

    await expect(firstTab).toContainText('Terminal 1');
  });

  test('[P2] should handle rename with special characters', async ({ page }) => {
    const terminalPanel = page.locator('[data-testid="terminal-panel"]');
    const firstTab = terminalPanel.locator('[data-testid^="terminal-tab-item-"]').first();

    await firstTab.click({ button: 'right' });
    await page.locator('.terminal-context-menu-item:has-text("Rename")').click();

    const renameInput = page.locator('.terminal-rename-input');
    await renameInput.fill('My Terminal 🚀');
    await renameInput.press('Enter');

    await expect(firstTab).toContainText('My Terminal');
  });

  test('[P2] should not close tab when close button disabled', async ({ page }) => {
    const terminalPanel = page.locator('[data-testid="terminal-panel"]');

    await expect(terminalPanel.locator('[data-testid^="terminal-tab-item-"]')).toHaveCount(1);
    const closeButton = terminalPanel.locator('[data-testid^="terminal-tab-close-"]');
    await expect(closeButton).not.toBeVisible();
  });

  test('[P2] should show disabled close menu for single tab', async ({ page }) => {
    const terminalPanel = page.locator('[data-testid="terminal-panel"]');
    const firstTab = terminalPanel.locator('[data-testid^="terminal-tab-item-"]').first();

    await expect(terminalPanel.locator('[data-testid^="terminal-tab-item-"]')).toHaveCount(1);

    await firstTab.click({ button: 'right' });
    await expect(page.locator('.terminal-context-menu')).toBeVisible();
    
    const closeMenuItem = page.locator('.terminal-context-menu-item:has-text("Close Tab")');
    await expect(closeMenuItem).toHaveClass(/disabled/);
  });
});