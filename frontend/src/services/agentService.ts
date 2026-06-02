// Agent服务层 - 处理Agent模式下的文件操作

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

export interface OperationLogEntry {
  id: string;
  operationType: 'read' | 'write' | 'create' | 'delete' | 'search';
  filePath: string;
  timestamp: number;
  result: 'success' | 'failed' | 'rejected' | 'pending';
  details?: string;
}

const API_BASE_URL = '/api/v1/agent';
const API_TIMEOUT = 30000; // 30秒超时

// 路径验证正则：防止路径遍历攻击
const PATH_TRAVERSAL_PATTERN = /\.\.[\/\\]/;
const VALID_PATH_PATTERN = /^[a-zA-Z0-9_\-\.\/\\]+$/;

class AgentService {
  // 验证文件路径安全性
  private validateFilePath(filePath: string): void {
    if (!filePath || filePath.trim() === '') {
      throw new Error('文件路径不能为空');
    }
    if (PATH_TRAVERSAL_PATTERN.test(filePath)) {
      throw new Error('文件路径包含非法的路径遍历字符');
    }
    if (!VALID_PATH_PATTERN.test(filePath)) {
      throw new Error('文件路径包含非法字符');
    }
  }

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
    this.validateFilePath(filePath);
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
    this.validateFilePath(directoryPath);
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
    if (directory) {
      this.validateFilePath(directory);
    }
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

  // 执行文件操作
  async executeOperation(operation: Omit<AgentOperation, 'id' | 'status' | 'timestamp'>): Promise<boolean> {
    this.validateFilePath(operation.filePath);
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/execute-operation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation),
      });

      const result = await response.json();
      
      return result.status === 'success';
    } catch (error) {
      console.error('Execute operation error:', error);
      return false;
    }
  }

  // 生成唯一ID
  generateId(): string {
    return crypto.randomUUID();
  }

  // 创建操作对象
  createOperation(
    type: AgentOperation['type'],
    filePath: string,
    content?: string,
    originalContent?: string
  ): AgentOperation {
    this.validateFilePath(filePath);
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
}

export const agentService = new AgentService();