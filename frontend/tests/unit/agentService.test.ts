import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { agentService } from '../../src/services/agentService';

describe('AgentService', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn();
    (global as any).fetch = fetchMock;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('readFile', () => {
    it('should throw error when filePath is empty', async () => {
      await expect(agentService.readFile('')).rejects.toThrow('文件路径不能为空');
      await expect(agentService.readFile('   ')).rejects.toThrow('文件路径不能为空');
    });

    it('should return file content when API succeeds', async () => {
      const mockContent = 'export function test() {}';
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'success',
          data: { content: mockContent },
        }),
      });

      const result = await agentService.readFile('test.ts');

      expect(result).toBe(mockContent);
      expect(fetchMock).toHaveBeenCalledWith('/api/v1/agent/read-file', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ filePath: 'test.ts' }),
      }));
    });

    it('should throw error when API returns error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        json: async () => ({
          status: 'error',
          error: { message: '文件不存在' },
        }),
      });

      await expect(agentService.readFile('non-existent.ts')).rejects.toThrow('文件不存在');
    });

    it('should throw error when network request fails', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      await expect(agentService.readFile('test.ts')).rejects.toThrow('Network error');
    });
  });

  describe('listFiles', () => {
    it('should throw error when directoryPath is empty', async () => {
      await expect(agentService.listFiles('')).rejects.toThrow('目录路径不能为空');
      await expect(agentService.listFiles('   ')).rejects.toThrow('目录路径不能为空');
    });

    it('should return file list when API succeeds', async () => {
      const mockFiles = [
        { name: 'test.ts', path: 'test.ts', type: 'file' as const, size: 100 },
        { name: 'src', path: 'src', type: 'directory' as const },
      ];
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'success',
          data: mockFiles,
        }),
      });

      const result = await agentService.listFiles('.');

      expect(result).toEqual(mockFiles);
      expect(fetchMock).toHaveBeenCalledWith('/api/v1/agent/list-files', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ directoryPath: '.' }),
      }));
    });

    it('should throw error when API returns error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        json: async () => ({
          status: 'error',
          error: { message: '目录不存在' },
        }),
      });

      await expect(agentService.listFiles('non-existent')).rejects.toThrow('目录不存在');
    });
  });

  describe('searchCode', () => {
    it('should return search results when API succeeds', async () => {
      const mockResults = [
        { filePath: 'test.ts', lineNumber: 5, snippet: 'export function test()' },
      ];
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'success',
          data: mockResults,
        }),
      });

      const result = await agentService.searchCode('function', '.');

      expect(result).toEqual(mockResults);
      expect(fetchMock).toHaveBeenCalledWith('/api/v1/agent/search-code', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ pattern: 'function', directory: '.' }),
      }));
    });

    it('should search without directory when not provided', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'success',
          data: [],
        }),
      });

      await agentService.searchCode('pattern');

      expect(fetchMock).toHaveBeenCalledWith('/api/v1/agent/search-code', expect.objectContaining({
        body: JSON.stringify({ pattern: 'pattern', directory: undefined }),
      }));
    });

    it('should throw error when API returns error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        json: async () => ({
          status: 'error',
          error: { message: '搜索失败' },
        }),
      });

      await expect(agentService.searchCode('pattern')).rejects.toThrow('搜索失败');
    });
  });

  describe('fetchWithTimeout', () => {
    it('should abort request when timeout occurs', async () => {
      const controller = new AbortController();
      const originalAbortController = AbortController;
      let capturedSignal: AbortSignal | undefined;

      (global as any).AbortController = class {
        signal = controller.signal;
        abort = () => {};
      };

      const mockTimeout = vi.spyOn(global, 'setTimeout').mockImplementation((cb) => {
        setTimeout(() => cb(), 10);
        return 1 as ReturnType<typeof setTimeout>;
      });

      fetchMock.mockImplementation(() => {
        return new Promise(() => {});
      });

      await expect(agentService.readFile('test.ts')).rejects.toThrow('请求超时');

      (global as any).AbortController = originalAbortController;
      mockTimeout.mockRestore();
    });
  });
});
