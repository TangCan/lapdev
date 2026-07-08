import { test, expect } from '@playwright/test';

test('debug terminal visibility', async ({ page }) => {
  page.on('console', (msg) => {
    console.log(`[Browser] ${msg.text()}`);
  });
  
  page.on('pageerror', (err) => {
    console.log(`[Browser Error] ${err.message}`);
  });
  
  await page.goto('/');
  await page.waitForTimeout(3000);
  
  const beforeClick = await page.evaluate(() => {
    return {
      showTerminal: (window as any).__test_showTerminalState,
      terminalButton: !!document.querySelector('[data-testid="terminal-button"]'),
      terminalPanel: !!document.querySelector('[data-testid="terminal-panel"]'),
      terminalContainer: !!document.querySelector('[data-testid="terminal-container"]')
    };
  });
  
  console.log('Before click:', JSON.stringify(beforeClick));
  
  await page.locator('[data-testid="terminal-button"]').click();
  await page.waitForTimeout(5000);
  
  const afterClick = await page.evaluate(() => {
    return {
      showTerminal: (window as any).__test_showTerminalState,
      terminalButton: !!document.querySelector('[data-testid="terminal-button"]'),
      terminalPanel: !!document.querySelector('[data-testid="terminal-panel"]'),
      terminalContainer: !!document.querySelector('[data-testid="terminal-container"]'),
      allDataTestid: Array.from(document.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid'))
    };
  });
  
  console.log('After click:', JSON.stringify(afterClick, null, 2));
  
  const reactErrors = await page.evaluate(() => {
    return (window as any).__reactErrors || [];
  });
  console.log('React errors:', reactErrors);
  
  const terminalPanel = await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="terminal-panel"]');
    if (!panel) return { found: false };
    
    const style = window.getComputedStyle(panel);
    return {
      found: true,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      height: panel.offsetHeight,
      width: panel.offsetWidth,
      className: panel.className,
      hasTerminalClass: panel.classList.contains('terminal'),
      parent: panel.parentElement?.getAttribute('data-testid'),
      parentClass: panel.parentElement?.className
    };
  });
  
  console.log('Terminal panel details:', JSON.stringify(terminalPanel, null, 2));
});
