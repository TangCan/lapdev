const API_URL = import.meta.env.VITE_API_URL || '';

export interface GitChange {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed';
  staged?: boolean;
}

export interface GitBranch {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
}

export interface GitStatus {
  branch: string;
  changes: GitChange[];
  staged: GitChange[];
  untracked: string[];
}

export async function fetchGitStatus(): Promise<{ status: string; data?: GitStatus; message?: string }> {
  const response = await fetch(`${API_URL}/api/v1/git/status`);
  return response.json();
}

export async function fetchGitDiff(path: string): Promise<{ status: string; data?: { diff: string }; message?: string }> {
  const response = await fetch(`${API_URL}/api/v1/git/diff?path=${encodeURIComponent(path)}`);
  return response.json();
}

export async function fetchBranches(): Promise<{ status: string; data?: { branches: GitBranch[]; current: string }; message?: string }> {
  const response = await fetch(`${API_URL}/api/v1/git/branches`);
  return response.json();
}

export async function stageFiles(paths: string[]): Promise<{ status: string; message?: string }> {
  const response = await fetch(`${API_URL}/api/v1/git/stage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ paths })
  });
  return response.json();
}

export async function commitChanges(message: string): Promise<{ status: string; message?: string }> {
  const response = await fetch(`${API_URL}/api/v1/git/commit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });
  return response.json();
}

export async function checkoutBranch(branch: string): Promise<{ status: string; message?: string }> {
  const response = await fetch(`${API_URL}/api/v1/git/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ branch })
  });
  return response.json();
}
