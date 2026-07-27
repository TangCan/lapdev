import type { IAIRepository } from '../domain/ports/IAIRepository';
import type {
  AIModelConfig,
  AICompletionRequest,
  AICompletionResponse,
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
    return {
      text: result.data?.text || '',
      suggestions: result.data?.suggestions,
    };
  }

  async testConnection(config: AIModelConfig): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/v1/ai/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getModels(): Promise<string[]> {
    const response = await fetch(`${API_URL}/v1/ai/models`);
    const result = await response.json();
    return result.data || [];
  }
}
