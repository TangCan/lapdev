import type {
  GitStatus,
  GitBranchesResult,
  GitDiff,
  GitOperationResult,
} from '../Git';

/**
 * Git 仓储端口接口
 * 定义 Git 相关的所有操作契约
 */
export interface IGitRepository {
  /** 获取 Git 状态 */
  getStatus(): Promise<GitOperationResult>;
  /** 获取分支列表 */
  getBranches(): Promise<GitOperationResult>;
  /** 获取文件 diff */
  getDiff(path: string): Promise<GitOperationResult>;
  /** 暂存文件 */
  stageFiles(paths: string[]): Promise<GitOperationResult>;
  /** 提交更改 */
  commit(message: string): Promise<GitOperationResult>;
  /** 切换分支 */
  checkout(branch: string): Promise<GitOperationResult>;
}
