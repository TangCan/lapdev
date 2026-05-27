// Git服务层 - 使用Deno内置Git功能
interface GitStatus {
  branch: string;
  changes: GitChange[];
  staged: GitChange[];
  untracked: string[];
}

interface GitChange {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed';
  staged?: boolean;
}

interface GitBranch {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
}

const WORKSPACE_PATH = Deno.env.get('WORKSPACE_PATH') || '/workspace';

export async function getGitStatus(): Promise<{ status: string; data?: GitStatus; message?: string }> {
  try {
    const repoPath = WORKSPACE_PATH;
    
    const isGitRepo = await isGitRepository(repoPath);
    if (!isGitRepo) {
      return { status: 'error', message: 'Not a git repository' };
    }

    const branch = await getCurrentBranch(repoPath);
    const changes = await getChanges(repoPath);
    const staged = await getStagedChanges(repoPath);
    const untracked = await getUntrackedFiles(repoPath);

    return {
      status: 'success',
      data: {
        branch,
        changes,
        staged,
        untracked
      }
    };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

export async function getGitDiff(path: string): Promise<{ status: string; data?: { diff: string }; message?: string }> {
  try {
    const repoPath = WORKSPACE_PATH;
    const fullPath = `${repoPath}${path}`;

    const isGitRepo = await isGitRepository(repoPath);
    if (!isGitRepo) {
      return { status: 'error', message: 'Not a git repository' };
    }

    const diffOutput = await runGitCommand(['diff', '--no-color', '--', path], repoPath);
    const diff = diffOutput.stdout || '';

    return {
      status: 'success',
      data: { diff }
    };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

export async function getBranches(): Promise<{ status: string; data?: { branches: GitBranch[]; current: string }; message?: string }> {
  try {
    const repoPath = WORKSPACE_PATH;

    const isGitRepo = await isGitRepository(repoPath);
    if (!isGitRepo) {
      return { status: 'error', message: 'Not a git repository' };
    }

    const currentBranch = await getCurrentBranch(repoPath);
    const branchOutput = await runGitCommand(['branch', '-a'], repoPath);
    const branches: GitBranch[] = [];

    branchOutput.stdout.split('\n').forEach(line => {
      line = line.trim();
      if (line) {
        const isCurrent = line.startsWith('*');
        const branchName = isCurrent ? line.slice(2) : line;
        const isRemote = branchName.includes('remotes/');
        
        const cleanName = isRemote ? branchName.replace('remotes/origin/', '') : branchName;
        
        branches.push({
          name: cleanName,
          isCurrent,
          isRemote
        });
      }
    });

    return {
      status: 'success',
      data: { branches, current: currentBranch }
    };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

export async function stageFiles(paths: string[]): Promise<{ status: string; message?: string }> {
  try {
    const repoPath = WORKSPACE_PATH;

    const isGitRepo = await isGitRepository(repoPath);
    if (!isGitRepo) {
      return { status: 'error', message: 'Not a git repository' };
    }

    await runGitCommand(['add', ...paths], repoPath);

    return { status: 'success' };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

export async function commitChanges(message: string): Promise<{ status: string; message?: string }> {
  try {
    const repoPath = WORKSPACE_PATH;

    const isGitRepo = await isGitRepository(repoPath);
    if (!isGitRepo) {
      return { status: 'error', message: 'Not a git repository' };
    }

    const result = await runGitCommand(['commit', '-m', message], repoPath);
    
    if (result.stderr && result.stderr.includes('nothing to commit')) {
      return { status: 'error', message: 'Nothing to commit' };
    }

    return { status: 'success' };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

export async function checkoutBranch(branch: string): Promise<{ status: string; message?: string }> {
  try {
    const repoPath = WORKSPACE_PATH;

    const isGitRepo = await isGitRepository(repoPath);
    if (!isGitRepo) {
      return { status: 'error', message: 'Not a git repository' };
    }

    await runGitCommand(['checkout', branch], repoPath);

    return { status: 'success' };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

async function isGitRepository(path: string): Promise<boolean> {
  try {
    const gitDir = `${path}/.git`;
    const stat = await Deno.stat(gitDir);
    return stat.isDirectory;
  } catch {
    return false;
  }
}

async function getCurrentBranch(path: string): Promise<string> {
  const result = await runGitCommand(['rev-parse', '--abbrev-ref', 'HEAD'], path);
  return result.stdout.trim();
}

async function getChanges(path: string): Promise<GitChange[]> {
  const result = await runGitCommand(['diff', '--name-status'], path);
  const changes: GitChange[] = [];

  result.stdout.split('\n').forEach(line => {
    line = line.trim();
    if (line) {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        const statusCode = parts[0];
        const filePath = parts[1];
        
        let status: GitChange['status'] = 'modified';
        if (statusCode === 'A') status = 'added';
        else if (statusCode === 'D') status = 'deleted';
        else if (statusCode === 'R') status = 'renamed';
        
        changes.push({ path: filePath, status });
      }
    }
  });

  return changes;
}

async function getStagedChanges(path: string): Promise<GitChange[]> {
  const result = await runGitCommand(['diff', '--cached', '--name-status'], path);
  const changes: GitChange[] = [];

  result.stdout.split('\n').forEach(line => {
    line = line.trim();
    if (line) {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        const statusCode = parts[0];
        const filePath = parts[1];
        
        let status: GitChange['status'] = 'modified';
        if (statusCode === 'A') status = 'added';
        else if (statusCode === 'D') status = 'deleted';
        else if (statusCode === 'R') status = 'renamed';
        
        changes.push({ path: filePath, status, staged: true });
      }
    }
  });

  return changes;
}

async function getUntrackedFiles(path: string): Promise<string[]> {
  const result = await runGitCommand(['ls-files', '--others', '--exclude-standard'], path);
  return result.stdout.split('\n').filter(line => line.trim());
}

async function runGitCommand(args: string[], cwd: string): Promise<{ stdout: string; stderr: string }> {
  const process = await Deno.run({
    cmd: ['git', ...args],
    cwd,
    stdout: 'piped',
    stderr: 'piped'
  });

  const [stdout, stderr] = await Promise.all([
    process.output(),
    process.stderrOutput()
  ]);

  const status = await process.status();
  if (!status.success) {
    const errorMessage = new TextDecoder().decode(stderr);
    throw new Error(errorMessage || 'Git command failed');
  }

  return {
    stdout: new TextDecoder().decode(stdout),
    stderr: new TextDecoder().decode(stderr)
  };
}
