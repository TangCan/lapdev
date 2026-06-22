import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3333';

  test.describe('Path Traversal Protection', () => {
    test('[P0] should block path traversal with single ../', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/files/read`, {
        params: { path: '../etc/passwd' }
      });
      
      expect(response.ok()).toBeFalsy();
      const data = await response.json();
      expect(data.status).toBe('error');
    });

    test('[P0] should block path traversal with double ../', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/files/read`, {
        params: { path: '../../etc/passwd' }
      });
      
      expect(response.ok()).toBeFalsy();
    });

    test('[P0] should block path traversal with multiple ../', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/files/read`, {
        params: { path: '../../../etc/passwd' }
      });
      
      expect(response.ok()).toBeFalsy();
    });

    test('[P0] should block absolute path access', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/files/read`, {
        params: { path: '/etc/passwd' }
      });
      
      expect(response.ok()).toBeFalsy();
    });

    test('[P0] should block root directory access', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/files/read`, {
        params: { path: '/' }
      });
      
      expect(response.ok()).toBeFalsy();
    });

    test('[P1] should block encoded path traversal', async ({ request }) => {
      const encodedPath = encodeURIComponent('../etc/passwd');
      const response = await request.get(`${baseURL}/api/v1/files/read`, {
        params: { path: encodedPath }
      });
      
      expect(response.ok()).toBeFalsy();
    });

    test('[P1] should block double-dot variations', async ({ request }) => {
      const variations = [
        '..\\',
        '..//',
        '.\\.',
        './.',
      ];
      
      for (const variation of variations) {
        const response = await request.get(`${baseURL}/api/v1/files/read`, {
          params: { path: `${variation}etc/passwd` }
        });
        
        expect(response.ok()).toBeFalsy();
      }
    });
  });

  test.describe('CORS Security', () => {
    test('[P1] should handle preflight OPTIONS request', async ({ request }) => {
      const response = await request.fetch(`${baseURL}/api/v1/files/tree`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3333',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      expect(response.status()).toBe(200);
      const headers = response.headers();
      expect(headers['access-control-allow-methods']).toBeDefined();
      expect(headers['access-control-allow-headers']).toBeDefined();
    });

    test('[P1] should allow requests from allowed origin', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/files/tree`, {
        headers: {
          'Origin': 'http://localhost:3333'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const headers = response.headers();
      const corsHeader = headers['access-control-allow-origin'];
      expect(corsHeader).toBe('http://localhost:3333');
    });

    test('[P1] should not expose CORS header for disallowed origin', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/files/tree`, {
        headers: {
          'Origin': 'http://malicious.com'
        }
      });
      
      const headers = response.headers();
      const corsHeader = headers['access-control-allow-origin'];
      expect(corsHeader).toBeUndefined();
    });

    test('[P2] should handle null origin', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/files/tree`, {
        headers: {
          'Origin': 'null'
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Input Validation', () => {
    test('[P0] should reject empty path parameter', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/files/read`, {
        params: { path: '' }
      });
      
      expect(response.ok()).toBeFalsy();
    });

    test('[P0] should reject undefined path parameter', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/files/read`);
      
      expect(response.ok()).toBeFalsy();
    });

    test('[P1] should handle very long paths gracefully', async ({ request }) => {
      const longPath = '/workspace/' + 'a'.repeat(1024);
      const response = await request.get(`${baseURL}/api/v1/files/read`, {
        params: { path: longPath }
      });
      
      expect(response.status()).toBeLessThan(500);
    });

    test('[P1] should reject paths with null bytes', async ({ request }) => {
      const maliciousPath = '/workspace/test.txt\u0000/etc/passwd';
      const response = await request.get(`${baseURL}/api/v1/files/read`, {
        params: { path: maliciousPath }
      });
      
      expect(response.ok()).toBeFalsy();
    });
  });

  test.describe('Rate Limiting', () => {
    test('[P2] should handle rapid consecutive requests', async ({ request }) => {
      const responses = await Promise.all(
        Array.from({ length: 10 }).map(() => 
          request.get(`${baseURL}/api/v1/files/tree`, {
            params: { path: '/workspace' }
          })
        )
      );
      
      const successCount = responses.filter(r => r.ok()).length;
      expect(successCount).toBeGreaterThanOrEqual(5);
    });
  });

  test.describe('File Operations Security', () => {
    const testPrefix = `/workspace/security-test-${Date.now()}`;

    test.beforeEach(async ({ request }) => {
      await request.post(`${baseURL}/api/v1/files/create`, {
        data: { path: testPrefix, type: 'directory' }
      });
    });

    test.afterEach(async ({ request }) => {
      await request.delete(`${baseURL}/api/v1/files/delete`, {
        data: { path: testPrefix }
      }).catch(() => {});
    });

    test('[P0] should prevent creating file outside workspace', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/files/create`, {
        data: {
          path: '/etc/malicious.txt',
          type: 'file',
          content: 'bad content'
        }
      });
      
      expect(response.ok()).toBeFalsy();
    });

    test('[P0] should prevent deleting directory outside workspace', async ({ request }) => {
      const response = await request.delete(`${baseURL}/api/v1/files/delete`, {
        data: { path: '/etc' }
      });
      
      expect(response.ok()).toBeFalsy();
    });

    test('[P1] should prevent renaming file to outside workspace', async ({ request }) => {
      await request.post(`${baseURL}/api/v1/files/create`, {
        data: {
          path: `${testPrefix}/test.txt`,
          type: 'file',
          content: 'test'
        }
      });
      
      const response = await request.post(`${baseURL}/api/v1/files/rename`, {
        data: {
          oldPath: `${testPrefix}/test.txt`,
          newPath: '/etc/malicious.txt'
        }
      });
      
      expect(response.ok()).toBeFalsy();
    });
  });
});