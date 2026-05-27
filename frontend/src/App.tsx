import { useState, useEffect, useCallback } from 'react';
import { FileTree } from './components/FileTree';
import { CodeEditor, type DiffLine } from './components/Editor/CodeEditor';
import { Terminal } from './components/Terminal/Terminal';
import GitPanel from './components/Git/GitPanel';
import { GitProvider, useGit } from './context/GitContext';
import type { FileInfo } from './types/file';
import { readFile, writeFile, formatCode } from './services/fileService';
import { fetchGitDiff } from './services/gitService';

interface Tab {
  id: string;
  file: FileInfo;
  content: string;
  isModified: boolean;
  language: string;
}

function AppContent() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showGitPanel, setShowGitPanel] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(300);
  const [diffLines, setDiffLines] = useState<Record<string, DiffLine[]>>({});
  
  const { status, currentBranch, refreshStatus } = useGit();

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const parseDiffLines = useCallback((diff: string): DiffLine[] => {
    const lines: DiffLine[] = [];
    const diffLines = diff.split('\n');
    let currentLineNumber = 0;
    
    for (const line of diffLines) {
      // Skip header lines
      if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('@@')) {
        // Parse the @@ header to get the starting line number
        const match = line.match(/@@ -\d+,\d+ \+(\d+),/);
        if (match) {
          currentLineNumber = parseInt(match[1], 10) - 1;
        }
        continue;
      }
      
      // Skip index line
      if (line.startsWith('index ')) {
        continue;
      }
      
      // Process diff lines
      if (line.startsWith('+')) {
        currentLineNumber++;
        lines.push({ lineNumber: currentLineNumber, type: 'added' });
      } else if (line.startsWith('-')) {
        // Deleted lines don't affect current line number in the new file
        lines.push({ lineNumber: currentLineNumber + 1, type: 'deleted' });
      } else if (line.length > 0 && !line.startsWith('\\')) {
        currentLineNumber++;
        // Check if this line is modified (appears after a -/+ pair)
        const prevLine = diffLines[diffLines.indexOf(line) - 1];
        if (prevLine && (prevLine.startsWith('-') || prevLine.startsWith('+'))) {
          const prevPrevLine = diffLines[diffLines.indexOf(line) - 2];
          if (prevPrevLine && prevPrevLine.startsWith('-')) {
            lines.push({ lineNumber: currentLineNumber, type: 'modified' });
          }
        }
      }
    }
    
    return lines;
  }, []);

  const loadDiffForFile = useCallback(async (filePath: string) => {
    try {
      const result = await fetchGitDiff(filePath);
      if (result.status === 'success' && result.data) {
        const parsedLines = parseDiffLines(result.data.diff);
        setDiffLines(prev => ({
          ...prev,
          [filePath]: parsedLines
        }));
      }
    } catch (error) {
      console.error('Failed to load diff:', error);
    }
  }, [parseDiffLines]);

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
      // Load diff for the file if not already loaded
      if (!diffLines[file.path]) {
        loadDiffForFile(file.path);
      }
      return;
    }

    setLoadingFiles(prev => new Set([...prev, file.path]));

    try {
      const [fileResult, diffResult] = await Promise.all([
        readFile(file.path),
        fetchGitDiff(file.path).catch(() => ({ status: 'error' }))
      ]);
      
      if (fileResult.status === 'success' && fileResult.data) {
        const newTab: Tab = {
          id: `tab-${Date.now()}`,
          file,
          content: fileResult.data.content,
          isModified: false,
          language: detectLanguage(file.path)
        };
        setTabs([...tabs, newTab]);
        setActiveTabId(newTab.id);
        
        // Parse and store diff lines if available
        if (diffResult.status === 'success' && diffResult.data) {
          const parsedLines = parseDiffLines(diffResult.data.diff);
          setDiffLines(prev => ({
            ...prev,
            [file.path]: parsedLines
          }));
        }
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
        refreshStatus();
      } else {
        showError(result.message || '保存失败');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  }, [tabs, activeTabId, showError, refreshStatus]);

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
  
  const changesCount = status 
    ? status.changes.length + status.untracked.length 
    : 0;

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
            className={`action-button ${showGitPanel ? 'active' : ''}`}
            onClick={() => setShowGitPanel(!showGitPanel)}
            data-testid="git-panel-button"
          >
            🗂️ Git {changesCount > 0 && `(${changesCount})`}
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
      
      <footer className="status-bar" data-testid="status-bar">
        <div className="status-left">
          {currentBranch && (
            <span className="branch-info" data-testid="branch-info">
              🌿 {currentBranch}
            </span>
          )}
          {changesCount > 0 && (
            <span className="changes-count" data-testid="changes-count">
              {changesCount} changes
            </span>
          )}
        </div>
        <div className="status-right">
          <span>Lapdev v1.0</span>
        </div>
      </footer>
      
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
                    diffLines={diffLines[activeTab.file.path] || []}
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
        
        {showGitPanel && (
          <aside className="git-sidebar">
            <GitPanel />
          </aside>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <GitProvider>
      <AppContent />
    </GitProvider>
  );
}

export default App;
