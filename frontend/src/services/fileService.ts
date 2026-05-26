import type { FileTreeResult, FileContentResult, OperationResult, CreateFileRequest, RenameRequest, DeleteRequest } from '../types/file';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function fetchFileTree(path: string = '/', depth: number = 3): Promise<FileTreeResult> {
  const response = await fetch(`${BASE_URL}/api/v1/files/tree?path=${encodeURIComponent(path)}&depth=${depth}`);
  return await response.json();
}

export async function readFile(path: string): Promise<FileContentResult> {
  const response = await fetch(`${BASE_URL}/api/v1/files/read?path=${encodeURIComponent(path)}`);
  return await response.json();
}

export async function writeFile(path: string, content: string): Promise<OperationResult> {
  const response = await fetch(`${BASE_URL}/api/v1/files/write?path=${encodeURIComponent(path)}`, {
    method: 'POST',
    body: content,
    headers: {
      'Content-Type': 'text/plain'
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