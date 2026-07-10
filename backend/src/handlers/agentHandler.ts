import { join, resolve } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { getWorkspacePath } from '../config/index.ts';

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
      return new Response(JSON.stringify({
        status: 'success',
        data: { content },
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
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

      return new Response(JSON.stringify({
        status: 'success',
        data: results,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
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