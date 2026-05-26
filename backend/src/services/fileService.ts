import { FileInfo, FileTreeResult, FileContentResult, OperationResult } from '../types/file.ts';

const WORKSPACE_DIR = Deno.env.get('WORKSPACE_DIR') || '/workspace';
const MAX_DEPTH = 20;

/**
 * Validates that the path is within the allowed workspace directory
 * Uses canonicalization to prevent path traversal attacks
 */
function sanitizePath(path: string): string {
  const normalized = path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/$/, '');
  
  // Check for path traversal attempts in original path
  if (normalized.includes('..')) {
    throw new Error('invalid path traversal attempt');
  }
  
  let resolved: string;
  
  // If path is /workspace, map directly to workspace directory
  if (normalized === '/workspace') {
    resolved = WORKSPACE_DIR;
  }
  // If path starts with /workspace/, treat it as relative to workspace root
  else if (normalized.startsWith('/workspace/')) {
    resolved = WORKSPACE_DIR + normalized.substring('/workspace'.length);
  }
  // If path starts with /workspace (exact match handled above)
  else if (normalized === '/') {
    throw new Error('Invalid path: root access denied');
  }
  // Reject absolute paths that bypass workspace
  else if (normalized.startsWith('/')) {
    throw new Error('Invalid path: absolute path not allowed');
  } else {
    // Build absolute path within workspace
    try {
      resolved = new URL(normalized, `file://${WORKSPACE_DIR}/`).pathname;
    } catch {
      throw new Error('Invalid path format');
    }
  }
  
  // Normalize path
  resolved = resolved.replace(/\/+/g, '/').replace(/\/$/, '');
  
  // Verify path is within workspace
  if (!resolved.startsWith(WORKSPACE_DIR + '/') && resolved !== WORKSPACE_DIR) {
    throw new Error('Access denied: Path outside workspace');
  }
  
  return resolved;
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Safely checks if a file should be ignored based on .gitignore patterns
 * Prevents regex injection by escaping special characters
 */
function isIgnored(name: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    // Exact match
    if (name === pattern) {
      return true;
    }
    
    // Glob pattern matching (only support * for now)
    if (pattern.includes('*')) {
      try {
        // Escape all regex special chars except *
        const safePattern = escapeRegex(pattern).replace(/\\\*/g, '.*');
        const regex = new RegExp(`^${safePattern}$`);
        if (regex.test(name)) {
          return true;
        }
      } catch {
        // Invalid regex, skip this pattern
        continue;
      }
    }
  }
  return false;
}

export async function getFileTree(path: string, depth: number = 3): Promise<FileTreeResult> {
  try {
    const sanitizedPath = sanitizePath(path);
    
    if (!await exists(sanitizedPath)) {
      return {
        status: 'error',
        message: 'Path does not exist'
      };
    }
    
    const safeDepth = Math.min(Math.max(0, depth), MAX_DEPTH);
    const info = await readDirRecursive(sanitizedPath, safeDepth, WORKSPACE_DIR);
    
    return {
      status: 'success',
      data: info
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Converts absolute path to workspace-relative path
 */
function toWorkspacePath(absolutePath: string): string {
  if (absolutePath === WORKSPACE_DIR) {
    return '/workspace';
  } else if (absolutePath.startsWith(WORKSPACE_DIR + '/')) {
    return '/workspace' + absolutePath.substring(WORKSPACE_DIR.length);
  }
  return absolutePath;
}

async function readDirRecursive(
  path: string,
  depth: number,
  rootPath: string
): Promise<FileInfo> {
  // Prevent excessive recursion
  if (depth <= 0) {
    return {
      name: path.split('/').pop() || '/',
      path: toWorkspacePath(path),
      type: 'directory',
      children: []
    };
  }
  
  const stat = await Deno.stat(path);
  
  if (stat.isDirectory) {
    const entries: FileInfo[] = [];
    const ignorePatterns = await parseGitignore(path);
    
    for await (const entry of Deno.readDir(path)) {
      const entryPath = `${path}/${entry.name}`;
      
      // Skip hidden files (except . and ..)
      if (entry.name.startsWith('.') && entry.name !== '.' && entry.name !== '..') {
        continue;
      }
      
      if (isIgnored(entry.name, ignorePatterns)) {
        continue;
      }
      
      const childInfo = await readDirRecursive(entryPath, depth - 1, rootPath);
      entries.push(childInfo);
    }
    
    entries.sort((a, b) => {
      const aIsDir = a.type === 'directory';
      const bIsDir = b.type === 'directory';
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.name.localeCompare(b.name);
    });
    
    return {
      name: path.split('/').pop() || '/',
      path: toWorkspacePath(path),
      type: 'directory',
      children: entries
    };
  } else {
    return {
      name: path.split('/').pop() || '',
      path: toWorkspacePath(path),
      type: 'file',
      size: stat.size,
      lastModified: stat.mtime?.toISOString()
    };
  }
}

async function parseGitignore(dirPath: string): Promise<string[]> {
  const gitignorePath = `${dirPath}/.gitignore`;
  try {
    const content = await Deno.readTextFile(gitignorePath);
    return content.split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('#'));
  } catch {
    return [];
  }
}

export async function readFile(path: string): Promise<FileContentResult> {
  try {
    const sanitizedPath = sanitizePath(path);
    const content = await Deno.readTextFile(sanitizedPath);
    
    return {
      status: 'success',
      data: {
        path: toWorkspacePath(sanitizedPath),
        content
      }
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function writeFile(path: string, content: string): Promise<OperationResult> {
  try {
    const sanitizedPath = sanitizePath(path);
    
    const dirPath = sanitizedPath.substring(0, sanitizedPath.lastIndexOf('/'));
    await Deno.mkdir(dirPath, { recursive: true });
    
    await Deno.writeTextFile(sanitizedPath, content);
    
    return {
      status: 'success',
      message: 'File written successfully'
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function createFile(path: string, content?: string): Promise<OperationResult> {
  try {
    const sanitizedPath = sanitizePath(path);
    
    if (await exists(sanitizedPath)) {
      return {
        status: 'error',
        message: 'File already exists'
      };
    }
    
    const dirPath = sanitizedPath.substring(0, sanitizedPath.lastIndexOf('/'));
    await Deno.mkdir(dirPath, { recursive: true });
    
    await Deno.writeTextFile(sanitizedPath, content || '');
    
    return {
      status: 'success',
      message: 'File created successfully'
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function createDirectory(path: string): Promise<OperationResult> {
  try {
    const sanitizedPath = sanitizePath(path);
    
    await Deno.mkdir(sanitizedPath, { recursive: true });
    
    return {
      status: 'success',
      message: 'Directory created successfully'
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function renameFile(oldPath: string, newPath: string): Promise<OperationResult> {
  try {
    const sanitizedOldPath = sanitizePath(oldPath);
    const sanitizedNewPath = sanitizePath(newPath);
    
    if (!await exists(sanitizedOldPath)) {
      return {
        status: 'error',
        message: 'Source file does not exist'
      };
    }
    
    await Deno.rename(sanitizedOldPath, sanitizedNewPath);
    
    return {
      status: 'success',
      message: 'File renamed successfully'
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function deleteFile(path: string): Promise<OperationResult> {
  try {
    const sanitizedPath = sanitizePath(path);
    
    if (!await exists(sanitizedPath)) {
      return {
        status: 'error',
        message: 'Path does not exist'
      };
    }
    
    const stat = await Deno.stat(sanitizedPath);
    
    if (stat.isDirectory) {
      await Deno.remove(sanitizedPath, { recursive: true });
      return {
        status: 'success',
        message: 'Directory deleted successfully'
      };
    } else {
      await Deno.remove(sanitizedPath);
      return {
        status: 'success',
        message: 'File deleted successfully'
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}