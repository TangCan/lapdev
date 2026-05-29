// AI配置E2E测试
// 测试覆盖：UI交互、配置表单、连接测试、模型管理

import { test, expect } from '@playwright/test';

test.describe('AI Configuration - AC-1: Model Config Form', () => {
  test('should display AI config panel in settings', async ({ page }) => {
    await page.goto('/settings');
    
    // Verify AI config section exists
    const aiSection = page.locator('[data-testid="ai-config-section"]');
    await expect(aiSection).toBeVisible();
    
    // Verify form fields exist
    await expect(page.locator('[data-testid="ai-model-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-provider-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-api-key"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-base-url"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-model-select"]')).toBeVisible();
  });

  test('should show password type for API key field', async ({ page }) => {
    await page.goto('/settings');
    
    const apiKeyInput = page.locator('[data-testid="ai-api-key"]');
    await expect(apiKeyInput).toHaveAttribute('type', 'password');
  });

  test('should support provider selection (OpenAI/DeepSeek/Custom)', async ({ page }) => {
    await page.goto('/settings');
    
    const providerSelect = page.locator('[data-testid="ai-provider-select"]');
    
    // Verify all provider options exist by checking select content
    const options = await providerSelect.evaluate((select) => {
      return Array.from(select.options).map(opt => opt.textContent);
    });
    
    expect(options).toContain('OpenAI');
    expect(options).toContain('DeepSeek');
    expect(options).toContain('Custom');
    
    // Test selection changes Base URL
    await providerSelect.selectOption('deepseek');
    await expect(page.locator('[data-testid="ai-base-url"]')).toHaveValue('https://api.deepseek.com/v1');
    
    await providerSelect.selectOption('openai');
    await expect(page.locator('[data-testid="ai-base-url"]')).toHaveValue('https://api.openai.com/v1');
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/settings');
    
    // Clear the default Base URL so we can test validation
    await page.locator('[data-testid="ai-base-url"]').fill('');
    
    // Click save without filling anything
    await page.locator('[data-testid="ai-save-btn"]').click();
    
    // Verify validation errors appear
    await expect(page.locator('text=请输入模型名称')).toBeVisible();
    await expect(page.locator('text=请输入API Key')).toBeVisible();
    await expect(page.locator('text=请输入Base URL')).toBeVisible();
  });
});

test.describe('AI Configuration - AC-2: Connection Test', () => {
  test('should show test connection button', async ({ page }) => {
    await page.goto('/settings');
    
    const testBtn = page.locator('[data-testid="ai-test-btn"]');
    await expect(testBtn).toBeVisible();
    await expect(testBtn).toHaveText('测试连接');
  });

  test('should show loading state during test', async ({ page }) => {
    await page.goto('/settings');
    
    // Fill in valid form
    await page.locator('[data-testid="ai-model-name"]').fill('Test Model');
    await page.locator('[data-testid="ai-api-key"]').fill('sk-test-key');
    await page.locator('[data-testid="ai-base-url"]').fill('https://api.openai.com/v1');
    await page.locator('[data-testid="ai-model-select"]').selectOption('gpt-4o');
    
    // Mock response to test loading state
    await page.route('**/api/v1/ai/test', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        json: { status: 'success', message: '连接成功', latency: 150 },
      });
    });
    
    // Click test and verify loading
    const testBtn = page.locator('[data-testid="ai-test-btn"]');
    await testBtn.click();
    
    await expect(testBtn).toHaveAttribute('disabled');
    await expect(page.locator('text=测试中...')).toBeVisible();
  });

  test('should show success message for valid connection', async ({ page }) => {
    await page.goto('/settings');
    
    // Fill in form
    await page.locator('[data-testid="ai-model-name"]').fill('Test Model');
    await page.locator('[data-testid="ai-api-key"]').fill('sk-valid-key');
    await page.locator('[data-testid="ai-base-url"]').fill('https://api.openai.com/v1');
    await page.locator('[data-testid="ai-model-select"]').selectOption('gpt-4o');
    
    // Mock successful response
    await page.route('**/api/v1/ai/test', async (route) => {
      await route.fulfill({
        json: { status: 'success', message: '连接成功', latency: 150 },
      });
    });
    
    await page.locator('[data-testid="ai-test-btn"]').click();
    
    await expect(page.locator('text=连接成功')).toBeVisible();
  });

  test('should show error message for failed connection', async ({ page }) => {
    await page.goto('/settings');
    
    // Fill in form
    await page.locator('[data-testid="ai-model-name"]').fill('Test Model');
    await page.locator('[data-testid="ai-api-key"]').fill('sk-invalid-key');
    await page.locator('[data-testid="ai-base-url"]').fill('https://api.openai.com/v1');
    await page.locator('[data-testid="ai-model-select"]').selectOption('gpt-4o');
    
    // Mock failed response
    await page.route('**/api/v1/ai/test', async (route) => {
      await route.fulfill({
        json: { status: 'error', message: 'API Key无效' },
      });
    });
    
    await page.locator('[data-testid="ai-test-btn"]').click();
    
    await expect(page.locator('text=API Key无效')).toBeVisible();
  });
});

test.describe('AI Configuration - AC-3: Multi-Model Management', () => {
  test('should add and list configured models', async ({ page }) => {
    await page.goto('/settings');
    
    // Add a model
    await page.locator('[data-testid="ai-model-name"]').fill('Test Model');
    await page.locator('[data-testid="ai-api-key"]').fill('sk-test-key-1234');
    await page.locator('[data-testid="ai-base-url"]').fill('https://api.openai.com/v1');
    await page.locator('[data-testid="ai-model-select"]').selectOption('gpt-4o');
    await page.locator('[data-testid="ai-save-btn"]').click();
    
    // Verify model is listed - use locator with filter to avoid strict mode violation
    await expect(page.locator('[data-testid^="model-item-"]').filter({ hasText: 'Test Model' })).toBeVisible();
    await expect(page.locator('text=活跃')).toBeVisible();
  });

  test('should allow editing model', async ({ page }) => {
    await page.goto('/settings');
    
    // First add a model
    await page.locator('[data-testid="ai-model-name"]').fill('Model A');
    await page.locator('[data-testid="ai-api-key"]').fill('sk-test-key');
    await page.locator('[data-testid="ai-base-url"]').fill('https://api.openai.com/v1');
    await page.locator('[data-testid="ai-model-select"]').selectOption('gpt-4o');
    await page.locator('[data-testid="ai-save-btn"]').click();
    
    // Wait for model to appear
    await page.waitForSelector('text=Model A');
    
    // Click edit button
    const editBtn = page.locator('[data-testid^="edit-btn-"]').first();
    await editBtn.click();
    
    // Verify form is populated with existing data
    await expect(page.locator('[data-testid="ai-model-name"]')).toHaveValue('Model A');
    
    // Change name
    await page.locator('[data-testid="ai-model-name"]').fill('Model A Updated');
    await page.locator('[data-testid="ai-api-key"]').fill('sk-new-key');
    await page.locator('[data-testid="ai-save-btn"]').click();
    
    // Verify update success
    await expect(page.locator('[data-testid^="model-item-"]').filter({ hasText: 'Model A Updated' })).toBeVisible();
  });

  test('should allow deleting model', async ({ page }) => {
    await page.goto('/settings');
    
    // First add a model
    await page.locator('[data-testid="ai-model-name"]').fill('Model to Delete');
    await page.locator('[data-testid="ai-api-key"]').fill('sk-test-key');
    await page.locator('[data-testid="ai-base-url"]').fill('https://api.openai.com/v1');
    await page.locator('[data-testid="ai-model-select"]').selectOption('gpt-4o');
    await page.locator('[data-testid="ai-save-btn"]').click();
    
    // Wait for model to appear
    await page.waitForSelector('text=Model to Delete');
    
    // Set up dialog handler
    page.on('dialog', dialog => dialog.accept());
    
    // Click delete button
    const deleteBtn = page.locator('[data-testid^="delete-btn-"]').first();
    await deleteBtn.click();
    
    // Verify model is removed (empty state shown)
    await expect(page.locator('text=暂无模型配置')).toBeVisible();
  });
});

test.describe('AI Configuration - AC-4: Security Requirements', () => {
  test('should clear API key on page refresh', async ({ page }) => {
    await page.goto('/settings');
    
    // Fill in API key
    const apiKeyInput = page.locator('[data-testid="ai-api-key"]');
    await apiKeyInput.fill('sk-secret-key');
    
    // Verify it was filled
    await expect(apiKeyInput).toHaveValue('sk-secret-key');
    
    // Refresh page
    await page.reload();
    
    // Verify field is empty
    await expect(apiKeyInput).toHaveValue('');
  });

  test('should mask API key display', async ({ page }) => {
    await page.goto('/settings');
    
    // Add a model with full API key
    await page.locator('[data-testid="ai-model-name"]').fill('Model with Key');
    await page.locator('[data-testid="ai-api-key"]').fill('sk-abcdefghijklmnopqrstuvwxyz1234');
    await page.locator('[data-testid="ai-base-url"]').fill('https://api.openai.com/v1');
    await page.locator('[data-testid="ai-model-select"]').selectOption('gpt-4o');
    await page.locator('[data-testid="ai-save-btn"]').click();
    
    // Wait for model to appear
    await page.waitForSelector('text=Model with Key');
    
    // Find the API key display element
    const keyDisplay = page.locator('[data-testid^="api-key-display-"]').first();
    await expect(keyDisplay).toBeVisible();
    
    // Verify masked display
    const text = await keyDisplay.textContent();
    expect(text).toContain('***');
    expect(text).not.toContain('abcdefghijklmnopqrstuvwxyz');
  });

  test('should send API key in request body', async ({ page }) => {
    await page.goto('/settings');
    
    let requestBody: string | null = null;
    
    // Intercept and capture request
    await page.route('**/api/v1/ai/test', async (route) => {
      const request = route.request();
      const postData = request.postData();
      if (postData) {
        requestBody = postData;
      }
      await route.fulfill({
        json: { status: 'success', message: 'OK' },
      });
    });
    
    // Fill in form and test
    await page.locator('[data-testid="ai-model-name"]').fill('Test');
    await page.locator('[data-testid="ai-api-key"]').fill('sk-sensitive-key-12345');
    await page.locator('[data-testid="ai-base-url"]').fill('https://api.openai.com/v1');
    await page.locator('[data-testid="ai-model-select"]').selectOption('gpt-4o');
    await page.locator('[data-testid="ai-test-btn"]').click();
    
    // Wait for the request to be made
    await page.waitForTimeout(1000);
    
    // The key should be sent in request body (necessary for testing)
    expect(requestBody).toBeTruthy();
    expect(requestBody).toContain('sk-sensitive-key-12345');
  });
});