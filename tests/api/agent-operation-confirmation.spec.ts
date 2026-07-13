import { test, expect } from '@playwright/test';

test.describe('[9.2] Agent Operation Confirmation API Tests (ATDD - RED PHASE)', () => {
  test.skip('[P0] TC-9.2.1 should write file successfully', async ({ request }) => {
    const response = await request.post('/api/v1/agent/write-file', {
      data: {
        filePath: 'test-output.ts',
        content: 'export const testValue = "written by agent";',
      },
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.status).toBe('success');
    expect(result.data).toBeDefined();
    expect(result.data.filePath).toBe('test-output.ts');
  });

  test.skip('[P0] TC-9.2.2 should block path traversal attack', async ({ request }) => {
    const response = await request.post('/api/v1/agent/write-file', {
      data: {
        filePath: '../etc/passwd',
        content: 'malicious content',
      },
    });

    expect(response.status()).toBe(400);
    const result = await response.json();
    expect(result.status).toBe('error');
    expect(result.error.message).toContain('无效') || expect(result.error.message).toContain('超出');
  });

  test.skip('[P1] TC-9.2.3 should return error for non-existent directory', async ({ request }) => {
    const response = await request.post('/api/v1/agent/write-file', {
      data: {
        filePath: 'non-existent-dir/test.ts',
        content: 'test content',
      },
    });

    expect(response.status()).toBe(404);
    const result = await response.json();
    expect(result.status).toBe('error');
  });

  test.skip('[P1] TC-9.2.4 should return error for empty file path', async ({ request }) => {
    const response = await request.post('/api/v1/agent/write-file', {
      data: {
        filePath: '',
        content: 'test content',
      },
    });

    expect(response.status()).toBe(400);
    const result = await response.json();
    expect(result.status).toBe('error');
    expect(result.error.message).toContain('不能为空');
  });

  test.skip('[P1] TC-9.2.5 should return error for missing content', async ({ request }) => {
    const response = await request.post('/api/v1/agent/write-file', {
      data: {
        filePath: 'test.ts',
      },
    });

    expect(response.status()).toBe(400);
    const result = await response.json();
    expect(result.status).toBe('error');
  });

  test.skip('[P1] TC-9.2.6 should return error for invalid JSON', async ({ request }) => {
    const response = await request.post('/api/v1/agent/write-file', {
      data: 'not valid json',
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(400);
    const result = await response.json();
    expect(result.status).toBe('error');
  });
});