import { agentService, AgentOperation, OperationLogEntry } from './agentService';
import { vi, describe, test, expect, beforeEach } from 'vitest';

global.fetch = vi.fn();

describe('AgentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('readFile', () => {
    test('should throw error when filePath is empty', async () => {
      await expect(agentService.readFile('')).rejects.toThrow('文件路径不能为空');
      await expect(agentService.readFile('   ')).rejects.toThrow('文件路径不能为空');
    });

    test('should read file content successfully', async () => {
      const mockContent = 'test file content';
      (global.fetch as vi.Mock).mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          status: 'success',
          data: { content: mockContent },
        }),
      });

      const result = await agentService.readFile('/test/file.ts');
      expect(result).toBe(mockContent);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/agent/read-file',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ filePath: '/test/file.ts' }),
        })
      );
    });

    test('should throw error when API returns failure', async () => {
      (global.fetch as vi.Mock).mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          status: 'error',
          error: { message: 'File not found' },
        }),
      });

      await expect(agentService.readFile('/test/file.ts')).rejects.toThrow('File not found');
    });
  });

  describe('writeFile', () => {
    test('should throw error when filePath is empty', async () => {
      await expect(agentService.writeFile('', 'content')).rejects.toThrow('文件路径不能为空');
    });

    test('should throw error when content is undefined', async () => {
      await expect(agentService.writeFile('/test/file.ts', undefined as any)).rejects.toThrow('文件内容不能为空');
    });

    test('should throw error when content is null', async () => {
      await expect(agentService.writeFile('/test/file.ts', null as any)).rejects.toThrow('文件内容不能为空');
    });

    test('should write file successfully', async () => {
      (global.fetch as vi.Mock).mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          status: 'success',
        }),
      });

      await agentService.writeFile('/test/file.ts', 'new content');
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/agent/write-file',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ filePath: '/test/file.ts', content: 'new content' }),
        })
      );
    });

    test('should throw error when API returns failure', async () => {
      (global.fetch as vi.Mock).mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          status: 'error',
          error: { message: 'Write failed' },
        }),
      });

      await expect(agentService.writeFile('/test/file.ts', 'content')).rejects.toThrow('Write failed');
    });
  });

  describe('listFiles', () => {
    test('should throw error when directoryPath is empty', async () => {
      await expect(agentService.listFiles('')).rejects.toThrow('目录路径不能为空');
    });

    test('should list files successfully', async () => {
      const mockFiles = [
        { name: 'file.ts', path: '/test/file.ts', type: 'file' as const, size: 100 },
        { name: 'dir', path: '/test/dir', type: 'directory' as const },
      ];
      (global.fetch as vi.Mock).mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          status: 'success',
          data: mockFiles,
        }),
      });

      const result = await agentService.listFiles('/test');
      expect(result).toEqual(mockFiles);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/agent/list-files',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ directoryPath: '/test' }),
        })
      );
    });
  });

  describe('searchCode', () => {
    test('should search code successfully', async () => {
      const mockResults = [
        { filePath: '/test/file.ts', lineNumber: 5, snippet: 'search result' },
      ];
      (global.fetch as vi.Mock).mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          status: 'success',
          data: mockResults,
        }),
      });

      const result = await agentService.searchCode('pattern', '/test');
      expect(result).toEqual(mockResults);
    });

    test('should search without directory', async () => {
      (global.fetch as vi.Mock).mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          status: 'success',
          data: [],
        }),
      });

      await agentService.searchCode('pattern');
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/agent/search-code',
        expect.objectContaining({
          body: JSON.stringify({ pattern: 'pattern', directory: undefined }),
        })
      );
    });
  });

  describe('executeOperation', () => {
    test('should execute write operation', async () => {
      (global.fetch as vi.Mock).mockResolvedValue({
        json: vi.fn().mockResolvedValue({ status: 'success' }),
      });

      const result = await agentService.executeOperation({
        type: 'write',
        filePath: '/test/file.ts',
        content: 'content',
      });
      expect(result).toBe(true);
    });

    test('should execute read operation', async () => {
      (global.fetch as vi.Mock).mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          status: 'success',
          data: { content: 'content' },
        }),
      });

      const result = await agentService.executeOperation({
        type: 'read',
        filePath: '/test/file.ts',
      });
      expect(result).toBe(true);
    });

    test('should execute search operation', async () => {
      (global.fetch as vi.Mock).mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          status: 'success',
          data: [],
        }),
      });

      const result = await agentService.executeOperation({
        type: 'search',
        filePath: 'pattern',
      });
      expect(result).toBe(true);
    });

    test('should return false when operation fails', async () => {
      (global.fetch as vi.Mock).mockRejectedValue(new Error('Network error'));

      const result = await agentService.executeOperation({
        type: 'read',
        filePath: '/test/file.ts',
      });
      expect(result).toBe(false);
    });

    test('should return false for write operation with empty content', async () => {
      const result = await agentService.executeOperation({
        type: 'write',
        filePath: '/test/file.ts',
        content: '',
      });
      expect(result).toBe(false);
    });
  });

  describe('getLogs', () => {
    test('should get logs successfully', async () => {
      const mockLogs: OperationLogEntry[] = [
        {
          id: '1',
          operationType: 'read',
          filePath: '/test/file.ts',
          result: 'success',
          timestamp: Date.now(),
        },
      ];
      (global.fetch as vi.Mock).mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          status: 'success',
          data: mockLogs,
        }),
      });

      const result = await agentService.getLogs();
      expect(result).toEqual(mockLogs);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/agent/get-logs',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('clearServerLogs', () => {
    test('should clear server logs successfully', async () => {
      (global.fetch as vi.Mock).mockResolvedValue({
        json: vi.fn().mockResolvedValue({ status: 'success' }),
      });

      await agentService.clearServerLogs();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/agent/clear-logs',
        expect.objectContaining({ method: 'POST' })
      );
    });

    test('should throw error when API returns failure', async () => {
      (global.fetch as vi.Mock).mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          status: 'error',
          error: { message: 'Clear failed' },
        }),
      });

      await expect(agentService.clearServerLogs()).rejects.toThrow('Clear failed');
    });
  });

  describe('createOperation', () => {
    test('should create operation object', () => {
      const operation = agentService.createOperation('read', '/test/file.ts', 'content');
      expect(operation.id).toBeDefined();
      expect(operation.type).toBe('read');
      expect(operation.filePath).toBe('/test/file.ts');
      expect(operation.content).toBe('content');
      expect(operation.status).toBe('pending');
      expect(operation.timestamp).toBeDefined();
    });
  });

  describe('generateId', () => {
    test('should generate unique ID', () => {
      const id1 = agentService.generateId();
      const id2 = agentService.generateId();
      expect(id1).not.toBe(id2);
      expect(id1.length).toBeGreaterThan(0);
    });
  });
});