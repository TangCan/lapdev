import { test } from './fixtures/ai.fixture';

test.describe('Code Completion', () => {
  test('should show code suggestions', async ({ page, codeCompletion, editor }) => {
    await page.goto('/');
    
    await editor.type('const arr = [1, 2, 3]; arr.');
    await codeCompletion.triggerCompletion();
    await codeCompletion.waitForSuggestions();
    
    const suggestions = await codeCompletion.getSuggestions();
    test.expect(suggestions.length).toBeGreaterThan(0);
  });

  test('should insert selected suggestion', async ({ page, codeCompletion, editor }) => {
    await page.goto('/');
    
    await editor.type('const str = "hello"; str.');
    await codeCompletion.triggerCompletion();
    await codeCompletion.waitForSuggestions();
    await codeCompletion.selectSuggestion(0);
    
    const content = await editor.getContent();
    test.expect(content).toContain('str.');
  });
});