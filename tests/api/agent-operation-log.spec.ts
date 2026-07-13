import { test, expect } from '@playwright/test';

test.describe('Agent Operation Log API', () => {
  test('[API-9.3.1] GET /api/v1/agent/get-logs returns empty array when no logs', async ({ request }) => {
    const response = await request.get('/api/v1/agent/get-logs');
    
    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.status).toBe('success');
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(0);
  });

  test('[API-9.3.2] GET /api/v1/agent/get-logs returns logs array', async ({ request }) => {
    await request.post('/api/v1/agent/write-file', {
      data: {
        filePath: 'test-log-file.ts',
        content: 'console.log("test");',
      },
    });

    const response = await request.get('/api/v1/agent/get-logs');
    
    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.status).toBe('success');
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
  });

  test('[API-9.3.3] POST /api/v1/agent/clear-logs clears all logs', async ({ request }) => {
    await request.post('/api/v1/agent/write-file', {
      data: {
        filePath: 'test-clear-log.ts',
        content: 'test',
      },
    });

    const clearResponse = await request.post('/api/v1/agent/clear-logs');
    expect(clearResponse.ok()).toBeTruthy();

    const getResponse = await request.get('/api/v1/agent/get-logs');
    const result = await getResponse.json();
    expect(result.data).toHaveLength(0);
  });

  test('[API-9.3.4] GET /api/v1/agent/get-logs returns logs with correct structure', async ({ request }) => {
    await request.post('/api/v1/agent/write-file', {
      data: {
        filePath: 'test-structure.ts',
        content: 'structure',
      },
    });

    const response = await request.get('/api/v1/agent/get-logs');
    const result = await response.json();
    
    if (result.data.length > 0) {
      const logEntry = result.data[0];
      expect(logEntry.id).toBeDefined();
      expect(['read', 'write', 'search', 'create', 'delete']).toContain(logEntry.type);
      expect(typeof logEntry.filePath).toBe('string');
      expect(['success', 'failed', 'rejected']).toContain(logEntry.result);
      expect(typeof logEntry.timestamp).toBe('number');
    }
  });
});
