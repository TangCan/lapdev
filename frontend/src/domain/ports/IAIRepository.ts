import type {
  ChatMessage,
  ChatContextItem,
  ChatStreamEvent,
  AIModelConfig,
  AICompletionRequest,
  AICompletionResponse,
} from '../Chat';

/**
 * AI 仓储端口接口
 * 定义 AI 相关的所有操作契约
 */
export interface IAIRepository {
  /** 发送聊天消息（流式） */
  chatStream(
    modelId: string,
    messages: { role: string; content: string; contexts?: ChatContextItem[] }[],
    signal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array> | null>;

  /** 获取内联补全 */
  getCompletion(request: AICompletionRequest): Promise<AICompletionResponse>;

  /** 测试模型连接 */
  testConnection(config: AIModelConfig): Promise<boolean>;

  /** 获取可用模型列表 */
  getModels(): Promise<string[]>;
}
