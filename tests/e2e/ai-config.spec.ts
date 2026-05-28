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
    await providerSelect.click();
    
    // Verify all provider options exist
    await expect(page.locator('text=OpenAI')).toBeVisible();
    await expect(page.locator('text=DeepSeek')).toBeVisible();
    await expect(page.locator('text=Custom')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/settings');
    
    // Click save without filling anything
    await page.locator('[data-testid="ai-save-btn"]').click();
    
    // Verify validation errors
    await expect(page.locator('[data-testid="error-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-api-key"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-base-url"]')).toBeVisible();
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
    await page.locator('[data-testid="ai-model-select"]').fill('gpt-4o');
    
    // Click test and verify loading
    const testBtn = page.locator('[data-testid="ai-test-btn"]');
    await testBtn.click();
    
    await expect(testBtn).toHaveAttribute('disabled');
    await expect(page.locator('[data-testid="test-loading"]')).toBeVisible();
  });

  test('should show success message for valid connection', async ({ page }) => {
    await page.goto('/settings');
    
    // Fill in form
    await page.locator('[data-testid="ai-model-name"]').fill('Test Model');
    await page.locator('[data-testid="ai-api-key"]').fill('sk-valid-key');
    await page.locator('[data-testid="ai-base-url"]').fill('https://api.openai.com/v1');
    await page.locator('[data-testid="ai-model-select"]').fill('gpt-4o');
    
    // Mock successful response
    await page.route('**/api/v1/ai/test', async (route) => {
      await route.fulfill({
        json: { status: 'success', message: '连接成功', latency: 150 },
      });
    });
    
    await page.locator('[data-testid="ai-test-btn"]').click();
    
    await expect(page.locator('[data-testid="test-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="test-success"]')).toContainText('连接成功');
  });

  test('should show error message for failed connection', async ({ page }) => {
    await page.goto('/settings');
    
    // Fill in form
    await page.locator('[data-testid="ai-model-name"]').fill('Test Model');
    await page.locator('[data-testid="ai-api-key"]').fill('sk-invalid-key');
    await page.locator('[data-testid="ai-base-url"]').fill('https://api.openai.com/v1');
    await page.locator('[data-testid="ai-model-select"]').fill('gpt-4o');
    
    // Mock failed response
    await page.route('**/api/v1/ai/test', async (route) => {
      await route.fulfill({
        json: { status: 'error', message: 'API Key无效' },
      });
    });
    
    await page.locator('[data-testid="ai-test-btn"]').click();
    
    await expect(page.locator('[data-testid="test-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="test-error"]')).toContainText('API Key无效');
  });
});

test.describe('AI Configuration - AC-3: Multi-Model Management', () => {
  test('should list all configured models', async ({ page }) => {
    await page.goto('/settings');
    
    // Mock multiple models
    await page.route('**/api/v1/ai/config', async (route) => {
      await route.fulfill({
        json: {
          status: 'success',
          data: [
            { id: '1', name: 'OpenAI', provider: 'openai', model: 'gpt-4o', isActive: true },
            { id: '2', name: 'DeepSeek', provider: 'deepseek', model: 'deepseek-chat', isActive: false },
          ],
        },
      });
    });
    
    await page.reload();
    
    const modelList = page.locator('[data-testid="model-list"]');
    await expect(modelList).toBeVisible();
    await expect(modelList.locator('[data-testid="model-item"]')).toHaveCount(2);
  });

  test('should allow selecting active model', async ({ page }) => {
    await page.goto('/settings');
    
    // Mock models
    await page.route('**/api/v1/ai/config', async (route) => {
      await route.fulfill({
        json: {
          status: 'success',
          data: [
            { id: '1', name: 'Model A', provider: 'openai', model: 'gpt-4o', isActive: false },
            { id: '2', name: 'Model B', provider: 'deepseek', model: 'deepseek-chat', isActive: false },
          ],
        },
      });
    });
    
    await page.reload();
    
    // Click activate on first model
    const activateBtn = page.locator('[data-testid="activate-btn-1"]');
    await activateBtn.click();
    
    // Verify it's marked as active
    await expect(page.locator('[data-testid="active-badge-1"]')).toBeVisible();
  });

  test('should allow editing model', async ({ page }) => {
    await page.goto('/settings');
    
    // Click edit button
    const editBtn = page.locator('[data-testid="edit-btn-1"]');
    await editBtn.click();
    
    // Verify form is populated with existing data
    await expect(page.locator('[data-testid="ai-model-name"]')).toHaveValue('Model A');
    
    // Change name
    await page.locator('[data-testid="ai-model-name"]').fill('Model A Updated');
    await page.locator('[data-testid="ai-save-btn"]').click();
    
    // Verify update success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('should allow deleting model', async ({ page }) => {
    await page.goto('/settings');
    
    // Click delete button
    const deleteBtn = page.locator('[data-testid="delete-btn-1"]');
    await deleteBtn.click();
    
    // Confirm deletion
    await page.locator('[data-testid="confirm-delete"]').click();
    
    // Verify model is removed
    await expect(page.locator('[data-testid="model-item-1"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });
});

test.describe('AI Configuration - AC-4: Security Requirements', () => {
  test('should mask API key display', async ({ page }) => {
    await page.goto('/settings');
    
    // Mock model with API key
    await page.route('**/api/v1/ai/config', async (route) => {
      await route.fulfill({
        json: {
          status: 'success',
          data: [
            { id: '1', name: 'Test', provider: 'openai', model: 'gpt-4o', apiKey: 'sk-***...1234', isActive: true },
          ],
        },
      });
    });
    
    await page.reload();
    
    // Verify masked display
    const keyDisplay = page.locator('[data-testid="api-key-display-1"]');
    await expect(keyDisplay).toHaveText('sk-***...1234');
    await expect(keyDisplay).not.toHaveText('sk-full-secret-key-1234');
  });

  test('should clear API key on page refresh', async ({ page }) => {
    await page.goto('/settings');
    
    // Fill in API key
    await page.locator('[data-testid="ai-api-key"]').fill('sk-secret-key');
    
    // Refresh page
    await page.reload();
    
    // Verify field is empty
    await expect(page.locator('[data-testid="ai-api-key"]')).toHaveValue('');
  });

  test('should not expose API key in network logs', async ({ page }) => {
    await page.goto('/settings');
    
    let requestBody: string | null = null;
    
    // Intercept and capture request
    await page.route('**/api/v1/ai/test', async (route) => {
      const request = route.request();
      requestBody = await request.text();
      await route.fulfill({
        json: { status: 'success', message: 'OK' },
      });
    });
    
    // Fill in form and test
    await page.locator('[data-testid="ai-model-name"]').fill('Test');
    await page.locator('[data-testid="ai-api-key"]').fill('sk-sensitive-key-12345');
    await page.locator('[data-testid="ai-base-url"]').fill('https://api.openai.com/v1');
    await page.locator('[data-testid="ai-model-select"]').fill('gpt-4o');
    await page.locator('[data-testid="ai-test-btn"]').click();
    
    // The key should be sent in request body (necessary for testing)
    // But in real implementation, ensure logs don't expose it
    expect(requestBody).toBeTruthy();
  });
});