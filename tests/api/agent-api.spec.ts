import { test, expect, request } from '@playwright/test';

test.describe('[9.1] Agent API Tests', () => {
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
    const response = await apiContext.post('/api/v1/agent/read-file', {
      data: { filePath: 'tests/fixtures/test-workspace/test-file.ts' },
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    expect(result.status).toBe('success');
    expect(result.data).toHaveProperty('content');
    expect(typeof result.data.content).toBe('string');
    expect(result.data.content).toContain('export function greet');
    expect(result.data.content).toContain('Hello, ${name}!');
  });

  test('[P1] API-9.1.2 should return error when file does not exist', async () => {
    const response = await apiContext.post('/api/v1/agent/read-file', {
      data: { filePath: 'non-existent-file.ts' },
    });

    expect(response.ok()).toBeFalsy();
    const result = await response.json();

    expect(result.status).toBe('error');
    expect(result.error).toHaveProperty('message');
  });

  test('[P0] API-9.1.3 should block path traversal attacks', async () => {
    const response = await apiContext.post('/api/v1/agent/read-file', {
      data: { filePath: '../etc/passwd' },
    });

    expect(response.ok()).toBeFalsy();
    const result = await response.json();

    expect(result.status).toBe('error');
    expect(result.error.message).toContain('非法');
  });

  test('[P0] API-9.1.3b should block nested path traversal attacks', async () => {
    const response = await apiContext.post('/api/v1/agent/read-file', {
      data: { filePath: '../../../../../etc/passwd' },
    });

    expect(response.ok()).toBeFalsy();
    const result = await response.json();

    expect(result.status).toBe('error');
  });

  test('[P0] API-9.1.4 should list directory contents', async () => {
    const response = await apiContext.post('/api/v1/agent/list-files', {
      data: { directoryPath: 'tests/fixtures/test-workspace' },
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    expect(result.status).toBe('success');
    expect(Array.isArray(result.data)).toBeTruthy();
    expect(result.data.length).toBeGreaterThan(0);

    const fileNames = result.data.map((f: any) => f.name);
    expect(fileNames).toContain('test-file.ts');
    expect(fileNames).toContain('search-target.ts');
    expect(fileNames).toContain('nested');

    for (const file of result.data) {
      expect(file).toHaveProperty('name');
      expect(file).toHaveProperty('path');
      expect(file).toHaveProperty('type');
      expect(['file', 'directory']).toContain(file.type);
    }
  });

  test('[P1] API-9.1.4b should return error for non-existent directory', async () => {
    const response = await apiContext.post('/api/v1/agent/list-files', {
      data: { directoryPath: 'non-existent-dir' },
    });

    expect(response.ok()).toBeFalsy();
    const result = await response.json();

    expect(result.status).toBe('error');
  });

  test('[P0] API-9.1.5 should search code in workspace', async () => {
    const response = await apiContext.post('/api/v1/agent/search-code', {
      data: { pattern: 'search', directory: 'tests/fixtures/test-workspace' },
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    expect(result.status).toBe('success');
    expect(Array.isArray(result.data)).toBeTruthy();
    expect(result.data.length).toBeGreaterThan(0);

    for (const match of result.data) {
      expect(match).toHaveProperty('filePath');
      expect(match).toHaveProperty('lineNumber');
      expect(match).toHaveProperty('snippet');
    }

    const filePaths = result.data.map((m: any) => m.filePath);
    expect(filePaths).toContain('tests/fixtures/test-workspace/search-target.ts');
  });

  test('[P1] API-9.1.5b should return empty results for non-matching pattern', async () => {
    const response = await apiContext.post('/api/v1/agent/search-code', {
      data: { pattern: 'xyz-nonexistent-pattern-123', directory: 'tests/fixtures/test-workspace' },
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    expect(result.status).toBe('success');
    expect(result.data).toEqual([]);
  });

  test('[P1] API-9.1.5c should search across entire workspace without directory', async () => {
    const response = await apiContext.post('/api/v1/agent/search-code', {
      data: { pattern: 'export function' },
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    expect(result.status).toBe('success');
    expect(Array.isArray(result.data)).toBeTruthy();
    expect(result.data.length).toBeGreaterThan(0);
  });
});
