import { test, expect, request } from '@playwright/test';

test.describe('[9.1] Agent API Tests (ATDD RED PHASE)', () => {
  let apiContext;

  test.beforeAll(async () => {
    apiContext = await request.newContext({
      baseURL: 'http://localhost:3333',
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('[P0] API-9.1.1 should read file successfully', async () => {
    await test.skip();
    
    const response = await apiContext.post('/api/v1/agent/read-file', {
      data: { filePath: 'test-file.ts' },
    });
    
    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    
    expect(result.status).toBe('success');
    expect(result.data).toHaveProperty('content');
    expect(typeof result.data.content).toBe('string');
  });

  test('[P1] API-9.1.2 should return error when file does not exist', async () => {
    await test.skip();
    
    const response = await apiContext.post('/api/v1/agent/read-file', {
      data: { filePath: 'non-existent-file.ts' },
    });
    
    expect(response.ok()).toBeFalsy();
    const result = await response.json();
    
    expect(result.status).toBe('error');
    expect(result.error).toHaveProperty('message');
  });

  test('[P0] API-9.1.3 should block path traversal attacks', async () => {
    await test.skip();
    
    const response = await apiContext.post('/api/v1/agent/read-file', {
      data: { filePath: '../etc/passwd' },
    });
    
    expect(response.ok()).toBeFalsy();
    const result = await response.json();
    
    expect(result.status).toBe('error');
    expect(result.error.message).toContain('非法');
  });

  test('[P0] API-9.1.4 should list directory contents', async () => {
    await test.skip();
    
    const response = await apiContext.post('/api/v1/agent/list-files', {
      data: { directoryPath: '.' },
    });
    
    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    
    expect(result.status).toBe('success');
    expect(Array.isArray(result.data)).toBeTruthy();
    expect(result.data.length).toBeGreaterThan(0);
    
    for (const file of result.data) {
      expect(file).toHaveProperty('name');
      expect(file).toHaveProperty('path');
      expect(file).toHaveProperty('type');
      expect(['file', 'directory']).toContain(file.type);
    }
  });

  test('[P0] API-9.1.5 should search code in workspace', async () => {
    await test.skip();
    
    const response = await apiContext.post('/api/v1/agent/search-code', {
      data: { pattern: 'function', directory: '.' },
    });
    
    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    
    expect(result.status).toBe('success');
    expect(Array.isArray(result.data)).toBeTruthy();
    
    for (const match of result.data) {
      expect(match).toHaveProperty('filePath');
      expect(match).toHaveProperty('lineNumber');
      expect(match).toHaveProperty('snippet');
    }
  });
});