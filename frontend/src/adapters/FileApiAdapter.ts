import type { IFileRepository } from '../domain/ports/IFileRepository';
import type {
  FileTreeResult,
  FileReadResult,
  FileWriteResult,
  FileFormatResult,
  FileSearchResult,
} from '../domain/File';
import {
  fetchFileTree,
  readFile as readFileService,
  writeFile as writeFileService,
  formatCode as formatCodeService,
  createFile,
  renameFile,
  deleteFile,
} from '../services/fileService';

const BASE_URL = '';

/**
 * 文件 API 适配器
 * 实现 IFileRepository 端口接口，适配现有的 fileService
 */
export class FileApiAdapter implements IFileRepository {
  async getFileTree(path: string): Promise<FileTreeResult> {
    return fetchFileTree(path);
  }

  async readFile(path: string): Promise<FileReadResult> {
    const result = await readFileService(path);
    return {
      status: result.status,
      data: result.data
        ? {
            path: result.data.path,
            content: result.data.content,
            encoding: 'utf-8',
            size: result.data.size || 0,
          }
        : undefined,
      message: result.message,
    };
  }

  async writeFile(path: string, content: string): Promise<FileWriteResult> {
    return writeFileService(path, content);
  }

  async formatCode(content: string, language: string): Promise<FileFormatResult> {
    return formatCodeService(content, language);
  }

  async searchFiles(query: string, path?: string): Promise<FileSearchResult[]> {
    const response = await fetch(
      `${BASE_URL}/api/v1/files/search?q=${encodeURIComponent(query)}${path ? `&path=${encodeURIComponent(path)}` : ''}`
    );
    const result = await response.json();
    return result.data || [];
  }

  async createFile(path: string, type: 'file' | 'directory'): Promise<FileWriteResult> {
    return createFile({ path, type });
  }

  async deleteFile(path: string): Promise<FileWriteResult> {
    return deleteFile({ path });
  }

  async renameFile(oldPath: string, newPath: string): Promise<FileWriteResult> {
    return renameFile({ oldPath, newPath });
  }
}
