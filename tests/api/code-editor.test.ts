import { test, expect } from '@playwright/test';
import { BASE_URL } from '../config/index.ts';

const baseURL = BASE_URL;
const testPrefix = '/workspace';

test.describe('[API] Code Editor API', () => {
  test.describe('GET /api/v1/files/read', () => {
    test('[P0] should return file content', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/files/read`, {
        params: { path: `${testPrefix}/test-file.txt` }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('content');
      expect(data.data).toHaveProperty('path');
    });

    test('[P0] should handle non-existent file', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/files/read`, {
        params: { path: `${testPrefix}/non-existent.txt` }
      });

      expect(response.status()).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty('status', 'error');
    });

    test('[P1] should return file metadata', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/files/read`, {
        params: { path: `${testPrefix}/test-file.txt` }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data.data).toHaveProperty('lastModified');
      expect(data.data).toHaveProperty('size');
      expect(data.data).toHaveProperty('type');
    });

    test('[P2] should handle large file', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/files/read`, {
        params: { path: `${testPrefix}/large-file.txt` }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.data.content.length).toBeGreaterThan(10000);
    });
  });

  test.describe('POST /api/v1/files/write', () => {
    test('[P0] should create new file', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/files/write`, {
        data: {
          path: `${testPrefix}/new-file.txt`,
          content: 'Hello, World!'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty('status', 'success');
    });

    test('[P0] should update existing file', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/files/write`, {
        data: {
          path: `${testPrefix}/test-file.txt`,
          content: 'Updated content'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty('status', 'success');
    });

    test('[P1] should handle binary files', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/files/write`, {
        data: {
          path: `${testPrefix}/binary.bin`,
          content: Buffer.from([0x00, 0x01, 0x02]).toString('base64'),
          isBase64: true
        }
      });

      expect(response.ok()).toBeTruthy();
    });

    test('[P2] should validate path traversal', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/files/write`, {
        data: {
          path: '../etc/passwd',
          content: 'malicious'
        }
      });

      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data).toHaveProperty('status', 'error');
    });
  });

  test.describe('POST /api/v1/files/format', () => {
    test('[P0] should format JavaScript code', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/files/format`, {
        data: {
          content: 'function foo() { return 1 }',
          language: 'javascript'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.data.formatted).toBe('function foo() {\n  return 1;\n}');
    });

    test('[P0] should format TypeScript code', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/files/format`, {
        data: {
          content: 'const x:number=1',
          language: 'typescript'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.data.formatted).toContain('const x: number = 1');
    });

    test('[P1] should format Python code', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/files/format`, {
        data: {
          content: 'def foo(): return 1',
          language: 'python'
        }
      });

      expect(response.ok()).toBeTruthy();
    });

    test('[P1] should format Rust code', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/files/format`, {
        data: {
          content: 'fn main(){ println!("Hello"); }',
          language: 'rust'
        }
      });

      expect(response.ok()).toBeTruthy();
    });

    test('[P2] should handle unsupported language', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/files/format`, {
        data: {
          content: 'some code',
          language: 'unknown-lang'
        }
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('GET /api/v1/languages', () => {
    test('[P0] should return supported languages', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/languages`);

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data).toContain('javascript');
      expect(data.data).toContain('typescript');
      expect(data.data).toContain('python');
      expect(data.data).toContain('rust');
      expect(data.data).toContain('go');
    });
  });
});
