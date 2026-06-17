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

function getWorkspacePath(): string {
  return Deno.env.get('WORKSPACE_PATH') || '/workspace';
}

// 安全检查：防止路径遍历攻击
function sanitizePath(path: string): string {
  // 移除路径遍历字符
  let sanitized = path
    .replace(/\.\./g, '')  // 移除路径遍历
    .replace(/\/\.\//g, '/')  // 移除 /./
    .replace(/^\/+/, '')  // 移除开头的 /
    .replace(/\/+$/, '');  // 移除结尾的 /
  
  // 移除所有危险字符（扩展检查）
  const dangerousChars = /[<>:"|?*\x00-\x1F;`$()!\\]/g;
  sanitized = sanitized.replace(dangerousChars, '');
  
  // 移除空格（可能导致命令问题）
  sanitized = sanitized.trim().replace(/\s+/g, '');
  
  return sanitized;
}

// 验证路径是否在工作空间内
function validatePath(path: string): boolean {
  // 首先检查原始路径是否包含路径遍历字符
  if (path.includes('..')) {
    return false;
  }
  
  // 检查危险字符（命令注入）
  const dangerousChars = /[;&|`$()!<>]/;
  if (dangerousChars.test(path)) {
    return false;
  }
  
  const sanitized = sanitizePath(path);
  if (!sanitized || sanitized.startsWith('/') || sanitized.includes('\\')) {
    return false;
  }
  return true;
}

export async function getGitStatus(): Promise<{ status: string; data?: GitStatus; message?: string }> {
  try {
    const repoPath = getWorkspacePath();
    
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
    console.error('Git status error:', error);
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

export async function getGitDiff(path: string): Promise<{ status: string; data?: { diff: string }; message?: string }> {
  try {
    // 安全检查：验证路径
    if (!validatePath(path)) {
      return { status: 'error', message: 'Invalid path' };
    }
    
    const repoPath = getWorkspacePath();
    const sanitizedPath = sanitizePath(path);

    const isGitRepo = await isGitRepository(repoPath);
    if (!isGitRepo) {
      return { status: 'error', message: 'Not a git repository' };
    }

    let diff = '';
    
    try {
      const diffOutput = await runGitCommand(['diff', '--no-color', '--', sanitizedPath], repoPath);
      diff = diffOutput.stdout || '';
    } catch {
      // 如果普通diff失败，尝试查看暂存区的diff
      try {
        const cachedOutput = await runGitCommand(['diff', '--no-color', '--cached', '--', sanitizedPath], repoPath);
        diff = cachedOutput.stdout || '';
      } catch {
        // 如果还是失败，尝试查看文件内容作为伪diff（未跟踪文件）
        try {
          const fileContent = await Deno.readTextFile(sanitizedPath);
          const fileName = sanitizedPath.split('/').pop() || path;
          diff = `diff --git a/${fileName} b/${fileName}\nnew file mode 100644\nindex 0000000..${Math.random().toString(16).substring(2, 10)}\n--- /dev/null\n+++ b/${fileName}\n@@ -0,0 +1,${fileContent.split('\n').length} @@\n${fileContent.split('\n').map((line, i) => (i === 0 ? '+' : '+ ') + line).join('\n')}`;
        } catch {
          // 所有尝试都失败
        }
      }
    }

    return {
      status: 'success',
      data: { diff }
    };
  } catch (error) {
    console.error('Git diff error:', error);
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

export async function getBranches(): Promise<{ status: string; data?: { branches: GitBranch[]; current: string }; message?: string }> {
  try {
    const repoPath = getWorkspacePath();

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
        
        // 验证分支名称
        if (cleanName && !cleanName.includes('..')) {
          branches.push({
            name: cleanName,
            isCurrent,
            isRemote
          });
        }
      }
    });

    return {
      status: 'success',
      data: { branches, current: currentBranch }
    };
  } catch (error) {
    console.error('Git branches error:', error);
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

export async function stageFiles(paths: string[]): Promise<{ status: string; message?: string }> {
  try {
    // 安全检查：验证所有路径
    const invalidPaths = paths.filter(p => !validatePath(p));
    if (invalidPaths.length > 0) {
      return { status: 'error', message: 'Invalid paths' };
    }
    
    const repoPath = getWorkspacePath();
    const sanitizedPaths = paths.map(p => sanitizePath(p));

    const isGitRepo = await isGitRepository(repoPath);
    if (!isGitRepo) {
      return { status: 'error', message: 'Not a git repository' };
    }

    await runGitCommand(['add', ...sanitizedPaths], repoPath);

    return { status: 'success' };
  } catch (error) {
    console.error('Git stage error:', error);
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

// 提交消息最大长度（Git 建议不超过 1000 字符）
const MAX_COMMIT_MESSAGE_LENGTH = 1000;

export async function commitChanges(message: string): Promise<{ status: string; message?: string }> {
  try {
    // 验证提交信息
    if (!message || message.trim().length === 0) {
      return { status: 'error', message: 'Commit message is required' };
    }
    
    // 验证提交信息长度
    if (message.length > MAX_COMMIT_MESSAGE_LENGTH) {
      return { status: 'error', message: `Commit message is too long (max ${MAX_COMMIT_MESSAGE_LENGTH} characters)` };
    }
    
    // 防止恶意提交信息
    if (message.includes(';') || message.includes('|') || message.includes('`')) {
      return { status: 'error', message: 'Invalid commit message' };
    }

    const repoPath = getWorkspacePath();

    const isGitRepo = await isGitRepository(repoPath);
    if (!isGitRepo) {
      return { status: 'error', message: 'Not a git repository' };
    }

    const result = await runGitCommand(['commit', '-m', message.trim()], repoPath);
    
    if (result.stderr && result.stderr.includes('nothing to commit')) {
      return { status: 'error', message: 'Nothing to commit' };
    }

    return { status: 'success' };
  } catch (error) {
    console.error('Git commit error:', error);
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

export async function checkoutBranch(branch: string): Promise<{ status: string; message?: string }> {
  try {
    // 验证分支名称
    if (!branch || !branch.trim()) {
      return { status: 'error', message: 'Branch name is required' };
    }
    
    // 防止分支名称中的路径遍历
    if (branch.includes('..') || branch.includes('/') || branch.includes('\\')) {
      return { status: 'error', message: 'Invalid branch name' };
    }

    const repoPath = getWorkspacePath();

    const isGitRepo = await isGitRepository(repoPath);
    if (!isGitRepo) {
      return { status: 'error', message: 'Not a git repository' };
    }

    await runGitCommand(['checkout', branch.trim()], repoPath);

    return { status: 'success' };
  } catch (error) {
    console.error('Git checkout error:', error);
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
  // 验证命令参数 - 扩展检查
  for (const arg of args) {
    if (typeof arg !== 'string') {
      throw new Error('Invalid command argument');
    }
    // 防止命令注入 - 扩展检查
    if (/[;&|`$()<>]/.test(arg) || arg.includes('&&') || arg.includes('||')) {
      throw new Error('Invalid command argument');
    }
  }

  const command = new Deno.Command('git', {
    args,
    cwd,
    stdout: 'piped',
    stderr: 'piped'
  });

  const { code, stdout, stderr } = await command.output();

  if (code !== 0) {
    const errorMessage = new TextDecoder().decode(stderr);
    throw new Error(errorMessage || 'Git command failed');
  }

  return {
    stdout: new TextDecoder().decode(stdout),
    stderr: new TextDecoder().decode(stderr)
  };
}