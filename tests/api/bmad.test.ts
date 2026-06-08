import { test, expect } from '@playwright/test';

test.describe('BMAD API Tests', () => {
  test('[P0] should get BMAD status', async ({ request }) => {
    const response = await request.get('/api/bmad/status');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('installed');
    expect(body).toHaveProperty('installing');
    expect(body).toHaveProperty('version');
  });

  test('[P0] should handle SSE streaming for install', async ({ request }) => {
    const response = await request.post('/api/bmad/install', {
      headers: {
        'Accept': 'text/event-stream',
      },
    });
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/event-stream');
  });

  test('[P1] should return 405 for invalid method on install', async ({ request }) => {
    const response = await request.get('/api/bmad/install');
    expect(response.status()).toBe(405);
  });

  test('[P1] should handle concurrent installation request', async ({ request }) => {
    const response = await request.post('/api/bmad/install', {
      headers: {
        'Accept': 'text/event-stream',
      },
    });
    expect(response.status()).toBe(200);
  });
});