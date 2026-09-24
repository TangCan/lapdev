import type { IAIRepository } from '../domain/ports/IAIRepository';
import type {
  AICompletionRequest,
  AICompletionResponse,
  AIModelInfo,
  AITestConnectionRequest,
  AITestConnectionResponse,
  ChatContextItem,
} from '../domain/Chat';
import { API_URL } from '../config';

/**
 * AI API 适配器
 * 实现 IAIRepository 端口接口，适配现有的 aiService
 */
export class AIApiAdapter implements IAIRepository {
  async chatStream(
    modelId: string,
    messages: { role: string; content: string; contexts?: ChatContextItem[] }[],
    signal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array> | null> {
    const response = await fetch(`${API_URL}/v1/ai/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId, messages }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.body;
  }

  async getCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
    const response = await fetch(`${API_URL}/v1/ai/completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || '补全请求失败');
    }
    return {
      completion: result.data?.completion || '',
      stopReason: result.data?.stopReason,
      model: result.data?.model,
    };
  }

  async testConnection(config: AITestConnectionRequest): Promise<AITestConnectionResponse> {
    try {
      const response = await fetch(`${API_URL}/v1/ai/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return await response.json();
    } catch {
      return { status: 'error', message: '网络连接失败，请检查网络或稍后重试' };
    }
  }

  async getModels(): Promise<AIModelInfo[]> {
    const response = await fetch(`${API_URL}/v1/ai/models`);
    const result = await response.json();
    return result.data || [];
  }
}
