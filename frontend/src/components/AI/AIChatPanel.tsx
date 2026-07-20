import React, { useState, useRef, useEffect } from 'react';
import { useChat, ChatMessage } from '../../context/ChatContext';
import { useAI } from '../../context/AIContext';
import { useSkill } from '../../context/SkillContext';
import { useSkillMatch } from '../../hooks/useSkillMatch';
import { AgentModeToggle } from './AgentModeToggle';
import { parseContextReferences } from '../../utils/chatContextParser';
import { SkillPanel } from '../SkillPanel/SkillPanel';
import { useAgent } from '../../context/AgentContext';
import { agentService, AgentOperation } from '../../services/agentService';
import OperationConfirmation from './OperationConfirmation';
import { OperationLog } from './OperationLog';
import './AIChatPanel.css';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isStreaming }) => {
  return (
    <div className={`message-bubble ${message.role}`} data-testid="ai-message" data-role={message.role}>
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
    clearSession,
    togglePanel
  } = useChat();

  const { isConnected, currentModel } = useAI();
  const { activeSkills } = useSkill();
  const { matchAndActivate } = useSkillMatch();

  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showActivationNotification, setShowActivationNotification] = useState(false);
  const [activatedSkills, setActivatedSkills] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ filePath: string; lineNumber: number; snippet: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAgentWarning, setShowAgentWarning] = useState(false);
  const [showOperationConfirmation, setShowOperationConfirmation] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<AgentOperation[]>([]);
  const [operationMessage, setOperationMessage] = useState<string | null>(null);
  const [showOperationLog, setShowOperationLog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isAgentMode, addLogEntry, addOperation } = useAgent();

  const MAX_INPUT_LENGTH = 10000;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return;

    setError(null);

    if (inputValue.length > MAX_INPUT_LENGTH) {
      setError(`输入超过最大长度限制 (${MAX_INPUT_LENGTH} 字符)`);
      setTimeout(() => setError(null), 5000);
      return;
    }

    if (!isAgentMode && inputValue.toLowerCase().includes('read') && inputValue.toLowerCase().includes('file')) {
      setShowAgentWarning(true);
      setTimeout(() => setShowAgentWarning(false), 3000);
      return;
    }

    const fileContexts: Array<{ type: 'file'; path: string; content: string }> = [];

    if (isAgentMode) {
      try {
        const activeEditor = document.querySelector('[data-testid="code-editor"]');
        if (activeEditor) {
          const fileTabs = document.querySelectorAll('[data-testid^="file-tab-item-"]');
          fileTabs.forEach(tab => {
            const tabTitle = tab.textContent?.trim();
            if (tabTitle && tabTitle !== '+' && tab.classList.contains('active')) {
              fileContexts.push({ type: 'file', path: tabTitle, content: '' });
            }
          });
        }

        for (const ctx of fileContexts) {
          try {
            const content = await agentService.readFile(ctx.path);
            ctx.content = content;
            addLogEntry({
              operationType: 'read',
              filePath: ctx.path,
              result: 'success',
              details: '读取文件成功',
            });
          } catch {
            addLogEntry({
              operationType: 'read',
              filePath: ctx.path,
              result: 'failed',
              details: '读取文件失败',
            });
          }
        }
      } catch (err) {
        console.warn('Agent file reading error:', err);
      }
    }

    try {
      const matchingSkills = matchAndActivate({ text: inputValue });
      const matchedSkillIds = matchingSkills.map(s => s.id).filter(Boolean) as string[];
      
      if (matchedSkillIds.length > 0) {
        setActivatedSkills(matchedSkillIds);
        setShowActivationNotification(true);
        setTimeout(() => setShowActivationNotification(false), 5000);
      }
    } catch (err) {
      console.warn('Skill matching error:', err);
    }

    try {
      const contexts = await parseContextReferences(inputValue);
      contexts.push(...fileContexts);
      await sendMessage(inputValue, contexts);
      setInputValue('');

      if (isAgentMode && (inputValue.toLowerCase().includes('modify') || 
          inputValue.toLowerCase().includes('write') || 
          inputValue.toLowerCase().includes('update') ||
          inputValue.toLowerCase().includes('change'))) {
        const mockOperation: AgentOperation = {
          id: agentService.generateId(),
          type: 'write',
          filePath: 'test-file.ts',
          content: 'export const modifiedValue = "modified by agent";',
          originalContent: 'export const originalValue = "original";',
          status: 'pending',
          timestamp: Date.now(),
        };
        addOperation({
          type: mockOperation.type,
          filePath: mockOperation.filePath,
          content: mockOperation.content,
          originalContent: mockOperation.originalContent,
        });
        setPendingOperations([mockOperation]);
        setShowOperationConfirmation(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发送消息失败';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleOperationClose = () => {
    setShowOperationConfirmation(false);
    setOperationMessage(null);
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

  const handleSearch = async () => {
    if (!searchQuery.trim() || !isAgentMode) return;

    setIsSearching(true);
    setShowAgentWarning(false);

    try {
      const results = await agentService.searchCode(searchQuery);
      setSearchResults(results);
      addLogEntry({
        operationType: 'search',
        filePath: searchQuery,
        result: 'success',
        details: `搜索到 ${results.length} 个匹配项`,
      });
    } catch (err) {
      console.error('Search error:', err);
      addLogEntry({
        operationType: 'search',
        filePath: searchQuery,
        result: 'failed',
        details: '搜索失败',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleClearConfirm = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmClear = () => {
    clearSession();
    setShowConfirmDialog(false);
  };

  const handleCancelClear = () => {
    setShowConfirmDialog(false);
  };

  if (!isPanelOpen) {
    return null;
  }

  return (
    <div className={`ai-chat-panel ${isExpanded ? 'expanded' : 'collapsed'}`} data-testid="ai-chat-panel">
      {/* Header */}
      <div className="chat-header" data-testid="ai-chat-header">
        <div className="header-left">
          <span className="logo">🤖</span>
          <span className="title">AI Chat</span>
        </div>
        <div className="header-right">
          <AgentModeToggle />
          <button
            className="header-btn"
            onClick={togglePanel}
            title="Close"
            data-testid="ai-close-panel"
          >
            ✕
          </button>
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
          <div className="config-notice" data-testid="ai-guidance">
            <div className="notice-icon">🔧</div>
            <div className="notice-content">
              <p className="notice-title">请先配置AI</p>
              <p className="notice-text">在设置中配置AI模型后即可使用聊天功能</p>
            </div>
          </div>
        )}

        {/* Agent Mode Warning */}
        {showAgentWarning && (
          <div className="agent-mode-warning" data-testid="agent-mode-warning">
            ⚠️ 请先开启Agent模式才能读取文件
          </div>
        )}

        {/* Skill Activation Notification */}
        {showActivationNotification && (
          <div className="skill-activation-notification" data-testid="skill-activation-notification">
            💡 已自动激活 {activatedSkills.length} 个Skill: {activatedSkills.join(', ')}
          </div>
        )}

        {/* Agent Search Bar */}
        {isAgentMode && (
          <div className="agent-search-bar">
            <input
              type="text"
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="搜索代码..."
              disabled={isSearching}
              data-testid="agent-search-input"
            />
            <button
              className={`search-btn ${isSearching ? 'disabled' : ''}`}
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              🔍
            </button>
            {searchResults.length > 0 && (
              <button className="clear-search-btn" onClick={handleClearSearch}>
                ✕
              </button>
            )}
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="search-results" data-testid="search-results">
            <div className="search-results-header">
              <span>搜索结果 ({searchResults.length})</span>
              <button onClick={handleClearSearch}>关闭</button>
            </div>
            <div className="search-results-list">
              {searchResults.slice(0, 20).map((result, index) => (
                <div key={index} className="search-result-item">
                  <span className="result-file">{result.filePath}</span>
                  <span className="result-line">第 {result.lineNumber} 行</span>
                  <span className="result-snippet">{result.snippet}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skill Panel */}
        {isConnected && activeSkills.length > 0 && (
          <SkillPanel />
        )}

        {/* Messages */}
        {isConnected && (
          <div className="message-list" data-testid="ai-message-list">
            {!currentSession || currentSession.messages.length === 0 ? (
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
          <div className="error-message" data-testid="ai-error-message">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* Loading Indicator */}
        {isStreaming && (
          <div className="streaming-indicator" data-testid="ai-loading">
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
            <button className="action-btn" onClick={newSession} title="New Session" data-testid="ai-new-conversation">
              ➕ 新会话
            </button>
            <button className="action-btn" onClick={handleClearConfirm} title="Clear Session" data-testid="ai-clear-conversation">
              🗑️ 清空
            </button>
            <button 
              className={`action-btn ${showOperationLog ? 'active' : ''}`} 
              onClick={() => setShowOperationLog(!showOperationLog)} 
              title="操作日志" 
              data-testid="operation-log-toggle"
            >
              📋 日志
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
              data-testid="ai-chat-input"
            />
            <div className="input-footer">
              <span className="char-count" data-testid="ai-char-count">{inputValue.length}/{MAX_INPUT_LENGTH}</span>
              <button
                className={`send-btn ${isStreaming ? 'disabled' : ''}`}
                onClick={handleSend}
                disabled={isStreaming || !inputValue.trim()}
                data-testid="ai-send-button"
              >
                {isStreaming ? '发送中...' : '发送'}
              </button>
            </div>
          </div>
        )}

        {/* Confirm Dialog */}
        {showConfirmDialog && (
          <div className="confirm-dialog">
            <div className="dialog-content">
              <h3>确认清空会话</h3>
              <p>确定要清空当前会话的所有消息吗？此操作无法撤销。</p>
              <div className="dialog-buttons">
                <button className="dialog-btn cancel" onClick={handleCancelClear}>
                  取消
                </button>
                <button className="dialog-btn confirm" onClick={handleConfirmClear} data-testid="confirm-button">
                  确认
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Operation Confirmation Dialog */}
        {showOperationConfirmation && (
          <OperationConfirmation
            operations={pendingOperations}
            onClose={handleOperationClose}
          />
        )}

        {/* Operation Result Message */}
        {operationMessage && (
          <div className={`operation-result ${operationMessage === '操作已批准' ? 'success' : 'rejected'}`}
            data-testid={operationMessage === '操作已批准' ? 'operation-success-message' : 'operation-rejected-message'}>
            {operationMessage === '操作已批准' ? '✓' : '✕'} {operationMessage}
          </div>
        )}

        {/* Operation Log Panel */}
        {showOperationLog && (
          <div className="operation-log-container">
            <OperationLog />
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChatPanel;