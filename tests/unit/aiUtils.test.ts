// AI工具函数单元测试
// 测试覆盖：API Key脱敏、模型配置验证、连接测试逻辑

import { assertEquals } from 'https://deno.land/std@0.224.0/testing/asserts.ts';
import {
  maskApiKey,
  validateModelConfig,
  generateModelId,
  isOpenAICompatible,
} from '../../server/src/utils/aiUtils.ts';

Deno.test('AI Utils - API Key Masking - should mask OpenAI API key', () => {
  const key = 'sk-1234567890abcdefghijklmnopqrstuv';
  const masked = maskApiKey(key);
  assertEquals(masked, 'sk-***...pqrstuv');
});

Deno.test('AI Utils - API Key Masking - should mask short API key', () => {
  const key = 'sk-1234';
  const masked = maskApiKey(key);
  assertEquals(masked, '*******');
});

Deno.test('AI Utils - API Key Masking - should handle empty key', () => {
  const masked = maskApiKey('');
  assertEquals(masked, '');
});

Deno.test('AI Utils - API Key Masking - should handle null key', () => {
  const masked = maskApiKey(null);
  assertEquals(masked, '');
});

Deno.test('AI Utils - Model Config Validation - should validate valid OpenAI config', () => {
  const config = {
    name: 'OpenAI',
    provider: 'openai',
    apiKey: 'sk-valid-key',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
  };
  const result = validateModelConfig(config);
  assertEquals(result.valid, true);
  assertEquals(result.errors, []);
});

Deno.test('AI Utils - Model Config Validation - should validate valid DeepSeek config', () => {
  const config = {
    name: 'DeepSeek',
    provider: 'deepseek',
    apiKey: 'sk-valid-key',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  };
  const result = validateModelConfig(config);
  assertEquals(result.valid, true);
  assertEquals(result.errors, []);
});

Deno.test('AI Utils - Model Config Validation - should reject config without name', () => {
  const config = {
    name: '',
    provider: 'openai',
    apiKey: 'sk-valid-key',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
  };
  const result = validateModelConfig(config);
  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
});

Deno.test('AI Utils - Model Config Validation - should reject config without API key', () => {
  const config = {
    name: 'OpenAI',
    provider: 'openai',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
  };
  const result = validateModelConfig(config);
  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
});

Deno.test('AI Utils - Model Config Validation - should reject invalid base URL', () => {
  const config = {
    name: 'OpenAI',
    provider: 'openai',
    apiKey: 'sk-valid-key',
    baseUrl: 'not-a-url',
    model: 'gpt-4o',
  };
  const result = validateModelConfig(config);
  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
});

Deno.test('AI Utils - Model ID Generation - should generate unique ID', () => {
  const id1 = generateModelId();
  const id2 = generateModelId();
  if (id1 === id2) {
    throw new Error('IDs should be unique');
  }
});

Deno.test('AI Utils - Model ID Generation - should generate valid UUID format', () => {
  const id = generateModelId();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  assertEquals(uuidRegex.test(id), true);
});

Deno.test('AI Utils - OpenAI Compatibility Check - should recognize OpenAI URL', () => {
  assertEquals(isOpenAICompatible('https://api.openai.com/v1'), true);
});

Deno.test('AI Utils - OpenAI Compatibility Check - should recognize DeepSeek URL', () => {
  assertEquals(isOpenAICompatible('https://api.deepseek.com/v1'), true);
});

Deno.test('AI Utils - OpenAI Compatibility Check - should recognize custom OpenAI-compatible URL', () => {
  assertEquals(isOpenAICompatible('https://api.example.com/v1'), true);
});

Deno.test('AI Utils - OpenAI Compatibility Check - should reject non-standard URLs', () => {
  assertEquals(isOpenAICompatible('https://example.com/api'), false);
});