import type { IFileRepository } from '../domain/ports/IFileRepository';
import type { IGitRepository } from '../domain/ports/IGitRepository';
import type { IAIRepository } from '../domain/ports/IAIRepository';
import { FileApiAdapter } from './FileApiAdapter';
import { GitApiAdapter } from './GitApiAdapter';
import { AIApiAdapter } from './AIApiAdapter';

/**
 * 依赖注入容器
 * 统一管理端口与适配器的绑定
 *
 * 使用示例：
 * ```typescript
 * const fileRepo = container.getFileRepository();
 * const result = await fileRepo.readFile('/workspace/test.ts');
 * ```
 */
class DIContainer {
  private fileRepository: IFileRepository;
  private gitRepository: IGitRepository;
  private aiRepository: IAIRepository;

  constructor() {
    this.fileRepository = new FileApiAdapter();
    this.gitRepository = new GitApiAdapter();
    this.aiRepository = new AIApiAdapter();
  }

  getFileRepository(): IFileRepository {
    return this.fileRepository;
  }

  getGitRepository(): IGitRepository {
    return this.gitRepository;
  }

  getAIRepository(): IAIRepository {
    return this.aiRepository;
  }

  /** 替换文件仓储实现（用于测试） */
  setFileRepository(repo: IFileRepository): void {
    this.fileRepository = repo;
  }

  /** 替换 Git 仓储实现（用于测试） */
  setGitRepository(repo: IGitRepository): void {
    this.gitRepository = repo;
  }

  /** 替换 AI 仓储实现（用于测试） */
  setAIRepository(repo: IAIRepository): void {
    this.aiRepository = repo;
  }
}

/** 全局 DI 容器实例 */
export const container = new DIContainer();
