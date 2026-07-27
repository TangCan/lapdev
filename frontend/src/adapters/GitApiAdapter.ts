import type { IGitRepository } from '../domain/ports/IGitRepository';
import type { GitOperationResult } from '../domain/Git';
import {
  fetchGitStatus,
  fetchBranches,
  fetchGitDiff,
  stageFiles as stageFilesService,
  commitChanges,
  checkoutBranch,
} from '../services/gitService';

/**
 * Git API 适配器
 * 实现 IGitRepository 端口接口，适配现有的 gitService
 */
export class GitApiAdapter implements IGitRepository {
  async getStatus(): Promise<GitOperationResult> {
    return fetchGitStatus();
  }

  async getBranches(): Promise<GitOperationResult> {
    return fetchBranches();
  }

  async getDiff(path: string): Promise<GitOperationResult> {
    return fetchGitDiff(path);
  }

  async stageFiles(paths: string[]): Promise<GitOperationResult> {
    return stageFilesService(paths);
  }

  async commit(message: string): Promise<GitOperationResult> {
    return commitChanges(message);
  }

  async checkout(branch: string): Promise<GitOperationResult> {
    return checkoutBranch(branch);
  }
}
