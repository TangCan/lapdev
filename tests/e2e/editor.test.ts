import { test } from './fixtures/ide.fixture';

test.describe('Editor Operations', () => {
  test('should edit and save a file', async ({ page, editor }) => {
    await page.goto('/');
    
    await editor.type('const greeting = "Hello, Lapdev!";');
    await editor.save();
    
    const content = await editor.getContent();
    test.expect(content).toContain('Hello, Lapdev!');
  });

  test('should highlight syntax', async ({ page, editor }) => {
    await page.goto('/');
    
    await editor.type('function hello() { return "world"; }');
    await editor.waitForSyntaxHighlight();
    
    await page.waitForSelector('[data-testid="syntax-highlight-active"]');
  });
});