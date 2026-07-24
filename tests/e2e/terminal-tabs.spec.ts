import { test, expect } from '@playwright/test';
import { safeGoto, safeWaitForSelector, safeClick, waitForPageReady } from './utils/testUtils';

test.describe('Terminal Tab Management', () => {
  test('[P0] TC-7.1.1 should create a new terminal tab when clicking + button', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    page.on('console', msg => {
      if (msg.text().includes('Terminal')) {
        console.log('Browser console:', msg.text());
      }
    });
    
    await safeGoto(page, '/');
    await waitForPageReady(page);
    await safeWaitForSelector(page, '[data-testid="terminal-button"]', { timeout: 15000 });
    await safeClick(page, '[data-testid="terminal-button"]');
    await page.waitForTimeout(3000);
    await safeWaitForSelector(page, '[data-testid="terminal-panel"]', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    const terminalPanel = page.locator('[data-testid="terminal-panel"]');
    await expect(terminalPanel).toBeVisible();
    
    const tabsBefore = page.locator('[data-testid^="terminal-tab-item-"]');
    const countBefore = await tabsBefore.count();
    console.log('Tabs before:', countBefore);
    
    await safeClick(page, '[data-testid="terminal-tab-add"]');
    await page.waitForTimeout(1000);
    
    const tabsAfter = page.locator('[data-testid^="terminal-tab-item-"]');
    const countAfter = await tabsAfter.count();
    console.log('Tabs after:', countAfter);
    
    expect(countAfter).toBe(countBefore + 1);
    
    await context.close();
  });

  test('[P0] TC-7.1.2 should switch between terminal tabs', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await safeGoto(page, '/');
    await waitForPageReady(page);
    await safeWaitForSelector(page, '[data-testid="terminal-button"]', { timeout: 15000 });
    await safeClick(page, '[data-testid="terminal-button"]');
    await page.waitForTimeout(3000);
    await safeWaitForSelector(page, '[data-testid="terminal-panel"]', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    const terminalPanel = page.locator('[data-testid="terminal-panel"]');
    await expect(terminalPanel).toBeVisible();
    
    await safeClick(page, '[data-testid="terminal-tab-add"]');
    await page.waitForTimeout(1000);
    
    const tabs = page.locator('[data-testid^="terminal-tab-item-"]');
    await tabs.nth(0).click();
    await page.waitForTimeout(500);
    
    await tabs.nth(1).click();
    await page.waitForTimeout(500);
    
    const isActive = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-testid^="terminal-tab-item-"]');
      return elements[1]?.classList.contains('active');
    });
    
    expect(isActive).toBe(true);
    
    await context.close();
  });

  test('[P0] TC-7.1.3 should close a terminal tab when clicking × button', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await safeGoto(page, '/');
    await waitForPageReady(page);
    await safeWaitForSelector(page, '[data-testid="terminal-button"]', { timeout: 15000 });
    await safeClick(page, '[data-testid="terminal-button"]');
    await page.waitForTimeout(3000);
    await safeWaitForSelector(page, '[data-testid="terminal-panel"]', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    const terminalPanel = page.locator('[data-testid="terminal-panel"]');
    await expect(terminalPanel).toBeVisible();
    
    await safeClick(page, '[data-testid="terminal-tab-add"]');
    await page.waitForTimeout(1000);
    
    const tabsBefore = page.locator('[data-testid^="terminal-tab-item-"]');
    const countBefore = await tabsBefore.count();
    
    await page.locator('[data-testid^="terminal-tab-close-"]').first().click();
    await page.waitForTimeout(500);
    
    const tabsAfter = page.locator('[data-testid^="terminal-tab-item-"]');
    const countAfter = await tabsAfter.count();
    
    expect(countAfter).toBe(countBefore - 1);
    
    await context.close();
  });
});