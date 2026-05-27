import { test, expect } from '@playwright/test';

test.describe('[1.3] Terminal API Tests (ATDD GREEN PHASE)', () => {
  test('[P0] should create a new terminal session', async ({ request }) => {
    const response = await request.post('/api/v1/terminal/create', {
      data: {},
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result).toHaveProperty('status', 'success');
    expect(result).toHaveProperty('sessionId');
    expect(result.sessionId).toBeDefined();
  });

  test('[P0] should execute command in terminal', async ({ request }) => {
    const createResponse = await request.post('/api/v1/terminal/create', {
      data: {},
    });
    const createResult = await createResponse.json();
    const sessionId = createResult.sessionId;

    const commandResponse = await request.post('/api/v1/terminal/command', {
      data: {
        sessionId,
        command: 'echo "Hello World"',
      },
    });

    expect(commandResponse.status()).toBe(200);
    const result = await commandResponse.json();
    expect(result).toHaveProperty('status', 'success');
  });

  test('[P1] should resize terminal and send SIGWINCH', async ({ request }) => {
    const createResponse = await request.post('/api/v1/terminal/create', {
      data: {},
    });
    const createResult = await createResponse.json();
    const sessionId = createResult.sessionId;

    const resizeResponse = await request.post('/api/v1/terminal/resize', {
      data: {
        sessionId,
        cols: 120,
        rows: 40,
      },
    });

    expect(resizeResponse.status()).toBe(200);
    const result = await resizeResponse.json();
    expect(result).toHaveProperty('status', 'success');
  });

  test('[P1] should close terminal session', async ({ request }) => {
    const createResponse = await request.post('/api/v1/terminal/create', {
      data: {},
    });
    const createResult = await createResponse.json();
    const sessionId = createResult.sessionId;

    const closeResponse = await request.post('/api/v1/terminal/close', {
      data: {
        sessionId,
      },
    });

    expect(closeResponse.status()).toBe(200);
    const result = await closeResponse.json();
    expect(result).toHaveProperty('status', 'success');
  });

  test('[P2] should return error for invalid session ID', async ({ request }) => {
    const response = await request.post('/api/v1/terminal/command', {
      data: {
        sessionId: 'invalid-session-id',
        command: 'ls',
      },
    });

    expect(response.status()).toBe(400);
    const result = await response.json();
    expect(result).toHaveProperty('status', 'error');
  });

  test('[P2] should handle multiple concurrent sessions', async ({ request }) => {
    const createResponse1 = await request.post('/api/v1/terminal/create', { data: {} });
    const createResponse2 = await request.post('/api/v1/terminal/create', { data: {} });
    
    const result1 = await createResponse1.json();
    const result2 = await createResponse2.json();

    expect(createResponse1.status()).toBe(200);
    expect(createResponse2.status()).toBe(200);
    expect(result1.sessionId).not.toBe(result2.sessionId);
  });
});
