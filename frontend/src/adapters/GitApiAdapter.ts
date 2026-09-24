import type { IGitRepository } from '../domain/ports/IGitRepository';
import type {
  GitStatus,
  GitBranchesResult,
  GitDiff,
  GitOperationResult,
} from '../domain/Git';
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
  async getStatus(): Promise<GitOperationResult<GitStatus>> {
    return fetchGitStatus();
  }

  async getBranches(): Promise<GitOperationResult<GitBranchesResult>> {
    return fetchBranches();
  }

  async getDiff(path: string): Promise<GitOperationResult<GitDiff>> {
    return fetchGitDiff(path);
  }

  async stageFiles(paths: string[]): Promise<GitOperationResult<void>> {
    return stageFilesService(paths);
  }

  async commit(message: string): Promise<GitOperationResult<void>> {
    return commitChanges(message);
  }

  async checkout(branch: string): Promise<GitOperationResult<void>> {
    return checkoutBranch(branch);
  }
}
