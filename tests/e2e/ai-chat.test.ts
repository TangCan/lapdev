import { test } from './fixtures/ai.fixture';

test.describe('AI Chat Features', () => {
  test('should send message and receive response', async ({ page, aiChat }) => {
    await page.goto('/');
    
    await aiChat.openChat();
    await aiChat.sendMessage('What is Lapdev?');
    await aiChat.waitForResponse();
    
    const response = await aiChat.getLastResponse();
    test.expect(response).toBeDefined();
  });

  test('should switch between AI models', async ({ page, aiChat }) => {
    await page.goto('/');
    
    await aiChat.openChat();
    await aiChat.switchModel('deepseek');
    
    await page.waitForSelector('[data-testid="model-deepseek-active"]');
  });
});