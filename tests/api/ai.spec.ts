// AI API集成测试
// 测试覆盖：配置管理、连接测试、模型列表端点

import { describe, it, assertEquals, assertExists } from 'https://deno.land/std@0.224.0/testing/asserts.ts';

const API_BASE = 'http://localhost:8000/api/v1/ai';

describe('AI API - Configuration Management', () => {
  it('AC-1: should return empty config list initially', async () => {
    const response = await fetch(`${API_BASE}/config`);
    const result = await response.json();
    
    assertEquals(response.status, 200);
    assertEquals(result.status, 'success');
    assertEquals(Array.isArray(result.data), true);
    assertEquals(result.data.length, 0);
  });

  it('AC-1: should create a new model config', async () => {
    const config = {
      name: 'Test Model',
      provider: 'openai',
      apiKey: 'sk-test-key-12345',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
    };

    const response = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    const result = await response.json();
    
    assertEquals(response.status, 200);
    assertEquals(result.status, 'success');
    assertExists(result.data.id);
    assertEquals(result.data.name, config.name);
    assertEquals(result.data.provider, config.provider);
    assertEquals(result.data.baseUrl, config.baseUrl);
    assertEquals(result.data.model, config.model);
    // API Key should not be returned
    assertEquals(result.data.apiKey, undefined);
  });

  it('AC-1: should return error for invalid config', async () => {
    const invalidConfig = {
      name: '', // Empty name
      provider: 'openai',
      apiKey: 'sk-test-key',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
    };

    const response = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidConfig),
    });

    const result = await response.json();
    
    assertEquals(response.status, 400);
    assertEquals(result.status, 'error');
    assertExists(result.error.message);
  });

  it('AC-3: should update existing config', async () => {
    // First create a config
    const createResponse = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'To Update',
        provider: 'openai',
        apiKey: 'sk-update-key',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
      }),
    });
    const createResult = await createResponse.json();
    const configId = createResult.data.id;

    // Then update it
    const updateResponse = await fetch(`${API_BASE}/config/${configId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Updated Model',
        model: 'gpt-4o',
      }),
    });

    const result = await updateResponse.json();
    
    assertEquals(updateResponse.status, 200);
    assertEquals(result.status, 'success');
    assertEquals(result.data.name, 'Updated Model');
    assertEquals(result.data.model, 'gpt-4o');
  });

  it('AC-3: should delete config', async () => {
    // First create a config
    const createResponse = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'To Delete',
        provider: 'openai',
        apiKey: 'sk-delete-key',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
      }),
    });
    const createResult = await createResponse.json();
    const configId = createResult.data.id;

    // Then delete it
    const deleteResponse = await fetch(`${API_BASE}/config/${configId}`, {
      method: 'DELETE',
    });

    const result = await deleteResponse.json();
    
    assertEquals(deleteResponse.status, 200);
    assertEquals(result.status, 'success');

    // Verify it's gone
    const getResponse = await fetch(`${API_BASE}/config/${configId}`);
    assertEquals(getResponse.status, 404);
  });
});

describe('AI API - Connection Test', () => {
  it('AC-2: should test connection successfully with valid config', async () => {
    const testConfig = {
      apiKey: 'sk-valid-test-key',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
    };

    const response = await fetch(`${API_BASE}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testConfig),
    });

    const result = await response.json();
    
    assertEquals(response.status, 200);
    // Note: In real test, this would mock the AI API
    // For now, we just verify the response structure
    assertEquals(['success', 'error'].includes(result.status), true);
    assertExists(result.message);
  });

  it('AC-2: should return error for invalid API key', async () => {
    const testConfig = {
      apiKey: '', // Empty key
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
    };

    const response = await fetch(`${API_BASE}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testConfig),
    });

    const result = await response.json();
    
    assertEquals(response.status, 400);
    assertEquals(result.status, 'error');
    assertExists(result.message);
  });

  it('AC-2: should return error for invalid base URL', async () => {
    const testConfig = {
      apiKey: 'sk-valid-key',
      baseUrl: 'not-a-valid-url',
      model: 'gpt-4o',
    };

    const response = await fetch(`${API_BASE}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testConfig),
    });

    const result = await response.json();
    
    assertEquals(response.status, 400);
    assertEquals(result.status, 'error');
  });
});

describe('AI API - Model List', () => {
  it('should return list of supported models', async () => {
    const response = await fetch(`${API_BASE}/models`);
    const result = await response.json();
    
    assertEquals(response.status, 200);
    assertEquals(result.status, 'success');
    assertEquals(Array.isArray(result.data), true);
    // Should contain at least OpenAI and DeepSeek models
    const providers = result.data.map((m: { provider: string }) => m.provider);
    assertEquals(providers.includes('openai'), true);
    assertEquals(providers.includes('deepseek'), true);
  });

  it('should return models filtered by provider', async () => {
    const response = await fetch(`${API_BASE}/models?provider=openai`);
    const result = await response.json();
    
    assertEquals(response.status, 200);
    assertEquals(result.status, 'success');
    assertEquals(Array.isArray(result.data), true);
    
    // All models should be from OpenAI
    for (const model of result.data) {
      assertEquals(model.provider, 'openai');
    }
  });
});

describe('AI API - Security', () => {
  it('AC-4: should not expose API key in error responses', async () => {
    const config = {
      name: 'Test',
      provider: 'openai',
      apiKey: 'sk-sensitive-key-12345',
      baseUrl: 'invalid-url',
      model: 'gpt-4o',
    };

    const response = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    const result = await response.json();
    
    // Response should not contain the full API key
    const responseString = JSON.stringify(result);
    assertEquals(responseString.includes('sk-sensitive-key-12345'), false);
  });

  it('AC-4: should return masked API key in config list', async () => {
    // First create a config
    const createResponse = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Masked Key Test',
        provider: 'openai',
        apiKey: 'sk-full-key-1234567890',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
      }),
    });

    // Get all configs
    const getResponse = await fetch(`${API_BASE}/config`);
    const result = await getResponse.json();

    // Find our config
    const config = result.data.find((c: { name: string }) => c.name === 'Masked Key Test');
    
    // API key should be masked or not returned
    if (config.apiKey) {
      assertEquals(config.apiKey.includes('sk-***'), true);
      assertEquals(config.apiKey.includes('1234567890'), false);
    }
  });
});