import { test, expect } from '@playwright/test';

test.describe('[API] AI Chat Stream', () => {
  test('[P1] should return streaming response for chat request', async ({ request }) => {
    const response = await request.post('/api/v1/ai/chat/stream', {
      data: {
        modelId: 'current',
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('text/event-stream');
  });

  test('[P1] should handle empty messages array', async ({ request }) => {
    const response = await request.post('/api/v1/ai/chat/stream', {
      data: {
        modelId: 'test-model-id',
        messages: []
      }
    });

    expect(response.status()).toBe(400);
  });

  test('[P1] should handle missing modelId', async ({ request }) => {
    const response = await request.post('/api/v1/ai/chat/stream', {
      data: {
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      }
    });

    expect(response.status()).toBe(400);
  });

  test('[P1] should handle missing messages', async ({ request }) => {
    const response = await request.post('/api/v1/ai/chat/stream', {
      data: {
        modelId: 'test-model-id'
      }
    });

    expect(response.status()).toBe(400);
  });

  test('[P2] should handle invalid message format', async ({ request }) => {
    const response = await request.post('/api/v1/ai/chat/stream', {
      data: {
        modelId: 'test-model-id',
        messages: [
          { role: 'invalid', content: 'Hello' }
        ]
      }
    });

    expect(response.status()).toBe(400);
  });

  test('[P1] should support context references in messages', async ({ request }) => {
    const response = await request.post('/api/v1/ai/chat/stream', {
      data: {
        modelId: 'current',
        messages: [
          { 
            role: 'user', 
            content: 'Explain @file:src/utils/helper.ts',
            contexts: [
              { type: 'file', path: 'src/utils/helper.ts', content: 'export function helper() { return 42; }' }
            ]
          }
        ]
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('text/event-stream');
  });

  test('[P1] should return error for unavailable model', async ({ request }) => {
    const response = await request.post('/api/v1/ai/chat/stream', {
      data: {
        modelId: 'non-existent-model',
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      }
    });

    expect(response.status()).toBe(404);
  });

  test('[P2] should return error for empty request body', async ({ request }) => {
    const response = await request.post('/api/v1/ai/chat/stream', {
      data: {}
    });

    expect(response.status()).toBe(400);
  });

  test('[P2] should handle messages without role', async ({ request }) => {
    const response = await request.post('/api/v1/ai/chat/stream', {
      data: {
        modelId: 'test-model-id',
        messages: [
          { content: 'Hello' }
        ]
      }
    });

    expect(response.status()).toBe(400);
  });

  test('[P2] should handle messages without content', async ({ request }) => {
    const response = await request.post('/api/v1/ai/chat/stream', {
      data: {
        modelId: 'test-model-id',
        messages: [
          { role: 'user' }
        ]
      }
    });

    expect(response.status()).toBe(400);
  });

  test('[P2] should return error for invalid JSON body', async ({ request }) => {
    const response = await request.post('/api/v1/ai/chat/stream', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: 'invalid json'
    });

    expect(response.status()).toBe(400);
  });

  test('[P1] should use "current" model when modelId is "current"', async ({ request }) => {
    const response = await request.post('/api/v1/ai/chat/stream', {
      data: {
        modelId: 'current',
        messages: [
          { role: 'user', content: 'Test message' }
        ]
      }
    });

    expect(response.ok()).toBeTruthy();
  });
});