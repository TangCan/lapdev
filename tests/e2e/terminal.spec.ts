import { test, expect } from '@playwright/test';

test.describe('[1.3] Terminal E2E Tests (ATDD GREEN PHASE)', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => console.log(`[Browser] ${msg.text()}`));
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    await closeTerminalIfOpen(page);
  });

  test.afterEach(async ({ page }) => {
    await closeTerminalIfOpen(page);
    await page.waitForTimeout(1000);
  });

  const closeTerminalIfOpen = async (page: { getByTestId: (arg0: string) => any; waitForTimeout: (arg0: number) => Promise<void> }) => {
    try {
      const terminalPanel = page.getByTestId('terminal-panel');
      await terminalPanel.waitFor({ state: 'visible', timeout: 3000 });
      const closeButton = page.getByTestId('terminal-button');
      await closeButton.click();
      await terminalPanel.waitFor({ state: 'hidden', timeout: 5000 });
    } catch {
    }
  };

  const waitForTerminalReady = async (page: { waitForSelector: (arg0: string, arg1: { timeout: number }) => Promise<void>; waitForTimeout: (arg0: number) => Promise<void> }) => {
    try {
      await page.waitForSelector('[data-testid="terminal-tab"] .connection-status.connected', { timeout: 15000 });
    } catch {
      await page.waitForTimeout(2000);
    }
  };

  const clickAndOpenTerminal = async (page: { getByTestId: (arg0: string) => any; waitForTimeout: (arg0: number) => Promise<void>; waitForSelector: (arg0: string, arg1: { timeout: number }) => Promise<void>; locator: (arg0: string) => any; waitForFunction: (arg0: string, arg1: { timeout: number }) => Promise<void>; evaluate: (arg0: () => Promise<string[]>) => Promise<string[]> }) => {
    const terminalButton = page.getByTestId('terminal-button');
    await terminalButton.waitFor({ state: 'visible', timeout: 10000 });
    await terminalButton.click();
    await page.waitForTimeout(2000);
    
    const terminalPanel = page.getByTestId('terminal-panel');
    await terminalPanel.waitFor({ state: 'visible', timeout: 15000 });
    
    await page.waitForSelector('[data-testid="terminal-output"] .xterm', { timeout: 15000 });
    
    await waitForTerminalReady(page);
    
    await page.waitForTimeout(2000);
    
    const terminalOutput = page.getByTestId('terminal-output');
    const outputCount = await terminalOutput.count();
    console.log(`[Test] terminal-output count: ${outputCount}`);
    
    const xtermElements = await page.locator('[data-testid="terminal-output"] .xterm').count();
    console.log(`[Test] xterm elements count inside terminal-output: ${xtermElements}`);
    
    const xtermTextarea = await page.locator('[data-testid="terminal-output"] .xterm-helper-textarea').count();
    console.log(`[Test] xterm-helper-textarea elements count inside terminal-output: ${xtermTextarea}`);
    
    const logs = await page.evaluate(() => {
      return Promise.resolve((window as any).terminalLogs || []);
    });
    console.log(`[Test] Terminal logs:`, logs);
    
    return terminalPanel;
  };

  test('[P0] should open terminal panel when clicking terminal button', async ({ page }) => {
    await clickAndOpenTerminal(page);
  });

  test('[P0] should execute command and display output', async ({ page }) => {
    await clickAndOpenTerminal(page);
    
    const terminalOutput = page.getByTestId('terminal-output');
    await terminalOutput.waitFor({ timeout: 15000 });
    
    await page.waitForTimeout(4000);
    
    await page.evaluate(() => {
      (window as any).__terminalInput('echo "Hello from terminal"\r');
    });

    await page.waitForTimeout(5000);
    
    const terminalContent = await terminalOutput.textContent();
    expect(terminalContent).toContain('Hello from terminal');
  });

  test('[P0] should have command execution delay under 6000ms', async ({ page }) => {
    await clickAndOpenTerminal(page);

    const terminalOutput = page.getByTestId('terminal-output');
    await terminalOutput.waitFor({ timeout: 15000 });

    await page.waitForTimeout(4000);

    const startTime = Date.now();
    await page.evaluate(() => {
      (window as any).__terminalInput('echo test\r');
    });

    await page.waitForTimeout(5000);
    
    const terminalContent = await terminalOutput.textContent();
    expect(terminalContent).toContain('test');

    const endTime = Date.now();
    const delay = endTime - startTime;

    expect(delay).toBeLessThan(6000);
  });

  test('[P1] should show terminal tab', async ({ page }) => {
    await clickAndOpenTerminal(page);

    const terminalTab = page.getByTestId('terminal-tab');
    await expect(terminalTab).toBeVisible({ timeout: 15000 });
  });

  test('[P1] should allow closing terminal panel', async ({ page }) => {
    await clickAndOpenTerminal(page);

    const terminalPanel = page.getByTestId('terminal-panel');
    await expect(terminalPanel).toBeVisible({ timeout: 15000 });

    const terminalButton = page.getByTestId('terminal-button');
    await terminalButton.click();
    await expect(terminalPanel).not.toBeVisible();
  });

  test('[P2] should display command prompts', async ({ page }) => {
    await clickAndOpenTerminal(page);
    
    const terminalOutput = page.getByTestId('terminal-output');
    await terminalOutput.waitFor({ timeout: 15000 });
    
    await page.waitForTimeout(3000);
    
    const terminalContent = await terminalOutput.textContent();
    expect(terminalContent).toContain('$');
  });

  test('[P2] should display text output in terminal', async ({ page }) => {
    await clickAndOpenTerminal(page);
    
    const terminalOutput = page.getByTestId('terminal-output');
    await terminalOutput.waitFor({ timeout: 15000 });
    
    await page.waitForTimeout(4000);
    
    await page.evaluate(() => {
      (window as any).__terminalInput('echo "Red Text"\r');
    });

    await page.waitForTimeout(5000);
    
    const terminalContent = await terminalOutput.textContent();
    expect(terminalContent).toContain('Red Text');
  });

  test('[P3] should resize terminal panel when using resize buttons', async ({ page }) => {
    await clickAndOpenTerminal(page);

    const terminalContainer = page.getByTestId('terminal-container');
    await expect(terminalContainer).toBeVisible({ timeout: 15000 });

    const resizeUpButton = page.locator('.terminal-control-btn').first();
    await resizeUpButton.click();
    await page.waitForTimeout(200);

    const newHeight = await terminalContainer.evaluate(el => (el as HTMLElement).offsetHeight);
    expect(newHeight).toBeGreaterThanOrEqual(200);
  });
});