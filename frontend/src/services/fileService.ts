import type { FileTreeResult, FileContentResult, OperationResult, CreateFileRequest, RenameRequest, DeleteRequest } from '../types/file';

const BASE_URL = '';

export async function fetchFileTree(path: string = '/workspace', depth: number = 3): Promise<FileTreeResult> {
  console.log('[fileService] fetchFileTree called, path:', path, 'depth:', depth);
  const response = await fetch(`${BASE_URL}/api/v1/files/tree?path=${encodeURIComponent(path)}&depth=${depth}`);
  const result = await response.json();
  console.log('[fileService] fetchFileTree result:', JSON.stringify(result));
  return result;
}

export async function readFile(path: string): Promise<FileContentResult> {
  console.log('[fileService] readFile called, path:', path);
  const response = await fetch(`${BASE_URL}/api/v1/files/read?path=${encodeURIComponent(path)}`);
  const result = await response.json();
  console.log('[fileService] readFile result:', JSON.stringify(result));
  return result;
}

export async function writeFile(path: string, content: string): Promise<OperationResult> {
  console.log('[fileService] writeFile called, path:', path);
  const response = await fetch(`${BASE_URL}/api/v1/files/write`, {
    method: 'POST',
    body: JSON.stringify({ path, content }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const result = await response.json();
  console.log('[fileService] writeFile result:', JSON.stringify(result));
  return result;
}

export async function createFile(request: CreateFileRequest): Promise<OperationResult> {
  console.log('[fileService] createFile called, request:', JSON.stringify(request));
  const response = await fetch(`${BASE_URL}/api/v1/files/create`, {
    method: 'POST',
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const result = await response.json();
  console.log('[fileService] createFile result:', JSON.stringify(result));
  return result;
}

export async function renameFile(request: RenameRequest): Promise<OperationResult> {
  console.log('[fileService] renameFile called, request:', JSON.stringify(request));
  const response = await fetch(`${BASE_URL}/api/v1/files/rename`, {
    method: 'POST',
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const result = await response.json();
  console.log('[fileService] renameFile result:', JSON.stringify(result));
  return result;
}

export async function deleteFile(request: DeleteRequest): Promise<OperationResult> {
  console.log('[fileService] deleteFile called, request:', JSON.stringify(request));
  const response = await fetch(`${BASE_URL}/api/v1/files/delete`, {
    method: 'DELETE',
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const result = await response.json();
  console.log('[fileService] deleteFile result:', JSON.stringify(result));
  return result;
}

export interface FormatResult {
  status: 'success' | 'error';
  data?: {
    formatted: string;
  };
  message?: string;
}

export async function formatCode(content: string, language: string): Promise<FormatResult> {
  console.log('[fileService] formatCode called, language:', language);
  const response = await fetch(`${BASE_URL}/api/v1/files/format`, {
    method: 'POST',
    body: JSON.stringify({ content, language }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const result = await response.json();
  console.log('[fileService] formatCode result:', JSON.stringify(result));
  return result;
}

export interface LanguagesResult {
  status: 'success' | 'error';
  data?: string[];
  message?: string;
}

export async function getSupportedLanguages(): Promise<LanguagesResult> {
  console.log('[fileService] getSupportedLanguages called');
  const response = await fetch(`${BASE_URL}/api/v1/languages`);
  const result = await response.json();
  console.log('[fileService] getSupportedLanguages result:', JSON.stringify(result));
  return result;
}
