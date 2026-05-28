// AI服务层 - 处理与后端AI API的通信

export interface AIModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'deepseek' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
  isActive: boolean;
}

export interface TestConnectionRequest {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface TestConnectionResponse {
  status: 'success' | 'error';
  message: string;
  latency?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  content: string;
  finishReason?: string;
}

const API_BASE_URL = '/api/v1/ai';

// 工具函数：API Key脱敏
export function maskApiKey(apiKey: string | null): string {
  if (!apiKey || apiKey.length === 0) return '';
  
  const prefix = apiKey.substring(0, 3); // 'sk-'
  const suffix = apiKey.substring(apiKey.length - 7);
  return `${prefix}***...${suffix}`;
}

class AiService {
  private models: AIModelConfig[] = [];
  private currentModelId: string | null = null;

  constructor() {
    // 从sessionStorage恢复配置（仅内存存储，刷新页面丢失）
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = sessionStorage.getItem('lapdev-ai-models');
      if (stored) {
        const data = JSON.parse(stored);
        this.models = data.models || [];
        this.currentModelId = data.currentModelId || null;
      }
    } catch {
      // 忽略解析错误
    }
  }

  private saveToStorage(): void {
    try {
      sessionStorage.setItem('lapdev-ai-models', JSON.stringify({
        models: this.models,
        currentModelId: this.currentModelId,
      }));
    } catch {
      // 忽略存储错误
    }
  }

  // 获取所有模型配置
  getModels(): AIModelConfig[] {
    return this.models;
  }

  // 获取当前活跃模型
  getCurrentModel(): AIModelConfig | null {
    return this.models.find(m => m.id === this.currentModelId) || null;
  }

  // 设置活跃模型
  setActiveModel(modelId: string): void {
    this.currentModelId = modelId;
    this.models.forEach(m => {
      m.isActive = m.id === modelId;
    });
    this.saveToStorage();
  }

  // 添加模型配置
  addModel(config: Omit<AIModelConfig, 'id' | 'isActive'>): AIModelConfig {
    const newModel: AIModelConfig = {
      ...config,
      id: this.generateId(),
      isActive: this.models.length === 0, // 第一个模型默认激活
    };
    
    if (newModel.isActive) {
      this.currentModelId = newModel.id;
    }
    
    this.models.push(newModel);
    this.saveToStorage();
    return newModel;
  }

  // 更新模型配置
  updateModel(modelId: string, updates: Partial<Omit<AIModelConfig, 'id' | 'isActive'>>): AIModelConfig | null {
    const index = this.models.findIndex(m => m.id === modelId);
    if (index === -1) return null;

    this.models[index] = { ...this.models[index], ...updates };
    this.saveToStorage();
    return this.models[index];
  }

  // 删除模型配置
  removeModel(modelId: string): boolean {
    const index = this.models.findIndex(m => m.id === modelId);
    if (index === -1) return false;

    const removed = this.models[index];
    this.models.splice(index, 1);

    // 如果删除的是当前活跃模型，选择第一个作为新的活跃模型
    if (removed.isActive && this.models.length > 0) {
      this.setActiveModel(this.models[0].id);
    } else if (this.models.length === 0) {
      this.currentModelId = null;
    }

    this.saveToStorage();
    return true;
  }

  // 生成唯一ID
  private generateId(): string {
    return crypto.randomUUID();
  }

  // 测试连接
  async testConnection(config: TestConnectionRequest): Promise<TestConnectionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      return await response.json();
    } catch (error) {
      return {
        status: 'error',
        message: '网络连接失败，请检查网络或稍后重试',
      };
    }
  }

  // 发送聊天请求
  async sendChatRequest(messages: ChatMessage[]): Promise<ChatResponse> {
    const currentModel = this.getCurrentModel();
    if (!currentModel) {
      throw new Error('请先配置AI模型');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: currentModel.id,
          messages,
        }),
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        return {
          content: result.data.content,
          finishReason: result.data.finishReason,
        };
      } else {
        throw new Error(result.error?.message || '请求失败');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '请求失败');
    }
  }

  // 获取支持的模型列表
  async getSupportedModels(): Promise<{ provider: string; name: string; model: string }[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/models`);
      const result = await response.json();
      
      if (result.status === 'success') {
        return result.data;
      }
    } catch (error) {
      console.error('Failed to fetch supported models:', error);
    }

    // 返回默认模型列表作为后备
    return [
      { provider: 'openai', name: 'GPT-4o', model: 'gpt-4o' },
      { provider: 'openai', name: 'GPT-4', model: 'gpt-4' },
      { provider: 'openai', name: 'GPT-3.5 Turbo', model: 'gpt-3.5-turbo' },
      { provider: 'deepseek', name: 'DeepSeek Chat', model: 'deepseek-chat' },
      { provider: 'deepseek', name: 'DeepSeek R1', model: 'deepseek-r1' },
    ];
  }

  // 清空所有配置（用于登出或重置）
  clearAll(): void {
    this.models = [];
    this.currentModelId = null;
    sessionStorage.removeItem('lapdev-ai-models');
  }
}

export const aiService = new AiService();