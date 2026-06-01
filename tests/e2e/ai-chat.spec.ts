import { test, expect } from '@playwright/test';

test.describe('[E2E] AI Chat Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 10000 });

    await page.evaluate(() => {
      const mockAIConfig = {
        models: [
          {
            id: 'mock-model-1',
            name: 'Mock AI',
            provider: 'openai' as const,
            apiKey: 'sk-mock-key',
            baseUrl: 'https://api.mock.com/v1',
            model: 'mock-model',
            isActive: true
          }
        ],
        currentModelId: 'mock-model-1'
      };
      sessionStorage.setItem('lapdev-ai-models', JSON.stringify(mockAIConfig));
    });

    await page.reload();
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 10000 });
  });

  // AC-1: AI面板UI
  test('[P0] should open AI chat panel when button clicked', async ({ page }) => {
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    const chatPanel = page.locator('[data-testid="ai-chat-panel"]');
    await expect(chatPanel).toBeVisible({ timeout: 5000 });

    const messageList = page.locator('[data-testid="ai-message-list"]');
    await expect(messageList).toBeVisible();

    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    await expect(inputArea).toBeVisible();

    const sendButton = page.locator('[data-testid="ai-send-button"]');
    await expect(sendButton).toBeVisible();
  });

  test('[P0] should show guidance when AI not configured', async ({ page }) => {
    await page.evaluate(() => sessionStorage.removeItem('lapdev-ai-models'));
    await page.reload();
    await page.waitForSelector('[data-testid="file-tree"]', { timeout: 10000 });

    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    const guidance = page.locator('[data-testid="ai-guidance"]');
    await expect(guidance).toBeVisible();
    await expect(guidance).toContainText('请先配置AI');
  });

  test('[P1] should close AI chat panel when close button clicked', async ({ page }) => {
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    const chatPanel = page.locator('[data-testid="ai-chat-panel"]');
    await expect(chatPanel).toBeVisible();

    const closeButton = page.locator('[data-testid="ai-close-panel"]');
    await closeButton.click();

    await expect(chatPanel).not.toBeVisible();
  });

  // AC-2: 消息输入
  test('[P0] should send plain text message', async ({ page }) => {
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    await inputArea.fill('Hello, AI!');

    const sendButton = page.locator('[data-testid="ai-send-button"]');
    await sendButton.click();

    const userMessage = page.locator('[data-testid="ai-message"]').filter({ hasText: 'Hello, AI!' });
    await expect(userMessage).toBeVisible({ timeout: 3000 });
  });

  test('[P1] should support @file context reference', async ({ page }) => {
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    await inputArea.fill('Explain this code @file:src/utils/helper.ts');

    const sendButton = page.locator('[data-testid="ai-send-button"]');
    await sendButton.click();

    const userMessage = page.locator('[data-testid="ai-message"]').filter({ hasText: '@file:src/utils/helper.ts' });
    await expect(userMessage).toBeVisible();
  });

  test('[P2] should reject messages exceeding character limit', async ({ page }) => {
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    const longMessage = 'a'.repeat(10001);
    await inputArea.fill(longMessage);

    const sendButton = page.locator('[data-testid="ai-send-button"]');
    await sendButton.click();

    const errorMessage = page.locator('[data-testid="ai-error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('输入超过');
  });

  test('[P2] should display character count', async ({ page }) => {
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    await inputArea.fill('Hello');

    const charCount = page.locator('[data-testid="ai-char-count"]');
    await expect(charCount).toBeVisible();
    await expect(charCount).toContainText('5');
  });

  // AC-3: 流式回复
  test('[P1] should display streaming response incrementally', async ({ page }) => {
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    await inputArea.fill('Hello');

    const sendButton = page.locator('[data-testid="ai-send-button"]');
    await sendButton.click();

    const aiResponse = page.locator('[data-testid="ai-message"][data-role="assistant"]');
    await expect(aiResponse).toBeVisible({ timeout: 10000 });

    const textContent = await aiResponse.textContent();
    expect(textContent).toBeTruthy();
    expect(textContent!.length).toBeGreaterThan(0);
  });

  test('[P1] should show loading indicator during response', async ({ page }) => {
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    await inputArea.fill('Explain React hooks');

    const sendButton = page.locator('[data-testid="ai-send-button"]');
    await sendButton.click();

    const loadingIndicator = page.locator('[data-testid="ai-loading"]');
    await expect(loadingIndicator).toBeVisible({ timeout: 5000 });
  });

  /**
   * 智能等待策略实现：验证loading指示器在响应完成后隐藏
   * 
   * 核心策略：
   * 1. 使用非阻塞式waitFor替代expect来处理loading可能快速出现又消失的情况
   * 2. 等待AI响应DOM出现且内容不为空，确保流式响应完成
   * 3. 使用waitForFunction轮询检测loading消失状态
   * 
   * 解决的异步问题：
   * - Mock响应可能很快完成，loading可能来不及被检测到
   * - React状态更新是异步的，DOM变化与状态更新存在时序差
   * - 流式响应是渐进式的，需要等待内容完全渲染
   */
  test('[P2] should hide loading indicator when response completes', async ({ page }) => {
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    await inputArea.fill('Short question');

    const sendButton = page.locator('[data-testid="ai-send-button"]');
    await sendButton.click();

    const loadingIndicator = page.locator('[data-testid="ai-loading"]');
    /**
     * 策略1：非阻塞等待loading出现
     * 使用waitFor + catch()避免loading出现时间太短导致测试失败
     * 增加超时时间到10秒以应对慢响应场景
     */
    await loadingIndicator.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

    const aiResponse = page.locator('[data-testid="ai-message"][data-role="assistant"]');
    /**
     * 策略2：双重验证确保流式响应完成
     * 第一步：等待响应DOM元素可见
     * 第二步：等待响应内容不为空（流式响应可能先出现空元素再填充内容）
     */
    await aiResponse.waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForFunction(
      () => {
        const response = document.querySelector('[data-testid="ai-message"][data-role="assistant"]');
        return response && response.textContent && response.textContent.trim().length > 0;
      },
      { timeout: 15000 }
    );

    /**
     * 策略3：智能等待loading消失
     * 使用waitForFunction轮询检测DOM状态，替代固定时间等待
     * 最多等待5秒，避免无限等待
     */
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="ai-loading"]'),
      { timeout: 5000 }
    );
  });

  test('[P2] should show error message and auto dismiss', async ({ page }) => {
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    await inputArea.fill('@file:../../etc/passwd');

    const sendButton = page.locator('[data-testid="ai-send-button"]');
    await sendButton.click();

    const errorMessage = page.locator('[data-testid="ai-error-message"]');
    await expect(errorMessage).toBeVisible();

    await page.waitForTimeout(6000);
    await expect(errorMessage).not.toBeVisible();
  });

  // AC-4: 会话管理
  /**
   * 智能等待策略实现：验证会话历史保持功能
   * 
   * 核心策略：
   * 1. 每条消息发送后等待loading状态从显示到消失，确保响应完整
   * 2. 使用loading状态作为响应完成的信号，替代固定时间等待
   * 3. 使用first()避免Playwright严格模式下多元素选择问题
   * 
   * 解决的异步问题：
   * - 流式响应需要时间完成（约4-5秒），固定2秒等待不足以完成响应
   * - React状态更新异步，消息计数可能在状态同步前获取到旧值
   * - Playwright严格模式下多个匹配元素会导致waitFor失败
   */
  test('[P1] should preserve conversation history', async ({ page }) => {
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    const sendButton = page.locator('[data-testid="ai-send-button"]');
    const loadingIndicator = page.locator('[data-testid="ai-loading"]');

    // 发送第一条消息并等待响应完成
    await inputArea.fill('Message 1');
    await sendButton.click();
    
    /**
     * 策略1：基于loading状态的响应完成检测
     * 等待loading出现（可选，因为响应可能太快），然后等待loading消失
     * 使用waitForFunction轮询，最长等待15秒确保流式响应完成
     */
    await loadingIndicator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="ai-loading"]'),
      { timeout: 15000 }
    );

    // 发送第二条消息并等待响应完成
    await inputArea.fill('Message 2');
    await sendButton.click();
    
    // 重复策略1：等待第二条消息的响应完成
    await loadingIndicator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="ai-loading"]'),
      { timeout: 15000 }
    );

    /**
     * 策略2：严格模式兼容处理
     * 使用first()方法避免Playwright严格模式下多个匹配元素的问题
     * 确保消息列表至少包含4条消息（2条用户消息 + 2条AI响应）
     */
    const messages = page.locator('[data-testid="ai-message"]');
    await messages.first().waitFor({ state: 'visible', timeout: 5000 });
    const count = await messages.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('[P1] should create new conversation', async ({ page }) => {
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    const sendButton = page.locator('[data-testid="ai-send-button"]');
    await inputArea.fill('Test message');
    await sendButton.click();
    await page.waitForTimeout(2000);

    const newConversationButton = page.locator('[data-testid="ai-new-conversation"]');
    await newConversationButton.click();

    const messages = page.locator('[data-testid="ai-message"]');
    const count = await messages.count();
    expect(count).toBe(0);
  });

  test('[P2] should clear conversation', async ({ page }) => {
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    const sendButton = page.locator('[data-testid="ai-send-button"]');
    await inputArea.fill('Test message');
    await sendButton.click();
    await page.waitForTimeout(2000);

    const clearButton = page.locator('[data-testid="ai-clear-conversation"]');
    await clearButton.click();

    const confirmButton = page.locator('[data-testid="confirm-button"]');
    await confirmButton.click();

    const messages = page.locator('[data-testid="ai-message"]');
    const count = await messages.count();
    expect(count).toBe(0);
  });

  /**
   * 智能等待策略实现：验证每个会话保持独立的对话历史
   * 
   * 核心策略：
   * 1. 每条消息发送后等待loading消失确保响应完成
   * 2. 创建新会话后等待消息数为0，验证会话切换完成
   * 3. 使用waitForFunction轮询检测状态变化
   * 
   * 解决的异步问题：
   * - setCurrentSessionId是异步的，新会话创建后需要等待状态同步
   * - 固定500ms等待不足以完成会话切换
   * - 消息可能被错误发送到旧会话
   */
  test('[P2] should maintain separate conversation history per session', async ({ page }) => {
    const aiButton = page.locator('[data-testid="ai-panel-button"]');
    await aiButton.click();

    const inputArea = page.locator('[data-testid="ai-chat-input"]');
    const sendButton = page.locator('[data-testid="ai-send-button"]');
    const newConversationButton = page.locator('[data-testid="ai-new-conversation"]');
    const loadingIndicator = page.locator('[data-testid="ai-loading"]');

    // 在会话1中发送消息并等待响应完成
    await inputArea.fill('Session 1 - Message 1');
    await sendButton.click();
    
    /**
     * 策略1：等待响应完成
     * 使用loading状态作为响应完成信号，确保消息完全保存到会话1
     */
    await loadingIndicator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="ai-loading"]'),
      { timeout: 15000 }
    );

    // 创建新会话并等待会话切换完成
    await newConversationButton.click();
    
    /**
     * 策略2：会话切换验证
     * 使用waitForFunction轮询检测消息数为0，确保会话切换完成
     * React状态更新是异步的，setCurrentSessionId不会立即生效
     */
    await page.waitForSelector('[data-testid="ai-message-list"]', { timeout: 5000 });
    await page.waitForFunction(
      () => {
        const messages = document.querySelectorAll('[data-testid="ai-message"]');
        return messages.length === 0;
      },
      { timeout: 3000 }
    );

    // 在会话2中发送消息并等待响应完成
    await inputArea.fill('Session 2 - Message 1');
    await sendButton.click();
    
    // 重复策略1：等待响应完成
    await loadingIndicator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="ai-loading"]'),
      { timeout: 15000 }
    );

    /**
     * 验证：会话2中应该只有2条消息（1条用户消息 + 1条AI响应）
     * 如果会话隔离失败，消息会累积到当前会话，导致消息数超过预期
     */
    const messages = page.locator('[data-testid="ai-message"]');
    const count = await messages.count();
    expect(count).toBe(2);
  });
});