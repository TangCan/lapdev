import { describe, it, expect, vi, beforeEach } from 'vitest';

import { lspService } from './lspService';

describe('lspService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHover', () => {
    it('[P1] TC-8.1.13 should call backend API with correct parameters', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({
          status: 'success',
          hover: {
            contents: [{ kind: 'markdown', value: '**string**' }],
            range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }
          }
        })
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      await lspService.getHover('file:///workspace/test.ts', { line: 0, character: 6 });

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe('http://localhost:3333/v1/lsp/hover');
      const body = JSON.parse(callArgs[1].body);
      expect(body.path).toBe('/workspace/test.ts');
      expect(body.position).toEqual({ line: 0, character: 6 });
    });

    it('[P1] TC-8.1.14 should return parsed Hover object on success', async () => {
      const mockHover = {
        contents: [{ kind: 'markdown', value: '**string**' }],
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({
          status: 'success',
          hover: mockHover
        })
      }) as unknown as typeof fetch;

      const result = await lspService.getHover('file:///workspace/test.ts', { line: 0, character: 6 });

      expect(result).toEqual(mockHover);
    });

    it('[P1] TC-8.1.15 should handle API error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('API error')) as unknown as typeof fetch;

      const result = await lspService.getHover('file:///workspace/test.ts', { line: 0, character: 6 });

      expect(result).toBeNull();
      consoleErrorSpy.mockRestore();
    });

    it('[P1] TC-8.1.16 should handle 404 error for uninitialized session', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({
          status: 'error',
          message: 'Session not found'
        })
      }) as unknown as typeof fetch;

      const result = await lspService.getHover('file:///workspace/test.ts', { line: 0, character: 6 });

      expect(result).toBeNull();
    });

    it('[P1] TC-8.1.17 should handle 400 error for invalid parameters', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({
          status: 'error',
          message: 'Invalid parameters'
        })
      }) as unknown as typeof fetch;

      const result = await lspService.getHover('file:///workspace/test.ts', { line: -1, character: -1 });

      expect(result).toBeNull();
    });
  });

  describe('formatRange (EPI2.03)', () => {
    it('[P0] should return formatting edits for valid range', async () => {
      const mockContent = 'const x=1\nconst y=2\nconst z=3';
      const mockFormatted = 'const x = 1;\nconst y = 2;\nconst z = 3;';

      // Mock monaco model
      vi.spyOn(lspService, 'getMonacoMod' as never).mockReturnValue({
        editor: {
          getModels: () => [{
            uri: { toString: () => 'file:///workspace/test.ts' },
            getValue: () => mockContent,
          }],
        },
      } as never);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          content: mockFormatted,
        }),
      }) as unknown as typeof fetch;

      const result = await lspService.formatRange('file:///workspace/test.ts', {
        startLine: 0,
        endLine: 2,
      });

      expect(result).not.toBeNull();
      expect(result!.length).toBeGreaterThan(0);
      // 验证仅返回选中范围的编辑（不替换整个文档）
      expect(result![0].range.start.line).toBe(0);
      expect(result![0].range.end.line).toBe(2);
    });

    it('[P1] should return null for empty content', async () => {
      vi.spyOn(lspService, 'getMonacoMod' as never).mockReturnValue({
        editor: {
          getModels: () => [{
            uri: { toString: () => 'file:///workspace/test.ts' },
            getValue: () => '',
          }],
        },
      } as never);

      const result = await lspService.formatRange('file:///workspace/test.ts', {
        startLine: 0,
        endLine: 5,
      });

      expect(result).toBeNull();
    });

    it('[P1] should return null for invalid range (startLine > endLine)', async () => {
      const mockContent = 'const x=1\nconst y=2';

      vi.spyOn(lspService, 'getMonacoMod' as never).mockReturnValue({
        editor: {
          getModels: () => [{
            uri: { toString: () => 'file:///workspace/test.ts' },
            getValue: () => mockContent,
          }],
        },
      } as never);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = await lspService.formatRange('file:///workspace/test.ts', {
        startLine: 5,
        endLine: 2,
      });

      expect(result).toBeNull();
      consoleWarnSpy.mockRestore();
    });

    it('[P1] should use cache for repeated format calls with same content', async () => {
      const mockContent = 'const a=1\nconst b=2\nconst c=3';
      const mockFormatted = 'const a = 1;\nconst b = 2;\nconst c = 3;';
      const range = { startLine: 0, endLine: 2 };

      vi.spyOn(lspService, 'getMonacoMod' as never).mockReturnValue({
        editor: {
          getModels: () => [{
            uri: { toString: () => 'file:///workspace/test.ts' },
            getValue: () => mockContent,
          }],
        },
      } as never);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          content: mockFormatted,
        }),
      }) as unknown as typeof fetch;

      globalThis.fetch = mockFetch;

      // First call - should hit API
      await lspService.formatRange('file:///workspace/test.ts', range);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call with same content + range - should use cache (no new API call)
      await lspService.formatRange('file:///workspace/test.ts', range);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1 - cache hit
    });

    it('[P1] should handle API error gracefully', async () => {
      const mockContent = 'const x=1\nconst y=2';
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.spyOn(lspService, 'getMonacoMod' as never).mockReturnValue({
        editor: {
          getModels: () => [{
            uri: { toString: () => 'file:///workspace/test.ts' },
            getValue: () => mockContent,
          }],
        },
      } as never);

      globalThis.fetch = vi.fn().mockRejectedValue(new Error('API error')) as unknown as typeof fetch;

      const result = await lspService.formatRange('file:///workspace/test.ts', {
        startLine: 0,
        endLine: 1,
      });

      expect(result).toBeNull();
      consoleErrorSpy.mockRestore();
    });
  });
});
