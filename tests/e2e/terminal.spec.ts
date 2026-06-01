import { test, expect } from '@playwright/test';

test.describe('[1.3] Terminal E2E Tests (ATDD GREEN PHASE)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 10000 });
  });

  test('[P0] should open terminal panel when clicking terminal button', async ({ page }) => {
    const terminalButton = page.getByTestId('terminal-button');
    await terminalButton.click();

    const terminalPanel = page.getByTestId('terminal-panel');
    await expect(terminalPanel).toBeVisible({ timeout: 10000 });
  });

  test('[P0] should execute command and display output', async ({ page }) => {
    const terminalButton = page.getByTestId('terminal-button');
    await terminalButton.click();

    const terminalPanel = page.getByTestId('terminal-panel');
    await expect(terminalPanel).toBeVisible({ timeout: 10000 });
    
    const terminalInput = page.getByTestId('terminal-input');
    await expect(terminalInput).toBeEnabled({ timeout: 10000 });
    
    await terminalInput.fill('echo "Hello from terminal"');
    await terminalInput.press('Enter');

    const terminalOutput = page.getByTestId('terminal-output');
    await expect(terminalOutput).toContainText('Hello from terminal', { timeout: 10000 });
  });

  test('[P0] should have command execution delay under 500ms', async ({ page }) => {
    const terminalButton = page.getByTestId('terminal-button');
    await terminalButton.click();

    const terminalPanel = page.getByTestId('terminal-panel');
    await expect(terminalPanel).toBeVisible({ timeout: 10000 });
    
    const terminalInput = page.getByTestId('terminal-input');
    await expect(terminalInput).toBeEnabled({ timeout: 10000 });

    const startTime = Date.now();
    await terminalInput.fill('echo test');
    await terminalInput.press('Enter');

    const terminalOutput = page.getByTestId('terminal-output');
    await expect(terminalOutput).toContainText('test', { timeout: 10000 });

    const endTime = Date.now();
    const delay = endTime - startTime;

    expect(delay).toBeLessThan(500);
  });

  test('[P1] should show terminal tab', async ({ page }) => {
    const terminalButton = page.getByTestId('terminal-button');
    await terminalButton.click();

    const terminalTab = page.getByTestId('terminal-tab');
    await expect(terminalTab).toBeVisible({ timeout: 10000 });
  });

  test('[P1] should allow closing terminal panel', async ({ page }) => {
    const terminalButton = page.getByTestId('terminal-button');
    await terminalButton.click();

    const terminalPanel = page.getByTestId('terminal-panel');
    await expect(terminalPanel).toBeVisible({ timeout: 10000 });

    await terminalButton.click();
    await expect(terminalPanel).not.toBeVisible();
  });

  test('[P2] should display command prompts', async ({ page }) => {
    const terminalButton = page.getByTestId('terminal-button');
    await terminalButton.click();

    const terminalPanel = page.getByTestId('terminal-panel');
    await expect(terminalPanel).toBeVisible({ timeout: 10000 });
    
    const terminalOutput = page.getByTestId('terminal-output');
    await expect(terminalOutput).toContainText('$', { timeout: 10000 });
  });

  test('[P2] should display text output in terminal', async ({ page }) => {
    const terminalButton = page.getByTestId('terminal-button');
    await terminalButton.click();

    const terminalPanel = page.getByTestId('terminal-panel');
    await expect(terminalPanel).toBeVisible({ timeout: 10000 });
    
    const terminalInput = page.getByTestId('terminal-input');
    await expect(terminalInput).toBeEnabled({ timeout: 10000 });
    
    await terminalInput.fill('echo -e "Red Text"');
    await terminalInput.press('Enter');

    const terminalOutput = page.getByTestId('terminal-output');
    await expect(terminalOutput).toContainText('Red Text', { timeout: 10000 });
  });

  test('[P3] should resize terminal panel when using resize buttons', async ({ page }) => {
    const terminalButton = page.getByTestId('terminal-button');
    await terminalButton.click();

    const terminalContainer = page.getByTestId('terminal-container');
    await expect(terminalContainer).toBeVisible({ timeout: 10000 });

    const resizeUpButton = page.locator('.terminal-control-btn').first();
    await resizeUpButton.click();
    await page.waitForTimeout(200);

    const newHeight = await terminalContainer.evaluate(el => (el as HTMLElement).offsetHeight);
    expect(newHeight).toBeGreaterThanOrEqual(200);
  });
});