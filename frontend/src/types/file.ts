export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: string;
  children?: FileInfo[];
}

export interface FileTreeResult {
  status: 'success' | 'error';
  data?: FileInfo;
  message?: string;
}

export interface FileContentResult {
  status: 'success' | 'error';
  data?: {
    path: string;
    content: string;
  };
  message?: string;
}

export interface OperationResult {
  status: 'success' | 'error';
  message: string;
}

export interface CreateFileRequest {
  path: string;
  type: 'file' | 'directory';
  content?: string;
}

export interface RenameRequest {
  oldPath: string;
  newPath: string;
}

export interface DeleteRequest {
  path: string;
}