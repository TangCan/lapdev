import { test, expect } from '@playwright/test';
import { BASE_URL } from '../config/index.ts';

const baseURL = BASE_URL;

test.describe('[API] LSP Hover Provider', () => {
  test.describe('AC-1: 基本悬停提示', () => {
    test.skip('[P0] TC-8.1.1 should return hover info for variables', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/hover`, {
        data: {
          path: '/workspace/test.ts',
          content: 'const x: number = 42;\nconsole.log(x);',
          position: { line: 0, column: 7 }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(data).toHaveProperty('hover');
      expect(data.hover).toHaveProperty('contents');
      expect(data.hover.contents.length).toBeGreaterThan(0);
      expect(data.hover.contents[0]).toContain('number');
    });

    test.skip('[P0] TC-8.1.2 should return hover info with documentation for functions', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/hover`, {
        data: {
          path: '/workspace/test.ts',
          content: '/**\n * Adds two numbers\n * @param a First number\n * @param b Second number\n * @returns Sum of a and b\n */\nfunction add(a: number, b: number): number {\n  return a + b;\n}',
          position: { line: 7, column: 9 }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(data).toHaveProperty('hover');
      expect(data.hover).toHaveProperty('contents');
      const content = JSON.stringify(data.hover.contents);
      expect(content).toContain('add');
      expect(content).toContain('number');
      expect(content).toContain('Adds two numbers');
      expect(content).toContain('@param');
    });

    test.skip('[P1] TC-8.1.3 should return empty hover for undefined symbols', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/hover`, {
        data: {
          path: '/workspace/test.ts',
          content: 'console.log(undefinedVar);',
          position: { line: 0, column: 16 }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(data.hover).toBeUndefined();
    });
  });

  test.describe('AC-2: 导入模块悬停', () => {
    test.skip('[P0] TC-8.1.4 should return exports list for imported modules', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/hover`, {
        data: {
          path: '/workspace/test.ts',
          content: 'import { useState } from \'react\';',
          position: { line: 0, column: 8 }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(data).toHaveProperty('hover');
      expect(data.hover).toHaveProperty('contents');
    });

    test.skip('[P1] TC-8.1.5 should return error for non-existent modules', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/hover`, {
        data: {
          path: '/workspace/test.ts',
          content: 'import { foo } from \'non-existent-module\';',
          position: { line: 0, column: 8 }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
    });
  });

  test.describe('AC-3: 错误符号悬停', () => {
    test.skip('[P0] TC-8.1.6 should return error info for type errors', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/hover`, {
        data: {
          path: '/workspace/test.ts',
          content: 'const x: number = "string";',
          position: { line: 0, column: 14 }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(data).toHaveProperty('hover');
      expect(data.hover).toHaveProperty('contents');
    });

    test.skip('[P1] TC-8.1.7 should return fix suggestions for errors', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/hover`, {
        data: {
          path: '/workspace/test.ts',
          content: 'const x: number = "string";',
          position: { line: 0, column: 14 }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
    });
  });

  test.describe('AC-4: 泛型参数悬停', () => {
    test.skip('[P1] TC-8.1.8 should return type constraints for generic parameters', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/hover`, {
        data: {
          path: '/workspace/test.ts',
          content: 'function identity<T extends string>(arg: T): T {\n  return arg;\n}',
          position: { line: 0, column: 19 }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(data).toHaveProperty('hover');
      expect(data.hover).toHaveProperty('contents');
    });

    test.skip('[P2] TC-8.1.9 should return full bounds for complex generics', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/hover`, {
        data: {
          path: '/workspace/test.ts',
          content: 'type ValueOf<T> = T[keyof T];\nfunction getValue<T>(obj: T, key: keyof T): ValueOf<T> {\n  return obj[key];\n}',
          position: { line: 0, column: 14 }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(data).toHaveProperty('hover');
    });
  });

  test.describe('Hover API Edge Cases', () => {
    test.skip('[P2] should handle empty content', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/hover`, {
        data: {
          path: '/workspace/test.ts',
          content: '',
          position: { line: 0, column: 0 }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty('status', 'success');
    });

    test.skip('[P2] should handle out of bounds position', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/hover`, {
        data: {
          path: '/workspace/test.ts',
          content: 'const x = 1;',
          position: { line: 100, column: 100 }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty('status', 'success');
    });

    test.skip('[P2] should handle whitespace position', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/hover`, {
        data: {
          path: '/workspace/test.ts',
          content: 'const x = 1;',
          position: { line: 0, column: 6 }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty('status', 'success');
    });
  });
});
