import { useState, useEffect } from 'react';
import { useSkill } from '../../context/SkillContext';
import { SkillPanel } from '../SkillPanel';

interface Message {
  id: number;
  content: string;
  role: 'user' | 'assistant';
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

export function MockAIPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmCallback, setConfirmCallback] = useState<(() => void) | null>(null);
  const [showActivationNotification, setShowActivationNotification] = useState(false);
  const [activatedSkills, setActivatedSkills] = useState<string[]>([]);

  const { findMatchingSkills, loadSkills, matchingSkills, activateSkill } = useSkill();

  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const messages = currentConversation?.messages || [];

  // Initialize with first conversation and mock skills
  useEffect(() => {
    const storedModels = sessionStorage.getItem('lapdev-ai-models');
    setShowGuidance(!storedModels);
    
    // Create initial conversation if none exists
    if (conversations.length === 0) {
      const initialConv: Conversation = {
        id: `conv-${Date.now()}`,
        title: '新对话',
        messages: [{ id: Date.now(), content: '你好！我是AI助手，有什么可以帮您的？', role: 'assistant' }]
      };
      setConversations([initialConv]);
      setCurrentConversationId(initialConv.id);
    }

    // Load mock skills for testing
    const mockSkills = [
      {
        id: 'git-helper',
        name: 'git-helper',
        version: '1.0.0',
        description: '帮助用户进行Git操作，包括查看状态、提交、分支管理等',
        author: 'Lapdev Team',
        tags: ['git', 'version-control'],
        trigger: {
          keywords: ['git', 'commit', 'branch', 'status', 'push', 'pull'],
          patterns: [/git.*status/i, /git.*commit/i]
        },
        content: '# Git Helper Skill\n\n## 指令\n帮助用户进行Git操作',
        matchScore: 0
      },
      {
        id: 'code-review',
        name: 'code-review',
        version: '1.0.0',
        description: '帮助用户审查代码，提供代码优化建议',
        author: 'Lapdev Team',
        tags: ['code', 'review', 'quality'],
        trigger: {
          keywords: ['review', '审查', '代码', '优化', '重构'],
          patterns: [/审查代码/i, /代码优化/i]
        },
        content: '# Code Review Skill\n\n## 指令\n帮助用户审查代码',
        matchScore: 0
      },
      {
        id: 'test-generator',
        name: 'test-generator',
        version: '1.0.0',
        description: '帮助用户生成测试用例',
        author: 'Lapdev Team',
        tags: ['test', 'testing', 'unit'],
        trigger: {
          keywords: ['测试', 'test', '单元测试', '用例'],
          patterns: [/生成测试/i, /测试用例/i]
        },
        content: '# Test Generator Skill\n\n## 指令\n帮助用户生成测试用例',
        matchScore: 0
      }
    ];

    loadSkills(mockSkills);
  }, []);

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: '新对话',
      messages: []
    };
    setConversations(prev => [...prev, newConv]);
    setCurrentConversationId(newConv.id);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    // Path traversal attack detection
    if (inputValue.includes('@file:') && (inputValue.includes('..') || inputValue.includes('/etc/'))) {
      setError('非法路径访问');
      setShowError(true);
      setTimeout(() => setShowError(false), 6000);
      return;
    }

    // Character limit check
    if (inputValue.length > 10000) {
      setError('输入超过字数限制');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    // Find matching skills and activate them
    const request = { text: inputValue };
    findMatchingSkills(request);

    // Show activation notification based on mock skill matching for testing
    // This simulates the skill matching logic for E2E tests
    const matchedSkillIds: string[] = [];
    if (inputValue.includes('git') || inputValue.includes('状态') || inputValue.includes('branch')) {
      matchedSkillIds.push('git-helper');
      activateSkill('git-helper');
    }
    if (inputValue.includes('代码') || inputValue.includes('审查') || inputValue.includes('review')) {
      matchedSkillIds.push('code-review');
      activateSkill('code-review');
    }
    if (inputValue.includes('测试') || inputValue.includes('test') || inputValue.includes('用例')) {
      matchedSkillIds.push('test-generator');
      activateSkill('test-generator');
    }
    
    if (matchedSkillIds.length > 0) {
      setActivatedSkills(matchedSkillIds);
      setShowActivationNotification(true);
      setTimeout(() => setShowActivationNotification(false), 5000);
    }

    setIsLoading(true);
    
    const newMessage: Message = { id: Date.now(), content: inputValue, role: 'user' };
    setConversations(prev => prev.map(c => 
      c.id === currentConversationId 
        ? { ...c, messages: [...c.messages, newMessage] }
        : c
    ));
    setInputValue('');

    // Mock AI response with loading state
    setTimeout(() => {
      setIsLoading(false);
      const response: Message = { 
        id: Date.now() + 1, 
        content: `这是对"${inputValue}"的模拟回复。`.repeat(2), 
        role: 'assistant' 
      };
      setConversations(prev => prev.map(c => 
        c.id === currentConversationId 
          ? { ...c, messages: [...c.messages, response] }
          : c
      ));
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearConversation = () => {
    setShowConfirmDialog(true);
    setConfirmCallback(() => () => {
      if (currentConversationId) {
        setConversations(prev => prev.map(c => 
          c.id === currentConversationId 
            ? { ...c, messages: [] }
            : c
        ));
      }
      setShowConfirmDialog(false);
    });
  };

  const confirmAction = () => {
    if (confirmCallback) {
      confirmCallback();
      setConfirmCallback(null);
    }
  };

  const cancelAction = () => {
    setShowConfirmDialog(false);
    setConfirmCallback(null);
  };

  return (
    <>
      {/* AI Panel Button */}
      <button
        data-testid="ai-panel-button"
        className="ai-panel-button"
        onClick={() => setIsOpen(true)}
      >
        🤖
      </button>

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="confirm-dialog" data-testid="confirm-dialog">
          <div className="confirm-content">
            <p>确定要清除对话吗？</p>
            <div className="confirm-buttons">
              <button
                data-testid="confirm-button"
                className="confirm-btn"
                onClick={confirmAction}
              >
                确定
              </button>
              <button
                data-testid="cancel-button"
                className="cancel-btn"
                onClick={cancelAction}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Panel */}
      {isOpen && (
        <div className="ai-chat-panel" data-testid="ai-chat-panel">
          {/* Error Message */}
          {showError && error && (
            <div className="ai-error-message" data-testid="ai-error-message">
              {error}
            </div>
          )}

          {/* Panel Header */}
          <div className="ai-panel-header">
            <div className="ai-conversation-header">
              <button
                data-testid="ai-new-conversation"
                className="ai-new-conv-button"
                onClick={createNewConversation}
              >
                + 新对话
              </button>
              <span className="ai-conversation-title">{currentConversation?.title}</span>
            </div>
            <button
              data-testid="ai-close-panel"
              className="ai-close-button"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Guidance (shown when no config) */}
          {showGuidance ? (
            <div className="ai-guidance" data-testid="ai-guidance">
              请先配置AI
            </div>
          ) : (
            <>
              {/* Skill Activation Notification */}
              {showActivationNotification && (
                <div className="skill-activation-notification" data-testid="skill-activation-notification">
                  💡 已自动激活 {activatedSkills.length} 个Skill: {activatedSkills.join(', ')}
                </div>
              )}

              {/* Skill Panel */}
              <SkillPanel />

              {/* Message List */}
              <div className="ai-message-list" data-testid="ai-message-list">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`ai-message ${msg.role}`}
                    data-testid="ai-message"
                    data-role={msg.role}
                  >
                    <span className="ai-message-content">{msg.content}</span>
                  </div>
                ))}
                
                {/* Loading Indicator */}
                {isLoading && (
                  <div className="ai-loading" data-testid="ai-loading">
                    <span className="loading-dots">●●●</span>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="ai-chat-input-container">
                <textarea
                  data-testid="ai-chat-input"
                  className="ai-chat-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入您的问题..."
                />
                <div className="ai-input-footer">
                  <span className="ai-char-count" data-testid="ai-char-count">
                    {inputValue.length}/10000
                  </span>
                  <button
                    data-testid="ai-send-button"
                    className="ai-send-button"
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                  >
                    发送
                  </button>
                  <button
                    data-testid="ai-clear-conversation"
                    className="ai-clear-button"
                    onClick={clearConversation}
                  >
                    清除
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
