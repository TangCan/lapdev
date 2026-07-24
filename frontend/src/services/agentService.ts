/**
 * Agent 服务层
 * 
 * 处理 Agent 模式下的文件操作，包括：
 * - 文件读取/写入
 * - 目录列表
 * - 代码搜索
 * - 操作日志管理
 * - 操作审批流程
 * 
 * 所有 API 请求都带有超时控制（30秒），确保不会无限等待。
 */

/**
 * 操作日志条目
 */
export interface OperationLogEntry {
  /** 日志唯一标识 */
  id: string;
  /** 操作类型 */
  operationType: 'read' | 'write' | 'search' | 'create' | 'delete';
  /** 操作的文件路径 */
  filePath: string;
  /** 操作结果 */
  result: 'success' | 'failed' | 'rejected' | 'pending';
  /** 操作时间戳 */
  timestamp: number;
  /** 详细信息 */
  details?: string;
}

/**
 * Agent 操作对象
 */
export interface AgentOperation {
  /** 操作唯一标识 */
  id: string;
  /** 操作类型 */
  type: 'read' | 'write' | 'create' | 'delete' | 'search';
  /** 操作的文件路径 */
  filePath: string;
  /** 写入的内容（仅 write 操作） */
  content?: string;
  /** 原始内容（用于比较） */
  originalContent?: string;
  /** 操作状态 */
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  /** 创建时间戳 */
  timestamp: number;
}

/**
 * 文件信息
 */
export interface AgentFileInfo {
  /** 文件名 */
  name: string;
  /** 文件路径 */
  path: string;
  /** 文件类型 */
  type: 'file' | 'directory';
  /** 文件大小（字节） */
  size?: number;
  /** 最后修改时间 */
  lastModified?: number;
}

/**
 * 代码搜索结果
 */
export interface AgentSearchResult {
  /** 文件路径 */
  filePath: string;
  /** 匹配行号 */
  lineNumber: number;
  /** 匹配代码片段 */
  snippet: string;
}

/** API 基础 URL */
const API_BASE_URL = '/api/v1/agent';
/** API 请求超时时间（毫秒） */
const API_TIMEOUT = 30000;

/**
 * Agent 服务类
 * 
 * 提供与后端 Agent API 交互的方法，包含完整的错误处理和超时控制。
 */
class AgentService {

  /**
   * 添加超时控制的请求方法
   * 
   * 使用 AbortController 实现超时中断，防止请求无限等待。
   * 
   * @param url 请求 URL
   * @param options 请求选项
   * @returns Promise<Response>
   * @throws 当请求超时时抛出 '请求超时' 错误
   */
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

  /**
   * 读取文件内容
   * 
   * @param filePath 文件路径
   * @returns 文件内容字符串
   * @throws 当文件路径为空或读取失败时抛出错误
   */
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

  /**
   * 列出目录内容
   * 
   * @param directoryPath 目录路径
   * @returns 文件信息数组
   * @throws 当目录路径为空或读取失败时抛出错误
   */
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

  /**
   * 搜索代码
   * 
   * 在指定目录下搜索匹配正则表达式的代码。
   * 
   * @param pattern 搜索模式（正则表达式）
   * @param directory 搜索目录（可选）
   * @returns 搜索结果数组
   * @throws 当搜索失败时抛出错误
   */
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

  /**
   * 写入文件内容
   * 
   * @param filePath 文件路径
   * @param content 文件内容
   * @returns Promise<void>
   * @throws 当文件路径或内容为空，或写入失败时抛出错误
   */
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

  /**
   * 执行操作
   * 
   * 根据操作类型执行对应的文件操作。
   * 
   * @param operation 操作对象
   * @returns 操作是否成功
   */
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

  /**
   * 生成唯一 ID
   * 
   * 使用随机数和时间戳生成唯一标识符。
   * 
   * @returns 唯一 ID 字符串
   */
  generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  /**
   * 创建操作对象
   * 
   * @param type 操作类型
   * @param filePath 文件路径
   * @param content 写入内容（可选）
   * @param originalContent 原始内容（可选）
   * @returns 操作对象
   */
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

  /**
   * 获取服务器端日志
   * 
   * 获取 Agent 操作的历史日志。
   * 
   * @returns 日志条目数组
   * @throws 当获取失败时抛出错误
   */
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

  /**
   * 清除服务器端日志
   * 
   * 清空 Agent 操作的历史日志。
   * 
   * @returns Promise<void>
   * @throws 当清除失败时抛出错误
   */
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

/** AgentService 单例实例 */
export const agentService = new AgentService();