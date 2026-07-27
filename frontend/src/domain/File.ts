/**
 * 文件领域模型
 * 框架无关的领域实体定义
 */

export type FileType = 'file' | 'directory';

export interface FileEntity {
  name: string;
  path: string;
  type: FileType;
  children?: FileEntity[];
}

export interface FileContent {
  path: string;
  content: string;
  encoding: string;
  size: number;
}

export interface FileTreeResult {
  status: 'success' | 'error';
  data?: FileEntity;
  message?: string;
}

export interface FileReadResult {
  status: 'success' | 'error';
  data?: FileContent;
  message?: string;
}

export interface FileWriteResult {
  status: 'success' | 'error';
  message?: string;
}

export interface FileFormatResult {
  status: 'success' | 'error';
  data?: { formatted: string };
  message?: string;
}

/**
 * 文件搜索结果
 */
export interface FileSearchResult {
  path: string;
  name: string;
  type: FileType;
  matchType: 'name' | 'content';
  line?: number;
  preview?: string;
}
