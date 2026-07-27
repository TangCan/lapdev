/**
 * AI 领域模型
 * 框架无关的领域实体定义
 */

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatContextItem {
  type: 'file' | 'selection';
  path?: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  contexts?: ChatContextItem[];
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AIModelConfig {
  id: string;
  name: string;
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface AICompletionRequest {
  modelId: string;
  prompt: string;
  context?: ChatContextItem[];
  language?: string;
}

export interface AICompletionResponse {
  text: string;
  suggestions?: string[];
}

/**
 * 流式 SSE 事件类型
 */
export type ChatStreamEvent =
  | { type: 'content'; content: string }
  | { type: 'done' }
  | { type: 'error'; error: string };
