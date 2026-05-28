// AI服务层 - 处理AI API请求和配置管理

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

export interface ChatRequest {
  modelId: string;
  messages: ChatMessage[];
}

export interface ChatResponse {
  content: string;
  finishReason?: string;
}

// AI服务常量
const AI_CONSTANTS = {
  CONNECTION_TIMEOUT_MS: 10000,
  CHAT_TIMEOUT_MS: 60000,
  MAX_TOKENS_TEST: 10,
  MAX_TOKENS_CHAT: 2048,
  TEMPERATURE: 0.7,
} as const;

export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length === 0) return '';

  const prefix = apiKey.substring(0, 3);
  const suffix = apiKey.substring(apiKey.length - 7);

  if (apiKey.length <= 8) {
    return '*'.repeat(apiKey.length);
  }

  return `${prefix}***...${suffix}`;
}

export function validateModelConfig(config: Partial<AIModelConfig>): string | null {
  if (!config.name?.trim()) {
    return '请输入模型名称';
  }

  if (!config.apiKey?.trim()) {
    return '请输入API Key';
  }

  if (!config.baseUrl?.trim()) {
    return '请输入Base URL';
  }

  try {
    new URL(config.baseUrl);
  } catch {
    return '请输入有效的URL';
  }

  if (!config.model?.trim()) {
    return '请选择模型';
  }

  return null;
}

export function generateModelId(): string {
  return crypto.randomUUID();
}

export function isOpenAICompatible(baseUrl: string): boolean {
  try {
    const url = new URL(baseUrl);
    return url.pathname.includes('/v1') ||
           url.hostname.includes('openai') ||
           url.hostname.includes('deepseek');
  } catch {
    return false;
  }
}

class AiService {
  private supportedModels = [
    { provider: 'openai', name: 'GPT-4o', model: 'gpt-4o' },
    { provider: 'openai', name: 'GPT-4', model: 'gpt-4' },
    { provider: 'openai', name: 'GPT-3.5 Turbo', model: 'gpt-3.5-turbo' },
    { provider: 'deepseek', name: 'DeepSeek Chat', model: 'deepseek-chat' },
    { provider: 'deepseek', name: 'DeepSeek R1', model: 'deepseek-r1' },
  ];

  async testConnection(request: TestConnectionRequest): Promise<TestConnectionResponse> {
    const startTime = performance.now();

    try {
      const response = await fetch(`${request.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.apiKey}`,
        },
        body: JSON.stringify({
          model: request.model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Hello' },
          ],
          max_tokens: AI_CONSTANTS.MAX_TOKENS_TEST,
        }),
        signal: AbortSignal.timeout(AI_CONSTANTS.CONNECTION_TIMEOUT_MS),
      });

      const latency = Math.round(performance.now() - startTime);

      if (response.ok) {
        const result = await response.json();

        if (result.choices && result.choices.length > 0) {
          return {
            status: 'success',
            message: '连接成功！',
            latency,
          };
        } else {
          return {
            status: 'error',
            message: 'API响应格式不正确',
            latency,
          };
        }
      } else {
        const errorMessage = `连接失败: HTTP ${response.status}`;

        return {
          status: 'error',
          message: errorMessage,
          latency,
        };
      }
    } catch (error) {
      const latency = Math.round(performance.now() - startTime);

      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          status: 'error',
          message: '请求超时，请检查网络或API配置',
          latency,
        };
      }

      return {
        status: 'error',
        message: `连接失败: ${error instanceof Error ? error.message : '未知错误'}`,
        latency,
      };
    }
  }

  async sendChatRequest(modelConfig: AIModelConfig, messages: ChatMessage[]): Promise<ChatResponse> {
    try {
      const response = await fetch(`${modelConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${modelConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: modelConfig.model,
          messages,
          max_tokens: AI_CONSTANTS.MAX_TOKENS_CHAT,
          temperature: AI_CONSTANTS.TEMPERATURE,
        }),
        signal: AbortSignal.timeout(AI_CONSTANTS.CHAT_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.error?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();

      if (result.choices && result.choices.length > 0) {
        return {
          content: result.choices[0].message?.content || '',
          finishReason: result.choices[0].finish_reason,
        };
      }

      throw new Error('API响应格式不正确');
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : '聊天请求失败'
      );
    }
  }

  getSupportedModels(): { provider: string; name: string; model: string }[] {
    return this.supportedModels;
  }

  getProviderInfo(provider: string): { name: string; baseUrl: string; models: string[] } {
    const providers: Record<string, { name: string; baseUrl: string; models: string[] }> = {
      openai: {
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        models: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'],
      },
      deepseek: {
        name: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com/v1',
        models: ['deepseek-chat', 'deepseek-r1'],
      },
      custom: {
        name: 'Custom',
        baseUrl: '',
        models: [],
      },
    };

    return providers[provider] || providers.custom;
  }
}

export const aiService = new AiService();