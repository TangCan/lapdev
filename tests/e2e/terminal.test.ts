import { test } from './fixtures/ide.fixture';

test.describe('Terminal Operations', () => {
  test('should execute a command', async ({ page, terminal }) => {
    await page.goto('/');
    
    await terminal.executeCommand('echo "Hello from terminal"');
    await terminal.waitForOutput('Hello from terminal');
    
    const output = await terminal.getOutput();
    test.expect(output).toContain('Hello from terminal');
  });

  test('should clear terminal output', async ({ page, terminal }) => {
    await page.goto('/');
    
    await terminal.executeCommand('ls');
    await terminal.clear();
    
    const output = await terminal.getOutput();
    test.expect(output).toBe('');
  });
});