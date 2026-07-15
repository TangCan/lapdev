// Agent服务层 - 处理Agent模式下的文件操作
export interface OperationLogEntry {
  id: string;
  operationType: 'read' | 'write' | 'search' | 'create' | 'delete';
  filePath: string;
  result: 'success' | 'failed' | 'rejected' | 'pending';
  timestamp: number;
  details?: string;
}

export interface AgentOperation {
  id: string;
  type: 'read' | 'write' | 'create' | 'delete' | 'search';
  filePath: string;
  content?: string;
  originalContent?: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  timestamp: number;
}

export interface AgentFileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: number;
}

export interface AgentSearchResult {
  filePath: string;
  lineNumber: number;
  snippet: string;
}

const API_BASE_URL = '/api/v1/agent';
const API_TIMEOUT = 30000;

class AgentService {

  // 添加超时控制的请求方法
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求超时');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // 读取文件内容
  async readFile(filePath: string): Promise<string> {
    if (!filePath || filePath.trim() === '') {
      throw new Error('文件路径不能为空');
    }
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/read-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        return result.data.content;
      } else {
        throw new Error(result.error?.message || '读取文件失败');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '读取文件失败');
    }
  }

  // 列出目录内容
  async listFiles(directoryPath: string): Promise<AgentFileInfo[]> {
    if (!directoryPath || directoryPath.trim() === '') {
      throw new Error('目录路径不能为空');
    }
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/list-files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directoryPath }),
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        return result.data;
      } else {
        throw new Error(result.error?.message || '列出文件失败');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '列出文件失败');
    }
  }

  // 搜索代码
  async searchCode(pattern: string, directory?: string): Promise<AgentSearchResult[]> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/search-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern, directory }),
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        return result.data;
      } else {
        throw new Error(result.error?.message || '搜索失败');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '搜索失败');
    }
  }

  // 写入文件内容
  async writeFile(filePath: string, content: string): Promise<void> {
    if (!filePath || filePath.trim() === '') {
      throw new Error('文件路径不能为空');
    }
    if (content === undefined || content === null) {
      throw new Error('文件内容不能为空');
    }
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/write-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, content }),
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        return;
      } else {
        throw new Error(result.error?.message || '写入文件失败');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '写入文件失败');
    }
  }

  // 执行操作
  async executeOperation(operation: {
    type: AgentOperation['type'];
    filePath: string;
    content?: string;
    originalContent?: string;
  }): Promise<boolean> {
    try {
      switch (operation.type) {
        case 'write':
          if (!operation.content || operation.content.trim() === '') {
            throw new Error('文件内容不能为空');
          }
          await this.writeFile(operation.filePath, operation.content);
          return true;
        case 'read':
          await this.readFile(operation.filePath);
          return true;
        case 'search':
          await this.searchCode(operation.filePath);
          return true;
        default:
          throw new Error(`不支持的操作类型: ${operation.type}`);
      }
    } catch {
      return false;
    }
  }

  // 生成唯一ID
  generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  // 创建操作对象
  createOperation(
    type: AgentOperation['type'],
    filePath: string,
    content?: string,
    originalContent?: string
  ): AgentOperation {
    return {
      id: this.generateId(),
      type,
      filePath,
      content,
      originalContent,
      status: 'pending',
      timestamp: Date.now(),
    };
  }

  // 获取服务器端日志
  async getLogs(): Promise<OperationLogEntry[]> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/get-logs`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        return result.data;
      } else {
        throw new Error(result.error?.message || '获取日志失败');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '获取日志失败');
    }
  }

  // 清除服务器端日志
  async clearServerLogs(): Promise<void> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/clear-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.error?.message || '清除日志失败');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '清除日志失败');
    }
  }
}

export const agentService = new AgentService();
