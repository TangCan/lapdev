// 后端 AI Service 单元测试
// 测试覆盖：maskApiKey、validateModelConfig、常量配置

import { assertEquals } from 'https://deno.land/std@0.224.0/testing/asserts.ts';
import {
  maskApiKey,
  validateModelConfig,
  generateModelId,
  isOpenAICompatible,
} from '../../backend/src/services/aiService.ts';

Deno.test('Backend AI Service - maskApiKey - should mask standard OpenAI key', () => {
  const key = 'sk-proj-1234567890abcdefghijklmnopqrstuvwxyz';
  const masked = maskApiKey(key);
  assertEquals(masked, 'sk-***...tuvwxyz');
});

Deno.test('Backend AI Service - maskApiKey - should mask short key with all asterisks', () => {
  const key = 'sk-1234';
  const masked = maskApiKey(key);
  assertEquals(masked, '*******');
});

Deno.test('Backend AI Service - maskApiKey - should handle empty string', () => {
  const masked = maskApiKey('');
  assertEquals(masked, '');
});

Deno.test('Backend AI Service - maskApiKey - should handle 9-character key', () => {
  const key = 'sk-1234567';
  const masked = maskApiKey(key);
  assertEquals(masked, 'sk-***...1234567');
});

Deno.test('Backend AI Service - validateModelConfig - should validate valid config', () => {
  const config = {
    name: 'Test Model',
    provider: 'openai' as const,
    apiKey: 'sk-valid-key',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    isActive: true,
  };
  const result = validateModelConfig(config);
  assertEquals(result, null);
});

Deno.test('Backend AI Service - validateModelConfig - should reject empty name', () => {
  const config = {
    name: '',
    provider: 'openai' as const,
    apiKey: 'sk-valid-key',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
  };
  const result = validateModelConfig(config);
  assertEquals(result, '请输入模型名称');
});

Deno.test('Backend AI Service - validateModelConfig - should reject empty API key', () => {
  const config = {
    name: 'Test Model',
    provider: 'openai' as const,
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
  };
  const result = validateModelConfig(config);
  assertEquals(result, '请输入API Key');
});

Deno.test('Backend AI Service - validateModelConfig - should reject invalid URL', () => {
  const config = {
    name: 'Test Model',
    provider: 'openai' as const,
    apiKey: 'sk-valid-key',
    baseUrl: 'not-a-valid-url',
    model: 'gpt-4o',
  };
  const result = validateModelConfig(config);
  assertEquals(result, '请输入有效的URL');
});

Deno.test('Backend AI Service - validateModelConfig - should reject empty model', () => {
  const config = {
    name: 'Test Model',
    provider: 'openai' as const,
    apiKey: 'sk-valid-key',
    baseUrl: 'https://api.openai.com/v1',
    model: '',
  };
  const result = validateModelConfig(config);
  assertEquals(result, '请选择模型');
});

Deno.test('Backend AI Service - generateModelId - should generate valid UUID', () => {
  const id = generateModelId();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  assertEquals(uuidRegex.test(id), true);
});

Deno.test('Backend AI Service - generateModelId - should generate unique IDs', () => {
  const id1 = generateModelId();
  const id2 = generateModelId();
  assertEquals(id1 !== id2, true);
});

Deno.test('Backend AI Service - isOpenAICompatible - should recognize OpenAI URL', () => {
  assertEquals(isOpenAICompatible('https://api.openai.com/v1'), true);
});

Deno.test('Backend AI Service - isOpenAICompatible - should recognize DeepSeek URL', () => {
  assertEquals(isOpenAICompatible('https://api.deepseek.com/v1'), true);
});

Deno.test('Backend AI Service - isOpenAICompatible - should recognize custom URL with /v1', () => {
  assertEquals(isOpenAICompatible('https://api.example.com/v1'), true);
});

Deno.test('Backend AI Service - isOpenAICompatible - should reject URL without /v1', () => {
  assertEquals(isOpenAICompatible('https://api.example.com/api'), false);
});

Deno.test('Backend AI Service - isOpenAICompatible - should handle invalid URL', () => {
  assertEquals(isOpenAICompatible('not-a-url'), false);
});