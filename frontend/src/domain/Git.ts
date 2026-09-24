/**
 * Git 领域模型
 * 框架无关的领域实体定义
 */

export interface GitFileChange {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
  staged?: boolean;
}

export interface GitStatus {
  branch: string;
  changes: GitFileChange[];
  staged: GitFileChange[];
  untracked: string[];
}

export interface GitBranch {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
}

export interface GitBranchesResult {
  branches: GitBranch[];
  current: string;
}

export interface GitDiff {
  diff: string;
}

/**
 * 通用 Git 操作结果包装
 * @template T data 负载类型（Status/Branches/Diff），无负载的操作用 void
 */
export interface GitOperationResult<T = void> {
  status: string;
  data?: T;
  message?: string;
}
