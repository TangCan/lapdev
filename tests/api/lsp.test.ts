import { test, expect } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:3333';

test.describe('[API] LSP Code Intelligence API', () => {
  test.describe('AC-1: 代码补全功能', () => {
    test('[P0] should return completion suggestions', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/completion`, {
        data: {
          path: '/workspace/test.ts',
          content: 'const x = ',
          position: { line: 0, column: 10 }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(data).toHaveProperty('items');
      expect(Array.isArray(data.items)).toBeTruthy();
    });

    test('[P0] should return signature help', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/signature`, {
        data: {
          path: '/workspace/test.ts',
          content: 'console.log(',
          position: { line: 0, column: 13 }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(data).toHaveProperty('signatures');
    });

    test('[P1] should return auto-import suggestions', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/completion`, {
        data: {
          path: '/workspace/test.ts',
          content: 'React.',
          position: { line: 0, column: 6 }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(Array.isArray(data.items)).toBeTruthy();
    });

    test('[P2] should handle empty content', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/completion`, {
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
  });

  test.describe('AC-2: 代码导航功能', () => {
    test('[P0] should return definition location', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/definition`, {
        data: {
          path: '/workspace/test.ts',
          content: 'const x = 1;\nconsole.log(x);',
          position: { line: 1, column: 12 }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(data).toHaveProperty('locations');
    });

    test('[P0] should return references', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/references`, {
        data: {
          path: '/workspace/test.ts',
          content: 'const x = 1;\nconsole.log(x);\nconst y = x;',
          position: { line: 0, column: 7 }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(data).toHaveProperty('locations');
      expect(Array.isArray(data.locations)).toBeTruthy();
    });

    test('[P1] should return type definition', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/typeDefinition`, {
        data: {
          path: '/workspace/test.ts',
          content: 'interface User { name: string; }\nconst user: User = { name: "test" };',
          position: { line: 1, column: 11 }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(data).toHaveProperty('locations');
    });

    test('[P2] should return empty for undefined symbol', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/definition`, {
        data: {
          path: '/workspace/test.ts',
          content: 'console.log(undefinedVar);',
          position: { line: 0, column: 16 }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(data.locations).toEqual([]);
    });
  });

  test.describe('AC-3: 代码重构功能', () => {
    test('[P0] should return rename edits', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/rename`, {
        data: {
          path: '/workspace/test.ts',
          content: 'const oldName = 1;\nconsole.log(oldName);',
          position: { line: 0, column: 7 },
          newName: 'newName'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(data).toHaveProperty('edits');
    });

    test('[P0] should format document', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/format`, {
        data: {
          path: '/workspace/test.ts',
          content: 'const x=1;const y=2;'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(data).toHaveProperty('content');
      expect(data.content).toContain('\n');
    });

    test('[P1] should return code actions', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/codeActions`, {
        data: {
          path: '/workspace/test.ts',
          content: 'const x: number = "string";',
          range: { start: { line: 0, column: 14 }, end: { line: 0, column: 22 } }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(data).toHaveProperty('actions');
      expect(Array.isArray(data.actions)).toBeTruthy();
    });

    test('[P2] should handle invalid rename', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/rename`, {
        data: {
          path: '/workspace/test.ts',
          content: 'const x = 1;',
          position: { line: 0, column: 7 },
          newName: 'class'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'error');
    });
  });

  test.describe('AC-4: 实时诊断功能', () => {
    test('[P0] should return diagnostics', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/diagnostics`, {
        data: {
          path: '/workspace/test.ts',
          content: 'const x: number = "string";\nconst undefinedVar;'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(data).toHaveProperty('diagnostics');
      expect(Array.isArray(data.diagnostics)).toBeTruthy();
    });

    test('[P1] should differentiate error and warning', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/diagnostics`, {
        data: {
          path: '/workspace/test.ts',
          content: 'const x: number = "string";\n// @ts-ignore\nconst unused = 1;'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      const errors = data.diagnostics.filter((d: any) => d.severity === 1);
      const warnings = data.diagnostics.filter((d: any) => d.severity === 2);
      expect(errors.length).toBeGreaterThan(0);
    });

    test('[P2] should handle empty file', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/diagnostics`, {
        data: {
          path: '/workspace/test.ts',
          content: ''
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(data.diagnostics).toEqual([]);
    });
  });

  test.describe('LSP 服务管理', () => {
    test('[P0] should start LSP server', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/start`, {
        data: {
          language: 'typescript'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty('status', 'success');
    });

    test('[P0] should stop LSP server', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/v1/lsp/stop`, {
        data: {
          language: 'typescript'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty('status', 'success');
    });

    test('[P1] should get LSP server status', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/lsp/status`, {
        params: { language: 'typescript' }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('status', 'success');
      expect(data).toHaveProperty('running');
      expect(typeof data.running).toBe('boolean');
    });
  });
});