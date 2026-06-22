import type { FileTreeResult, FileContentResult, OperationResult, CreateFileRequest, RenameRequest, DeleteRequest } from '../types/file';

const BASE_URL = '';

export async function fetchFileTree(path: string = '/workspace', depth: number = 3): Promise<FileTreeResult> {
  const response = await fetch(`${BASE_URL}/api/v1/files/tree?path=${encodeURIComponent(path)}&depth=${depth}`);
  return await response.json();
}

export async function readFile(path: string): Promise<FileContentResult> {
  const response = await fetch(`${BASE_URL}/api/v1/files/read?path=${encodeURIComponent(path)}`);
  return await response.json();
}

export async function writeFile(path: string, content: string): Promise<OperationResult> {
  const response = await fetch(`${BASE_URL}/api/v1/files/write`, {
    method: 'POST',
    body: JSON.stringify({ path, content }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}

export async function createFile(request: CreateFileRequest): Promise<OperationResult> {
  const response = await fetch(`${BASE_URL}/api/v1/files/create`, {
    method: 'POST',
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}

export async function renameFile(request: RenameRequest): Promise<OperationResult> {
  const response = await fetch(`${BASE_URL}/api/v1/files/rename`, {
    method: 'POST',
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}

export async function deleteFile(request: DeleteRequest): Promise<OperationResult> {
  const response = await fetch(`${BASE_URL}/api/v1/files/delete`, {
    method: 'DELETE',
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}

export interface FormatResult {
  status: 'success' | 'error';
  data?: {
    formatted: string;
  };
  message?: string;
}

export async function formatCode(content: string, language: string): Promise<FormatResult> {
  const response = await fetch(`${BASE_URL}/api/v1/files/format`, {
    method: 'POST',
    body: JSON.stringify({ content, language }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}

export interface LanguagesResult {
  status: 'success' | 'error';
  data?: string[];
  message?: string;
}

export async function getSupportedLanguages(): Promise<LanguagesResult> {
  const response = await fetch(`${BASE_URL}/api/v1/languages`);
  return await response.json();
}