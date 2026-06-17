import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';

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

interface ChatContextType {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isStreaming: boolean;
  isPanelOpen: boolean;
  
  sendMessage: (content: string, contexts?: ChatContextItem[]) => Promise<void>;
  abortStream: () => void;
  newSession: () => void;
  clearSession: () => void;
  deleteSession: (sessionId: string) => void;
  switchSession: (sessionId: string) => void;
  togglePanel: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

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

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<ChatSession[]>(loadSessions);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(loadCurrentSessionId());
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // 使用ref保存currentSessionId以避免闭包问题
  const currentSessionIdRef = useRef<string | null>(currentSessionId);
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  // 计算当前会话
  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  // 当会话变化时保存到sessionStorage
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    if (currentSessionId) {
      saveCurrentSessionId(currentSessionId);
    }
  }, [currentSessionId]);

  // 创建新会话
  const newSession = useCallback(() => {
    const newSessionData: ChatSession = {
      id: generateSessionId(),
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setSessions(prev => [...prev, newSessionData]);
    setCurrentSessionId(newSessionData.id);
  }, []);

  // 清空当前会话
  const clearSession = useCallback(() => {
    if (!currentSessionId) return;

    setSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? { ...session, messages: [], updatedAt: Date.now() }
        : session
    ));
  }, [currentSessionId]);

  // 删除会话
  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
    
    if (currentSessionId === sessionId) {
      const remaining = sessions.filter(s => s.id !== sessionId);
      if (remaining.length > 0) {
        setCurrentSessionId(remaining[0].id);
      } else {
        setCurrentSessionId(null);
      }
    }
  }, [currentSessionId, sessions]);

  // 切换会话
  const switchSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, []);

  // 发送消息
  const sendMessage = useCallback(async (content: string, contexts?: ChatContextItem[]) => {
    let sessionId = currentSessionIdRef.current;

    // 如果没有会话，先创建
    if (!sessionId) {
      const newSessionData: ChatSession = {
        id: generateSessionId(),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setSessions(prev => [...prev, newSessionData]);
      sessionId = newSessionData.id;
      setCurrentSessionId(sessionId);
    }

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content,
      timestamp: Date.now(),
      contexts,
    };

    // 更新会话，添加用户消息
    setSessions(prev => prev.map(session =>
      session.id === sessionId
        ? {
            ...session,
            messages: [...session.messages, userMessage],
            updatedAt: Date.now()
          }
        : session
    ));

    // 创建AI消息（等待流式响应）
    const aiMessageId = generateMessageId();
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setSessions(prev => prev.map(session =>
      session.id === sessionId
        ? {
            ...session,
            messages: [...session.messages, aiMessage],
            updatedAt: Date.now()
          }
        : session
    ));

    setIsStreaming(true);
    
    // 创建新的AbortController
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${API_URL}/api/v1/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: 'current',
          messages: [
            { role: 'user', content, contexts }
          ],
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
          if (trimmedLine === '') continue;
          if (!trimmedLine.startsWith('data: ')) continue;

          const data = trimmedLine.slice(6);
          if (data === '') continue;

          if (data === '[DONE]') {
            break;
          }

          try {
            const event = JSON.parse(data);

            if (event.type === 'content' && typeof event.content === 'string') {
              setSessions(prev => prev.map(session =>
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
              ));
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
        // 更新AI消息为错误消息
        const errorMessage = error instanceof Error ? error.message : '发送消息失败';
        setSessions(prev => prev.map(session =>
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
        ));
      }
    } finally {
      setIsStreaming(false);
      setAbortController(null);
    }
  }, []);

  // 中断流式响应
  const abortStream = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  // 切换面板状态
  const togglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        currentSession,
        sessions,
        isStreaming,
        isPanelOpen,
        sendMessage,
        abortStream,
        newSession,
        clearSession,
        deleteSession,
        switchSession,
        togglePanel,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};