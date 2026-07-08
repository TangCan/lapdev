import { test, expect } from '@playwright/test';

test.describe('Terminal Tab Management', () => {
  test('[P0] TC-7.1.1 should create a new terminal tab when clicking + button', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    page.on('console', msg => {
      if (msg.text().includes('Terminal')) {
        console.log('Browser console:', msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-button"]', { timeout: 10000 });
    await page.locator('[data-testid="terminal-button"]').click();
    await page.waitForTimeout(3000);
    await page.waitForSelector('[data-testid="terminal-panel"]', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    const terminalPanel = page.locator('[data-testid="terminal-panel"]');
    await expect(terminalPanel).toBeVisible();
    
    const tabsBefore = page.locator('[data-testid^="terminal-tab-item-"]');
    const countBefore = await tabsBefore.count();
    console.log('Tabs before:', countBefore);
    
    await page.locator('[data-testid="terminal-tab-add"]').click();
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
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-button"]', { timeout: 10000 });
    await page.locator('[data-testid="terminal-button"]').click();
    await page.waitForTimeout(3000);
    await page.waitForSelector('[data-testid="terminal-panel"]', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    const terminalPanel = page.locator('[data-testid="terminal-panel"]');
    await expect(terminalPanel).toBeVisible();
    
    await page.locator('[data-testid="terminal-tab-add"]').click();
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
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-button"]', { timeout: 10000 });
    await page.locator('[data-testid="terminal-button"]').click();
    await page.waitForTimeout(3000);
    await page.waitForSelector('[data-testid="terminal-panel"]', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    const terminalPanel = page.locator('[data-testid="terminal-panel"]');
    await expect(terminalPanel).toBeVisible();
    
    await page.locator('[data-testid="terminal-tab-add"]').click();
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

  test('[P0] TC-7.1.4 should switch to adjacent tab when closing active tab', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-button"]', { timeout: 10000 });
    await page.locator('[data-testid="terminal-button"]').click();
    await page.waitForTimeout(3000);
    await page.waitForSelector('[data-testid="terminal-panel"]', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    const terminalPanel = page.locator('[data-testid="terminal-panel"]');
    await expect(terminalPanel).toBeVisible();
    
    await page.locator('[data-testid="terminal-tab-add"]').click();
    await page.waitForTimeout(1000);
    await page.locator('[data-testid="terminal-tab-add"]').click();
    await page.waitForTimeout(1000);
    
    const tabs = page.locator('[data-testid^="terminal-tab-item-"]');
    await tabs.nth(1).click();
    await page.waitForTimeout(500);
    
    await page.locator('[data-testid^="terminal-tab-close-"]').nth(1).click();
    await page.waitForTimeout(500);
    
    const isActive = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-testid^="terminal-tab-item-"]');
      return elements[0]?.classList.contains('active');
    });
    
    expect(isActive).toBe(true);
    
    await context.close();
  });

  test('[P1] TC-7.1.5 should show context menu when right-clicking tab', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-button"]', { timeout: 10000 });
    await page.locator('[data-testid="terminal-button"]').click();
    await page.waitForTimeout(3000);
    await page.waitForSelector('[data-testid="terminal-panel"]', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    const terminalPanel = page.locator('[data-testid="terminal-panel"]');
    await expect(terminalPanel).toBeVisible();
    
    const tabs = page.locator('[data-testid^="terminal-tab-item-"]');
    await tabs.first().click({ button: 'right' });
    await page.waitForTimeout(500);
    
    const contextMenu = page.locator('.terminal-context-menu');
    await expect(contextMenu).toBeVisible();
    
    await context.close();
  });

  test('[P2] TC-7.1.7 should not close the only remaining tab', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-button"]', { timeout: 10000 });
    await page.locator('[data-testid="terminal-button"]').click();
    await page.waitForTimeout(3000);
    await page.waitForSelector('[data-testid="terminal-panel"]', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    const terminalPanel = page.locator('[data-testid="terminal-panel"]');
    await expect(terminalPanel).toBeVisible();
    
    const tabs = page.locator('[data-testid^="terminal-tab-item-"]');
    const closeButtons = page.locator('[data-testid^="terminal-tab-close-"]');
    
    expect(await tabs.count()).toBe(1);
    expect(await closeButtons.count()).toBe(0);
    
    await context.close();
  });
});