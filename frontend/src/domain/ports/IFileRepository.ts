import type {
  FileEntity,
  FileContent,
  FileTreeResult,
  FileReadResult,
  FileWriteResult,
  FileFormatResult,
  FileSearchResult,
} from '../File';

/**
 * 文件仓储端口接口
 * 定义文件相关的所有操作契约
 */
export interface IFileRepository {
  /** 获取文件树 */
  getFileTree(path: string): Promise<FileTreeResult>;
  /** 读取文件内容 */
  readFile(path: string): Promise<FileReadResult>;
  /** 写入文件内容 */
  writeFile(path: string, content: string): Promise<FileWriteResult>;
  /** 格式化代码 */
  formatCode(content: string, language: string): Promise<FileFormatResult>;
  /** 搜索文件 */
  searchFiles(query: string, path?: string): Promise<FileSearchResult[]>;
  /** 创建文件/目录 */
  createFile(path: string, type: 'file' | 'directory'): Promise<FileWriteResult>;
  /** 删除文件/目录 */
  deleteFile(path: string): Promise<FileWriteResult>;
  /** 重命名文件/目录 */
  renameFile(oldPath: string, newPath: string): Promise<FileWriteResult>;
}
