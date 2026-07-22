import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('monaco-editor', () => ({
  editor: {
    getModels: vi.fn().mockReturnValue([]),
  }
}));

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
});
