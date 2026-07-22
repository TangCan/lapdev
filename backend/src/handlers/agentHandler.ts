import { join, resolve } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { getWorkspacePath } from '../config/index.ts';
import { OperationLogEntry } from '../../../shared/types/agent.ts';

type SearchResult = { filePath: string; lineNumber: number; snippet: string };

function getWorkspaceResolved(): string {
  return resolve(getWorkspacePath());
}

function escapeRegex(pattern: string): string {
  return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getFullPath(relativePath: string): string | null {
  const joined = join(getWorkspacePath(), relativePath);
  const resolved = resolve(joined);
  const workspaceResolved = getWorkspaceResolved();
  if (!resolved.startsWith(workspaceResolved)) {
    return null;
  }
  return resolved;
}

const ALLOWED_EXTENSIONS = [
  'ts', 'tsx', 'js', 'jsx', 'rs', 'py', 'go', 'java', 'cpp', 'h',
  'md', 'json', 'yaml', 'yml', 'toml', 'sql', 'html', 'css'
];

function shouldSearchFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return !ext || ALLOWED_EXTENSIONS.includes(ext);
}

async function searchInFile(
  filePath: string,
  regex: RegExp,
  maxResults: number
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  try {
    const stat = await Deno.stat(filePath);
    if (stat.size > 1024 * 1024) return results;

    const content = await Deno.readTextFile(filePath);
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length && results.length < maxResults; i++) {
      regex.lastIndex = 0;
      if (regex.test(lines[i])) {
        const relativePath = filePath.replace(getWorkspaceResolved() + '/', '');
        results.push({
          filePath: relativePath,
          lineNumber: i + 1,
          snippet: lines[i].trim().slice(0, 100),
        });
      }
    }
  } catch {
    // ignore
  }
  return results;
}

export async function handleAgentReadFile(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { filePath } = body;

    const fullPath = getFullPath(filePath);
    if (!fullPath) {
      return new Response(JSON.stringify({
        status: 'error',
        error: { message: '文件路径无效或超出工作区范围' },
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const content = await Deno.readTextFile(fullPath);
      await appendLogEntry({
        operationType: 'read',
        filePath,
        result: 'success',
        details: `读取成功，大小: ${content.length} 字节`,
      });
      return new Response(JSON.stringify({
        status: 'success',
        data: { content },
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      await appendLogEntry({
        operationType: 'read',
        filePath,
        result: 'failed',
        details: '文件不存在或无法读取',
      });
      return new Response(JSON.stringify({
        status: 'error',
        error: { message: '文件不存在或无法读取' },
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch {
    return new Response(JSON.stringify({
      status: 'error',
      error: { message: '请求参数格式错误' },
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function handleAgentListFiles(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { directoryPath = '.' } = body;

    const fullPath = getFullPath(directoryPath);
    if (!fullPath) {
      return new Response(JSON.stringify({
        status: 'error',
        error: { message: '目录路径无效或超出工作区范围' },
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const entries = [];
      for await (const entry of Deno.readDir(fullPath)) {
        const entryPath = join(fullPath, entry.name);
        const stat = await Deno.stat(entryPath);
        
        entries.push({
          name: entry.name,
          path: join(directoryPath, entry.name),
          type: entry.isDirectory ? 'directory' : 'file',
          size: entry.isFile ? stat.size : undefined,
          lastModified: stat.mtime?.getTime(),
        });
      }

      return new Response(JSON.stringify({
        status: 'success',
        data: entries,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({
        status: 'error',
        error: { message: '目录不存在或无法访问' },
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch {
    return new Response(JSON.stringify({
      status: 'error',
      error: { message: '请求参数格式错误' },
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function handleAgentSearchCode(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { pattern, directory = '.' } = body;

    if (!pattern || pattern.trim() === '') {
      return new Response(JSON.stringify({
        status: 'error',
        error: { message: '搜索模式不能为空' },
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fullPath = getFullPath(directory);
    if (!fullPath) {
      return new Response(JSON.stringify({
        status: 'error',
        error: { message: '目录路径无效或超出工作区范围' },
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results: SearchResult[] = [];
    const maxResults = 100;

    try {
      const escapedPattern = escapeRegex(pattern);
      const regex = new RegExp(escapedPattern, 'g');

      for await (const entry of Deno.readDir(fullPath)) {
        if (results.length >= maxResults) break;

        const entryPath = join(fullPath, entry.name);
        
        if (entry.isDirectory) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
            continue;
          }
          const nestedResults = await searchInDirectory(entryPath, regex, maxResults - results.length);
          results.push(...nestedResults);
        } else if (shouldSearchFile(entry.name)) {
          const fileResults = await searchInFile(entryPath, regex, maxResults - results.length);
          results.push(...fileResults);
        }
      }

      await appendLogEntry({
        operationType: 'search',
        filePath: directory,
        result: 'success',
        details: `搜索 "${pattern}"，找到 ${results.length} 个结果`,
      });
      return new Response(JSON.stringify({
        status: 'success',
        data: results,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      await appendLogEntry({
        operationType: 'search',
        filePath: directory,
        result: 'failed',
        details: `搜索 "${pattern}" 失败`,
      });
      return new Response(JSON.stringify({
        status: 'error',
        error: { message: '搜索失败' },
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch {
    return new Response(JSON.stringify({
      status: 'error',
      error: { message: '请求参数格式错误' },
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function searchInDirectory(
  dirPath: string,
  regex: RegExp,
  maxResults: number
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  for await (const entry of Deno.readDir(dirPath)) {
    if (results.length >= maxResults) break;

    const entryPath = join(dirPath, entry.name);

    if (entry.isDirectory) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }
      const nestedResults = await searchInDirectory(entryPath, regex, maxResults - results.length);
      results.push(...nestedResults);
    } else if (shouldSearchFile(entry.name)) {
      const fileResults = await searchInFile(entryPath, regex, maxResults - results.length);
      results.push(...fileResults);
    }
  }

  return results;
}

export async function handleAgentWriteFile(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { filePath, content } = body;

    if (!filePath || filePath.trim() === '') {
      return new Response(JSON.stringify({
        status: 'error',
        error: { message: '文件路径不能为空' },
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (content === undefined || content === null) {
      return new Response(JSON.stringify({
        status: 'error',
        error: { message: '文件内容不能为空' },
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (typeof content === 'string' && content.length > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({
        status: 'error',
        error: { message: '文件内容超过大小限制（最大 10MB）' },
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fullPath = getFullPath(filePath);
    if (!fullPath) {
      return new Response(JSON.stringify({
        status: 'error',
        error: { message: '文件路径无效或超出工作区范围' },
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      await Deno.writeTextFile(fullPath, content);
      console.log(`[handleAgentWriteFile] File written successfully: ${filePath}, size: ${content.length} bytes`);
      await appendLogEntry({
        operationType: 'write',
        filePath,
        result: 'success',
        details: `写入成功，大小: ${content.length} 字节`,
      });
      return new Response(JSON.stringify({
        status: 'success',
        data: { filePath },
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        await appendLogEntry({
          operationType: 'write',
          filePath,
          result: 'failed',
          details: '目录不存在或无法访问',
        });
        return new Response(JSON.stringify({
          status: 'error',
          error: { message: '目录不存在或无法访问' },
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      await appendLogEntry({
        operationType: 'write',
        filePath,
        result: 'failed',
        details: '写入文件失败',
      });
      return new Response(JSON.stringify({
        status: 'error',
        error: { message: '写入文件失败' },
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch {
    return new Response(JSON.stringify({
      status: 'error',
      error: { message: '请求参数格式错误' },
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

const LOG_FILE_PATH = join(Deno.cwd(), 'logs', 'agent-operations.log');

async function ensureLogDirectory(): Promise<void> {
  const logDir = join(Deno.cwd(), 'logs');
  try {
    await Deno.mkdir(logDir, { recursive: true });
  } catch (error) {
    console.error(`[ensureLogDirectory] Failed to create log directory: ${error}`);
    throw error;
  }
}

async function appendLogEntry(entry: Omit<OperationLogEntry, 'id' | 'timestamp'>): Promise<void> {
  try {
    await ensureLogDirectory();
    
    let logs: OperationLogEntry[] = [];
    try {
      const content = await Deno.readTextFile(LOG_FILE_PATH);
      if (content.trim()) {
        logs = JSON.parse(content);
      }
    } catch {
      logs = [];
    }
    
    const newEntry: OperationLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    
    logs.unshift(newEntry);
    logs = logs.slice(0, 100);
    
    await Deno.writeTextFile(LOG_FILE_PATH, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error(`[appendLogEntry] Failed to write log: ${error}`);
  }
}

export async function handleAgentGetLogs(): Promise<Response> {
  try {
    await ensureLogDirectory();
    
    let logs: OperationLogEntry[] = [];
    
    try {
      const content = await Deno.readTextFile(LOG_FILE_PATH);
      if (content.trim()) {
        logs = JSON.parse(content);
      }
    } catch {
      logs = [];
    }
    
    return new Response(JSON.stringify({
      status: 'success',
      data: logs,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({
      status: 'error',
      error: { message: '获取日志失败' },
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function handleAgentClearLogs(): Promise<Response> {
  try {
    await ensureLogDirectory();
    
    await Deno.writeTextFile(LOG_FILE_PATH, JSON.stringify([]));
    
    return new Response(JSON.stringify({
      status: 'success',
      data: {},
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({
      status: 'error',
      error: { message: '清除日志失败' },
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
