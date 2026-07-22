import { Page, expect } from '@playwright/test';

export async function clickElementByTestId(page: Page, testId: string): Promise<void> {
  await page.evaluate((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;
    if (el) el.click();
  }, testId);
}

export async function clickElementBySelector(page: Page, selector: string): Promise<void> {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el) el.click();
  }, selector);
}

export async function setLocalStorage(page: Page, key: string, value: string): Promise<void> {
  await page.evaluate(({ k, v }) => {
    localStorage.setItem(k, v);
  }, { k: key, v: value });
}

export async function setSessionStorage(page: Page, key: string, value: string): Promise<void> {
  await page.evaluate(({ k, v }) => {
    sessionStorage.setItem(k, v);
  }, { k: key, v: value });
}

export interface AIConfig {
  modelId?: string;
  modelName?: string;
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  isActive?: boolean;
}

export async function setupAIConfig(page: Page, config?: AIConfig): Promise<void> {
  const defaultConfig = {
    modelId: 'test-model',
    modelName: 'Test Model',
    provider: 'openai',
    apiKey: 'test-key',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    isActive: true,
    ...config,
  };

  try {
    await setSessionStorage(page, 'lapdev-ai-models', JSON.stringify({
      models: [{
        id: defaultConfig.modelId,
        name: defaultConfig.modelName,
        provider: defaultConfig.provider,
        apiKey: defaultConfig.apiKey,
        baseUrl: defaultConfig.baseUrl,
        model: defaultConfig.model,
        isActive: defaultConfig.isActive,
      }],
      currentModelId: defaultConfig.modelId,
    }));
  } catch {
    await page.goto('/');
    await setSessionStorage(page, 'lapdev-ai-models', JSON.stringify({
      models: [{
        id: defaultConfig.modelId,
        name: defaultConfig.modelName,
        provider: defaultConfig.provider,
        apiKey: defaultConfig.apiKey,
        baseUrl: defaultConfig.baseUrl,
        model: defaultConfig.model,
        isActive: defaultConfig.isActive,
      }],
      currentModelId: defaultConfig.modelId,
    }));
  }
}

export interface LogEntry {
  id: string;
  operationType: 'read' | 'write' | 'search' | 'create' | 'delete';
  filePath: string;
  result: 'success' | 'failed' | 'rejected' | 'pending';
  timestamp: number;
  details?: string;
}

export async function setupOperationLogs(page: Page, logs?: LogEntry[]): Promise<void> {
  const defaultLogs: LogEntry[] = logs || [
    { id: 'log-1', operationType: 'read', filePath: 'src/utils.ts', result: 'success', timestamp: Date.now() - 3600000 },
    { id: 'log-2', operationType: 'write', filePath: 'src/components/App.tsx', result: 'success', timestamp: Date.now() - 1800000 },
    { id: 'log-3', operationType: 'search', filePath: 'src/', result: 'success', timestamp: Date.now() - 600000 },
    { id: 'log-4', operationType: 'write', filePath: 'src/hooks/useAuth.ts', result: 'rejected', timestamp: Date.now() - 300000 },
    { id: 'log-5', operationType: 'read', filePath: 'src/config.ts', result: 'failed', timestamp: Date.now() - 60000 },
  ];

  await setLocalStorage(page, 'lapdev-agent-logs', JSON.stringify(defaultLogs));
}

export async function setupAgentMode(page: Page, enabled: boolean = false): Promise<void> {
  await setLocalStorage(page, 'lapdev-agent-mode', String(enabled));
}

export async function openAIPanel(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="ai-panel-button"]', { timeout: 10000 });
  await page.locator('[data-testid="ai-panel-button"]').click();
  await page.waitForSelector('[data-testid="ai-chat-panel"]', { timeout: 10000 });
}

export async function openOperationLogPanel(page: Page): Promise<void> {
  await page.locator('[data-testid="operation-log-toggle"]').click();
  await page.waitForSelector('[data-testid="operation-log-panel"]', { timeout: 5000 });
}

export async function confirmClearLogs(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="confirm-clear-logs"]', { timeout: 5000 });
  await clickElementByTestId(page, 'confirm-clear-logs');
}

export async function waitForVisible(page: Page, selector: string, timeout: number = 5000): Promise<void> {
  await page.waitForSelector(selector, { timeout, state: 'visible' });
}

export async function waitForHidden(page: Page, selector: string, timeout: number = 5000): Promise<void> {
  await page.waitForSelector(selector, { timeout, state: 'hidden' });
}

export async function waitForText(page: Page, selector: string, text: string, timeout: number = 5000): Promise<void> {
  const locator = page.locator(selector);
  await expect(locator).toHaveText(text, { timeout });
}

export async function waitForCount(page: Page, selector: string, count: number, timeout: number = 5000): Promise<void> {
  const locator = page.locator(selector);
  await expect(locator).toHaveCount(count, { timeout });
}

export async function waitForPageReady(page: Page, timeout: number = 30000): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const readyState = await page.evaluate(() => document.readyState);
    if (readyState === 'complete') {
      return;
    }
    await page.waitForTimeout(500);
  }
  throw new Error(`Page did not become ready within ${timeout}ms`);
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    baseDelay: number;
    maxDelay?: number;
    shouldRetry?: (error: unknown) => boolean;
  }
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay = 10000, shouldRetry = () => true } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= maxRetries || !shouldRetry(error)) {
        break;
      }
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export async function safeClick(
  page: Page,
  selector: string,
  options: {
    maxRetries?: number;
    timeout?: number;
  } = {}
): Promise<void> {
  const { maxRetries = 2, timeout = 15000 } = options;

  await retry(
    async () => {
      const locator = page.locator(selector);
      await locator.waitFor({ timeout, state: 'visible' });
      await locator.click({ timeout });
    },
    {
      maxRetries,
      baseDelay: 1000,
      maxDelay: 5000,
      shouldRetry: (error) => {
        return error instanceof Error && 
          (error.message.includes('Timeout') || 
           error.message.includes('not visible') ||
           error.message.includes('is not clickable'));
      },
    }
  );
}

export async function safeWaitForSelector(
  page: Page,
  selector: string,
  options: {
    maxRetries?: number;
    timeout?: number;
    state?: 'visible' | 'hidden' | 'attached';
  } = {}
): Promise<void> {
  const { maxRetries = 2, timeout = 15000, state = 'visible' } = options;

  await retry(
    async () => {
      await page.waitForSelector(selector, { timeout, state });
    },
    {
      maxRetries,
      baseDelay: 1000,
      maxDelay: 5000,
      shouldRetry: (error) => {
        return error instanceof Error && error.message.includes('Timeout');
      },
    }
  );
}

export async function safeGoto(
  page: Page,
  url: string,
  options: {
    maxRetries?: number;
    timeout?: number;
  } = {}
): Promise<void> {
  const { maxRetries = 2, timeout = 30000 } = options;

  await retry(
    async () => {
      await page.goto(url, { timeout, waitUntil: 'networkidle' });
    },
    {
      maxRetries,
      baseDelay: 2000,
      maxDelay: 10000,
      shouldRetry: (error) => {
        return error instanceof Error && 
          (error.message.includes('Timeout') || 
           error.message.includes('ERR_CONNECTION_REFUSED'));
      },
    }
  );
}
