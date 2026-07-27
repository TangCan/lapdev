import { create } from 'zustand';
import { API_URL } from '../config';

export interface ChatContextItem {
  type: 'file' | 'selection';
  path?: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
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

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isStreaming: boolean;
  isPanelOpen: boolean;
  sendMessage: (content: string, contexts?: ChatContextItem[]) => Promise<void>;
  abortStream: () => void;
  newSession: () => void;
  clearSession: () => void;
  deleteSession: (sessionId: string) => void;
  switchSession: (sessionId: string) => void;
  togglePanel: () => void;
  initFromStorage: () => void;
}

const STORAGE_KEY_SESSIONS = 'lapdev-chat-sessions';
const STORAGE_KEY_CURRENT = 'lapdev-chat-current-session';

function loadSessions(): ChatSession[] {
  try {
    const data = sessionStorage.getItem(STORAGE_KEY_SESSIONS);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    console.error('Failed to load chat sessions from sessionStorage');
  }
  return [];
}

function saveSessions(sessions: ChatSession[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  } catch {
    console.error('Failed to save chat sessions to sessionStorage');
  }
}

function loadCurrentSessionId(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY_CURRENT) || null;
  } catch {
    return null;
  }
}

function saveCurrentSessionId(sessionId: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY_CURRENT, sessionId);
  } catch {
    console.error('Failed to save current session id');
  }
}

function generateSessionId(): string {
  return crypto.randomUUID();
}

function generateMessageId(): string {
  return crypto.randomUUID();
}

// 全局 AbortController（在 store 外部管理）
let abortController: AbortController | null = null;

/**
 * 获取当前会话（选择器函数）
 */
export function selectCurrentSession(state: ChatState): ChatSession | null {
  return state.sessions.find(s => s.id === state.currentSessionId) || null;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: loadSessions(),
  currentSessionId: loadCurrentSessionId(),
  isStreaming: false,
  isPanelOpen: false,

  initFromStorage: () => {
    set({
      sessions: loadSessions(),
      currentSessionId: loadCurrentSessionId(),
    });
  },

  newSession: () => {
    const newSessionData: ChatSession = {
      id: generateSessionId(),
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => {
      const sessions = [...state.sessions, newSessionData];
      saveSessions(sessions);
      saveCurrentSessionId(newSessionData.id);
      return { sessions, currentSessionId: newSessionData.id };
    });
  },

  clearSession: () => {
    const { currentSessionId } = get();
    if (!currentSessionId) return;

    set((state) => {
      const sessions = state.sessions.map(session =>
        session.id === currentSessionId
          ? { ...session, messages: [], updatedAt: Date.now() }
          : session
      );
      saveSessions(sessions);
      return { sessions };
    });
  },

  deleteSession: (sessionId: string) => {
    set((state) => {
      const sessions = state.sessions.filter(session => session.id !== sessionId);
      saveSessions(sessions);

      let currentSessionId = state.currentSessionId;
      if (currentSessionId === sessionId) {
        const remaining = state.sessions.filter(s => s.id !== sessionId);
        currentSessionId = remaining.length > 0 ? remaining[0].id : null;
        if (currentSessionId) {
          saveCurrentSessionId(currentSessionId);
        }
      }
      return { sessions, currentSessionId };
    });
  },

  switchSession: (sessionId: string) => {
    saveCurrentSessionId(sessionId);
    set({ currentSessionId: sessionId });
  },

  togglePanel: () => {
    set((state) => ({ isPanelOpen: !state.isPanelOpen }));
  },

  abortStream: () => {
    if (abortController) {
      abortController.abort();
    }
  },

  sendMessage: async (content: string, contexts?: ChatContextItem[]) => {
    let sessionId = get().currentSessionId;

    if (!sessionId) {
      const newSessionData: ChatSession = {
        id: generateSessionId(),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      set((state) => {
        const sessions = [...state.sessions, newSessionData];
        saveSessions(sessions);
        saveCurrentSessionId(newSessionData.id);
        return { sessions, currentSessionId: newSessionData.id };
      });
      sessionId = newSessionData.id;
    }

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content,
      timestamp: Date.now(),
      contexts,
    };

    set((state) => {
      const sessions = state.sessions.map(session =>
        session.id === sessionId
          ? { ...session, messages: [...session.messages, userMessage], updatedAt: Date.now() }
          : session
      );
      saveSessions(sessions);
      return { sessions };
    });

    const aiMessageId = generateMessageId();
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    set((state) => {
      const sessions = state.sessions.map(session =>
        session.id === sessionId
          ? { ...session, messages: [...session.messages, aiMessage], updatedAt: Date.now() }
          : session
      );
      saveSessions(sessions);
      return { sessions };
    });

    set({ isStreaming: true });

    const controller = new AbortController();
    abortController = controller;

    try {
      const response = await fetch(`${API_URL}/v1/ai/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: 'current',
          messages: [{ role: 'user', content, contexts }],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine === '' || !trimmedLine.startsWith('data: ')) continue;

          const data = trimmedLine.slice(6);
          if (data === '' || data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);

            if (event.type === 'content' && typeof event.content === 'string') {
              set((state) => {
                const sessions = state.sessions.map(session =>
                  session.id === sessionId
                    ? {
                        ...session,
                        messages: session.messages.map(msg =>
                          msg.id === aiMessageId
                            ? { ...msg, content: msg.content + event.content }
                            : msg
                        ),
                        updatedAt: Date.now(),
                      }
                    : session
                );
                saveSessions(sessions);
                return { sessions };
              });
            } else if (event.type === 'done') {
              break;
            } else if (event.type === 'error') {
              throw new Error(event.error || 'Unknown error');
            }
          } catch (e) {
            if (e instanceof SyntaxError) {
              continue;
            }
            console.error('Failed to parse SSE event:', e);
          }
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Stream aborted');
      } else {
        console.error('Stream error:', error);
        const errorMessage = error instanceof Error ? error.message : '发送消息失败';
        set((state) => {
          const sessions = state.sessions.map(session =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: session.messages.map(msg =>
                    msg.id === aiMessageId
                      ? { ...msg, content: `❌ ${errorMessage}` }
                      : msg
                  ),
                  updatedAt: Date.now(),
                }
              : session
          );
          saveSessions(sessions);
          return { sessions };
        });
      }
    } finally {
      set({ isStreaming: false });
      abortController = null;
    }
  },
}));
