import { test, expect } from '@playwright/test';

test.describe('[1.3] Terminal E2E Tests (ATDD GREEN PHASE)', () => {
  test('[P0] should open terminal panel when clicking terminal button', async ({ page }) => {
    await page.goto('/');

    const terminalButton = page.getByRole('button', { name: /terminal/i });
    await terminalButton.click();

    const terminalPanel = page.getByTestId('terminal-panel');
    await expect(terminalPanel).toBeVisible();
  });

  test('[P0] should execute command and display output', async ({ page }) => {
    await page.goto('/');

    const terminalButton = page.getByRole('button', { name: /terminal/i });
    await terminalButton.click();

    const terminalInput = page.getByTestId('terminal-input');
    await terminalInput.fill('echo "Hello from terminal"');
    await terminalInput.press('Enter');

    const terminalOutput = page.getByTestId('terminal-output');
    await expect(terminalOutput).toContainText('Hello from terminal');
  });

  test('[P0] should have command execution delay under 500ms', async ({ page }) => {
    await page.goto('/');

    const terminalButton = page.getByRole('button', { name: /terminal/i });
    await terminalButton.click();

    const terminalInput = page.getByTestId('terminal-input');
    
    const startTime = Date.now();
    await terminalInput.fill('echo test');
    await terminalInput.press('Enter');

    const terminalOutput = page.getByTestId('terminal-output');
    await expect(terminalOutput).toContainText('test');
    
    const endTime = Date.now();
    const delay = endTime - startTime;
    
    expect(delay).toBeLessThan(500);
  });

  test('[P1] should show terminal tab', async ({ page }) => {
    await page.goto('/');

    const terminalButton = page.getByRole('button', { name: /terminal/i });
    await terminalButton.click();

    const terminalTab = page.getByTestId('terminal-tab');
    await expect(terminalTab).toBeVisible();
  });

  test('[P1] should allow closing terminal panel', async ({ page }) => {
    await page.goto('/');

    const terminalButton = page.getByRole('button', { name: /terminal/i });
    await terminalButton.click();

    const terminalPanel = page.getByTestId('terminal-panel');
    await expect(terminalPanel).toBeVisible();

    await terminalButton.click();
    await expect(terminalPanel).not.toBeVisible();
  });

  test('[P2] should display command prompts', async ({ page }) => {
    await page.goto('/');

    const terminalButton = page.getByRole('button', { name: /terminal/i });
    await terminalButton.click();

    const terminalOutput = page.getByTestId('terminal-output');
    await expect(terminalOutput).toContainText('$');
  });

  test('[P2] should display text output in terminal', async ({ page }) => {
    await page.goto('/');

    const terminalButton = page.getByRole('button', { name: /terminal/i });
    await terminalButton.click();

    const terminalInput = page.getByTestId('terminal-input');
    await terminalInput.fill('echo -e "Red Text"');
    await terminalInput.press('Enter');

    const terminalOutput = page.getByTestId('terminal-output');
    await expect(terminalOutput).toContainText('Red Text');
  });

  test('[P3] should resize terminal panel when using resize buttons', async ({ page }) => {
    await page.goto('/');

    const terminalButton = page.getByRole('button', { name: /terminal/i });
    await terminalButton.click();

    const terminalContainer = page.getByTestId('terminal-container');
    const initialHeight = await terminalContainer.evaluate(el => el.offsetHeight);

    const resizeUpButton = page.locator('.terminal-control-btn').first();
    await resizeUpButton.click();

    const newHeight = await terminalContainer.evaluate(el => el.offsetHeight);
    expect(newHeight).toBe(200);
  });
});
