import { test, expect } from '@playwright/test';

test.describe('[7.1] Terminal Session API Tests', () => {
  test('[P0] should create a new terminal session', async ({ request }) => {
    const response = await request.post('/api/v1/terminal/create');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('status', 'success');
    expect(data).toHaveProperty('sessionId');
    expect(typeof data.sessionId).toBe('string');
    expect(data.sessionId).toBeTruthy();
  });

  test('[P0] should close an existing terminal session', async ({ request }) => {
    const createResponse = await request.post('/api/v1/terminal/create');
    const createData = await createResponse.json();
    const sessionId = createData.sessionId;

    const closeResponse = await request.post('/api/v1/terminal/close', {
      data: { sessionId },
    });
    expect(closeResponse.status()).toBe(200);
    const closeData = await closeResponse.json();
    expect(closeData).toHaveProperty('status', 'success');
  });

  test('[P1] should list all active terminal sessions', async ({ request }) => {
    const response = await request.get('/api/v1/terminal/list');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('status', 'success');
    expect(Array.isArray(data.sessions)).toBe(true);
  });

  test('[P1] should resize terminal session', async ({ request }) => {
    const createResponse = await request.post('/api/v1/terminal/create');
    const createData = await createResponse.json();
    const sessionId = createData.sessionId;

    const resizeResponse = await request.post('/api/v1/terminal/resize', {
      data: { sessionId, cols: 80, rows: 24 },
    });
    expect(resizeResponse.status()).toBe(200);
    const resizeData = await resizeResponse.json();
    expect(resizeData).toHaveProperty('status', 'success');
  });

  test('[P2] should handle closing non-existent session', async ({ request }) => {
    const response = await request.post('/api/v1/terminal/close', {
      data: { sessionId: 'non-existent-session' },
    });
    const data = await response.json();
    expect(data.status).toBe('error');
  });

  test('[P2] should handle resizing non-existent session', async ({ request }) => {
    const response = await request.post('/api/v1/terminal/resize', {
      data: { sessionId: 'non-existent-session', cols: 80, rows: 24 },
    });
    const data = await response.json();
    expect(data.status).toBe('error');
  });

  test('[P0] should create multiple terminal sessions', async ({ request }) => {
    const responses = await Promise.all([
      request.post('/api/v1/terminal/create'),
      request.post('/api/v1/terminal/create'),
      request.post('/api/v1/terminal/create'),
    ]);

    for (const response of responses) {
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('success');
      expect(data.sessionId).toBeTruthy();
    }

    const listResponse = await request.get('/api/v1/terminal/list');
    const listData = await listResponse.json();
    expect(listData.sessions.length).toBeGreaterThanOrEqual(3);
  });
});