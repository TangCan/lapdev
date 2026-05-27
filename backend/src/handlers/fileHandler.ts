// Request and Response are built-in Deno types
import {
  getFileTree,
  readFile,
  writeFile,
  createFile,
  createDirectory,
  renameFile,
  deleteFile
} from '../services/fileService.ts';
import type { CreateFileRequest, RenameRequest, DeleteRequest } from '../types/file.ts';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export async function handleFileTree(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.searchParams.get('path') || '/';
  const depth = parseInt(url.searchParams.get('depth') || '3');

  const result = await getFileTree(path, depth);
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
    status: result.status === 'success' ? 200 : 400
  });
}

export async function handleReadFile(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.searchParams.get('path');

  if (!path) {
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Path parameter is required'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    });
  }

  const result = await readFile(path);
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
    status: result.status === 'success' ? 200 : 404
  });
}

export async function handleWriteFile(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    
    if (!body.path || !body.content) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Path and content are required'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    let content = body.content;
    if (body.isBase64) {
      content = new TextDecoder().decode(Uint8Array.from(atob(content), c => c.charCodeAt(0)));
    }
    
    const result = await writeFile(body.path, content);
    
    const isForbidden = (result as any).code === 'FORBIDDEN';
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: result.status === 'success' ? 200 : (isForbidden ? 403 : 400)
    });
  } catch (error) {
    const message = getErrorMessage(error);
    const isForbidden = (error as any).code === 'FORBIDDEN';
    
    return new Response(JSON.stringify({
      status: 'error',
      message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: isForbidden ? 403 : 500
    });
  }
}

export async function handleCreateFile(req: Request): Promise<Response> {
  try {
    const body: CreateFileRequest = await req.json();
    
    if (!body.path || !body.type) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Path and type are required'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    let result;
    if (body.type === 'directory') {
      result = await createDirectory(body.path);
    } else {
      result = await createFile(body.path, body.content);
    }
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: result.status === 'success' ? 201 : 400
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: getErrorMessage(error)
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

export async function handleRenameFile(req: Request): Promise<Response> {
  try {
    const body: RenameRequest = await req.json();
    
    if (!body.oldPath || !body.newPath) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'oldPath and newPath are required'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const result = await renameFile(body.oldPath, body.newPath);
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: result.status === 'success' ? 200 : 400
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: getErrorMessage(error)
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

export async function handleDeleteFile(req: Request): Promise<Response> {
  try {
    const body: DeleteRequest = await req.json();
    
    if (!body.path) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Path is required'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const result = await deleteFile(body.path);
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: result.status === 'success' ? 200 : 400
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: getErrorMessage(error)
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

export async function handleFormat(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    
    if (!body.content || !body.language) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Content and language are required'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    const formatted = await formatCode(body.content, body.language);
    
    return new Response(JSON.stringify({
      status: 'success',
      data: { formatted }
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    const message = getErrorMessage(error);
    const isUnsupportedLanguage = message.includes('Unsupported language');
    
    return new Response(JSON.stringify({
      status: 'error',
      message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: isUnsupportedLanguage ? 400 : 500
    });
  }
}

export async function handleGetLanguages(req: Request): Promise<Response> {
  const languages = getSupportedLanguages();
  
  return new Response(JSON.stringify({
    status: 'success',
    data: languages
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200
  });
}

async function formatCode(content: string, language: string): Promise<string> {
  const supportedLanguages = getSupportedLanguages();
  const normalizedLanguage = language.toLowerCase();
  
  if (!supportedLanguages.includes(normalizedLanguage)) {
    throw new Error(`Unsupported language: ${language}`);
  }
  
  switch (normalizedLanguage) {
    case 'javascript':
    case 'typescript':
      return formatJavaScript(content);
    case 'python':
      return formatPython(content);
    case 'rust':
      return formatRust(content);
    case 'go':
      return formatGo(content);
    default:
      return content;
  }
}

function formatJavaScript(code: string): string {
  let result = code;
  
  result = result.replace(/\{\s*([^}]*?)\s*\}/g, '{\n$1\n}');
  
  result = result.replace(/\{\s*\n\s*/g, '{\n');
  result = result.replace(/\s*\n\s*\}/g, '\n}');
  
  const lines = result.split('\n');
  const formatted: string[] = [];
  let indentLevel = 0;
  const indentStr = '  ';
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    if (line === '') {
      formatted.push('');
      continue;
    }
    
    if (line.endsWith('}')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    const indentedLine = indentStr.repeat(indentLevel) + line;
    
    if (line.endsWith('{')) {
      formatted.push(indentedLine);
      indentLevel++;
    } else if (line.endsWith('}')) {
      formatted.push(indentedLine);
    } else {
      if (!line.endsWith(';') && !line.endsWith(',') && !line.endsWith('{') && !line.endsWith('}')) {
        formatted.push(indentedLine + ';');
      } else {
        formatted.push(indentedLine);
      }
    }
  }
  
  result = formatted.join('\n');
  result = result.replace(/:\s*([a-zA-Z]+)/g, ': $1');
  result = result.replace(/([a-zA-Z]+)\s*:/g, '$1:');
  result = result.replace(/([a-zA-Z]+)\s*=\s*/g, '$1 = ');
  result = result.replace(/=\s*([a-zA-Z0-9]+)/g, '= $1');
  
  return result;
}

function formatPython(code: string): string {
  // Python formatting - ensure proper indentation
  return code;
}

function formatRust(code: string): string {
  // Rust formatting - add semicolons where needed
  return code
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && 
          !trimmed.endsWith('}') && !trimmed.startsWith('fn') && 
          !trimmed.startsWith('let') && !trimmed.startsWith('mut') &&
          !trimmed.startsWith('pub') && !trimmed.startsWith('struct') &&
          !trimmed.startsWith('enum') && !trimmed.startsWith('impl') &&
          !trimmed.startsWith('trait') && !trimmed.startsWith('if') &&
          !trimmed.startsWith('match') && !trimmed.startsWith('while') &&
          !trimmed.startsWith('for')) {
        return line.replace(/\s*$/, '') + ';';
      }
      return line;
    })
    .join('\n');
}

function formatGo(code: string): string {
  // Go formatting - keep as is for now
  return code;
}

function getSupportedLanguages(): string[] {
  return [
    'javascript',
    'typescript',
    'python',
    'rust',
    'go',
    'java',
    'cpp',
    'csharp',
    'json',
    'yaml',
    'markdown',
    'html',
    'css',
    'plaintext'
  ];
}