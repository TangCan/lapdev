import { test, expect } from '@playwright/test';

test.describe('[E2E] AI Chat Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 10000 });
  });

  // AC-1: AI面板UI
  test.skip('[P0] should open AI chat panel when button clicked', async ({ page }) => {
    // Click AI panel button
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    // Verify panel opens
    const chatPanel = page.locator('[data-testid="ai-chat-panel"]');
    await expect(chatPanel).toBeVisible({ timeout: 5000 });

    // Verify message list exists
    const messageList = page.locator('[data-testid="ai-message-list"]');
    await expect(messageList).toBeVisible();

    // Verify input area exists
    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    await expect(inputArea).toBeVisible();

    // Verify send button exists
    const sendButton = page.locator('[data-testid="ai-send-button"]');
    await expect(sendButton).toBeVisible();
  });

  test.skip('[P0] should show guidance when AI not configured', async ({ page }) => {
    // Click AI panel button
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    // Verify guidance message
    const guidance = page.locator('[data-testid="ai-guidance"]');
    await expect(guidance).toBeVisible();
    await expect(guidance).toContainText('请先在设置中配置AI');
  });

  // AC-2: 消息输入
  test.skip('[P0] should send plain text message', async ({ page }) => {
    // Click AI panel button
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    // Enter message
    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    await inputArea.fill('Hello, AI!');

    // Click send
    const sendButton = page.locator('[data-testid="ai-send-button"]');
    await sendButton.click();

    // Verify message appears in list
    const userMessage = page.locator('[data-testid="ai-message"]').filter({ hasText: 'Hello, AI!' });
    await expect(userMessage).toBeVisible({ timeout: 3000 });
  });

  test.skip('[P1] should support @file context reference', async ({ page }) => {
    // Click AI panel button
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    // Enter message with file reference
    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    await inputArea.fill('Explain this code @file:src/utils/helper.ts');

    // Click send
    const sendButton = page.locator('[data-testid="ai-send-button"]');
    await sendButton.click();

    // Verify message contains file reference
    const userMessage = page.locator('[data-testid="ai-message"]');
    await expect(userMessage.last()).toContainText('@file:src/utils/helper.ts');
  });

  // AC-3: 流式回复
  test.skip('[P1] should display streaming response incrementally', async ({ page }) => {
    // Click AI panel button
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    // Enter message
    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    await inputArea.fill('Hello');

    // Click send
    const sendButton = page.locator('[data-testid="ai-send-button"]');
    await sendButton.click();

    // Wait for AI response to start
    const aiResponse = page.locator('[data-testid="ai-message-assistant"]');
    await expect(aiResponse).toBeVisible({ timeout: 10000 });

    // Verify response contains content
    const textContent = await aiResponse.textContent();
    expect(textContent).toBeTruthy();
    expect(textContent!.length).toBeGreaterThan(0);
  });

  test.skip('[P1] should show loading indicator during response', async ({ page }) => {
    // Click AI panel button
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    // Enter message
    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    await inputArea.fill('Explain React hooks');

    // Click send
    const sendButton = page.locator('[data-testid="ai-send-button"]');
    await sendButton.click();

    // Verify loading indicator appears
    const loadingIndicator = page.locator('[data-testid="ai-loading"]');
    await expect(loadingIndicator).toBeVisible({ timeout: 5000 });
  });

  // AC-4: 会话管理
  test.skip('[P1] should preserve conversation history', async ({ page }) => {
    // Click AI panel button
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    // Send multiple messages
    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    const sendButton = page.locator('[data-testid="ai-send-button"]');

    await inputArea.fill('Message 1');
    await sendButton.click();
    await page.waitForTimeout(2000);

    await inputArea.fill('Message 2');
    await sendButton.click();
    await page.waitForTimeout(2000);

    // Verify both messages exist
    const messages = page.locator('[data-testid="ai-message"]');
    const count = await messages.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test.skip('[P1] should create new conversation', async ({ page }) => {
    // Click AI panel button
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    // Send a message
    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    const sendButton = page.locator('[data-testid="ai-send-button"]');
    await inputArea.fill('Test message');
    await sendButton.click();
    await page.waitForTimeout(2000);

    // Click new conversation button
    const newConversationButton = page.locator('[data-testid="ai-new-conversation"]');
    await newConversationButton.click();

    // Verify message list is cleared
    const messages = page.locator('[data-testid="ai-message"]');
    const count = await messages.count();
    expect(count).toBe(0);
  });

  test.skip('[P2] should clear conversation', async ({ page }) => {
    // Click AI panel button
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    // Send a message
    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    const sendButton = page.locator('[data-testid="ai-send-button"]');
    await inputArea.fill('Test message');
    await sendButton.click();
    await page.waitForTimeout(2000);

    // Click clear button
    const clearButton = page.locator('[data-testid="ai-clear-conversation"]');
    await clearButton.click();

    // Confirm dialog
    const confirmButton = page.locator('[data-testid="confirm-button"]');
    await confirmButton.click();

    // Verify message list is cleared
    const messages = page.locator('[data-testid="ai-message"]');
    const count = await messages.count();
    expect(count).toBe(0);
  });
});