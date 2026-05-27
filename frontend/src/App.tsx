import { useState, useEffect, useCallback } from 'react';
import { FileTree } from './components/FileTree';
import { CodeEditor } from './components/Editor/CodeEditor';
import { Terminal } from './components/Terminal/Terminal';
import type { FileInfo } from './types/file';
import { readFile, writeFile, formatCode } from './services/fileService';

interface Tab {
  id: string;
  file: FileInfo;
  content: string;
  isModified: boolean;
  language: string;
}

function App() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(300);

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const detectLanguage = useCallback((filePath: string): string => {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      rs: 'rust',
      go: 'go',
      java: 'java',
      cpp: 'cpp',
      c: 'cpp',
      cs: 'csharp',
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      md: 'markdown',
      html: 'html',
      css: 'css',
    };

    return languageMap[extension] || 'plaintext';
  }, []);

  const handleFileOpen = async (file: FileInfo) => {
    const existingTab = tabs.find(tab => tab.file.path === file.path);
    
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    setLoadingFiles(prev => new Set([...prev, file.path]));

    try {
      const result = await readFile(file.path);
      
      if (result.status === 'success' && result.data) {
        const newTab: Tab = {
          id: `tab-${Date.now()}`,
          file,
          content: result.data.content,
          isModified: false,
          language: detectLanguage(file.path)
        };
        setTabs([...tabs, newTab]);
        setActiveTabId(newTab.id);
      }
    } catch (error) {
      console.error('Failed to open file:', error);
    } finally {
      setLoadingFiles(prev => {
        const next = new Set(prev);
        next.delete(file.path);
        return next;
      });
    }
  };

  const handleCloseTab = (tabId: string) => {
    setTabs(tabs.filter(tab => tab.id !== tabId));
    
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId);
      setActiveTabId(remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1].id : null);
    }
  };

  const handleContentChange = (tabId: string, newContent: string) => {
    setTabs(tabs.map(tab => 
      tab.id === tabId 
        ? { ...tab, content: newContent, isModified: true }
        : tab
    ));
  };

  const handleSave = useCallback(async () => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (!activeTab || !activeTab.isModified) return;

    setIsSaving(true);
    try {
      const result = await writeFile(activeTab.file.path, activeTab.content);
      
      if (result.status === 'success') {
        setTabs(tabs.map(tab => 
          tab.id === activeTabId 
            ? { ...tab, isModified: false }
            : tab
        ));
      } else {
        showError(result.message || '保存失败');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  }, [tabs, activeTabId, showError]);

  const handleFormat = useCallback(async () => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (!activeTab) return;

    setIsFormatting(true);
    try {
      const result = await formatCode(activeTab.content, activeTab.language);
      
      if (result.status === 'success' && result.data && result.data.formatted) {
        const data = result.data;
        setTabs(tabs.map(tab => 
          tab.id === activeTabId 
            ? { ...tab, content: data.formatted, isModified: true }
            : tab
        ));
      } else {
        showError(result.message || '格式化失败');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '格式化失败');
    } finally {
      setIsFormatting(false);
    }
  }, [tabs, activeTabId, showError]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        handleFormat();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, handleSave, handleFormat]);

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <div className="app">
      <header className="header">
        <h1>📝 Lapdev IDE</h1>
        <div className="header-actions">
          <button 
            className="action-button" 
            onClick={handleSave}
            disabled={!activeTab || !activeTab.isModified || isSaving}
            data-testid="save-button"
          >
            {isSaving ? '⏳ 保存中...' : '💾 保存'}
          </button>
          <button 
            className="action-button" 
            onClick={handleFormat}
            disabled={!activeTab || isFormatting}
            data-testid="format-button"
          >
            {isFormatting ? '⏳ 格式化中...' : '🎨 格式化'}
          </button>
          <button 
            className={`action-button ${showTerminal ? 'active' : ''}`}
            onClick={() => setShowTerminal(!showTerminal)}
            data-testid="terminal-button"
          >
            🖥️ 终端
          </button>
        </div>
      </header>
      
      {errorMessage && (
          <div className="error-message" data-testid="error-message">
            ❌ {errorMessage}
          </div>
        )}
        <div className="main-content">
          <aside className="sidebar">
            <FileTree onFileOpen={handleFileOpen} />
          </aside>
        
        <main className="editor-area">
          <div className="tabs">
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTabId(tab.id)}
                data-testid="editor-tab"
              >
                <span className="tab-icon">{tab.file.type === 'directory' ? '📁' : '📄'}</span>
                <span className="tab-name">{tab.file.name}</span>
                {tab.isModified && <span className="modified-indicator" data-testid="modified-indicator">●</span>}
                <button 
                  className="close-tab" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTab(tab.id);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          
          <div className="editor-container" data-testid="editor-content">
            {activeTab ? (
              <div className="editor-wrapper">
                {loadingFiles.has(activeTab.file.path) ? (
                  <div className="loading-editor">Loading...</div>
                ) : (
                  <CodeEditor
                    value={activeTab.content}
                    language={activeTab.language}
                    onChange={(value) => handleContentChange(activeTab.id, value)}
                  />
                )}
              </div>
            ) : (
              <div className="welcome-screen">
                <h2>欢迎使用 Lapdev</h2>
                <p>点击左侧文件树中的文件开始编辑</p>
                <div className="shortcuts">
                  <p><kbd>Ctrl+S</kbd> 保存文件</p>
                  <p><kbd>Ctrl+Shift+F</kbd> 格式化代码</p>
                </div>
              </div>
            )}
          </div>
          
          {showTerminal && (
            <div 
              className="terminal-container" 
              style={{ height: `${terminalHeight}px` }}
              data-testid="terminal-container"
            >
              <Terminal 
                onClose={() => setShowTerminal(false)} 
                onResize={setTerminalHeight}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;