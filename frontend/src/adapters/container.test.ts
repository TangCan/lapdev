import { describe, it, expect, vi } from 'vitest';
import { container } from './index';
import type { IFileRepository } from '../domain/ports/IFileRepository';
import type { IGitRepository } from '../domain/ports/IGitRepository';
import type { IAIRepository } from '../domain/ports/IAIRepository';
import { FileApiAdapter } from './FileApiAdapter';
import { GitApiAdapter } from './GitApiAdapter';
import { AIApiAdapter } from './AIApiAdapter';

/**
 * DI 容器单元测试
 * 验证 AC #3：通过 setXxxRepository 替换适配器实现，无需改动消费方代码。
 * 以及端口的可注入性（mock 实现用于测试独立可测）。
 */

function createMockFileRepository(): IFileRepository {
  return {
    getFileTree: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    formatCode: vi.fn(),
    searchFiles: vi.fn(),
    createFile: vi.fn(),
    deleteFile: vi.fn(),
    renameFile: vi.fn(),
  };
}

function createMockGitRepository(): IGitRepository {
  return {
    getStatus: vi.fn(),
    getBranches: vi.fn(),
    getDiff: vi.fn(),
    stageFiles: vi.fn(),
    commit: vi.fn(),
    checkout: vi.fn(),
  };
}

function createMockAIRepository(): IAIRepository {
  return {
    chatStream: vi.fn(),
    getCompletion: vi.fn(),
    testConnection: vi.fn(),
    getModels: vi.fn(),
  };
}

describe('DIContainer 依赖注入容器', () => {
  it('[P0] 默认提供 File/Git/AI 三个仓储实现', () => {
    expect(container.getFileRepository()).toBeInstanceOf(FileApiAdapter);
    expect(container.getGitRepository()).toBeInstanceOf(GitApiAdapter);
    expect(container.getAIRepository()).toBeInstanceOf(AIApiAdapter);
  });

  it('[P0] setFileRepository 替换实现后 getFileRepository 返回 mock', () => {
    const mock = createMockFileRepository();
    container.setFileRepository(mock);
    expect(container.getFileRepository()).toBe(mock);
  });

  it('[P0] setGitRepository 替换实现后 getGitRepository 返回 mock', () => {
    const mock = createMockGitRepository();
    container.setGitRepository(mock);
    expect(container.getGitRepository()).toBe(mock);
  });

  it('[P0] setAIRepository 替换实现后 getAIRepository 返回 mock', () => {
    const mock = createMockAIRepository();
    container.setAIRepository(mock);
    expect(container.getAIRepository()).toBe(mock);
  });

  it('[P1] 注入 mock 仓储后可独立调用（无需真实后端）', async () => {
    const mock = createMockFileRepository();
    vi.mocked(mock.readFile).mockResolvedValue({
      status: 'success',
      data: { path: '/workspace/a.ts', content: 'const a = 1', encoding: 'utf-8', size: 11 },
    });
    container.setFileRepository(mock);

    const result = await container.getFileRepository().readFile('/workspace/a.ts');
    expect(result.status).toBe('success');
    expect(result.data?.content).toBe('const a = 1');
    expect(mock.readFile).toHaveBeenCalledWith('/workspace/a.ts');
  });
});