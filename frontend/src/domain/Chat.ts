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
  prefix: string;
  suffix: string;
  fileContent: string;
  language: string;
  maxTokens?: number;
}

export interface AICompletionResponse {
  completion: string;
  stopReason?: string;
  model?: string;
}

export interface AIModelInfo {
  provider: string;
  name: string;
  model: string;
}

export interface AITestConnectionRequest {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface AITestConnectionResponse {
  status: 'success' | 'error';
  message: string;
  latency?: number;
}

/**
 * 流式 SSE 事件类型
 */
export type ChatStreamEvent =
  | { type: 'content'; content: string }
  | { type: 'done' }
  | { type: 'error'; error: string };
