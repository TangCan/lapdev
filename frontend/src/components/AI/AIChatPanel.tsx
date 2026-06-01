import React, { useState, useRef, useEffect } from 'react';
import { useChat, ChatMessage } from '../../context/ChatContext';
import { useAI } from '../../context/AIContext';
import { parseContextReferences } from '../../utils/chatContextParser';
import './AIChatPanel.css';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isStreaming }) => {
  return (
    <div className={`message-bubble ${message.role}`}>
      <div className="message-content">
        <div className="message-text">
          {message.content}
          {isStreaming && <span className="typing-cursor">|</span>}
        </div>
        {message.contexts && message.contexts.length > 0 && (
          <div className="message-contexts">
            {message.contexts.map((ctx, index) => (
              <div key={index} className="context-tag">
                {ctx.type === 'file' ? '📄' : '✂️'}
                {ctx.path || 'selection'}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AIChatPanel: React.FC = () => {
  const {
    currentSession,
    isStreaming,
    isPanelOpen,
    sendMessage,
    abortStream,
    newSession,
    clearSession
  } = useChat();

  const { isConnected, currentModel } = useAI();

  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const MAX_INPUT_LENGTH = 10000;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_INPUT_LENGTH) {
      setInputValue(value);
    }
  };

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return;

    setError(null);

    try {
      const contexts = await parseContextReferences(inputValue);
      await sendMessage(inputValue, contexts);
      setInputValue('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发送消息失败';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInsertFile = () => {
    setInputValue(prev => prev + '@file:');
  };

  const handleInsertSelection = () => {
    setInputValue(prev => prev + '@selection');
  };

  if (!isPanelOpen) {
    return null;
  }

  return (
    <div className={`ai-chat-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Header */}
      <div className="chat-header">
        <div className="header-left">
          <span className="logo">🤖</span>
          <span className="title">AI Chat</span>
        </div>
        <div className="header-right">
          <button 
            className="header-btn" 
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '◀' : '▶'}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className={`chat-content ${isExpanded ? '' : 'hidden'}`}>
        {/* Configuration Notice */}
        {!isConnected && !currentModel && (
          <div className="config-notice">
            <div className="notice-icon">🔧</div>
            <div className="notice-content">
              <p className="notice-title">请先配置AI</p>
              <p className="notice-text">在设置中配置AI模型后即可使用聊天功能</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {isConnected && currentSession && (
          <div className="message-list">
            {currentSession.messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <p className="empty-title">开始对话</p>
                <p className="empty-text">输入消息或使用 @file:path 引用文件</p>
              </div>
            ) : (
              currentSession.messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isStreaming={isStreaming && index === currentSession.messages.length - 1 && message.role === 'assistant'}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* Loading Indicator */}
        {isStreaming && (
          <div className="streaming-indicator">
            <div className="loading-dots">
              <span>·</span>
              <span>·</span>
              <span>·</span>
            </div>
            <span className="loading-text">AI正在思考...</span>
            <button className="abort-btn" onClick={abortStream}>
              中断
            </button>
          </div>
        )}

        {/* Actions Bar */}
        {isConnected && (
          <div className="actions-bar">
            <button className="action-btn" onClick={newSession} title="New Session">
              ➕ 新会话
            </button>
            <button className="action-btn" onClick={clearSession} title="Clear Session">
              🗑️ 清空
            </button>
          </div>
        )}

        {/* Input Area */}
        {isConnected && (
          <div className="chat-input-area">
            <div className="input-helpers">
              <button className="helper-btn" onClick={handleInsertFile} title="Insert file reference">
                📄 @file:
              </button>
              <button className="helper-btn" onClick={handleInsertSelection} title="Insert selection">
                ✂️ @selection
              </button>
            </div>
            <textarea
              className="chat-input"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="输入消息... (支持 @file:path 和 @selection)"
              disabled={isStreaming}
              rows={3}
            />
            <div className="input-footer">
              <span className="char-count">{inputValue.length}/{MAX_INPUT_LENGTH}</span>
              <button
                className={`send-btn ${isStreaming ? 'disabled' : ''}`}
                onClick={handleSend}
                disabled={isStreaming || !inputValue.trim()}
              >
                {isStreaming ? '发送中...' : '发送'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChatPanel;