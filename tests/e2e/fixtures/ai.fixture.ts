import { test as base } from '@playwright/test';

type AiFixtures = {
  aiChat: AIChatHelper;
  codeCompletion: CodeCompletionHelper;
};

export const test = base.extend<AiFixtures>({
  aiChat: async ({ page }, use) => {
    await use(new AIChatHelper(page));
  },
  codeCompletion: async ({ page }, use) => {
    await use(new CodeCompletionHelper(page));
  },
});

export class AIChatHelper {
  constructor(private page: Page) {}

  async openChat() {
    await this.page.click('[data-testid="ai-chat-toggle"]');
  }

  async sendMessage(message: string) {
    await this.page.fill('[data-testid="ai-chat-input"]', message);
    await this.page.click('[data-testid="ai-chat-send"]');
  }

  async waitForResponse() {
    await this.page.waitForSelector('[data-testid="ai-chat-response-complete"]');
  }

  async getLastResponse() {
    const responses = this.page.locator('[data-testid="ai-chat-message"]');
    const count = await responses.count();
    return responses.nth(count - 1).textContent();
  }

  async switchModel(modelName: string) {
    await this.page.click('[data-testid="ai-model-selector"]');
    await this.page.click(`[data-testid="model-${modelName}"]`);
  }
}

export class CodeCompletionHelper {
  constructor(private page: Page) {}

  async triggerCompletion() {
    await this.page.keyboard.press('Ctrl+Space');
  }

  async selectSuggestion(index: number) {
    const suggestions = this.page.locator('[data-testid="completion-item"]');
    await suggestions.nth(index).click();
  }

  async waitForSuggestions() {
    await this.page.waitForSelector('[data-testid="completion-list"]');
  }

  async getSuggestions() {
    const suggestions = this.page.locator('[data-testid="completion-item"]');
    const count = await suggestions.count();
    const results: string[] = [];
    for (let i = 0; i < count; i++) {
      results.push(await suggestions.nth(i).textContent() || '');
    }
    return results;
  }
}