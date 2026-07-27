/**
 * Git 领域模型
 * 框架无关的领域实体定义
 */

export interface GitFileChange {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
  staged: boolean;
}

export interface GitStatus {
  changes: GitFileChange[];
  untracked: string[];
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote?: boolean;
}

export interface GitBranchesResult {
  branches: GitBranch[];
  current: string;
}

export interface GitDiff {
  path: string;
  diff: string;
}

export type GitOperationResult =
  | { status: 'success'; data?: GitStatus | GitBranchesResult | GitDiff | unknown }
  | { status: 'error'; message: string }
  | { status: string; data?: unknown; message?: string };
